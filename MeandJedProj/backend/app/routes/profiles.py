import uuid
from datetime import datetime
from pathlib import Path

from flask import Blueprint, jsonify, request

from app.common import (
    ApiError,
    ID_UPLOAD_DIR,
    MAX_ID_SIZE,
    current_user,
    get_current_provider,
    get_session,
    require_auth,
    user_out,
    validated,
)
from app.models import UserProfile
from app.schemas import ProfileUpdate, ProviderVerificationUpdate

profiles_bp = Blueprint("profiles", __name__)


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
        profile = session.query(UserProfile).filter_by(user_id=user.id).first()
        if profile is None:
            profile = UserProfile(user_id=user.id)
            session.add(profile)

        user.full_name = data.fullName.strip()
        profile.mobile_number = data.mobileNumber.strip()
        profile.gender = data.gender.strip()
        profile.address = data.address.strip()
        profile.birthday = data.birthday
        profile.profile_picture = data.profilePicture

        try:
            session.commit()
            session.refresh(user)
        except Exception as error:
            session.rollback()
            raise ApiError("Unable to save profile changes", 500) from error
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
                "availability_status": provider.availability_status,
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
            "hourly_rate",
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
        provider.verification_status = "incomplete"
        session.commit()
        session.refresh(provider)
        return jsonify(
            message="Provider verification information saved successfully.",
            verification_status=provider.verification_status,
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
        session.commit()
        session.refresh(provider)
        return jsonify(
            message="Provider verification submitted successfully.",
            verification_status=provider.verification_status,
            verification_submitted_at=provider.verification_submitted_at.isoformat(),
        )
