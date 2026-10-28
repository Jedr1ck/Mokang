import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../HomeownerDashboard.css';

import HomeownerSideBar from '../HomeownerSideBar/HomeownerSideBar';
import {
    getMyBookings,
    getNotifications,
    getMyProfile,
    getProviders,
    markAllNotificationsRead,
    markNotificationRead
} from '../../services/api';
import heroBackground from '../../assets/images/hero-background.png';

const EMPTY_USER = { fullName: 'Homeowner', profilePicture: '' };
const ACTIVE_STATUSES = new Set([
    'Pending',
    'Matched',
    'Accepted',
    'On the Way',
    'In Progress'
]);

const formatBookingDate = (value) => {
    if (!value) return 'Date to be confirmed';
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime())
        ? value
        : date.toLocaleDateString('en-PH', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
};

const notificationTime = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const minutes = Math.floor(Math.max(0, Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
};

const HomeownerDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(() => {
        try {
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            return {
                fullName:
                    storedUser.fullName ||
                    storedUser.full_name ||
                    storedUser.name ||
                    EMPTY_USER.fullName,
                profilePicture:
                    storedUser.profilePicture ||
                    storedUser.profileImage ||
                    ''
            };
        } catch (error) {
            console.error('Unable to read saved user:', error);
            return EMPTY_USER;
        }
    });
    const [bookings, setBookings] = useState([]);
    const [providers, setProviders] = useState([]);
    const [bookingError, setBookingError] = useState('');
    const [providerError, setProviderError] = useState('');
    const [notifications, setNotifications] = useState([]);
    const [notificationError, setNotificationError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        const handleProfileUpdated = (event) => {
            const updatedProfile = event.detail;
            if (!updatedProfile) return;
            setUser({
                fullName: updatedProfile.fullName || EMPTY_USER.fullName,
                profilePicture: updatedProfile.profilePicture || ''
            });
        };
        window.addEventListener('homeowner-profile-updated', handleProfileUpdated);

        getMyProfile()
            .then((profile) => {
                setUser({
                    fullName: profile.fullName || EMPTY_USER.fullName,
                    profilePicture: profile.profilePicture || ''
                });
                localStorage.setItem('user', JSON.stringify(profile));
            })
            .catch((error) =>
                console.error('Unable to load homeowner profile:', error)
            );

        getMyBookings()
            .then(setBookings)
            .catch((error) => setBookingError(error.message));

        getProviders()
            .then(setProviders)
            .catch((error) => setProviderError(error.message));

        let isCurrent = true;
        const loadNotifications = () => {
            getNotifications()
                .then((rows) => {
                    if (isCurrent) {
                        setNotifications(rows);
                        setNotificationError('');
                    }
                })
                .catch((error) => {
                    if (isCurrent) setNotificationError(error.message);
                });
        };
        loadNotifications();
        const intervalId = window.setInterval(loadNotifications, 15000);
        return () => {
            isCurrent = false;
            window.clearInterval(intervalId);
            window.removeEventListener('homeowner-profile-updated', handleProfileUpdated);
        };
    }, []);

    const activeBookings = useMemo(
        () => bookings.filter((booking) => ACTIVE_STATUSES.has(booking.status)),
        [bookings]
    );
    const completedBookings = useMemo(
        () => bookings.filter((booking) => booking.status === 'Completed'),
        [bookings]
    );
    const upcomingBookings = useMemo(
        () =>
            [...activeBookings]
                .sort((left, right) =>
                    String(left.preferredDate || '').localeCompare(
                        String(right.preferredDate || '')
                    )
                )
                .slice(0, 3),
        [activeBookings]
    );
    const recentBookings = bookings.slice(0, 3);
    const recommendedProviders = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return providers
            .filter((provider) =>
                `${provider.name} ${provider.category} ${provider.expertise || ''}`
                    .toLowerCase()
                    .includes(query)
            )
            .slice(0, 3);
    }, [providers, searchQuery]);

    const quickActions = [
        {
            label: 'Find a Service',
            detail: 'Browse providers',
            icon: 'bi-search',
            onClick: () => navigate('/services')
        },
        {
            label: 'Book a Service',
            detail: 'Schedule now',
            icon: 'bi-calendar-plus',
            onClick: () => navigate('/services')
        },
        {
            label: 'My Bookings',
            detail: 'Track your requests',
            icon: 'bi-calendar-check',
            onClick: () => navigate('/bookings')
        },
        {
            label: 'Messages',
            detail: 'Chat with providers',
            icon: 'bi-chat-dots',
            onClick: () => navigate('/messages')
        },
        {
            label: 'My Calendar',
            detail: 'View your schedule',
            icon: 'bi-calendar3',
            onClick: () => navigate('/calendar')
        },
        {
            label: 'Home Profile',
            detail: 'Manage your details',
            icon: 'bi-house-heart',
            onClick: () => navigate('/profile')
        }
    ];

    const viewBooking = (booking) =>
        navigate('/track-booking', { state: { booking } });
    const unreadNotifications = notifications.filter((item) => !item.isRead);

    const markNotificationAsRead = async (item) => {
        if (item.isRead) return;
        try {
            await markNotificationRead(item.id);
            setNotifications((previous) =>
                previous.map((notification) =>
                    notification.id === item.id
                        ? { ...notification, isRead: true }
                        : notification
                )
            );
        } catch (error) {
            setNotificationError(error.message);
        }
    };

    const openNotification = async (item) => {
        await markNotificationAsRead(item);
        setShowNotifications(false);
        navigate(item.type === 'message' ? '/messages' : '/bookings');
    };

    const markAllNotificationsAsRead = async () => {
        try {
            await markAllNotificationsRead();
            setNotifications((previous) =>
                previous.map((item) => ({ ...item, isRead: true }))
            );
        } catch (error) {
            setNotificationError(error.message);
        }
    };

    return (
        <div className="dashboard-wrapper d-flex">
            <HomeownerSideBar />
            <main className="homeowner-dashboard">
            <header className="homeowner-dashboard-header">
                <form
                    className="homeowner-dashboard-search"
                    onSubmit={(event) => {
                        event.preventDefault();
                        navigate('/services');
                    }}
                >
                    <i className="bi bi-search" aria-hidden="true" />
                    <input
                        type="search"
                        aria-label="Search services and providers"
                        placeholder="Search for services, providers, or bookings..."
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                    />
                </form>

                <div className="homeowner-dashboard-header-actions">
                    <button
                        type="button"
                        className="homeowner-dashboard-icon-button"
                        aria-label={`My Bookings${activeBookings.length ? `, ${activeBookings.length} active` : ''}`}
                        title="My Bookings"
                        onClick={() => navigate('/bookings')}
                    >
                        <i className="bi bi-truck" />
                        {activeBookings.length > 0 && (
                            <span className="homeowner-dashboard-notification-badge">
                                {activeBookings.length > 9 ? '9+' : activeBookings.length}
                            </span>
                        )}
                    </button>
                    <div className="homeowner-dashboard-notification-wrap">
                        <button
                            type="button"
                            className="homeowner-dashboard-icon-button"
                            aria-label={`Notifications${unreadNotifications.length ? `, ${unreadNotifications.length} unread` : ''}`}
                            title="Notifications"
                            aria-expanded={showNotifications}
                            onClick={() =>
                                setShowNotifications((visible) => !visible)
                            }
                        >
                            <i className="bi bi-bell" />
                            {unreadNotifications.length > 0 && (
                                <span className="homeowner-dashboard-notification-badge">
                                    {unreadNotifications.length > 9
                                        ? '9+'
                                        : unreadNotifications.length}
                                </span>
                            )}
                        </button>
                        {showNotifications && (
                            <div className="homeowner-dashboard-notification-menu">
                                <div className="homeowner-dashboard-notification-heading">
                                    <strong>Notifications</strong>
                                    <div>
                                        {unreadNotifications.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={markAllNotificationsAsRead}
                                            >
                                                Mark all read
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => navigate('/notifications')}
                                        >
                                            View all
                                        </button>
                                    </div>
                                </div>
                                {notificationError ? (
                                    <p className="homeowner-dashboard-notification-empty">
                                        Unable to load updates.
                                    </p>
                                ) : notifications.length ? (
                                    notifications.slice(0, 5).map((item) => (
                                        <button
                                            type="button"
                                            key={item.id}
                                            className={`homeowner-dashboard-notification-item ${item.isRead ? '' : 'unread'}`}
                                            onClick={() => openNotification(item)}
                                        >
                                            <span className={`homeowner-dashboard-notification-icon ${item.type || 'system'}`}>
                                                <i className={`bi ${item.type === 'message' ? 'bi-chat-dots-fill' : /accept/i.test(item.title) ? 'bi-calendar2-check-fill' : 'bi-calendar-event-fill'}`} />
                                            </span>
                                            <span className="homeowner-dashboard-notification-copy">
                                                <strong>{item.title}</strong>
                                                <small>{item.body}</small>
                                                <small>{notificationTime(item.createdAt)}</small>
                                            </span>
                                            {!item.isRead && (
                                                <span className="homeowner-dashboard-notification-unread-dot" />
                                            )}
                                        </button>
                                    ))
                                ) : (
                                    <p className="homeowner-dashboard-notification-empty">
                                        Updates about bookings and messages will appear here.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="homeowner-dashboard-profile-wrap">
                        <button
                            type="button"
                            className="homeowner-dashboard-profile-button"
                            onClick={() =>
                                setShowProfileMenu((visible) => !visible)
                            }
                            aria-expanded={showProfileMenu}
                        >
                            {user.profilePicture ? (
                                <img src={user.profilePicture} alt="" />
                            ) : (
                                <span className="homeowner-dashboard-profile-fallback">
                                    {user.fullName.charAt(0).toUpperCase()}
                                </span>
                            )}
                            <span className="homeowner-dashboard-profile-label">
                                <strong>Hi, {user.fullName}!</strong>
                                <small>Home Owner</small>
                            </span>
                            <i className="bi bi-chevron-down" />
                        </button>

                        {showProfileMenu && (
                            <div className="homeowner-dashboard-profile-menu">
                                <button
                                    type="button"
                                    onClick={() => navigate('/profile')}
                                >
                                    <i className="bi bi-person" /> My Profile
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/settings')}
                                >
                                    <i className="bi bi-gear" /> Settings
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <section
                className="homeowner-dashboard-hero"
                style={{ '--homeowner-hero-image': `url("${heroBackground}")` }}
            >
                <div className="homeowner-dashboard-hero-copy">
                    <h1>{user.fullName}!</h1>
                    <span>
                        Keep your home comfortable and well-maintained
                        <br className="homeowner-dashboard-desktop-break" />
                        with trusted service providers.
                    </span>
                </div>
                <button
                    type="button"
                    className="homeowner-dashboard-hero-button"
                    onClick={() => navigate('/services')}
                >
                    <i className="bi bi-calendar-plus" />
                    Book a Service
                    <i className="bi bi-chevron-right" />
                </button>
            </section>

            <section className="homeowner-dashboard-top-grid">
                <article className="homeowner-dashboard-panel">
                    <div className="homeowner-dashboard-panel-heading">
                        <h2>
                            <i className="bi bi-calendar2-week" />
                            Upcoming Bookings
                        </h2>
                        <button
                            type="button"
                            onClick={() => navigate('/bookings')}
                        >
                            View All
                        </button>
                    </div>

                    {bookingError ? (
                        <p className="homeowner-dashboard-empty">
                            Unable to load your bookings: {bookingError}
                        </p>
                    ) : upcomingBookings.length ? (
                        <div className="homeowner-dashboard-booking-list">
                            {upcomingBookings.map((booking) => (
                                <button
                                    type="button"
                                    className="homeowner-dashboard-booking"
                                    key={booking.id}
                                    onClick={() => viewBooking(booking)}
                                >
                                    <span className="homeowner-dashboard-booking-icon">
                                        <i className="bi bi-tools" />
                                    </span>
                                    <span className="homeowner-dashboard-booking-copy">
                                        <strong>{booking.serviceName || booking.category || 'Home Service'}</strong>
                                        <small>{booking.description || 'Service booking'}</small>
                                        <small className="homeowner-dashboard-booking-date">
                                            <i className="bi bi-calendar3" />
                                            {formatBookingDate(booking.preferredDate)}
                                            {booking.preferredTime
                                                ? ` · ${booking.preferredTime}`
                                                : ''}
                                        </small>
                                    </span>
                                    <span className={`homeowner-dashboard-status status-${String(booking.status || 'pending').toLowerCase().replaceAll(' ', '-')}`}>
                                        {booking.status || 'Pending'}
                                    </span>
                                    <i className="bi bi-chevron-right homeowner-dashboard-row-arrow" />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="homeowner-dashboard-empty">
                            <i className="bi bi-calendar-x" />
                            <span>No upcoming bookings yet.</span>
                            <button type="button" onClick={() => navigate('/services')}>
                                Book a service
                            </button>
                        </div>
                    )}
                </article>

                <article className="homeowner-dashboard-panel">
                    <div className="homeowner-dashboard-panel-heading">
                        <h2>
                            <i className="bi bi-lightning-charge-fill" />
                            Quick Actions
                        </h2>
                    </div>
                    <div className="homeowner-dashboard-actions-grid">
                        {quickActions.map((action) => (
                            <button
                                type="button"
                                className="homeowner-dashboard-action"
                                key={action.label}
                                onClick={action.onClick}
                            >
                                <i className={`bi ${action.icon}`} />
                                <strong>{action.label}</strong>
                                <small>{action.detail}</small>
                            </button>
                        ))}
                    </div>
                </article>
            </section>

            <section className="homeowner-dashboard-bottom-grid">
                <article className="homeowner-dashboard-panel">
                    <div className="homeowner-dashboard-panel-heading">
                        <h2>
                            <i className="bi bi-clock-history" />
                            Recent Activity
                        </h2>
                        <button
                            type="button"
                            onClick={() => navigate('/history')}
                        >
                            View All
                        </button>
                    </div>
                    {bookingError ? (
                        <p className="homeowner-dashboard-empty">
                            Unable to load recent activity: {bookingError}
                        </p>
                    ) : recentBookings.length ? (
                        <div className="homeowner-dashboard-activity-list">
                            {recentBookings.map((booking) => (
                                <button
                                    type="button"
                                    className="homeowner-dashboard-activity"
                                    key={booking.id}
                                    onClick={() => viewBooking(booking)}
                                >
                                    <span className="homeowner-dashboard-activity-dot" />
                                    <span>
                                        <strong>
                                            {booking.serviceName || booking.category || 'Service'} booking · {booking.status || 'Pending'}
                                        </strong>
                                        <small>
                                            {formatBookingDate(booking.preferredDate)}
                                            {booking.preferredTime
                                                ? ` · ${booking.preferredTime}`
                                                : ''}
                                        </small>
                                    </span>
                                    <i className="bi bi-chevron-right" />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="homeowner-dashboard-empty">
                            Your booking activity will appear here.
                        </p>
                    )}
                </article>

                <article className="homeowner-dashboard-panel">
                    <div className="homeowner-dashboard-panel-heading">
                        <h2>
                            <i className="bi bi-stars" />
                            Recommended for You
                        </h2>
                        <button
                            type="button"
                            onClick={() => navigate('/services')}
                        >
                            View All
                        </button>
                    </div>
                    {providerError ? (
                        <p className="homeowner-dashboard-empty">
                            Unable to load providers: {providerError}
                        </p>
                    ) : recommendedProviders.length ? (
                        <div className="homeowner-dashboard-provider-grid">
                            {recommendedProviders.map((provider) => (
                                <button
                                    type="button"
                                    className="homeowner-dashboard-provider"
                                    key={provider.id}
                                    onClick={() => navigate(`/provider/${provider.id}`)}
                                >
                                    {provider.image ? (
                                        <img
                                            className="homeowner-dashboard-provider-image"
                                            src={provider.image}
                                            alt={provider.name}
                                        />
                                    ) : (
                                        <span className="homeowner-dashboard-provider-fallback">
                                            <i className="bi bi-person-gear" />
                                        </span>
                                    )}
                                    <strong>{provider.name}</strong>
                                    <small>{provider.category || 'Verified Provider'}</small>
                                    <span className="homeowner-dashboard-provider-link">
                                        View Provider
                                        <i className="bi bi-arrow-up-right" />
                                    </span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="homeowner-dashboard-empty">
                            {searchQuery
                                ? 'No providers match your search.'
                                : 'Verified provider recommendations will appear here.'}
                        </p>
                    )}
                </article>
            </section>

            </main>
        </div>
    );
};

export default HomeownerDashboard;
