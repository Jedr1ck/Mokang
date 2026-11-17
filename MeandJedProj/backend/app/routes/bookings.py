import uuid
import json
from datetime import datetime, timedelta, timezone

from flask import Blueprint, jsonify
from sqlalchemy import and_, or_
from app.common import (
    ApiError,
    booking_out,
    current_week_start,
    current_user,
    get_session,
    is_at_least_16,
    normalize_category_name,
    notify_admins,
    profile_missing_fields,
    provider_booking_query,
    require_auth,
    validated,
    weekly_schedule_is_current,
)
from app.models import (
    Booking,
    Category,
    Complaint,
    Message,
    Notification,
    ProviderProfile,
    ProviderService,
    Review,
)
from app.schemas import BookingIn, BookingRescheduleIn, StatusIn

bookings_bp = Blueprint("bookings", __name__)

ACTIVE_BOOKING_STATUSES = [
    "Pending", "Matched", "Accepted", "On the Way", "In Progress",
    "Awaiting Confirmation",
]
DEFAULT_SERVICE_DURATION_MINUTES = 60
PHILIPPINES_TZ = timezone(timedelta(hours=8))


def _expire_overdue_pending_bookings(session):
    """Cancel requests that are still pending after their scheduled start time (Philippines time)."""
    now = datetime.now(PHILIPPINES_TZ)
    overdue = (
        session.query(Booking)
        .filter(
            Booking.status.in_(("Pending", "Matched")),
            or_(
                Booking.preferred_date < now.date(),
                and_(
                    Booking.preferred_date == now.date(),
                    Booking.preferred_time <= now.time().replace(tzinfo=None),
                ),
            ),
        )
        .with_for_update()
        .all()
    )
    for booking in overdue:
        booking.status = "Cancelled"
        category_name = booking.category.name if booking.category else "service"
        session.add(Notification(
            user_id=booking.homeowner_id,
            title="Booking automatically cancelled",
            body=(
                f"Your {category_name} booking was automatically cancelled "
                "because the requested date and time passed without provider acceptance."
            ),
            type="booking",
        ))
        if booking.provider:
            session.add(Notification(
                user_id=booking.provider.user_id,
                title="Pending booking expired",
                body=(
                    f"A pending {category_name} booking was automatically cancelled "
                    "because its requested date and time passed."
                ),
                type="booking",
            ))
    if overdue:
        session.commit()


def _duration_for_service(session, provider_id, category_id, service_name):
    if not service_name:
        return DEFAULT_SERVICE_DURATION_MINUTES
    services = session.query(ProviderService).filter_by(
        provider_id=provider_id,
        category_id=category_id,
    ).all()
    for service in services:
        titles = (service.title or "").split(",")
        if any(title.strip().casefold() == service_name.strip().casefold() for title in titles):
            duration = service.duration_minutes or DEFAULT_SERVICE_DURATION_MINUTES
            return max(1, int(duration))
    return DEFAULT_SERVICE_DURATION_MINUTES


def _category_match_key(value):
    normalized = normalize_category_name(value or "") or ""
    key = normalized.strip().casefold()
    equivalents = {
        "plumber": "plumbing",
        "plumbing": "plumbing",
        "electrician": "electrical",
        "electrical": "electrical",
        "carpenter": "carpentry",
        "carpentry": "carpentry",
        "painter": "painting",
        "painting": "painting",
        "aircon technician": "appliance repair",
        "appliance repair technician": "appliance repair",
    }
    return equivalents.get(key, key)


def _ensure_no_overlap(
    session, provider_id, preferred_date, preferred_time, duration_minutes,
    exclude_booking_id=None,
):
    query = session.query(Booking).filter(
        Booking.provider_id == provider_id,
        Booking.preferred_date == preferred_date,
        Booking.status.in_(ACTIVE_BOOKING_STATUSES),
    )
    if exclude_booking_id is not None:
        query = query.filter(Booking.id != exclude_booking_id)
    existing_bookings = query.with_for_update().all()
    requested_start = preferred_time.hour * 60 + preferred_time.minute
    requested_end = requested_start + duration_minutes
    for existing in existing_bookings:
        existing_start = existing.preferred_time.hour * 60 + existing.preferred_time.minute
        existing_duration = existing.service_duration_minutes or DEFAULT_SERVICE_DURATION_MINUTES
        existing_end = existing_start + max(1, int(existing_duration))
        if requested_start < existing_end and existing_start < requested_end:
            raise ApiError(
                "This time overlaps another booking. Please choose an available time.",
                409,
            )


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
        if user.profile and user.profile.birthday and not is_at_least_16(
            user.profile.birthday
        ):
            raise ApiError("Homeowners must be at least 16 years old to book.", 403)

        category_name = normalize_category_name(data.category)
        category = None
        if category_name:
            if data.provider_id:
                offered_services = (
                    session.query(ProviderService)
                    .filter_by(provider_id=data.provider_id)
                    .all()
                )
                requested_category = _category_match_key(data.category)
                category = next(
                    (
                        service.category
                        for service in offered_services
                        if service.category
                        and _category_match_key(service.category.name)
                        == requested_category
                    ),
                    None,
                )
                if category is None:
                    raise ApiError(
                        "Selected provider does not offer this service category.",
                        400,
                    )
            else:
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
                .with_for_update()
                .first()
            )
            if not provider:
                raise ApiError("Selected provider is not verified or available.", 400)
            if (provider.availability_status or "Available").strip().casefold() != "available":
                raise ApiError(
                    "This provider is not accepting bookings right now.",
                    409,
                )
            requested_slot = {
                "date": data.preferred_date.isoformat(),
                "time": data.preferred_time.strftime("%H:%M"),
            }
            service_duration_minutes = _duration_for_service(
                session, provider.id, category.id if category else None,
                data.service_name,
            )
            local_now = datetime.now(timezone(timedelta(hours=8)))
            schedule = json.loads(provider.working_schedule or "{}")
            has_weekly_schedule = (
                isinstance(schedule, dict)
                and any(isinstance(value, dict) for value in schedule.values())
            )
            if has_weekly_schedule:
                if not weekly_schedule_is_current(schedule, local_now.date()):
                    raise ApiError(
                        "The provider's schedule ended Sunday at 11:59 PM. Ask them to set availability for this week.",
                        409,
                    )
                week_start = datetime.strptime(
                    current_week_start(local_now.date()), "%Y-%m-%d"
                ).date()
                week_end = week_start + timedelta(days=6)
                if data.preferred_date < local_now.date() or data.preferred_date > week_end:
                    raise ApiError("This provider's availability is set one week at a time.", 409)
                weekday = data.preferred_date.strftime("%A")
                hours = schedule.get(weekday)
                if not isinstance(hours, dict) or hours.get("enabled") is not True:
                    raise ApiError("This provider is not available on the selected day.", 409)
                try:
                    start_time = datetime.strptime(str(hours.get("start", "")), "%H:%M").time()
                    end_time = datetime.strptime(str(hours.get("end", "")), "%H:%M").time()
                except ValueError as error:
                    raise ApiError("This provider's working schedule is invalid.", 409) from error
                start_minutes = start_time.hour * 60 + start_time.minute
                end_minutes = end_time.hour * 60 + end_time.minute
                requested_minutes = (
                    data.preferred_time.hour * 60 + data.preferred_time.minute
                )
                if (
                    requested_minutes < start_minutes
                    or requested_minutes + service_duration_minutes > end_minutes
                    or (requested_minutes - start_minutes) % 30 != 0
                ):
                    raise ApiError("The selected time is outside this provider's working hours.", 409)
                if (
                    data.preferred_date == local_now.date()
                    and requested_slot["time"] <= local_now.strftime("%H:%M")
                ):
                    raise ApiError("The selected time has already passed.", 409)
            else:
                provider_slots = json.loads(provider.availability_slots or "[]")
                week_start = local_now.date() - timedelta(days=local_now.weekday())
                week_end = week_start + timedelta(days=6)
                if data.preferred_date < local_now.date() or data.preferred_date > week_end:
                    raise ApiError("Bookings can only be made for available dates this week.", 409)
                if data.preferred_date == local_now.date() and requested_slot["time"] <= local_now.strftime("%H:%M"):
                    raise ApiError("The selected time has already passed.", 409)
                if requested_slot not in provider_slots:
                    raise ApiError("Selected date and time are no longer available from this provider.", 409)
            _ensure_no_overlap(
                session, provider.id, data.preferred_date, data.preferred_time,
                service_duration_minutes,
            )
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
            if data.service_name:
                matching_services = (
                    session.query(ProviderService.title)
                    .filter_by(
                        provider_id=provider.id,
                        category_id=category.id if category else None,
                    )
                    .all()
                )
                offered_names = {
                    name.strip().casefold()
                    for (title,) in matching_services
                    for name in (title or "").split(",")
                    if name.strip()
                }
                if data.service_name.casefold() not in offered_names:
                    raise ApiError(
                        "Selected provider does not offer this specific service.",
                        400,
                    )
        else:
            provider = None

        service_label = data.service_name or (
            category.name if category else "home service"
        )
        booking = Booking(
            booking_code="REQ-" + uuid.uuid4().hex[:8].upper(),
            homeowner_id=user.id,
            provider_id=data.provider_id,
            category_id=category.id if category else None,
            service_name=data.service_name,
            preferred_date=data.preferred_date,
            preferred_time=data.preferred_time,
            address=data.address,
            description=data.description,
            status="Pending",
            service_duration_minutes=(
                service_duration_minutes if provider else None
            ),
        )
        session.add(booking)
        session.add(
            Notification(
                user_id=user.id,
                title="Booking request submitted",
                body=(
                    f"Your {service_label} "
                    "booking request has been submitted."
                ),
                type="booking",
            )
        )
        notify_admins(
            session,
            "New booking request",
            f"Homeowner {user.full_name} submitted a {service_label} booking request.",
            "booking",
        )
        session.flush()
        if provider:
            request_details = (
                f"I submitted a booking request for {service_label} "
                f"on {data.preferred_date.isoformat()} at "
                f"{data.preferred_time.strftime('%I:%M %p')}."
            )
            session.add(
                Message(
                    sender_id=user.id,
                    recipient_id=provider.user_id,
                    booking_id=booking.id,
                    body=request_details,
                )
            )
            session.add(
                Notification(
                    user_id=provider.user_id,
                    title="New booking request",
                    body=f"A homeowner submitted a {service_label} booking request.",
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
        _expire_overdue_pending_bookings(session)
        user = current_user(session)
        query = provider_booking_query(session.query(Booking), user, session)
        if query is None:
            return jsonify([])
        rows = query.order_by(Booking.created_at.desc()).all()
        booking_ids = [booking.id for booking in rows]
        reviewed_booking_ids = set()
        if booking_ids:
            reviewed_booking_ids = {
                booking_id
                for (booking_id,) in session.query(Review.booking_id)
                .filter(Review.booking_id.in_(booking_ids))
                .all()
            }
        return jsonify([
            {**booking_out(booking), "hasReview": booking.id in reviewed_booking_ids}
            for booking in rows
        ])


@bookings_bp.patch("/bookings/<int:booking_id>/cancel")
@require_auth
def cancel_homeowner_booking(booking_id):
    with get_session() as session:
        _expire_overdue_pending_bookings(session)
        user = current_user(session)
        if user.role != "homeowner":
            raise ApiError("Homeowners only", 403)

        booking = session.get(Booking, booking_id)
        if not booking:
            raise ApiError("Booking not found", 404)
        if booking.homeowner_id != user.id:
            raise ApiError("Not your booking", 403)
        if booking.status not in {"Pending", "Matched"}:
            raise ApiError("This booking can only be cancelled before the provider accepts it.", 400)

        booking.status = "Cancelled"
        category_name = booking.category.name if booking.category else "service"
        session.add(
            Notification(
                user_id=user.id,
                title="Booking cancelled",
                body=f"Your {category_name} booking request was cancelled.",
                type="booking",
            )
        )
        if booking.provider_id:
            provider = session.get(ProviderProfile, booking.provider_id)
            if provider:
                session.add(
                    Notification(
                        user_id=provider.user_id,
                        title="Booking cancelled",
                        body=f"A homeowner cancelled their {category_name} booking request.",
                        type="booking",
                    )
                )
        notify_admins(
            session,
            "Booking cancelled by homeowner",
            f"Homeowner {user.full_name} cancelled a {category_name} booking request.",
            "booking",
        )
        session.commit()
        return jsonify(booking_out(booking))


@bookings_bp.get("/admin/bookings")
@require_auth
def admin_bookings():
    with get_session() as session:
        _expire_overdue_pending_bookings(session)
        user = current_user(session)
        if user.role != "admin" or not user.is_active:
            raise ApiError("Admins only", 403)
        rows = session.query(Booking).order_by(Booking.created_at.desc()).all()
        return jsonify([booking_out(booking) for booking in rows])


@bookings_bp.delete("/bookings/<int:booking_id>")
@require_auth
def delete_completed_booking(booking_id):
    with get_session() as session:
        user = current_user(session)
        booking = session.get(Booking, booking_id)
        if not booking:
            raise ApiError("Booking not found", 404)
        if booking.status != "Completed":
            raise ApiError("Only completed bookings can be deleted.", 409)
        review = session.query(Review.id).filter_by(booking_id=booking.id).first()
        if user.role == "provider":
            provider = session.query(ProviderProfile).filter_by(user_id=user.id).first()
            if not provider:
                raise ApiError("Provider profile not found", 404)
            if booking.provider_id != provider.id:
                raise ApiError("Not your booking", 403)
        elif user.role == "homeowner":
            if booking.homeowner_id != user.id:
                raise ApiError("Not your booking", 403)
            if not review:
                raise ApiError("Please leave a review before deleting this completed booking.", 409)
        else:
            raise ApiError("Homeowners or providers only", 403)
        if session.query(Complaint.id).filter_by(booking_id=booking.id).first():
            raise ApiError("This booking has a complaint and cannot be deleted.", 409)

        session.query(Message).filter_by(booking_id=booking.id).delete(synchronize_session=False)
        session.query(Review).filter_by(booking_id=booking.id).delete(synchronize_session=False)
        session.delete(booking)
        session.commit()
        return jsonify({"message": "Completed booking deleted."})


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
        "Awaiting Confirmation",
        "Completed",
        "Cancelled",
        "Rejected",
    }
    if data.status not in allowed_statuses:
        raise ApiError("Invalid booking status.", 422)

    with get_session() as session:
        _expire_overdue_pending_bookings(session)
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
            notify_admins(
                session,
                "Administrator updated booking",
                f"Administrator {user.full_name} changed {category_name} booking to {data.status}.",
                "booking",
            )
            session.commit()
        return jsonify(booking_out(booking))


@bookings_bp.patch("/bookings/<int:booking_id>/status")
@require_auth
def change_status(booking_id):
    data = validated(StatusIn)
    with get_session() as session:
        _expire_overdue_pending_bookings(session)
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
        if booking.status in {"Cancelled", "Rejected", "Completed"}:
            raise ApiError("This booking is no longer active.", 409)
        if data.status == "On the Way":
            if booking.status not in {"Accepted", "Matched"}:
                raise ApiError("Accept the booking before starting travel.", 409)
            scheduled_start = datetime.combine(
                booking.preferred_date, booking.preferred_time
            )
            if scheduled_start > datetime.now(PHILIPPINES_TZ).replace(tzinfo=None):
                raise ApiError("You can start travel only when the scheduled date and time arrives.", 409)
        if data.status == "In Progress" and booking.status != "On the Way":
            raise ApiError("Start travel before starting the service.", 409)
        if booking.status == "Awaiting Confirmation" and data.status != booking.status:
            raise ApiError("Only the homeowner can confirm this service as completed.", 400)
        if data.status == "Cancelled" and booking.status in {"On the Way", "In Progress"}:
            raise ApiError("A booking cannot be cancelled after the provider starts traveling to the service location.", 400)
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
        next_status = data.status
        if next_status == "Completed":
            if previous_status != "In Progress":
                raise ApiError("A service must be in progress before it can be marked complete.", 400)
            next_status = "Awaiting Confirmation"
        if previous_status == next_status and not claimed_booking:
            return jsonify(booking_out(booking))

        booking.status = next_status
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
        elif next_status == "Awaiting Confirmation":
            title = "Please confirm service completion"
            body = f"{provider_name} marked your {category_name} service as finished. Confirm it in your bookings when the work is complete."
        else:
            title = "Booking status updated"
            body = f"Your {category_name} booking is now {next_status}."
        session.add(
            Notification(
                user_id=booking.homeowner_id,
                title=title,
                body=body,
                type="booking",
            )
        )
        notify_admins(
            session,
            "Provider updated booking",
            f"Provider {provider_name} changed a {category_name} booking to {next_status}.",
            "booking",
        )
        session.commit()
        return jsonify(booking_out(booking))


@bookings_bp.patch("/bookings/<int:booking_id>/remind-completion")
@require_auth
def remind_completion(booking_id):
    with get_session() as session:
        user = current_user(session)
        if user.role != "provider":
            raise ApiError("Providers only", 403)
        provider = session.query(ProviderProfile).filter_by(user_id=user.id).first()
        if not provider:
            raise ApiError("Provider profile not found", 404)
        booking = session.get(Booking, booking_id)
        if not booking:
            raise ApiError("Booking not found", 404)
        if booking.provider_id != provider.id:
            raise ApiError("Not your booking", 403)
        if booking.status != "Awaiting Confirmation":
            raise ApiError("This booking is not waiting for completion confirmation.", 400)

        provider_name = provider.business_name or user.full_name
        category_name = booking.category.name if booking.category else "service"
        session.add(Notification(
            user_id=booking.homeowner_id,
            title="Reminder: Confirm completed service",
            body=(
                f"{provider_name} is reminding you to confirm the {category_name} "
                f"service for booking {booking.booking_code}. Open My Bookings to confirm it."
            ),
            type="booking",
        ))
        session.commit()
        return jsonify({"message": "Reminder sent."})


@bookings_bp.patch("/bookings/<int:booking_id>/confirm-completion")
@require_auth
def confirm_booking_completion(booking_id):
    with get_session() as session:
        user = current_user(session)
        if user.role != "homeowner":
            raise ApiError("Homeowners only", 403)
        booking = session.get(Booking, booking_id)
        if not booking:
            raise ApiError("Booking not found", 404)
        if booking.homeowner_id != user.id:
            raise ApiError("Not your booking", 403)
        if booking.status != "Awaiting Confirmation":
            raise ApiError("This booking is not waiting for completion confirmation.", 400)

        booking.status = "Completed"
        category_name = booking.category.name if booking.category else "service"
        if booking.provider:
            session.add(Notification(
                user_id=booking.provider.user_id,
                title="Service completion confirmed",
                body=f"The homeowner confirmed that the {category_name} service is complete.",
                type="booking",
            ))
        notify_admins(
            session,
            "Service completion confirmed",
            f"The homeowner confirmed completion of a {category_name} booking.",
            "booking",
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
            .with_for_update()
            .first()
        )
        if not provider:
            raise ApiError("Provider profile not found", 404)

        booking = session.get(Booking, booking_id)
        if not booking:
            raise ApiError("Booking not found", 404)
        if booking.provider_id != provider.id:
            raise ApiError("Not your booking", 403)
        if booking.status in {"On the Way", "In Progress", "Awaiting Confirmation", "Completed", "Cancelled", "Rejected"}:
            raise ApiError("A booking can no longer be rescheduled after the provider starts traveling to the service location.", 400)

        local_now = datetime.now(timezone(timedelta(hours=8)))
        if data.preferred_date < local_now.date() or data.preferred_date > local_now.date() + timedelta(days=365):
            raise ApiError("Bookings must be within the next 365 days.", 409)
        if data.preferred_date == local_now.date() and data.preferred_time <= local_now.time().replace(tzinfo=None):
            raise ApiError("The selected time has already passed.", 409)

        schedule = json.loads(provider.working_schedule or "{}")
        has_weekly_schedule = (
            isinstance(schedule, dict)
            and any(isinstance(value, dict) for value in schedule.values())
        )
        duration_minutes = booking.service_duration_minutes or _duration_for_service(
            session, provider.id, booking.category_id, booking.service_name
        )
        requested_minutes = data.preferred_time.hour * 60 + data.preferred_time.minute
        if has_weekly_schedule:
            if not weekly_schedule_is_current(schedule, local_now.date()):
                raise ApiError(
                    "The provider's schedule ended Sunday at 11:59 PM. Ask them to set availability for this week.",
                    409,
                )
            week_start = datetime.strptime(
                current_week_start(local_now.date()), "%Y-%m-%d"
            ).date()
            week_end = week_start + timedelta(days=6)
            if data.preferred_date > week_end:
                raise ApiError("This provider's availability is set one week at a time.", 409)
            hours = schedule.get(data.preferred_date.strftime("%A"))
            if not isinstance(hours, dict) or hours.get("enabled") is not True:
                raise ApiError("This provider is not available on the selected day.", 409)
            try:
                start_time = datetime.strptime(str(hours.get("start", "")), "%H:%M").time()
                end_time = datetime.strptime(str(hours.get("end", "")), "%H:%M").time()
            except ValueError as error:
                raise ApiError("This provider's working schedule is invalid.", 409) from error
            start_minutes = start_time.hour * 60 + start_time.minute
            end_minutes = end_time.hour * 60 + end_time.minute
            if (
                requested_minutes < start_minutes
                or requested_minutes + duration_minutes > end_minutes
                or (requested_minutes - start_minutes) % 30 != 0
            ):
                raise ApiError("The selected time is outside this provider's working hours.", 409)
        else:
            requested_slot = {
                "date": data.preferred_date.isoformat(),
                "time": data.preferred_time.strftime("%H:%M"),
            }
            if requested_slot not in json.loads(provider.availability_slots or "[]"):
                raise ApiError("Selected date and time are no longer available from this provider.", 409)

        _ensure_no_overlap(
            session, provider.id, data.preferred_date, data.preferred_time,
            duration_minutes, exclude_booking_id=booking.id,
        )

        booking.preferred_date = data.preferred_date
        booking.preferred_time = data.preferred_time
        booking.service_duration_minutes = duration_minutes
        category_name = booking.category.name if booking.category else "service"
        session.add(
            Notification(
                user_id=booking.homeowner_id,
                title="Booking rescheduled",
                body=(
                    f"Your {category_name} booking was rescheduled to "
                    f"{data.preferred_date.isoformat()} at "
                    f"{data.preferred_time.strftime('%I:%M %p')}."
                ),
                type="booking",
            )
        )
        provider_name = provider.business_name or user.full_name
        notify_admins(
            session,
            "Provider rescheduled booking",
            f"Provider {provider_name} rescheduled a {category_name} booking to "
            f"{data.preferred_date.isoformat()} at {data.preferred_time.strftime('%I:%M %p')}.",
            "booking",
        )
        session.commit()
        return jsonify(booking_out(booking))
