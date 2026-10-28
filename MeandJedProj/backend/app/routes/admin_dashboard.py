from flask import Blueprint, jsonify
from sqlalchemy import func
from sqlalchemy.orm import joinedload

from app.common import ApiError, current_user, get_session, require_auth
from app.models import Booking, ProviderProfile, ProviderService, User

admin_dashboard_bp = Blueprint("admin_dashboard", __name__)


@admin_dashboard_bp.get("/admin/dashboard")
@require_auth
def dashboard_overview():
    with get_session() as session:
        user = current_user(session)
        if user.role != "admin" or not user.is_active:
            raise ApiError("Administrator access required", 403)

        counts = {
            "homeowners": session.query(func.count(User.id))
            .filter(User.role == "homeowner")
            .scalar(),
            "providers": session.query(func.count(User.id))
            .filter(User.role == "provider")
            .scalar(),
            "bookings": session.query(func.count(Booking.id)).scalar(),
            "pendingApprovals": (
                session.query(func.count(ProviderProfile.id))
                .join(User, ProviderProfile.user_id == User.id)
                .filter(
                    ProviderProfile.verification_status == "pending",
                    User.is_active.is_(True),
                )
                .scalar()
            ),
        }

        bookings = (
            session.query(Booking)
            .options(
                joinedload(Booking.homeowner).joinedload(User.profile),
                joinedload(Booking.category),
            )
            .order_by(Booking.created_at.desc())
            .limit(10)
            .all()
        )
        recent_bookings = [
            {
                "id": booking.id,
                "customer": (
                    booking.homeowner.full_name if booking.homeowner else "Unknown"
                ),
                "service": (
                    booking.service_name
                    or (booking.category.name if booking.category else None)
                    or "Service request"
                ),
                "date": (
                    booking.preferred_date.isoformat()
                    if booking.preferred_date
                    else (
                        booking.created_at.date().isoformat()
                        if booking.created_at
                        else ""
                    )
                ),
                "status": booking.status or "Pending",
            }
            for booking in bookings
        ]

        homeowners = (
            session.query(User)
            .filter(User.role == "homeowner")
            .order_by(User.created_at.desc())
            .limit(10)
            .all()
        )
        recent_homeowners = [
            {
                "id": homeowner.id,
                "name": homeowner.full_name,
                "email": homeowner.email,
                "date": (
                    homeowner.created_at.strftime("%b %d, %Y")
                    if homeowner.created_at
                    else ""
                ),
                "status": "Active" if homeowner.is_active else "Inactive",
            }
            for homeowner in homeowners
        ]

        providers = (
            session.query(ProviderProfile)
            .join(User, ProviderProfile.user_id == User.id)
            .options(joinedload(ProviderProfile.user))
            .filter(
                ProviderProfile.verification_status == "pending",
                User.is_active.is_(True),
            )
            .order_by(ProviderProfile.verification_submitted_at.desc())
            .limit(10)
            .all()
        )
        services_by_provider = {}
        if providers:
            services = (
                session.query(ProviderService)
                .filter(
                    ProviderService.provider_id.in_(
                        [provider.id for provider in providers]
                    )
                )
                .options(joinedload(ProviderService.category))
                .all()
            )
            for service in services:
                service_name = service.title or (
                    service.category.name if service.category else None
                )
                if service_name:
                    services_by_provider.setdefault(
                        service.provider_id, []
                    ).append(service_name)

        pending_approvals = []
        for provider in providers:
            location = ", ".join(
                part
                for part in (
                    provider.city_municipality_name,
                    provider.province_name,
                )
                if part
            )
            pending_approvals.append(
                {
                    "id": provider.id,
                    "name": provider.business_name or provider.user.full_name,
                    "service": ", ".join(
                        services_by_provider.get(provider.id, [])
                    )
                    or "Service not provided",
                    "location": location
                    or provider.service_area
                    or provider.location
                    or "Location not provided",
                }
            )

        return jsonify(
            counts=counts,
            recentBookings=recent_bookings,
            newCustomers=recent_homeowners,
            pendingApprovals=pending_approvals,
        )
