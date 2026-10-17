from flask import Blueprint, jsonify

from app.common import (
    ApiError,
    current_user,
    get_session,
    pwd,
    require_auth,
    validated,
)
from app.models import ProviderProfile, User
from app.schemas import AdminAccountCreate

admin_users_bp = Blueprint("admin_users", __name__, url_prefix="/admin/users")


def require_admin(user):
    if user.role != "admin" or not user.is_active:
        raise ApiError("Administrator access required", 403)


@admin_users_bp.get("/homeowners")
@require_auth
def list_homeowners():
    with get_session() as session:
        require_admin(current_user(session))
        homeowners = (
            session.query(User)
            .filter(User.role == "homeowner")
            .order_by(User.full_name.asc())
            .all()
        )
        return jsonify(
            [
                {
                    "id": user.id,
                    "fullName": user.full_name,
                    "email": user.email,
                    "contact": user.profile.mobile_number if user.profile else None,
                    "location": user.profile.address if user.profile else None,
                    "status": "Active" if user.is_active else "Inactive",
                }
                for user in homeowners
            ]
        )


@admin_users_bp.post("")
@require_auth
def create_account():
    data = validated(AdminAccountCreate)
    if data.role not in ("homeowner", "provider"):
        raise ApiError("Invalid role", 400)

    with get_session() as session:
        require_admin(current_user(session))
        if session.query(User).filter(User.email == data.email).first():
            raise ApiError("Email already registered", 409)

        user = User(
            full_name=data.full_name,
            email=str(data.email),
            password_hash=pwd.hash(data.password),
            role=data.role,
        )
        session.add(user)
        session.flush()

        if data.role == "provider":
            session.add(ProviderProfile(user_id=user.id))

        session.commit()
        session.refresh(user)
        return jsonify(
            id=user.id,
            fullName=user.full_name,
            email=user.email,
            role=user.role,
        ), 201
