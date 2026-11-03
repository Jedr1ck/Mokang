import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    deleteNotification,
    getNotifications,
    markAllNotificationsRead,
    markNotificationRead,
} from '../../services/api';
import '../../ProviderDashboard.css';

const formatNotificationDate = (createdAt) => {
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return 'Date unavailable';

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
};

const ProviderNotifications = ({ onUnreadCountChange }) => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [openMenu, setOpenMenu] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionError, setActionError] = useState('');

    const loadNotifications = useCallback(async () => {
        try {
            const data = await getNotifications();
            if (!Array.isArray(data)) {
                throw new Error('The notifications response was invalid.');
            }

            setNotifications(data);
            onUnreadCountChange?.(data.filter((notification) => !notification.isRead).length);
            setError('');
        } catch (requestError) {
            console.error('Unable to load provider notifications:', requestError);
            setError(requestError.message || 'Unable to load notifications.');
        } finally {
            setLoading(false);
        }
    }, [onUnreadCountChange]);

    useEffect(() => {
        const initialLoadId = window.setTimeout(loadNotifications, 0);
        const intervalId = window.setInterval(loadNotifications, 15000);
        return () => {
            window.clearTimeout(initialLoadId);
            window.clearInterval(intervalId);
        };
    }, [loadNotifications]);

    const markAsRead = async (id) => {
        setActionError('');
        try {
            await markNotificationRead(id);
            const updatedNotifications = notifications.map((notification) =>
                notification.id === id
                    ? { ...notification, isRead: true }
                    : notification
            );
            setNotifications(updatedNotifications);
            onUnreadCountChange?.(
                updatedNotifications.filter((notification) => !notification.isRead).length
            );
            setOpenMenu(null);
            return true;
        } catch (requestError) {
            console.error('Unable to mark provider notification as read:', requestError);
            setActionError(requestError.message || 'Unable to update this notification.');
            return false;
        }
    };

    const markAllAsRead = async () => {
        setActionError('');
        try {
            await markAllNotificationsRead();
            setNotifications((current) =>
                current.map((notification) => ({ ...notification, isRead: true }))
            );
            onUnreadCountChange?.(0);
        } catch (requestError) {
            console.error('Unable to mark all provider notifications as read:', requestError);
            setActionError(requestError.message || 'Unable to update notifications.');
        }
    };

    const removeNotification = async (id) => {
        setActionError('');
        try {
            await deleteNotification(id);
            const updatedNotifications = notifications.filter(
                (notification) => notification.id !== id
            );
            setNotifications(updatedNotifications);
            onUnreadCountChange?.(
                updatedNotifications.filter((notification) => !notification.isRead).length
            );
            setOpenMenu(null);
        } catch (requestError) {
            console.error('Unable to delete provider notification:', requestError);
            setActionError(requestError.message || 'Unable to delete this notification.');
        }
    };

    const openNotification = async (notification) => {
        if (!notification.isRead) {
            const markedAsRead = await markAsRead(notification.id);
            if (!markedAsRead) return;
        }

        navigate(
            String(notification.type || '').toLowerCase().includes('message')
                ? '/provider-messages'
                : '/provider-bookings'
        );
    };

    const unreadCount = notifications.filter((notification) => !notification.isRead).length;

    return (
        <section className="provider-notifications-page">
            <div className="notifications-heading">
                <div>
                    <span className="notifications-eyebrow">PROVIDER CENTER</span>
                    <h1>Notifications</h1>
                    <p>Stay updated with booking requests, messages, and service activity.</p>
                </div>

                <button
                    type="button"
                    className="mark-all-read-btn"
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0 || loading}
                >
                    <i className="bi bi-check2-all"></i>
                    Mark all as read
                </button>
            </div>

            {actionError && (
                <div className="alert alert-danger" role="alert">
                    {actionError}
                </div>
            )}

            <div className="notifications-summary">
                <div className="notification-summary-icon">
                    <i className="bi bi-bell"></i>
                </div>
                <div>
                    <strong>{unreadCount} unread</strong>
                    <p>{notifications.length} total notifications</p>
                </div>
            </div>

            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                    <button type="button" className="btn btn-link" onClick={loadNotifications}>
                        Try again
                    </button>
                </div>
            )}

            <div className="notifications-list">
                {loading ? (
                    <div className="notifications-empty" role="status">
                        Loading notifications...
                    </div>
                ) : notifications.length === 0 && !error ? (
                    <div className="notifications-empty">
                        <div className="notifications-empty-icon">
                            <i className="bi bi-bell-slash"></i>
                        </div>
                        <h3>No notifications yet</h3>
                        <p>New booking requests and chat messages will appear here.</p>
                    </div>
                ) : (
                    notifications.map((notification) => {
                        const isRead = Boolean(notification.isRead);
                        const isMessage = String(notification.type || '')
                            .toLowerCase()
                            .includes('message');

                        return (
                            <article
                                key={notification.id}
                                className={`notification-card ${isRead ? 'is-read' : 'is-unread'}`}
                            >
                                <div className="notification-card-icon">
                                    <i className={`bi ${isMessage ? 'bi-chat-dots' : 'bi-calendar-check'}`}></i>
                                </div>

                                <div className="notification-card-content">
                                    <div className="notification-title-row">
                                        <h3>{notification.title}</h3>
                                        {!isRead && <span className="notification-unread-dot"></span>}
                                    </div>
                                    <p>{notification.body}</p>
                                    <div className="notification-meta">
                                        <span>
                                            <i className="bi bi-clock"></i>
                                            {formatNotificationDate(notification.createdAt)}
                                        </span>
                                        <span className="notification-status">
                                            {isMessage ? 'Message' : 'Booking'}
                                        </span>
                                        <button
                                            type="button"
                                            className="notification-open-button"
                                            onClick={() => openNotification(notification)}
                                        >
                                            {isMessage ? 'Open messages' : 'Open bookings'}
                                        </button>
                                    </div>
                                </div>

                                <div className="notification-menu-wrapper">
                                    <button
                                        type="button"
                                        className="notification-menu-trigger"
                                        aria-label={`Options for ${notification.title}`}
                                        aria-expanded={openMenu === notification.id}
                                        onClick={() =>
                                            setOpenMenu((current) =>
                                                current === notification.id ? null : notification.id
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
                                                        onClick={() => markAsRead(notification.id)}
                                                    >
                                                        <i className="bi bi-check2-circle"></i>
                                                        Mark as read
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    className="delete-notification-action"
                                                    onClick={() => removeNotification(notification.id)}
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
