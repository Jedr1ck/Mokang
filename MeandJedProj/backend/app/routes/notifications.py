from flask import Blueprint, jsonify, request

from app.common import ApiError, current_user, get_session, require_auth
from app.models import Notification

notifications_bp = Blueprint("notifications", __name__)


def notification_out(notification):
    return {
        "id": notification.id,
        "title": notification.title,
        "body": notification.body,
        "type": notification.type or "system",
        "isRead": notification.is_read,
        "createdAt": notification.created_at.isoformat(),
    }


@notifications_bp.get("/notifications")
@require_auth
def get_notifications():
    with get_session() as session:
        user = current_user(session)
        rows = (
            session.query(Notification)
            .filter(Notification.user_id == user.id)
            .order_by(Notification.created_at.desc(), Notification.id.desc())
            .limit(100)
            .all()
        )
        return jsonify([notification_out(item) for item in rows])


@notifications_bp.get("/admin/notifications")
@require_auth
def get_admin_notifications():
    with get_session() as session:
        user = current_user(session)
        if user.role != "admin" or not user.is_active:
            raise ApiError("Admins only", 403)

        rows = (
            session.query(Notification)
            .filter(Notification.user_id == user.id)
            .order_by(Notification.created_at.desc(), Notification.id.desc())
            .limit(100)
            .all()
        )
        return jsonify([notification_out(item) for item in rows])


@notifications_bp.patch("/notifications/read")
@require_auth
def mark_all_notifications_read():
    with get_session() as session:
        user = current_user(session)
        (
            session.query(Notification)
            .filter(
                Notification.user_id == user.id,
                Notification.is_read.is_(False),
            )
            .update({Notification.is_read: True}, synchronize_session=False)
        )
        session.commit()
        return jsonify(success=True)


@notifications_bp.patch("/notifications/<int:notification_id>/read")
@require_auth
def mark_notification_read(notification_id):
    with get_session() as session:
        user = current_user(session)
        notification = (
            session.query(Notification)
            .filter_by(id=notification_id, user_id=user.id)
            .first()
        )
        if not notification:
            raise ApiError("Notification not found", 404)

        notification.is_read = True
        session.commit()
        return jsonify(notification_out(notification))


@notifications_bp.patch("/notifications/<int:notification_id>")
@require_auth
def update_notification_read_status(notification_id):
    data = request.get_json(silent=True) or {}
    if not isinstance(data, dict) or not isinstance(data.get("isRead"), bool):
        raise ApiError("isRead must be a boolean", 422)

    with get_session() as session:
        user = current_user(session)
        notification = (
            session.query(Notification)
            .filter_by(id=notification_id, user_id=user.id)
            .first()
        )
        if not notification:
            raise ApiError("Notification not found", 404)

        notification.is_read = data["isRead"]
        session.commit()
        return jsonify(notification_out(notification))


@notifications_bp.delete("/notifications/<int:notification_id>")
@require_auth
def delete_notification(notification_id):
    with get_session() as session:
        user = current_user(session)
        notification = (
            session.query(Notification)
            .filter_by(id=notification_id, user_id=user.id)
            .first()
        )
        if not notification:
            raise ApiError("Notification not found", 404)

        session.delete(notification)
        session.commit()
        return jsonify(deleted=True)
