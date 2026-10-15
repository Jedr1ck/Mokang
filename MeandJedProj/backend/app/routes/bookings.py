import uuid

from flask import Blueprint, jsonify
from app.common import (
    ApiError,
    booking_out,
    current_user,
    get_session,
    normalize_category_name,
    provider_booking_query,
    require_auth,
    validated,
)
from app.models import (
    Booking,
    Category,
    ProviderProfile,
)
from app.schemas import BookingIn, StatusIn

bookings_bp = Blueprint("bookings", __name__)


@bookings_bp.post("/bookings")
@require_auth
def create_booking():
    data = validated(BookingIn)
    with get_session() as session:
        user = current_user(session)
        if user.role != "homeowner":
            raise ApiError("Homeowners only", 403)

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
        if not provider or booking.provider_id != provider.id:
            raise ApiError("Not your booking", 403)
        booking.status = data.status
        session.commit()
        return jsonify(booking_out(booking))
