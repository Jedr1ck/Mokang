from datetime import datetime, timedelta, timezone
from functools import wraps
from pathlib import Path
import json

from flask import current_app, g, jsonify, request
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import ValidationError
from sqlalchemy import and_, or_

from app.models import (
    Booking,
    Notification,
    ProviderProfile,
    ProviderService,
    User,
)

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
ALGORITHM = "HS256"
MAX_ID_SIZE = 5 * 1024 * 1024
ID_UPLOAD_DIR = Path(__file__).resolve().parent / "private_uploads" / "provider_ids"
MANILA_TIMEZONE = timezone(timedelta(hours=8))


def current_week_start(today=None):
    day = today or datetime.now(MANILA_TIMEZONE).date()
    return (day - timedelta(days=day.weekday())).isoformat()


def weekly_schedule_is_current(schedule, today=None):
    return (
        isinstance(schedule, dict)
        and schedule.get("_week_start") == current_week_start(today)
    )


def weekly_schedule_has_future_window(schedule, now=None):
    now = now or datetime.now(MANILA_TIMEZONE)
    if not weekly_schedule_is_current(schedule, now.date()):
        return False
    week_start = now.date() - timedelta(days=now.weekday())
    for offset, day_name in enumerate((
        "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
    )):
        hours = schedule.get(day_name)
        if not isinstance(hours, dict) or hours.get("enabled") is not True:
            continue
        try:
            start = datetime.strptime(str(hours.get("start", "")), "%H:%M").time()
            end = datetime.strptime(str(hours.get("end", "")), "%H:%M").time()
        except ValueError:
            continue
        if end <= start:
            continue
        work_date = week_start + timedelta(days=offset)
        if work_date > now.date() or (work_date == now.date() and end > now.time().replace(tzinfo=None)):
            return True
    return False


def is_at_least_16(birthday, today=None):
    today = today or datetime.now(MANILA_TIMEZONE).date()
    age = today.year - birthday.year
    if (today.month, today.day) < (birthday.month, birthday.day):
        age -= 1
    return age >= 16


def provider_has_future_availability(provider, now=None):
    now = now or datetime.now(MANILA_TIMEZONE)
    schedule = json.loads(provider.working_schedule or "{}")
    if isinstance(schedule, dict) and any(
        isinstance(value, dict) for value in schedule.values()
    ):
        return weekly_schedule_has_future_window(schedule, now)

    today = now.date()
    today_value = today.isoformat()
    week_end = today + timedelta(days=6 - today.weekday())
    current_time = now.strftime("%H:%M")
    slots = json.loads(provider.availability_slots or "[]")
    return any(
        isinstance(slot, dict)
        and isinstance(slot.get("date"), str)
        and isinstance(slot.get("time"), str)
        and today_value <= slot["date"] <= week_end.isoformat()
        and (
            slot["date"] > today_value
            or slot["time"] > current_time
        )
        for slot in slots
    )


class ApiError(Exception):
    def __init__(self, detail, status_code):
        super().__init__(str(detail))
        self.detail = detail
        self.status_code = status_code


def get_session():
    return current_app.extensions["session_factory"]()


def validated(schema):
    try:
        return schema.model_validate(request.get_json(silent=True) or {})
    except ValidationError as error:
        errors = []
        for item in error.errors():
            errors.append(
                {
                    "loc": ["body", *item["loc"]],
                    "msg": item["msg"],
                    "type": item["type"],
                }
            )
        raise ApiError(errors, 422) from error


def api_error_handler(error):
    if isinstance(error, ApiError):
        return jsonify(detail=error.detail), error.status_code
    return jsonify(detail="Internal server error"), 500


def require_auth(function):
    @wraps(function)
    def wrapped(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        scheme, _, token = auth_header.partition(" ")
        if scheme.lower() != "bearer" or not token:
            raise ApiError(
                "Not authenticated",
                403 if auth_header else 403,
            )
        try:
            payload = jwt.decode(
                token,
                current_app.config["SECRET_KEY"],
                algorithms=[ALGORITHM],
            )
            user_id = int(payload["sub"])
        except (JWTError, KeyError, TypeError, ValueError) as error:
            raise ApiError("Invalid token", 401) from error

        with get_session() as session:
            user = session.get(User, user_id)
            if not user:
                raise ApiError("User not found", 401)
            g.current_user_id = user.id
        return function(*args, **kwargs)

    return wrapped


def current_user(session):
    return session.get(User, g.current_user_id)


def notify_admins(session, title, body, notification_type):
    admins = (
        session.query(User)
        .filter(User.role == "admin", User.is_active.is_(True))
        .all()
    )
    session.add_all(
        Notification(
            user_id=admin.id,
            title=title,
            body=body,
            type=notification_type,
        )
        for admin in admins
    )


def create_token(user):
    return jwt.encode(
        {
            "sub": str(user.id),
            "exp": datetime.utcnow() + timedelta(days=1),
        },
        current_app.config["SECRET_KEY"],
        algorithm=ALGORITHM,
    )


def user_out(user):
    profile = user.profile
    missing_profile_fields = profile_missing_fields(user)
    return {
        "id": user.id,
        "fullName": user.full_name,
        "email": user.email,
        "createdAt": user.created_at.isoformat() if user.created_at else None,
        "lastLoginAt": user.last_login_at.isoformat() if user.last_login_at else None,
        "mobileNumber": profile.mobile_number if profile else None,
        "gender": profile.gender if profile else None,
        "address": profile.address if profile else None,
        "birthday": (
            profile.birthday.isoformat()
            if profile and profile.birthday
            else None
        ),
        "profilePicture": profile.profile_picture if profile else None,
        "role": user.role,
        "profileComplete": not missing_profile_fields,
        "missingProfileFields": missing_profile_fields,
    }


def profile_missing_fields(user):
    profile = user.profile
    fields = {
        "fullName": user.full_name,
        "mobileNumber": profile.mobile_number if profile else None,
        "gender": profile.gender if profile else None,
        "address": profile.address if profile else None,
        "birthday": profile.birthday if profile else None,
    }
    return [
        name
        for name, value in fields.items()
        if not value or (isinstance(value, str) and not value.strip())
    ]


def get_current_provider(user, session):
    provider = (
        session.query(ProviderProfile)
        .filter(ProviderProfile.user_id == user.id)
        .first()
    )
    if not provider:
        raise ApiError("Provider profile not found.", 404)
    return provider


def booking_out(booking):
    homeowner = booking.homeowner
    profile = homeowner.profile if homeowner else None
    return {
        "id": booking.id,
        "bookingCode": booking.booking_code,
        "category": booking.category.name if booking.category else None,
        "serviceName": booking.service_name,
        "preferredDate": str(booking.preferred_date),
        "preferredTime": str(booking.preferred_time),
        "serviceDurationMinutes": booking.service_duration_minutes,
        "address": booking.address,
        "description": booking.description,
        "status": booking.status,
        "providerId": booking.provider_id,
        "providerUserId": booking.provider.user_id if booking.provider else None,
        "providerName": (
            booking.provider.business_name or booking.provider.user.full_name
            if booking.provider
            else None
        ),
        "providerProfilePicture": (
            booking.provider.user.profile.profile_picture
            if booking.provider and booking.provider.user.profile
            else None
        ),
        "homeownerId": booking.homeowner_id,
        "customerName": homeowner.full_name if homeowner else None,
        "customerProfilePicture": (
            profile.profile_picture if profile else None
        ),
        "customerPhone": profile.mobile_number if profile else None,
        "customerEmail": homeowner.email if homeowner else None,
    }


CATEGORY_ALIASES = {
    "electrical": {"electrical", "electrical repair", "wiring", "lighting", "circuit", "outlet", "fan"},
    "plumbing": {"plumbing", "pipe", "leak", "drain", "water", "sink"},
    "carpentry": {"carpentry", "woodwork", "cabinet", "door", "furniture"},
    "cleaning": {"cleaning", "house cleaning", "ac cleaning", "aircon cleaning", "maintenance", "general service"},
    "painting": {"painting", "paint", "repaint", "wall paint"},
    "appliance repair": {"appliance repair", "appliance", "aircon", "ac repair", "refrigerator", "washing machine"},
    "gardening": {"gardening", "garden", "landscaping", "lawn"},
}


def normalize_category_name(category_name):
    if not category_name:
        return None
    raw = category_name.strip()
    if not raw:
        return None
    lowered = raw.lower()
    for canonical, aliases in CATEGORY_ALIASES.items():
        if (
            lowered == canonical
            or lowered in aliases
            or any(alias in lowered for alias in aliases)
        ):
            return "Appliance Repair" if canonical == "appliance repair" else canonical.title()
    return raw


def provider_booking_query(query, user, session):
    if user.role == "homeowner":
        return query.filter(Booking.homeowner_id == user.id)
    if user.role == "provider":
        provider = (
            session.query(ProviderProfile)
            .filter_by(user_id=user.id)
            .first()
        )
        if (
            not provider
            or not provider.is_verified
            or provider.verification_status != "verified"
            or profile_missing_fields(user)
        ):
            return query.filter(Booking.id == -1)
        category_ids = [
            row.category_id
            for row in session.query(ProviderService.category_id)
            .filter_by(provider_id=provider.id)
            .all()
        ]
        if category_ids:
            return query.filter(
                or_(
                    Booking.provider_id == provider.id,
                    and_(
                        Booking.provider_id.is_(None),
                        Booking.category_id.in_(category_ids),
                    ),
                )
            )
        return query.filter(Booking.provider_id == provider.id)
    return query
