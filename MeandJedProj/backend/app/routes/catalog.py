from flask import Blueprint, jsonify, request
from sqlalchemy import func

from app.common import get_session
from app.models import Booking, Category, ProviderProfile, ProviderService, User

catalog_bp = Blueprint("catalog", __name__)


def verified_provider_query(session):
    return (
        session.query(ProviderProfile)
        .join(User)
        .filter(
            User.role == "provider",
            User.is_active.is_(True),
            ProviderProfile.is_verified.is_(True),
            ProviderProfile.verification_status == "verified",
            ProviderProfile.verification_reviewed_by.isnot(None),
            ProviderProfile.verification_reviewed_at.isnot(None),
            func.trim(ProviderProfile.business_name) != "",
            func.trim(ProviderProfile.region_name) != "",
            func.trim(ProviderProfile.province_name) != "",
            func.trim(ProviderProfile.city_municipality_name) != "",
            func.trim(ProviderProfile.barangay_name) != "",
            func.trim(ProviderProfile.street_address) != "",
            func.trim(ProviderProfile.id_type) != "",
            func.trim(ProviderProfile.id_front_path) != "",
            func.trim(ProviderProfile.id_back_path) != "",
            func.trim(ProviderProfile.service_area) != "",
        )
    )


def provider_location(provider):
    return ", ".join(
        part
        for part in (
            provider.barangay_name,
            provider.city_municipality_name,
            provider.province_name,
            provider.region_name,
        )
        if part and part.strip()
    )


@catalog_bp.get("/public/stats")
def public_stats():
    with get_session() as session:
        user_count = (
            session.query(func.count(User.id))
            .filter(User.is_active.is_(True))
            .scalar()
            or 0
        )
        return jsonify(userCount=user_count)


@catalog_bp.get("/categories")
def categories():
    with get_session() as session:
        return jsonify(
            [
                {"id": category.id, "name": category.name}
                for category in session.query(Category).all()
            ]
        )


@catalog_bp.get("/providers")
def providers():
    query_text = request.args.get("q")
    location = request.args.get("location")
    category_filter = request.args.get("category")
    with get_session() as session:
        rows = verified_provider_query(session).all()
        output = []
        for provider in rows:
            services = (
                session.query(ProviderService)
                .filter_by(provider_id=provider.id)
                .all()
            )
            category_names = list(
                dict.fromkeys(
                    service.category.name
                    for service in services
                    if service.category and service.category.name
                )
            )
            specific_services = list(
                dict.fromkeys(
                    title.strip()
                    for service in services
                    if service.title
                    for title in service.title.split(",")
                    if title.strip()
                    and title.strip().casefold()
                    not in {
                        service.category.name.casefold()
                        if service.category and service.category.name
                        else ""
                    }
                )
            )
            category_name = ", ".join(category_names) or "Service Provider"
            location_name = provider_location(provider)
            searchable = " ".join(
                filter(
                    None,
                    (
                        provider.user.full_name,
                        provider.business_name,
                        *(category_names),
                    ),
                )
            ).lower()

            if query_text and query_text.lower() not in searchable:
                continue
            if location and location.lower() not in location_name.lower():
                continue
            if category_filter and category_filter.lower() not in category_name.lower():
                continue

            output.append(
                {
                    "id": provider.id,
                    "name": provider.business_name or provider.user.full_name,
                    "category": category_name,
                    "expertise": (
                        ", ".join(specific_services)
                        or provider.qualifications
                        or provider.bio
                        or category_name
                    ),
                    "specificServices": specific_services,
                    "qualifications": provider.qualifications or "",
                    "location": location_name,
                    "rate": float(provider.hourly_rate or 0),
                    "experience": f"{provider.experience_years or 0} years exp",
                    "availability": provider.availability_status or "Available",
                    "availabilityType": "today",
                    "rating": 0,
                    "reviews": 0,
                    "image": (
                        provider.user.profile.profile_picture
                        if provider.user.profile
                        else None
                    ),
                }
            )
        return jsonify(output)


@catalog_bp.get("/providers/<int:provider_id>")
def provider_details(provider_id):
    with get_session() as session:
        provider = verified_provider_query(session).filter(
            ProviderProfile.id == provider_id
        ).first()
        if not provider:
            return jsonify(detail="Provider not found"), 404

        services = (
            session.query(ProviderService)
            .filter_by(provider_id=provider.id)
            .all()
        )
        completed_jobs = (
            session.query(func.count(Booking.id))
            .filter(
                Booking.provider_id == provider.id,
                Booking.status == "Completed",
            )
            .scalar()
            or 0
        )
        return jsonify(
            {
                "id": provider.id,
                "name": provider.business_name or provider.user.full_name,
                "fullName": provider.user.full_name,
                "category": ", ".join(
                    dict.fromkeys(
                        service.category.name
                        for service in services
                        if service.category and service.category.name
                    )
                ),
                "location": provider_location(provider),
                "serviceArea": provider.service_area,
                "rate": (
                    float(provider.hourly_rate)
                    if provider.hourly_rate is not None
                    else None
                ),
                "experienceYears": provider.experience_years or 0,
                "availability": provider.availability_status or "Available",
                "bio": provider.bio or "",
                "qualifications": provider.qualifications or "",
                "image": (
                    provider.user.profile.profile_picture
                    if provider.user.profile
                    else None
                ),
                "completedJobs": completed_jobs,
                "isVerified": provider.is_verified,
                "services": [
                    {
                        "name": service.title
                        or (
                            service.category.name
                            if service.category
                            else "Service"
                        ),
                        "category": (
                            service.category.name
                            if service.category
                            else service.title or "Service"
                        ),
                        "price": (
                            float(service.rate)
                            if service.rate is not None
                            else None
                        ),
                    }
                    for service in services
                ],
            }
        )
