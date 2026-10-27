from flask import Blueprint, jsonify

from app.common import (
    ApiError,
    current_user,
    get_session,
    require_auth,
    validated,
)
from app.common import get_current_provider
from app.models import Booking, Complaint, Review
from app.schemas import ComplaintIn, ComplaintStatusIn, ReviewIn

feedback_bp = Blueprint("feedback", __name__)


@feedback_bp.get("/provider/reviews/me")
@require_auth
def provider_reviews():
    with get_session() as session:
        provider = get_current_provider(current_user(session), session)
        reviews = (
            session.query(Review)
            .join(Booking, Review.booking_id == Booking.id)
            .filter(Booking.provider_id == provider.id)
            .order_by(Review.created_at.desc())
            .all()
        )
        return jsonify(
            [
                {
                    "id": review.id,
                    "rating": review.rating,
                    "comment": review.comment or "",
                    "createdAt": (
                        review.created_at.isoformat()
                        if review.created_at
                        else None
                    ),
                    "service": (
                        review.booking.category.name
                        if review.booking and review.booking.category
                        else "Home service"
                    ),
                    "homeownerName": (
                        review.booking.homeowner.full_name
                        if review.booking and review.booking.homeowner
                        else "Homeowner"
                    ),
                }
                for review in reviews
            ]
        )


@feedback_bp.post("/bookings/<int:booking_id>/reviews")
@require_auth
def create_review(booking_id):
    data = validated(ReviewIn)
    with get_session() as session:
        user = current_user(session)
        booking = session.get(Booking, booking_id)
        if not booking or booking.homeowner_id != user.id:
            raise ApiError("Booking not found", 404)
        if booking.status != "Completed":
            raise ApiError("Reviews can only be submitted for completed bookings.", 400)
        if not booking.provider_id:
            raise ApiError("This booking has no assigned provider.", 400)
        if session.query(Review).filter_by(booking_id=booking.id).first():
            raise ApiError("A review has already been submitted for this booking.", 409)

        review = Review(
            booking_id=booking.id,
            rating=data.rating,
            comment=data.comment,
        )
        session.add(review)
        session.commit()
        return jsonify(id=review.id, rating=review.rating, comment=review.comment), 201


@feedback_bp.post("/bookings/<int:booking_id>/complaints")
@require_auth
def create_complaint(booking_id):
    data = validated(ComplaintIn)
    with get_session() as session:
        user = current_user(session)
        booking = session.get(Booking, booking_id)
        if not booking or booking.homeowner_id != user.id:
            raise ApiError("Booking not found", 404)
        complaint = Complaint(
            booking_id=booking.id,
            homeowner_id=user.id,
            subject=data.subject,
            message=data.message,
        )
        session.add(complaint)
        session.commit()
        return jsonify(id=complaint.id, status=complaint.status), 201


def require_admin(session):
    user = current_user(session)
    if user.role != "admin" or not user.is_active:
        raise ApiError("Admins only", 403)
    return user


@feedback_bp.get("/admin/feedback")
@require_auth
def admin_feedback():
    with get_session() as session:
        require_admin(session)
        rows = []
        for review in session.query(Review).all():
            booking = review.booking
            provider = booking.provider
            rows.append(
                {
                    "id": f"R-{review.id}",
                    "recordId": review.id,
                    "type": "Review",
                    "homeownerName": booking.homeowner.full_name,
                    "providerName": (
                        provider.business_name or provider.user.full_name
                        if provider
                        else None
                    ),
                    "service": booking.category.name if booking.category else None,
                    "rating": review.rating,
                    "date": review.created_at.isoformat() if review.created_at else None,
                    "status": "Published",
                    "subject": "Service review",
                    "message": review.comment or "",
                }
            )
        for complaint in session.query(Complaint).all():
            booking = complaint.booking
            provider = booking.provider
            rows.append(
                {
                    "id": f"C-{complaint.id}",
                    "recordId": complaint.id,
                    "type": "Complaint",
                    "homeownerName": complaint.homeowner.full_name,
                    "providerName": (
                        provider.business_name or provider.user.full_name
                        if provider
                        else None
                    ),
                    "service": booking.category.name if booking.category else None,
                    "rating": None,
                    "date": complaint.created_at.isoformat() if complaint.created_at else None,
                    "status": complaint.status,
                    "subject": complaint.subject,
                    "message": complaint.message,
                }
            )
        rows.sort(key=lambda row: row["date"] or "", reverse=True)
        return jsonify(rows)


@feedback_bp.patch("/admin/feedback/complaints/<int:complaint_id>/status")
@require_auth
def update_complaint_status(complaint_id):
    data = validated(ComplaintStatusIn)
    with get_session() as session:
        require_admin(session)
        complaint = session.get(Complaint, complaint_id)
        if not complaint:
            raise ApiError("Complaint not found", 404)
        complaint.status = data.status
        session.commit()
        return jsonify(id=f"C-{complaint.id}", status=complaint.status)


@feedback_bp.delete("/admin/feedback/<feedback_type>/<int:record_id>")
@require_auth
def delete_feedback(feedback_type, record_id):
    with get_session() as session:
        require_admin(session)
        model = {"reviews": Review, "complaints": Complaint}.get(feedback_type)
        if not model:
            raise ApiError("Invalid feedback type.", 400)
        record = session.get(model, record_id)
        if not record:
            raise ApiError("Feedback not found", 404)
        session.delete(record)
        session.commit()
        return jsonify(deleted=True)
