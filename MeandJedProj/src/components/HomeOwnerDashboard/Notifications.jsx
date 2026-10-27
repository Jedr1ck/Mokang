import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HomeownerSideBar from '../HomeownerSideBar/HomeownerSideBar';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../HomeownerDashboard.css';
import {
    getNotifications,
    markAllNotificationsRead,
    markNotificationRead
} from '../../services/api';

const formatNotificationTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const elapsed = Math.max(0, Date.now() - date.getTime());
    const minutes = Math.floor(elapsed / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

const notificationIcon = (type, title) => {
    if (type === 'message') return 'bi-chat-dots-fill';
    if (/complete/i.test(title)) return 'bi-check-circle-fill';
    if (/declin|cancel/i.test(title)) return 'bi-x-circle-fill';
    if (/accept/i.test(title)) return 'bi-calendar2-check-fill';
    return 'bi-calendar-event-fill';
};

const Notifications = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [activeTab, setActiveTab] = useState('All');
    const [error, setError] = useState('');

    useEffect(() => {
        let isCurrent = true;
        const loadNotifications = () => {
            getNotifications()
                .then((rows) => {
                    if (isCurrent) {
                        setNotifications(rows);
                        setError('');
                    }
                })
                .catch((loadError) => {
                    if (isCurrent) setError(loadError.message);
                });
        };

        loadNotifications();
        const intervalId = window.setInterval(loadNotifications, 15000);
        return () => {
            isCurrent = false;
            window.clearInterval(intervalId);
        };
    }, []);

    const unreadCount = notifications.filter((item) => !item.isRead).length;
    const filteredNotifications = useMemo(
        () =>
            notifications.filter((item) => {
                if (activeTab === 'Unread') return !item.isRead;
                if (activeTab === 'Bookings') return item.type === 'booking';
                if (activeTab === 'Messages') return item.type === 'message';
                return true;
            }),
        [activeTab, notifications]
    );

    const markAsRead = async (notification) => {
        if (notification.isRead) return;
        try {
            await markNotificationRead(notification.id);
            setNotifications((previous) =>
                previous.map((item) =>
                    item.id === notification.id ? { ...item, isRead: true } : item
                )
            );
        } catch (readError) {
            setError(readError.message);
        }
    };

    const markAllAsRead = async () => {
        try {
            await markAllNotificationsRead();
            setNotifications((previous) =>
                previous.map((item) => ({ ...item, isRead: true }))
            );
        } catch (readError) {
            setError(readError.message);
        }
    };

    const openNotification = async (notification) => {
        await markAsRead(notification);
        navigate(notification.type === 'message' ? '/messages' : '/bookings');
    };

    return (
        <div className="profile-page-container">
            <HomeownerSideBar />
            <main className="profile-main-content homeowner-notifications-page">
                <header className="profile-header homeowner-notifications-header">
                    <div>
                        <h2>Notifications</h2>
                        <p>Updates about your bookings and messages.</p>
                    </div>
                    {unreadCount > 0 && (
                        <button
                            type="button"
                            onClick={markAllAsRead}
                            className="homeowner-notifications-mark-all"
                        >
                            <i className="bi bi-check2-all" />
                            Mark all as read
                        </button>
                    )}
                </header>

                <nav
                    className="homeowner-notifications-tabs"
                    aria-label="Filter notifications"
                >
                    {['All', 'Unread', 'Bookings', 'Messages'].map((tab) => (
                        <button
                            type="button"
                            key={tab}
                            className={activeTab === tab ? 'active' : ''}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                            {tab === 'Unread' && unreadCount > 0 && (
                                <span>{unreadCount}</span>
                            )}
                        </button>
                    ))}
                </nav>

                <section className="homeowner-notifications-list">
                    {error && (
                        <p className="homeowner-notifications-error" role="alert">
                            Unable to load notifications: {error}
                        </p>
                    )}
                    {filteredNotifications.map((item) => (
                        <button
                            type="button"
                            key={item.id}
                            className={`homeowner-notification-item ${item.isRead ? '' : 'unread'}`}
                            onClick={() => openNotification(item)}
                        >
                            <span className={`homeowner-notification-icon ${item.type || 'system'}`}>
                                <i className={`bi ${notificationIcon(item.type, item.title)}`} />
                            </span>
                            <span className="homeowner-notification-copy">
                                <strong>{item.title}</strong>
                                <span>{item.body}</span>
                                <small>{formatNotificationTime(item.createdAt)}</small>
                            </span>
                            {!item.isRead && (
                                <span className="homeowner-notification-new">
                                    New
                                </span>
                            )}
                        </button>
                    ))}
                    {!error && filteredNotifications.length === 0 && (
                        <div className="homeowner-notifications-empty">
                            <i className="bi bi-bell-slash" />
                            <strong>No notifications</strong>
                            <span>
                                Booking and message updates will appear here.
                            </span>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default Notifications;
