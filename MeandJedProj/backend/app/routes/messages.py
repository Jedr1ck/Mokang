from datetime import datetime, timedelta

from flask import Blueprint, jsonify

from app.common import ApiError, current_user, get_session, require_auth, validated
from app.models import Booking, Message, Notification, ProviderProfile, User
from app.schemas import MessageIn

messages_bp = Blueprint("messages", __name__)
PRESENCE_TIMEOUT = timedelta(seconds=30)


@messages_bp.post("/messages/presence")
@require_auth
def update_presence():
    with get_session() as session:
        user = current_user(session)
        user.last_seen_at = datetime.utcnow()
        session.commit()
        return jsonify({"online": True})


@messages_bp.get("/messages/presence")
@require_auth
def get_presence():
    with get_session() as session:
        user = current_user(session)
        if user.role == "homeowner":
            contact_ids = {
                row[0]
                for row in session.query(ProviderProfile.user_id)
                .join(Booking, Booking.provider_id == ProviderProfile.id)
                .filter(Booking.homeowner_id == user.id)
                .all()
            }
        elif user.role == "provider":
            provider = (
                session.query(ProviderProfile)
                .filter(ProviderProfile.user_id == user.id)
                .first()
            )
            contact_ids = (
                {
                    row[0]
                    for row in session.query(Booking.homeowner_id)
                    .filter(Booking.provider_id == provider.id)
                    .all()
                }
                if provider
                else set()
            )
        else:
            contact_ids = set()

        message_contacts = (
            session.query(Message.sender_id, Message.recipient_id)
            .filter(
                (Message.sender_id == user.id)
                | (Message.recipient_id == user.id)
            )
            .all()
        )
        contact_ids.update(
            participant_id
            for row in message_contacts
            for participant_id in row
            if participant_id != user.id
        )

        active_after = datetime.utcnow() - PRESENCE_TIMEOUT
        online_ids = {
            row[0]
            for row in session.query(User.id)
            .filter(
                User.id.in_(contact_ids),
                User.last_seen_at >= active_after,
            )
            .all()
        } if contact_ids else set()
        return jsonify(
            [
                {"userId": contact_id, "online": contact_id in online_ids}
                for contact_id in contact_ids
            ]
        )


@messages_bp.post("/messages")
@require_auth
def send_message():
    data = validated(MessageIn)
    with get_session() as session:
        user = current_user(session)
        recipient = session.get(User, data.recipient_id)
        if not recipient:
            raise ApiError("Recipient not found", 404)

        if data.booking_id:
            booking = session.get(Booking, data.booking_id)
            provider_user_id = (
                booking.provider.user_id
                if booking and booking.provider
                else None
            )
            participants = (
                booking.homeowner_id,
                provider_user_id,
            )
            if (
                not booking
                or user.id not in participants
                or data.recipient_id not in participants
            ):
                raise ApiError("Message is not linked to your booking", 403)

        message = Message(
            sender_id=user.id,
            recipient_id=data.recipient_id,
            booking_id=data.booking_id,
            body=data.body,
        )
        session.add(message)
        session.add(
            Notification(
                user_id=recipient.id,
                title="New message",
                body=f"{user.full_name} sent you a message.",
                type="message",
            )
        )
        session.commit()
        session.refresh(message)
        return jsonify(
            id=message.id,
            recipientId=message.recipient_id,
            bookingId=message.booking_id,
            body=message.body,
            createdAt=message.created_at.isoformat(),
        )


@messages_bp.get("/messages")
@require_auth
def get_messages():
    with get_session() as session:
        user = current_user(session)
        rows = (
            session.query(Message)
            .filter(
                (Message.sender_id == user.id)
                | (Message.recipient_id == user.id)
            )
            .order_by(Message.created_at.asc())
            .all()
        )
        user_ids = {
            value
            for row in rows
            for value in (row.sender_id, row.recipient_id)
        }
        users = {
            item.id: item
            for item in session.query(User).filter(User.id.in_(user_ids)).all()
        } if user_ids else {}

        return jsonify(
            [
                {
                    "id": row.id,
                    "senderId": row.sender_id,
                    "recipientId": row.recipient_id,
                    "bookingId": row.booking_id,
                    "body": row.body,
                    "createdAt": row.created_at.isoformat(),
                    "senderName": (
                        users[row.sender_id].full_name
                        if row.sender_id in users
                        else "User"
                    ),
                    "senderProfilePicture": (
                        users[row.sender_id].profile.profile_picture
                        if row.sender_id in users
                        and users[row.sender_id].profile
                        else None
                    ),
                    "recipientName": (
                        users[row.recipient_id].full_name
                        if row.recipient_id in users
                        else "User"
                    ),
                    "recipientProfilePicture": (
                        users[row.recipient_id].profile.profile_picture
                        if row.recipient_id in users
                        and users[row.recipient_id].profile
                        else None
                    ),
                }
                for row in rows
            ]
        )
