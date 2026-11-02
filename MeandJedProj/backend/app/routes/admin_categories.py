from flask import Blueprint, jsonify, request
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from app.common import ApiError, current_user, get_session, require_auth
from app.models import Booking, Category, ProviderService

admin_categories_bp = Blueprint(
    "admin_categories",
    __name__,
    url_prefix="/admin/categories",
)


def require_admin(user):
    if user.role != "admin" or not user.is_active:
        raise ApiError("Administrator access required", 403)


def category_output(category):
    return {
        "id": category.id,
        "name": category.name,
        "description": category.description or "",
        "status": "Active" if category.is_active else "Inactive",
    }


def read_category_payload():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        raise ApiError("A JSON request body is required.", 422)

    name = payload.get("name")
    description = payload.get("description", "")
    status = payload.get("status", "Active")
    if not isinstance(name, str) or not name.strip():
        raise ApiError("Category name is required.", 422)
    if len(name.strip()) > 100:
        raise ApiError("Category name must be 100 characters or fewer.", 422)
    if not isinstance(description, str):
        raise ApiError("Category description must be text.", 422)
    if not isinstance(status, str) or status not in {"Active", "Inactive"}:
        raise ApiError("Category status must be Active or Inactive.", 422)
    return name.strip(), description.strip(), status == "Active"


@admin_categories_bp.get("")
@require_auth
def list_categories():
    with get_session() as session:
        require_admin(current_user(session))
        categories = (
            session.query(Category)
            .order_by(func.lower(Category.name), Category.id)
            .all()
        )
        return jsonify([category_output(category) for category in categories])


@admin_categories_bp.post("")
@require_auth
def create_category():
    name, description, is_active = read_category_payload()
    with get_session() as session:
        require_admin(current_user(session))
        duplicate = (
            session.query(Category.id)
            .filter(func.lower(Category.name) == name.lower())
            .first()
        )
        if duplicate:
            raise ApiError("A service category with that name already exists.", 409)

        category = Category(
            name=name,
            description=description,
            is_active=is_active,
        )
        session.add(category)
        try:
            session.commit()
        except IntegrityError as error:
            session.rollback()
            raise ApiError(
                "A service category with that name already exists.",
                409,
            ) from error
        session.refresh(category)
        return jsonify(category_output(category)), 201


@admin_categories_bp.put("/<int:category_id>")
@require_auth
def update_category(category_id):
    name, description, is_active = read_category_payload()
    with get_session() as session:
        require_admin(current_user(session))
        category = session.get(Category, category_id)
        if not category:
            raise ApiError("Service category not found.", 404)

        duplicate = (
            session.query(Category.id)
            .filter(
                func.lower(Category.name) == name.lower(),
                Category.id != category_id,
            )
            .first()
        )
        if duplicate:
            raise ApiError("A service category with that name already exists.", 409)

        category.name = name
        category.description = description
        category.is_active = is_active
        try:
            session.commit()
        except IntegrityError as error:
            session.rollback()
            raise ApiError(
                "A service category with that name already exists.",
                409,
            ) from error
        return jsonify(category_output(category))


@admin_categories_bp.delete("/<int:category_id>")
@require_auth
def delete_category(category_id):
    with get_session() as session:
        require_admin(current_user(session))
        category = session.get(Category, category_id)
        if not category:
            raise ApiError("Service category not found.", 404)

        has_provider_services = (
            session.query(ProviderService.id)
            .filter(ProviderService.category_id == category_id)
            .first()
        )
        has_bookings = (
            session.query(Booking.id)
            .filter(Booking.category_id == category_id)
            .first()
        )
        if has_provider_services or has_bookings:
            raise ApiError(
                "This category is used by provider services or bookings. Deactivate it instead.",
                409,
            )

        session.delete(category)
        session.commit()
        return jsonify(message="Service category deleted.")
