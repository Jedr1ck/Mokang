import uuid
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

from flask import Blueprint, jsonify, request
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from app.common import (
    ApiError,
    current_week_start,
    ID_UPLOAD_DIR,
    MAX_ID_SIZE,
    current_user,
    get_current_provider,
    get_session,
    is_at_least_16,
    notify_admins,
    pwd,
    provider_has_future_availability,
    require_auth,
    user_out,
    validated,
    weekly_schedule_has_future_window,
)
from app.models import Category, ProviderService, User, UserProfile
from app.schemas import (
    ProfileUpdate,
    ProfileSecurityUpdate,
    ProviderServiceSelection,
    ProviderServicesUpdate,
    ProviderVerificationUpdate,
)

profiles_bp = Blueprint("profiles", __name__)


def replace_provider_services(session, provider_id, service_selections, hourly_rate=None):
    previous_durations = {}
    for service in session.query(ProviderService).filter_by(provider_id=provider_id).all():
        category_name = service.category.name.casefold() if service.category else ""
        for title in (service.title or "").split(","):
            if title.strip():
                previous_durations[(category_name, title.strip().casefold())] = (
                    service.duration_minutes or 60
                )
    missing_prices = [
        title.strip()
        for selection in service_selections
        for title in selection.service_titles
        if title.strip()
        and title not in selection.service_rates
        and hourly_rate is None
    ]
    if missing_prices:
        raise ApiError(
            {
                "message": "A price is required for every selected service.",
                "missing_prices": missing_prices,
            },
            422,
        )

    session.query(ProviderService).filter_by(
        provider_id=provider_id
    ).delete(synchronize_session=False)

    for selection in service_selections:
        category = (
            session.query(Category)
            .filter(Category.name.ilike(selection.category))
            .first()
        )
        if not category:
            category = Category(name=selection.category)
            session.add(category)
            session.flush()

        for title in selection.service_titles:
            service_title = title.strip()[:150]
            if not service_title:
                continue
            session.add(
                ProviderService(
                    provider_id=provider_id,
                    category_id=category.id,
                    title=service_title,
                    rate=selection.service_rates.get(title, hourly_rate),
                    duration_minutes=previous_durations.get(
                        (selection.category.strip().casefold(), service_title.casefold()),
                        60,
                    ),
                )
            )


@profiles_bp.get("/profile/me")
@require_auth
def get_my_profile():
    with get_session() as session:
        return jsonify(user_out(current_user(session)))


@profiles_bp.put("/profile/me")
@require_auth
def update_my_profile():
    data = validated(ProfileUpdate)
    with get_session() as session:
        user = current_user(session)
        if (
            user.role == "homeowner"
            and data.birthday is not None
            and not is_at_least_16(data.birthday)
        ):
            raise ApiError("Homeowners must be at least 16 years old.", 422)
        profile = session.query(UserProfile).filter_by(user_id=user.id).first()
        if profile is None:
            profile = UserProfile(user_id=user.id)
            session.add(profile)

        if data.fullName is not None:
            user.full_name = data.fullName.strip()
        if data.mobileNumber is not None:
            profile.mobile_number = data.mobileNumber.strip()
        if data.gender is not None:
            profile.gender = data.gender.strip()
        if data.address is not None:
            profile.address = data.address.strip()
        if data.birthday is not None:
            profile.birthday = data.birthday
        if "profilePicture" in data.model_fields_set:
            profile.profile_picture = data.profilePicture

        try:
            session.commit()
            session.refresh(user)
        except Exception as error:
            session.rollback()
            raise ApiError("Unable to save profile changes", 500) from error
        return jsonify(user_out(user))


@profiles_bp.put("/profile/security")
@require_auth
def update_my_security():
    data = validated(ProfileSecurityUpdate)
    if data.newEmail is None and data.newPassword is None:
        raise ApiError("Enter a new email address or password.", 422)

    with get_session() as session:
        user = current_user(session)
        if not pwd.verify(data.currentPassword, user.password_hash):
            raise ApiError("Current password is incorrect.", 401)

        if data.newEmail is not None and str(data.newEmail).lower() != user.email.lower():
            existing_user = (
                session.query(User)
                .filter(
                    func.lower(User.email) == str(data.newEmail).lower(),
                    User.id != user.id,
                )
                .first()
            )
            if existing_user:
                raise ApiError("That email address is already in use.", 409)
            user.email = str(data.newEmail)

        if data.newPassword is not None:
            user.password_hash = pwd.hash(data.newPassword)

        try:
            session.commit()
            session.refresh(user)
        except IntegrityError as error:
            session.rollback()
            raise ApiError("Unable to update account security.", 409) from error
        return jsonify(user_out(user))


@profiles_bp.post("/provider-verification/upload-id")
@require_auth
def upload_provider_id():
    id_side = request.args.get("id_side")
    uploaded_file = request.files.get("file")
    if not uploaded_file:
        raise ApiError("Field required: file", 422)

    with get_session() as session:
        user = current_user(session)
        if user.role != "provider":
            raise ApiError("Providers only.", 403)
        if id_side not in ("front", "back"):
            raise ApiError("id_side must be 'front' or 'back'.", 400)

        provider = get_current_provider(user, session)
        if provider.verification_status == "verified":
            raise ApiError("Your provider profile is already verified.", 400)
        if uploaded_file.mimetype not in ("image/jpeg", "image/png", "image/webp"):
            raise ApiError("Only JPG, PNG, and WEBP images are allowed.", 400)

        content = uploaded_file.stream.read(MAX_ID_SIZE + 1)
        if not content:
            raise ApiError("The uploaded file is empty.", 400)
        if len(content) > MAX_ID_SIZE:
            raise ApiError("Maximum ID image size is 5 MB.", 413)

        if content.startswith(b"\xff\xd8\xff"):
            extension = ".jpg"
        elif content.startswith(b"\x89PNG\r\n\x1a\n"):
            extension = ".png"
        elif (
            len(content) >= 12
            and content[:4] == b"RIFF"
            and content[8:12] == b"WEBP"
        ):
            extension = ".webp"
        else:
            raise ApiError("The file is not a valid supported image.", 400)

        provider_dir = ID_UPLOAD_DIR / str(user.id)
        provider_dir.mkdir(parents=True, exist_ok=True)
        destination = provider_dir / f"{id_side}_{uuid.uuid4().hex}{extension}"
        old_path_value = (
            provider.id_front_path if id_side == "front" else provider.id_back_path
        )

        try:
            destination.write_bytes(content)
            saved_path = destination.relative_to(
                Path(__file__).resolve().parents[1]
            ).as_posix()
            if id_side == "front":
                provider.id_front_path = saved_path
            else:
                provider.id_back_path = saved_path
            provider.verification_status = "incomplete"
            provider.verification_submitted_at = None
            session.commit()
        except Exception as error:
            session.rollback()
            if destination.exists():
                destination.unlink()
            raise ApiError("Unable to save the ID image.", 500) from error

        if old_path_value:
            app_root = Path(__file__).resolve().parents[1]
            old_path = (app_root / old_path_value).resolve()
            allowed_dir = provider_dir.resolve()
            if (
                old_path.is_relative_to(allowed_dir)
                and old_path != destination.resolve()
                and old_path.is_file()
            ):
                old_path.unlink(missing_ok=True)
        return jsonify(message=f"ID {id_side} uploaded successfully.", id_side=id_side)


@profiles_bp.get("/provider-verification/me")
@require_auth
def get_provider_verification():
    with get_session() as session:
        provider = get_current_provider(current_user(session), session)
        provider_services = (
            session.query(ProviderService)
            .filter_by(provider_id=provider.id)
            .all()
        )
        grouped_services = {}
        for service in provider_services:
            category_name = service.category.name if service.category else "Service"
            category_services = grouped_services.setdefault(
                category_name,
                {"capabilities": [], "service_rates": {}},
            )
            for title in (service.title or "").split(","):
                capability = title.strip()
                if (
                    not capability
                    or capability.casefold() == category_name.casefold()
                ):
                    continue
                if capability not in category_services["capabilities"]:
                    category_services["capabilities"].append(capability)
                if service.rate is not None:
                    category_services["service_rates"][capability] = float(
                        service.rate
                    )

        services = [
            {
                "category": category_name,
                "title": ", ".join(service_data["capabilities"]),
                "capabilities": service_data["capabilities"],
                "service_rates": service_data["service_rates"],
                "rate": (
                    next(iter(service_data["service_rates"].values()))
                    if len(service_data["service_rates"]) == 1
                    else None
                ),
            }
            for category_name, service_data in grouped_services.items()
        ]
        effective_availability_status = provider.availability_status
        if (
            (provider.availability_status or "Available") == "Available"
            and not provider_has_future_availability(provider)
        ):
            effective_availability_status = "Unavailable"
        return jsonify(
            {
                "id": provider.id,
                "business_name": provider.business_name,
                "bio": provider.bio,
                "experience_years": provider.experience_years,
                "hourly_rate": (
                    float(provider.hourly_rate)
                    if provider.hourly_rate is not None
                    else None
                ),
                "availability_status": effective_availability_status,
                "verification_status": provider.verification_status,
                "verification_submitted_at": (
                    provider.verification_submitted_at.isoformat()
                    if provider.verification_submitted_at
                    else None
                ),
                "verification_reviewed_at": (
                    provider.verification_reviewed_at.isoformat()
                    if provider.verification_reviewed_at
                    else None
                ),
                "verification_review_notes": provider.verification_review_notes,
                "region_name": provider.region_name,
                "province_name": provider.province_name,
                "city_municipality_name": provider.city_municipality_name,
                "barangay_name": provider.barangay_name,
                "street_address": provider.street_address,
                "postal_code": provider.postal_code,
                "id_type": provider.id_type,
                "id_front_path": provider.id_front_path,
                "id_back_path": provider.id_back_path,
                "qualifications": provider.qualifications,
                "portfolio_paths": provider.portfolio_paths,
                "service_area": provider.service_area,
                "availability_slots": json.loads(provider.availability_slots or "[]"),
                "working_schedule": json.loads(provider.working_schedule or "[]"),
                "services": services,
                "service_category": services[0]["category"] if services else "",
                "service_titles": [
                    capability
                    for service in services
                    for capability in service["capabilities"]
                ],
            }
        )


@profiles_bp.put("/provider-verification/me")
@require_auth
def update_provider_verification():
    data = validated(ProviderVerificationUpdate)
    with get_session() as session:
        provider = get_current_provider(current_user(session), session)
        if provider.verification_status == "verified":
            raise ApiError("Your provider profile is already verified.", 400)

        for field in (
            "business_name",
            "bio",
            "experience_years",
            "region_name",
            "province_name",
            "city_municipality_name",
            "barangay_name",
            "street_address",
            "postal_code",
            "id_type",
            "service_area",
        ):
            setattr(provider, field, getattr(data, field))
        provider.hourly_rate = None
        provider.qualifications = data.bio

        service_selections = data.services or (
            [
                ProviderServiceSelection(
                    category=data.service_category,
                    service_titles=data.service_titles,
                    service_rates={
                        title: data.hourly_rate
                        for title in data.service_titles
                    }
                    if data.hourly_rate is not None
                    else {},
                )
            ]
            if data.service_category
            else []
        )
        replace_provider_services(
            session,
            provider.id,
            service_selections,
            data.hourly_rate,
        )
        provider.verification_status = "incomplete"
        session.commit()
        session.refresh(provider)
        return jsonify(
            message="Provider verification information saved successfully.",
            verification_status=provider.verification_status,
        )


@profiles_bp.put("/provider-availability/me")
@require_auth
def update_provider_availability():
    data = request.get_json(silent=True) or {}
    if "working_schedule" in data:
        schedule = data.get("working_schedule")
        days = ("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")
        if not isinstance(schedule, dict):
            raise ApiError("Working schedule must contain each weekday.", 422)
        normalized = {}
        for day in days:
            row = schedule.get(day)
            if not isinstance(row, dict):
                raise ApiError(f"Missing working hours for {day}.", 422)
            start = str(row.get("start", ""))
            end = str(row.get("end", ""))
            try:
                start_time = datetime.strptime(start, "%H:%M").time()
                end_time = datetime.strptime(end, "%H:%M").time()
            except ValueError as error:
                raise ApiError(f"Set valid 24-hour times for {day}.", 422) from error
            enabled = row.get("enabled") is True
            if enabled and end_time <= start_time:
                raise ApiError(f"End time must be after start time for {day}.", 422)
            normalized[day] = {
                "enabled": enabled,
                "start": start,
                "end": end,
            }
        normalized["_week_start"] = current_week_start()

        with get_session() as session:
            provider = get_current_provider(current_user(session), session)
            provider.working_schedule = json.dumps(normalized)
            provider.availability_slots = "[]"
            provider.availability_status = (
                "Available"
                if weekly_schedule_has_future_window(normalized)
                else "Unavailable"
            )
            session.commit()
            return jsonify(
                working_schedule=normalized,
                availability_slots=[],
                availability_status=provider.availability_status,
            )

    slots = data.get("availability_slots")
    if not isinstance(slots, list) or len(slots) > 168:
        raise ApiError("Availability must be a list of up to 168 date and time slots.", 422)
    normalized = []
    today = datetime.now(timezone(timedelta(hours=8))).date()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)
    for slot in slots:
        date_value = str(slot.get("date", "")) if isinstance(slot, dict) else ""
        time_value = str(slot.get("time", "")) if isinstance(slot, dict) else ""
        try:
            datetime.strptime(date_value, "%Y-%m-%d")
            datetime.strptime(time_value, "%H:%M")
        except ValueError as error:
            raise ApiError("Each availability slot needs a valid date and time.", 422) from error
        slot_date = datetime.strptime(date_value, "%Y-%m-%d").date()
        if slot_date < today:
            raise ApiError("Availability dates cannot be in the past.", 422)
        if slot_date > week_end:
            raise ApiError("Availability can only be set through Sunday of this week.", 422)
        item = {"date": date_value, "time": time_value}
        if item not in normalized:
            normalized.append(item)

    with get_session() as session:
        provider = get_current_provider(current_user(session), session)
        provider.availability_slots = json.dumps(normalized)
        provider.working_schedule = "[]"
        # Saving an open schedule means the provider is ready to receive
        # requests for those time slots. The separate dashboard toggle can
        # still pause availability after the schedule has been saved.
        provider.availability_status = "Available" if normalized else "Unavailable"
        session.commit()
        return jsonify(
            availability_slots=normalized,
            availability_status=provider.availability_status,
        )


@profiles_bp.put("/provider-availability/status")
@require_auth
def update_provider_availability_status():
    data = request.get_json(silent=True) or {}
    availability_status = data.get("availability_status")
    if availability_status not in {"Available", "Unavailable"}:
        raise ApiError("Availability must be Available or Unavailable.", 422)

    with get_session() as session:
        provider = get_current_provider(current_user(session), session)
        if provider.verification_status != "verified":
            raise ApiError("Only verified providers can change availability.", 403)
        if availability_status == "Available":
            if not provider_has_future_availability(provider):
                raise ApiError(
                    "This week's availability has expired or has no remaining hours. Save a schedule with future hours before going online.",
                    409,
                )
        provider.availability_status = availability_status
        session.commit()
        return jsonify(availability_status=provider.availability_status)


@profiles_bp.put("/provider-verification/services")
@require_auth
def update_verified_provider_services():
    data = validated(ProviderServicesUpdate)
    if not data.services:
        raise ApiError("Keep at least one service on your profile.", 422)

    with get_session() as session:
        provider = get_current_provider(current_user(session), session)
        if provider.verification_status != "verified":
            raise ApiError("Only verified providers can edit services here.", 400)

        replace_provider_services(session, provider.id, data.services)
        session.commit()
        return jsonify(
            message="Your services have been updated successfully.",
            services=[
                {
                    "category": selection.category,
                    "capabilities": [
                        title.strip()[:150]
                        for title in selection.service_titles
                        if title.strip()
                    ],
                    "service_rates": {
                        title.strip()[:150]: selection.service_rates[title]
                        for title in selection.service_titles
                        if title.strip()
                    },
                }
                for selection in data.services
            ],
        )


@profiles_bp.post("/provider-verification/submit")
@require_auth
def submit_provider_verification():
    with get_session() as session:
        provider = get_current_provider(current_user(session), session)
        if provider.verification_status == "verified":
            raise ApiError("Your provider profile is already verified.", 400)

        required_fields = {
            "business_name": provider.business_name,
            "region_name": provider.region_name,
            "province_name": provider.province_name,
            "city_municipality_name": provider.city_municipality_name,
            "barangay_name": provider.barangay_name,
            "street_address": provider.street_address,
            "id_type": provider.id_type,
            "service_area": provider.service_area,
        }
        missing_fields = [
            name
            for name, value in required_fields.items()
            if not value or not str(value).strip()
        ]
        if missing_fields:
            raise ApiError(
                {
                    "message": "Please complete all required verification information.",
                    "missing_fields": missing_fields,
                },
                400,
            )
        if not provider.id_front_path or not provider.id_back_path:
            raise ApiError(
                "Please upload both the front and back of your valid ID first.",
                400,
            )

        provider.verification_status = "pending"
        provider.verification_submitted_at = datetime.utcnow()
        provider.verification_reviewed_at = None
        provider.verification_reviewed_by = None
        provider.verification_review_notes = None
        notify_admins(
            session,
            "Provider verification submitted",
            f"Provider {provider.business_name or provider.user.full_name} submitted profile verification for review.",
            "provider",
        )
        session.commit()
        session.refresh(provider)
        return jsonify(
            message="Provider verification submitted successfully.",
            verification_status=provider.verification_status,
            verification_submitted_at=provider.verification_submitted_at.isoformat(),
        )
