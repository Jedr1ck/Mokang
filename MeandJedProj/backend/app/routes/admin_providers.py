from flask import Blueprint, jsonify
from sqlalchemy.orm import joinedload

from app.common import ApiError, current_user, get_session, require_auth
from app.models import ProviderProfile, ProviderService, User

admin_providers_bp = Blueprint(
    "admin_providers",
    __name__,
    url_prefix="/admin/providers",
)


def require_admin(user):
    if user.role != "admin" or not user.is_active:
        raise ApiError("Administrator access required", 403)


@admin_providers_bp.get("")
@require_auth
def list_providers():
    with get_session() as session:
        require_admin(current_user(session))
        providers = (
            session.query(ProviderProfile)
            .join(User, ProviderProfile.user_id == User.id)
            .options(
                joinedload(ProviderProfile.user).joinedload(User.profile)
            )
            .order_by(User.full_name.asc())
            .all()
        )

        services_by_provider = {}
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
            services_by_provider.setdefault(service.provider_id, []).append(
                service.title
                or (
                    service.category.name
                    if service.category
                    else None
                )
            )

        result = []
        for provider in providers:
            user = provider.user
            profile = user.profile
            location_parts = [
                provider.street_address,
                provider.barangay_name,
                provider.city_municipality_name,
                provider.province_name,
                provider.region_name,
                provider.postal_code,
            ]
            location = ", ".join(part for part in location_parts if part)
            location = location or provider.location or (
                profile.address if profile else None
            )

            result.append(
                {
                    "id": provider.id,
                    "userId": user.id,
                    "fullName": user.full_name,
                    "email": user.email,
                    "contact": profile.mobile_number if profile else None,
                    "gender": profile.gender if profile else None,
                    "birthday": (
                        profile.birthday.isoformat()
                        if profile and profile.birthday
                        else None
                    ),
                    "address": profile.address if profile else None,
                    "profilePicture": (
                        profile.profile_picture if profile else None
                    ),
                    "businessName": provider.business_name,
                    "serviceCategory": ", ".join(
                        name
                        for name in services_by_provider.get(provider.id, [])
                        if name
                    ),
                    "location": location,
                    "experience": provider.experience_years or 0,
                    "hourlyRate": (
                        float(provider.hourly_rate)
                        if provider.hourly_rate is not None
                        else None
                    ),
                    "qualifications": provider.qualifications,
                    "serviceArea": provider.service_area,
                    "verificationStatus": provider.verification_status,
                    "accountStatus": (
                        "Active" if user.is_active else "Inactive"
                    ),
                    "isVerified": provider.is_verified,
                }
            )

        return jsonify(result)
