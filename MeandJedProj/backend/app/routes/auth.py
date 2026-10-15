from flask import Blueprint, jsonify

from app.common import (
    ApiError,
    create_token,
    current_user,
    get_session,
    pwd,
    require_auth,
    user_out,
    validated,
)
from app.models import ProviderProfile, User
from app.schemas import AdminCredentials, Login, Register

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/auth/register")
def register():
    data = validated(Register)
    if data.role not in ("homeowner", "provider"):
        raise ApiError("Invalid role", 400)

    with get_session() as session:
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
        response = {
            "message": "Registration successful",
            "access_token": create_token(user),
            "token_type": "bearer",
            "user": user_out(user),
        }
        return jsonify(response)


@auth_bp.post("/auth/login")
def login():
    data = validated(Login)
    with get_session() as session:
        user = session.query(User).filter(User.email == data.email).first()
        if not user or not pwd.verify(data.password, user.password_hash):
            raise ApiError("Invalid email or password", 401)
        return jsonify(
            access_token=create_token(user),
            token_type="bearer",
            user=user_out(user),
        )


@auth_bp.post("/auth/admin/login")
def login_admin():
    data = validated(AdminCredentials)
    username = data.username.strip()
    with get_session() as session:
        user = (
            session.query(User)
            .filter(
                User.role == "admin",
                User.full_name == username,
                User.is_active.is_(True),
            )
            .first()
        )
        if not user or not pwd.verify(data.password, user.password_hash):
            raise ApiError("Invalid admin username or password", 401)
        return jsonify(
            access_token=create_token(user),
            token_type="bearer",
            user=user_out(user),
        )


@auth_bp.get("/auth/me")
@require_auth
def me():
    with get_session() as session:
        return jsonify(user_out(current_user(session)))
