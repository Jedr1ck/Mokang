from flask import Blueprint, jsonify

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
