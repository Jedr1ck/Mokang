import uuid

from flask import Blueprint, jsonify
from app.common import (
    ApiError,
    booking_out,
    current_user,
    get_session,
    normalize_category_name,
    profile_missing_fields,
    provider_booking_query,
    require_auth,
    validated,
)
from app.models import (
    Booking,
    Category,
    Notification,
    ProviderProfile,
    ProviderService,
)
from app.schemas import BookingIn, BookingRescheduleIn, StatusIn

bookings_bp = Blueprint("bookings", __name__)


@bookings_bp.post("/bookings")
@require_auth
def create_booking():
    data = validated(BookingIn)
    with get_session() as session:
        user = current_user(session)
        if user.role != "homeowner":
            raise ApiError("Homeowners only", 403)
        missing_fields = profile_missing_fields(user)
        if missing_fields:
            raise ApiError(
                {
                    "message": "Complete your profile before booking a service.",
                    "missing_fields": missing_fields,
                },
                403,
            )

        category_name = normalize_category_name(data.category)
        category = None
        if category_name:
            category = (
                session.query(Category)
                .filter(Category.name.ilike(category_name))
                .first()
            )
            if not category:
                category = Category(
                    name=category_name,
                    description=f"Auto-created category for {category_name}",
                )
                session.add(category)
                session.flush()

        if data.provider_id:
            provider = (
                session.query(ProviderProfile)
                .filter(
                    ProviderProfile.id == data.provider_id,
                    ProviderProfile.is_verified.is_(True),
                    ProviderProfile.verification_status == "verified",
                )
                .first()
            )
            if not provider:
                raise ApiError("Selected provider is not verified or available.", 400)
            provider_category_ids = {
                row.category_id
                for row in session.query(ProviderService.category_id)
                .filter_by(provider_id=provider.id)
                .all()
            }
            if category and category.id not in provider_category_ids:
                raise ApiError(
                    "Selected provider does not offer this service category.",
                    400,
                )

        booking = Booking(
            booking_code="REQ-" + uuid.uuid4().hex[:8].upper(),
            homeowner_id=user.id,
            provider_id=data.provider_id,
            category_id=category.id if category else None,
            preferred_date=data.preferred_date,
            preferred_time=data.preferred_time,
            address=data.address,
            description=data.description,
            status="Pending",
        )
        session.add(booking)
        session.add(
            Notification(
                user_id=user.id,
                title="Booking request submitted",
                body=f"Your {category.name if category else 'home service'} booking request has been submitted.",
                type="booking",
            )
        )
        session.commit()
        session.refresh(booking)
        return jsonify(booking_out(booking))


@bookings_bp.get("/bookings/my")
@require_auth
def my_bookings():
    with get_session() as session:
        user = current_user(session)
        query = provider_booking_query(session.query(Booking), user, session)
        if query is None:
            return jsonify([])
        rows = query.order_by(Booking.created_at.desc()).all()
        return jsonify([booking_out(booking) for booking in rows])


@bookings_bp.get("/admin/bookings")
@require_auth
def admin_bookings():
    with get_session() as session:
        user = current_user(session)
        if user.role != "admin" or not user.is_active:
            raise ApiError("Admins only", 403)
        rows = session.query(Booking).order_by(Booking.created_at.desc()).all()
        return jsonify([booking_out(booking) for booking in rows])


@bookings_bp.patch("/admin/bookings/<int:booking_id>/status")
@require_auth
def admin_change_booking_status(booking_id):
    data = validated(StatusIn)
    allowed_statuses = {
        "Pending",
        "Matched",
        "Accepted",
        "On the Way",
        "In Progress",
        "Completed",
        "Cancelled",
        "Rejected",
    }
    if data.status not in allowed_statuses:
        raise ApiError("Invalid booking status.", 422)

    with get_session() as session:
        user = current_user(session)
        if user.role != "admin" or not user.is_active:
            raise ApiError("Admins only", 403)
        booking = session.get(Booking, booking_id)
        if not booking:
            raise ApiError("Booking not found", 404)
        if booking.status != data.status:
            booking.status = data.status
            category_name = booking.category.name if booking.category else "service"
            session.add(
                Notification(
                    user_id=booking.homeowner_id,
                    title="Booking status updated",
                    body=f"Your {category_name} booking is now {data.status}.",
                    type="booking",
                )
            )
            session.commit()
        return jsonify(booking_out(booking))


@bookings_bp.patch("/bookings/<int:booking_id>/status")
@require_auth
def change_status(booking_id):
    data = validated(StatusIn)
    with get_session() as session:
        user = current_user(session)
        booking = session.get(Booking, booking_id)
        if not booking:
            raise ApiError("Booking not found", 404)
        if user.role != "provider":
            raise ApiError("Providers only", 403)
        provider = (
            session.query(ProviderProfile)
            .filter_by(user_id=user.id)
            .first()
        )
        if not provider:
            raise ApiError("Provider profile not found", 404)
        has_capabilities = session.query(ProviderService.id).filter(
            ProviderService.provider_id == provider.id,
            ProviderService.title.isnot(None),
            ProviderService.title != "",
        ).first()
        if (
            not provider.is_verified
            or provider.verification_status != "verified"
        ):
            required_provider_fields = {
                "business_name": provider.business_name,
                "region_name": provider.region_name,
                "province_name": provider.province_name,
                "city_municipality_name": provider.city_municipality_name,
                "barangay_name": provider.barangay_name,
                "street_address": provider.street_address,
                "id_type": provider.id_type,
                "id_front_path": provider.id_front_path,
                "id_back_path": provider.id_back_path,
                "service_area": provider.service_area,
            }
            missing_provider_fields = [
                field
                for field, value in required_provider_fields.items()
                if not value or not str(value).strip()
            ]
            if not has_capabilities:
                missing_provider_fields.append("specific service capabilities")
            if provider.verification_status == "pending":
                missing_provider_fields = ["administrator verification approval"]
            raise ApiError(
                {
                    "message": "Complete provider setup and verification before managing services.",
                    "missing_fields": missing_provider_fields,
                },
                403,
            )
        if not has_capabilities:
            raise ApiError(
                {
                    "message": "Add the specific services you provide before managing bookings.",
                    "missing_fields": ["specific service capabilities"],
                },
                403,
            )
        missing_profile_fields = profile_missing_fields(user)
        if missing_profile_fields:
            raise ApiError(
                {
                    "message": "Complete your personal profile before providing services.",
                    "missing_fields": missing_profile_fields,
                },
                403,
            )
        if booking.provider_id and booking.provider_id != provider.id:
            raise ApiError("Not your booking", 403)
        claimed_booking = booking.provider_id is None
        if claimed_booking:
            matching_category = (
                session.query(ProviderService.id)
                .filter_by(
                    provider_id=provider.id,
                    category_id=booking.category_id,
                )
                .first()
            )
            if data.status not in {"Accepted", "Matched"} or not matching_category:
                raise ApiError("This booking is not available to your service profile.", 403)
            booking.provider_id = provider.id
        previous_status = booking.status
        if previous_status == data.status and not claimed_booking:
            return jsonify(booking_out(booking))

        booking.status = data.status
        category_name = booking.category.name if booking.category else "Your service"
        provider_name = provider.business_name or user.full_name
        if data.status == "Accepted":
            title = "Booking accepted"
            body = f"{provider_name} accepted your {category_name} booking."
        elif data.status == "Rejected":
            title = "Booking declined"
            body = f"{provider_name} declined your {category_name} booking."
        elif data.status == "Cancelled":
            title = "Booking cancelled"
            body = f"Your {category_name} booking was cancelled by the provider."
        elif data.status == "Completed":
            title = "Service completed"
            body = f"{provider_name} marked your {category_name} booking as completed."
        else:
            title = "Booking status updated"
            body = f"Your {category_name} booking is now {data.status}."
        session.add(
            Notification(
                user_id=booking.homeowner_id,
                title=title,
                body=body,
                type="booking",
            )
        )
        session.commit()
        return jsonify(booking_out(booking))


@bookings_bp.patch("/bookings/<int:booking_id>/reschedule")
@require_auth
def reschedule_booking(booking_id):
    data = validated(BookingRescheduleIn)
    with get_session() as session:
        user = current_user(session)
        if user.role != "provider":
            raise ApiError("Providers only", 403)

        provider = (
            session.query(ProviderProfile)
            .filter_by(user_id=user.id)
            .first()
        )
        if not provider:
            raise ApiError("Provider profile not found", 404)

        booking = session.get(Booking, booking_id)
        if not booking:
            raise ApiError("Booking not found", 404)
        if booking.provider_id != provider.id:
            raise ApiError("Not your booking", 403)
        if booking.status in {"Completed", "Cancelled", "Rejected"}:
            raise ApiError("This booking can no longer be rescheduled.", 400)

        booking.preferred_date = data.preferred_date
        booking.preferred_time = data.preferred_time
        category_name = booking.category.name if booking.category else "service"
        session.add(
            Notification(
                user_id=booking.homeowner_id,
                title="Booking rescheduled",
                body=(
                    f"Your {category_name} booking was rescheduled to "
                    f"{data.preferred_date.isoformat()} at "
                    f"{data.preferred_time.strftime('%H:%M')}."
                ),
                type="booking",
            )
        )
        session.commit()
        return jsonify(booking_out(booking))
