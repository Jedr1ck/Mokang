import React, { useEffect, useState } from 'react';
import '../../ProviderDashboard.css';

const ProviderNotifications = ({ bookings = [] }) => {
    const [readIds, setReadIds] = useState(() => {
        try {
            return JSON.parse(
                localStorage.getItem('provider_read_notifications') || '[]'
            );
        } catch {
            return [];
        }
    });

    const [deletedIds, setDeletedIds] = useState(() => {
        try {
            return JSON.parse(
                localStorage.getItem('provider_deleted_notifications') || '[]'
            );
        } catch {
            return [];
        }
    });

    const [openMenu, setOpenMenu] = useState(null);

    useEffect(() => {
        localStorage.setItem(
            'provider_read_notifications',
            JSON.stringify(readIds)
        );
    }, [readIds]);

    useEffect(() => {
        localStorage.setItem(
            'provider_deleted_notifications',
            JSON.stringify(deletedIds)
        );
    }, [deletedIds]);

    const notifications = bookings.map((booking, index) => {
        const id = `booking-${booking.id ?? index}`;

        return {
            id,
            title:
                booking.status === 'Pending'
                    ? 'New Booking Request'
                    : 'Booking Update',
            message: `${booking.customerName || 'A homeowner'} ${booking.status === 'Pending'
                ? 'sent a booking request'
                : 'has a booking with you'
                } for ${booking.category || 'a service'}.`,
            date: booking.preferredDate || '',
            status: booking.status || 'Pending',
            icon: 'bi-calendar-check',
        };
    });

    const visibleNotifications = notifications.filter(
        (notification) => !deletedIds.includes(notification.id)
    );

    const unreadCount = visibleNotifications.filter(
        (notification) => !readIds.includes(notification.id)
    ).length;

    const markAsRead = (id) => {
        setReadIds((previous) =>
            previous.includes(id) ? previous : [...previous, id]
        );
        setOpenMenu(null);
    };

    const deleteNotification = (id) => {
        setDeletedIds((previous) =>
            previous.includes(id) ? previous : [...previous, id]
        );
        setOpenMenu(null);
    };

    const markAllAsRead = () => {
        setReadIds((previous) => [
            ...new Set([
                ...previous,
                ...visibleNotifications.map((notification) => notification.id),
            ]),
        ]);
    };

    return (
        <section className="provider-notifications-page">
            <div className="notifications-heading">
                <div>
                    <span className="notifications-eyebrow">
                        PROVIDER CENTER
                    </span>
                    <h1>Notifications</h1>
                    <p>
                        Stay updated with your booking requests and service
                        activity.
                    </p>
                </div>

                <button
                    type="button"
                    className="mark-all-read-btn"
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                >
                    <i className="bi bi-check2-all"></i>
                    Mark all as read
                </button>
            </div>

            <div className="notifications-summary">
                <div className="notification-summary-icon">
                    <i className="bi bi-bell"></i>
                </div>
                <div>
                    <strong>{unreadCount} unread</strong>
                    <p>
                        {visibleNotifications.length} total notifications
                    </p>
                </div>
            </div>

            <div className="notifications-list">
                {visibleNotifications.length === 0 ? (
                    <div className="notifications-empty">
                        <div className="notifications-empty-icon">
                            <i className="bi bi-bell-slash"></i>
                        </div>
                        <h3>No notifications yet</h3>
                        <p>
                            New booking requests will appear here when
                            homeowners book your services.
                        </p>
                    </div>
                ) : (
                    visibleNotifications.map((notification) => {
                        const isRead = readIds.includes(notification.id);

                        return (
                            <article
                                key={notification.id}
                                className={`notification-card ${isRead ? 'is-read' : 'is-unread'
                                    }`}
                            >
                                <div className="notification-card-icon">
                                    <i
                                        className={`bi ${notification.icon}`}
                                    ></i>
                                </div>

                                <div className="notification-card-content">
                                    <div className="notification-title-row">
                                        <h3>{notification.title}</h3>

                                        {!isRead && (
                                            <span className="notification-unread-dot"></span>
                                        )}
                                    </div>

                                    <p>{notification.message}</p>

                                    <div className="notification-meta">
                                        <span>
                                            <i className="bi bi-calendar3"></i>
                                            {notification.date || 'Date not specified'}
                                        </span>

                                        <span className="notification-status">
                                            {notification.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="notification-menu-wrapper">
                                    <button
                                        type="button"
                                        className="notification-menu-trigger"
                                        aria-label="Notification options"
                                        aria-expanded={
                                            openMenu === notification.id
                                        }
                                        onClick={() =>
                                            setOpenMenu((current) =>
                                                current === notification.id
                                                    ? null
                                                    : notification.id
                                            )
                                        }
                                    >
                                        <i className="bi bi-three-dots-vertical"></i>
                                    </button>

                                    {openMenu === notification.id && (
                                        <>
                                            <button
                                                type="button"
                                                className="notification-menu-backdrop"
                                                aria-label="Close menu"
                                                onClick={() => setOpenMenu(null)}
                                            />

                                            <div className="notification-menu">
                                                {!isRead && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            markAsRead(
                                                                notification.id
                                                            )
                                                        }
                                                    >
                                                        <i className="bi bi-check2-circle"></i>
                                                        Mark as read
                                                    </button>
                                                )}

                                                <button
                                                    type="button"
                                                    className="delete-notification-action"
                                                    onClick={() =>
                                                        deleteNotification(
                                                            notification.id
                                                        )
                                                    }
                                                >
                                                    <i className="bi bi-trash3"></i>
                                                    Delete
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </article>
                        );
                    })
                )}
            </div>
        </section>
    );
};

export default ProviderNotifications;
