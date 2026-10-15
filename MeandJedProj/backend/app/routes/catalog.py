from flask import Blueprint, jsonify, request
from sqlalchemy import func

from app.common import get_session
from app.models import Category, ProviderProfile, ProviderService, User

catalog_bp = Blueprint("catalog", __name__)


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
        rows = session.query(ProviderProfile).join(User).all()
        output = []
        for provider in rows:
            service = (
                session.query(ProviderService)
                .filter_by(provider_id=provider.id)
                .first()
            )
            category_name = (
                service.category.name
                if service and service.category
                else ""
            )
            searchable = " ".join(
                filter(
                    None,
                    (
                        provider.user.full_name,
                        provider.business_name,
                        category_name,
                    ),
                )
            ).lower()

            if query_text and query_text.lower() not in searchable:
                continue
            if location and location.lower() not in (provider.location or "").lower():
                continue
            if category_filter and category_filter.lower() not in category_name.lower():
                continue

            output.append(
                {
                    "id": provider.id,
                    "name": provider.business_name or provider.user.full_name,
                    "category": category_name or "Service Provider",
                    "location": provider.location or "",
                    "rate": float(provider.hourly_rate or 0),
                    "experience": f"{provider.experience_years or 0} years exp",
                    "availability": provider.availability_status or "Available",
                    "availabilityType": "today",
                    "rating": 0,
                    "reviews": 0,
                    "image": (
                        "https://images.unsplash.com/"
                        "photo-1540569014015-19a7be504e3a"
                        "?w=150&auto=format&fit=crop&q=80"
                    ),
                }
            )
        return jsonify(output)
