from datetime import datetime
from pathlib import Path

from flask import Blueprint, jsonify, send_file

from app.common import ApiError, current_user, get_session, require_auth
from app.models import ProviderProfile, ProviderService, User

admin_verifications_bp = Blueprint(
    "admin_verifications",
    __name__,
    url_prefix="/admin/provider-verifications",
)


def require_admin(user):
    if user.role != "admin" or not user.is_active:
        raise ApiError("Administrator access required", 403)


@admin_verifications_bp.get("")
@require_auth
def list_pending_verifications():
    with get_session() as session:
        require_admin(current_user(session))
        providers = (
            session.query(ProviderProfile)
            .join(User, ProviderProfile.user_id == User.id)
            .filter(
                ProviderProfile.verification_status == "pending",
                User.is_active.is_(True),
            )
            .order_by(ProviderProfile.verification_submitted_at.asc())
            .all()
        )

        reviews = []
        for provider in providers:
            user = provider.user
            profile = user.profile
            services = (
                session.query(ProviderService)
                .filter(ProviderService.provider_id == provider.id)
                .all()
            )
            service_names = [
                item.title
                or (item.category.name if item.category else None)
                for item in services
            ]
            reviews.append(
                {
                    "providerId": provider.id,
                    "userId": user.id,
                    "fullName": user.full_name,
                    "email": user.email,
                    "mobileNumber": profile.mobile_number if profile else None,
                    "gender": profile.gender if profile else None,
                    "address": profile.address if profile else None,
                    "birthday": (
                        profile.birthday.isoformat()
                        if profile and profile.birthday
                        else None
                    ),
                    "businessName": provider.business_name,
                    "bio": provider.bio,
                    "services": service_names,
                    "qualifications": provider.qualifications,
                    "experienceYears": provider.experience_years or 0,
                    "hourlyRate": (
                        float(provider.hourly_rate)
                        if provider.hourly_rate is not None
                        else None
                    ),
                    "serviceArea": provider.service_area,
                    "region": provider.region_name,
                    "province": provider.province_name,
                    "cityMunicipality": provider.city_municipality_name,
                    "barangay": provider.barangay_name,
                    "streetAddress": provider.street_address,
                    "postalCode": provider.postal_code,
                    "idType": provider.id_type,
                    "verificationSubmittedAt": (
                        provider.verification_submitted_at.isoformat()
                        if provider.verification_submitted_at
                        else None
                    ),
                    "documents": {
                        side: bool(getattr(provider, f"id_{side}_path"))
                        for side in ("front", "back")
                    },
                }
            )
        return jsonify(reviews)


@admin_verifications_bp.get("/<int:provider_id>/documents/<side>")
@require_auth
def get_verification_document(provider_id, side):
    if side not in ("front", "back"):
        raise ApiError("Document side must be 'front' or 'back'.", 400)

    with get_session() as session:
        require_admin(current_user(session))
        provider = session.get(ProviderProfile, provider_id)
        if not provider:
            raise ApiError("Provider verification not found", 404)

        stored_path = getattr(provider, f"id_{side}_path")
        if not stored_path:
            raise ApiError("Verification document not found", 404)

        app_root = Path(__file__).resolve().parents[1]
        expected_dir = (app_root / "private_uploads" / "provider_ids" / str(provider.user_id)).resolve()
        document_path = (app_root / stored_path).resolve()
        if (
            not document_path.is_relative_to(expected_dir)
            or not document_path.is_file()
        ):
            raise ApiError("Verification document not found", 404)

        suffix = document_path.suffix.lower()
        mimetype = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp",
        }.get(suffix)
        if not mimetype:
            raise ApiError("Unsupported verification document", 400)

        response = send_file(
            document_path,
            mimetype=mimetype,
            as_attachment=False,
            download_name=f"provider-{provider_id}-{side}{suffix}",
            conditional=True,
        )
        response.headers["Cache-Control"] = "private, no-store"
        return response


@admin_verifications_bp.post("/<int:provider_id>/approve")
@require_auth
def approve_verification(provider_id):
    with get_session() as session:
        admin = current_user(session)
        require_admin(admin)
        provider = session.get(ProviderProfile, provider_id)
        if not provider:
            raise ApiError("Provider verification not found", 404)
        if provider.verification_status != "pending":
            raise ApiError(
                "This provider verification is no longer pending",
                409,
            )
        if not provider.id_front_path or not provider.id_back_path:
            raise ApiError(
                "Both identity documents must be available before approval",
                409,
            )

        app_root = Path(__file__).resolve().parents[1]
        provider_dir = (
            app_root / "private_uploads" / "provider_ids" / str(provider.user_id)
        ).resolve()
        for side in ("front", "back"):
            document_path = (app_root / getattr(provider, f"id_{side}_path")).resolve()
            if (
                not document_path.is_relative_to(provider_dir)
                or not document_path.is_file()
            ):
                raise ApiError(
                    "Both identity documents must be available before approval",
                    409,
                )

        provider.is_verified = True
        provider.verification_status = "verified"
        provider.verification_reviewed_at = datetime.utcnow()
        provider.verification_reviewed_by = admin.id
        provider.verification_review_notes = None
        session.commit()
        return jsonify(
            message="Provider verification approved",
            providerId=provider.id,
            verificationStatus=provider.verification_status,
            isVerified=provider.is_verified,
        )
