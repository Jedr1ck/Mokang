from datetime import datetime

from flask import Blueprint, jsonify, request
from sqlalchemy import func, or_

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
from app.models import AuditLog, LoginHistory, ProviderProfile, User
from app.schemas import AdminCredentials, Login, Register

auth_bp = Blueprint("auth", __name__)


def record_login(session, email, user, success):
    session.add(LoginHistory(
        user_id=user.id if user else None,
        attempted_identifier=email[:255],
        success=success,
        ip_address=(request.remote_addr or "")[:45] or None,
        user_agent=(request.user_agent.string or "")[:500] or None,
    ))
    session.add(AuditLog(
        entity_type="authentication",
        entity_id=str(user.id) if user else None,
        action="login_success" if success else "login_failure",
        actor_user_id=user.id if user and success else None,
        details="{}",
    ))


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
    return login_user(required_role=None)


@auth_bp.post("/auth/login/<required_role>")
def login_with_role(required_role):
    if required_role not in ("homeowner", "provider"):
        raise ApiError("Invalid account type", 400)
    return login_user(required_role=required_role)


def login_user(required_role):
    data = validated(Login)
    with get_session() as session:
        user = session.query(User).filter(User.email == data.email).first()
        if (
            not user
            or not pwd.verify(data.password, user.password_hash)
            or (required_role and user.role != required_role)
        ):
            record_login(session, data.email, user, False)
            session.commit()
            raise ApiError("Invalid email or password", 401)
        if not user.is_active:
            record_login(session, data.email, user, False)
            session.commit()
            raise ApiError("Invalid email or password", 401)
        record_login(session, data.email, user, True)
        user.last_login_at = datetime.utcnow()
        session.commit()
        session.refresh(user)
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
                User.is_active.is_(True),
                or_(
                    User.full_name == username,
                    func.lower(User.email) == username.lower(),
                ),
            )
            .first()
        )
        if not user or not pwd.verify(data.password, user.password_hash):
            record_login(session, username, user, False)
            session.commit()
            raise ApiError("Invalid admin username or password", 401)
        record_login(session, user.email, user, True)
        user.last_login_at = datetime.utcnow()
        session.commit()
        session.refresh(user)
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
