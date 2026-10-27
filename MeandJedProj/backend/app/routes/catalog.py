from flask import Blueprint, jsonify, request
from sqlalchemy import func

from app.common import get_session
from app.models import (
    Booking,
    Category,
    ProviderProfile,
    ProviderService,
    Review,
    User,
    UserProfile,
)

catalog_bp = Blueprint("catalog", __name__)


def verified_provider_query(session):
    return (
        session.query(ProviderProfile)
        .join(User)
        .join(UserProfile, UserProfile.user_id == User.id)
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
            func.trim(UserProfile.mobile_number) != "",
            func.trim(UserProfile.gender) != "",
            func.trim(UserProfile.address) != "",
            UserProfile.birthday.isnot(None),
            ProviderProfile.id.in_(
                session.query(ProviderService.provider_id).filter(
                    ProviderService.title.isnot(None),
                    func.trim(ProviderService.title) != "",
                )
            ),
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
    service_filter = request.args.get("service")
    with get_session() as session:
        rows = verified_provider_query(session).all()
        review_summaries = {
            provider_id: {"rating": float(average_rating), "reviews": review_count}
            for provider_id, average_rating, review_count in (
                session.query(
                    Booking.provider_id,
                    func.avg(Review.rating),
                    func.count(Review.id),
                )
                .join(Review, Review.booking_id == Booking.id)
                .filter(Booking.provider_id.isnot(None))
                .group_by(Booking.provider_id)
                .all()
            )
        }
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
            capability_names = specific_services or [
                service.category.name
                for service in services
                if service.category and service.category.name
            ]
            service_prices = [
                float(service.rate)
                for service in services
                if service.rate is not None
            ]
            review_summary = review_summaries.get(
                provider.id, {"rating": 0.0, "reviews": 0}
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
            if service_filter and not any(
                service_filter.strip().casefold() in capability.casefold()
                for capability in capability_names
            ):
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
                    "capabilities": capability_names,
                    "qualifications": provider.qualifications or "",
                    "location": location_name,
                    "rate": min(service_prices) if service_prices else None,
                    "servicePrices": {
                        service.title: float(service.rate)
                        for service in services
                        if service.title and service.rate is not None
                    },
                    "experience": f"{provider.experience_years or 0} years exp",
                    "availability": provider.availability_status or "Available",
                    "availabilityType": "today",
                    "rating": round(review_summary["rating"], 1),
                    "reviews": review_summary["reviews"],
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
        reviews = (
            session.query(Review)
            .join(Booking, Review.booking_id == Booking.id)
            .filter(Booking.provider_id == provider.id)
            .order_by(Review.created_at.desc())
            .limit(10)
            .all()
        )
        average_rating, review_count = (
            session.query(func.avg(Review.rating), func.count(Review.id))
            .join(Booking, Review.booking_id == Booking.id)
            .filter(Booking.provider_id == provider.id)
            .one()
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
                    min(
                        float(service.rate)
                        for service in services
                        if service.rate is not None
                    )
                    if any(service.rate is not None for service in services)
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
                "rating": round(float(average_rating), 1) if average_rating else 0,
                "reviews": review_count,
                "reviewDetails": [
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
                    }
                    for review in reviews
                ],
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
