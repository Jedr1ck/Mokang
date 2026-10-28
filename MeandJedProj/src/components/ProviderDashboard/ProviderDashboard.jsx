import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import ProviderSideBar from '../ProviderSideBar/ProviderSideBar';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import '../../ProviderDashboard.css';
import {
    getMyBookings,
    getMyProfile,
    getMyProviderReviews,
    getProviderVerification,
} from '../../services/api';
import Messages from '../HomeOwnerDashboard/Messages';
import ProviderNotifications from './ProviderNotifications';
import ProviderAccountProfile from './ProviderAccountProfile';
import ProviderJobs from './ProviderJobs';


const ProviderDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [user, setUser] = useState(() => {
        try {
            const parsedUser = JSON.parse(localStorage.getItem('user') || '{}');
            return {
                fullName:
                    parsedUser.fullName ||
                    parsedUser.name ||
                    'Provider',
                profileImage:
                    parsedUser.profilePicture ||
                    parsedUser.profileImage ||
                    parsedUser.profilePhoto ||
                    parsedUser.photo ||
                    parsedUser.image ||
                    ''
            };
        } catch (error) {
            console.error('Unable to read provider account:', error);
            return { fullName: 'Provider', profileImage: '' };
        }
    });

    const activeSection = {
        '/provider-dashboard': 'dashboard',
        '/provider-bookings': 'bookings',
        '/provider-jobs': 'myjobs',
        '/provider-schedule': 'schedule',
        '/provider-availability': 'schedule',
        '/provider-messages': 'messages',
        '/provider-reviews': 'reviews',
        '/provider-notifications': 'notifications',
        '/provider-profile': 'profile',
    }[location.pathname] || 'dashboard';
    const [bookings, setBookings] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [reviewsError, setReviewsError] = useState('');
    const [providerServices, setProviderServices] = useState([]);
    const [providerServicesLoading, setProviderServicesLoading] = useState(true);
    const [providerServicesError, setProviderServicesError] = useState('');

    useEffect(() => {
        getMyProfile()
            .then((profile) => {
                setUser({
                    fullName: profile.fullName || 'Provider',
                    profileImage: profile.profilePicture || ''
                });
                localStorage.setItem('user', JSON.stringify(profile));
            })
            .catch((error) => console.error('Unable to load provider profile:', error));
    }, []);

    useEffect(() => {
        getMyBookings().then(setBookings).catch((error) => console.error('Unable to load provider bookings:', error));
        getProviderVerification()
            .then((profile) => setProviderServices(profile.services || []))
            .catch((error) => {
                console.error('Unable to load provider services:', error);
                setProviderServicesError(error.message || 'Unable to load your services.');
            })
            .finally(() => setProviderServicesLoading(false));
    }, []);

    useEffect(() => {
        getMyProviderReviews()
            .then(setReviews)
            .catch((error) => {
                console.error('Unable to load provider reviews:', error);
                setReviewsError(error.message || 'Unable to load your reviews.');
            })
            .finally(() => setReviewsLoading(false));
    }, []);

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const todaysBookings = bookings.filter((booking) => booking.preferredDate === today);
    const pendingBookings = bookings.filter((booking) => booking.status === 'Pending');
    const ongoingBookings = bookings.filter((booking) => ['Accepted', 'On the Way', 'In Progress'].includes(booking.status));
    const completedBookings = bookings.filter((booking) => booking.status === 'Completed');
    const actionableBookings = bookings.filter((booking) => booking.status === 'Pending');
    const calendarBookings = [...bookings]
        .filter((booking) =>
            booking.preferredDate >= today &&
            !['Cancelled', 'Canceled', 'Completed'].includes(booking.status)
        )
        .sort((first, second) =>
            `${first.preferredDate} ${first.preferredTime}`.localeCompare(
                `${second.preferredDate} ${second.preferredTime}`
            )
        );
    const averageRating = reviews.length
        ? reviews.reduce((total, review) => total + Number(review.rating || 0), 0) / reviews.length
        : 0;

    const handleProfileUpdated = (profile) => {
        setUser({
            fullName: profile.fullName || user.fullName || 'Provider',
            profileImage: profile.profilePicture || user.profileImage || ''
        });
        if (profile.services) {
            setProviderServices(profile.services);
            setProviderServicesError('');
        } else {
            getProviderVerification()
                .then((providerProfile) => {
                    setProviderServices(providerProfile.services || []);
                    setProviderServicesError('');
                })
                .catch((error) => {
                    console.error('Unable to refresh provider services:', error);
                    setProviderServicesError(error.message || 'Unable to refresh your services.');
                });
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/auth/provider');
    };


    const goToSection = (section, route) => {
        const sectionRoutes = {
            dashboard: '/provider-dashboard',
            bookings: '/provider-bookings',
            myjobs: '/provider-jobs',
            schedule: '/provider-schedule',
            messages: '/provider-messages',
            reviews: '/provider-reviews',
            notifications: '/provider-notifications',
            profile: '/provider-profile',
        };
        navigate(route || sectionRoutes[section] || '/provider-dashboard');
    };


    /*
     * Profile image fallback:
     * If the provider does not have a photo yet,
     * show a person icon.
     */
    const profileImage = user.profileImage;


    return (
        <div className="provider-layout">

            {/* =====================================
                SIDEBAR
            ====================================== */}

            <ProviderSideBar
                handleLogout={handleLogout}
            />


            {/* =====================================
                MAIN CONTENT
            ====================================== */}

            <main className="provider-main-content">


                {/* =====================================
                    TOP HEADER
                ====================================== */}

                <div className="provider-top-header">
                    <div className="provider-search-box">
                        <i className="bi bi-search"></i>
                        <input
                            type="search"
                            placeholder="Search bookings, customers, or services..."
                            aria-label="Search dashboard"
                        />
                    </div>

                    <div className="provider-header-actions">
                        <button
                            type="button"
                            className="provider-header-icon position-relative"
                            onClick={() =>
                                goToSection("notifications", "/provider-notifications")
                            }
                            title="Notifications"
                        >
                            <i className="bi bi-bell fs-5"></i>
                            <span className="provider-notification-count">3</span>
                        </button>

                        <button
                            type="button"
                            className="provider-header-icon"
                            onClick={() => goToSection("messages", "/provider-messages")}
                            title="Messages"
                        >
                            <i className="bi bi-chat-dots fs-5"></i>
                        </button>

                        <button
                            type="button"
                            className="provider-profile-header"
                            onClick={() => goToSection("profile", "/provider-profile")}
                            title="Open profile"
                        >
                            {profileImage ? (
                                <img
                                    src={profileImage}
                                    alt={user.fullName}
                                    className="provider-header-avatar"
                                />
                            ) : (
                                <span className="provider-header-avatar-placeholder">
                                    <i className="bi bi-person"></i>
                                </span>
                            )}

                            <span className="provider-header-name">
                                {user.fullName}
                            </span>

                            <i className="bi bi-chevron-down"></i>
                        </button>
                    </div>
                </div>

                {/* =====================================
                    DASHBOARD
                ====================================== */}

                {activeSection === 'dashboard' && (

                    <>
                        {/* =================================
                            WELCOME PROFILE CARD
                        ================================== */}

                        <section className="provider-welcome-card">

                            <div className="provider-welcome-profile">

                                {profileImage ? (
                                    <img
                                        src={profileImage}
                                        alt={user.fullName}
                                        className="provider-profile-avatar"
                                    />
                                ) : (
                                    <div className="provider-profile-avatar-placeholder">
                                        <i className="bi bi-person"></i>
                                    </div>
                                )}

                            </div>


                            <div className="provider-welcome-content">

                                <span className="provider-welcome-label">
                                    PROVIDER DASHBOARD
                                </span>

                                <h1>{user.fullName}!</h1>

                                <p>
                                    Keep up the great work! Provide quality service
                                    and make more homes comfortable.
                                </p>

                            </div>


                            <button
                                type="button"
                                className="provider-manage-services-button"
                                onClick={() => goToSection('profile', '/provider-profile')}
                            >
                                Manage My Services <i className="bi bi-arrow-right"></i>
                            </button>

                        </section>


                        {/* =================================
                            STATISTICS
                        ================================== */}

                        <section className="provider-stat-grid">
                            <button type="button" className="provider-stat-card stat-green" onClick={() => goToSection('bookings', '/provider-bookings')}>
                                <span className="provider-stat-icon"><i className="bi bi-calendar-check"></i></span>
                                <span><strong>{pendingBookings.length + ongoingBookings.length}</strong><small>Upcoming Bookings</small></span>
                                <i className="bi bi-chevron-right"></i>
                            </button>
                            <button type="button" className="provider-stat-card stat-orange" onClick={() => goToSection('myjobs', '/provider-jobs')}>
                                <span className="provider-stat-icon"><i className="bi bi-check-circle"></i></span>
                                <span><strong>{completedBookings.length}</strong><small>Completed Services</small></span>
                                <i className="bi bi-chevron-right"></i>
                            </button>
                            <div className="provider-stat-card stat-yellow">
                                <span className="provider-stat-icon"><i className="bi bi-star-fill"></i></span>
                                <span><strong>—</strong><small>Average Rating</small></span>
                            </div>

                        </section>


                        {/* =================================
                            LOWER DASHBOARD
                        ================================== */}

                        <section className="provider-dashboard-columns">


                            {/* Booking requests */}

                            <div className="provider-dashboard-card">

                                <div className="provider-card-header">

                                    <div>
                                        <h3>
                                            <i className="bi bi-calendar-event"></i>
                                            Booking Requests
                                        </h3>

                                        <p>
                                            New requests that match your services
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            goToSection(
                                                'bookings',
                                                '/provider-bookings'
                                            )
                                        }
                                    >
                                        View All
                                    </button>

                                </div>


                                <div className="provider-schedule-list">
                                    {actionableBookings.length === 0 ? <p>No new booking requests.</p> : actionableBookings.slice(0, 3).map((booking) => (
                                        <div className="provider-schedule-item" key={booking.id}>
                                            <div className="provider-time">
                                                <strong>{booking.preferredTime}</strong>
                                                <span>{booking.preferredDate}</span>
                                            </div>
                                            <div className="provider-schedule-line"></div>
                                            <div className="provider-schedule-details">
                                                <h4>{booking.serviceName || booking.category || 'Service request'}</h4>
                                                <p><i className="bi bi-person"></i>{booking.customerName || 'Homeowner'}</p>
                                                <p><i className="bi bi-geo-alt"></i>{booking.address || 'Address not provided'}</p>
                                            </div>
                                            <span className="provider-status pending">{booking.status}</span>
                                        </div>
                                    ))}
                                </div>

                            </div>


                            {/* Today's schedule */}

                            <div className="provider-dashboard-card">

                                <div className="provider-card-header">

                                    <div>
                                        <h3>
                                            <i className="bi bi-calendar-event"></i>
                                            Today's Schedule
                                        </h3>

                                        <p>
                                            {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            goToSection(
                                                'schedule',
                                                '/provider-schedule'
                                            )
                                        }
                                    >
                                        View Schedule
                                    </button>

                                </div>


                                <div className="provider-schedule-list">
                                    {todaysBookings.length === 0 ? <p>No bookings scheduled for today.</p> : todaysBookings.slice(0, 3).map((booking) => (
                                        <div className="provider-schedule-item" key={booking.id}>
                                            <div className="provider-time"><strong>{booking.preferredTime}</strong></div>
                                            <div className="provider-schedule-line"></div>
                                            <div className="provider-schedule-details">
                                                <h4>{booking.serviceName || booking.category || 'Service request'}</h4>
                                                <p><i className="bi bi-person"></i>{booking.customerName || 'Homeowner'}</p>
                                            </div>
                                            <span className="provider-status confirmed">{booking.status}</span>
                                        </div>
                                    ))}
                                </div>

                            </div>

                        </section>

                        <section className="provider-dashboard-card provider-my-services">
                            <div className="provider-card-header">
                                <div>
                                    <h3><i className="bi bi-wrench-adjustable"></i>My Services</h3>
                                    <p>These are the tasks you selected in your provider profile.</p>
                                </div>
                                <button type="button" onClick={() => goToSection('profile', '/provider-profile')}>
                                    Manage Services
                                </button>
                            </div>
                            {providerServicesLoading ? (
                                <div className="provider-services-empty" role="status">Loading your selected services...</div>
                            ) : providerServicesError ? (
                                <div className="provider-services-error" role="alert">{providerServicesError}</div>
                            ) : providerServices.length ? (
                                <div className="provider-service-grid">
                                    {providerServices.map((service, index) => (
                                        <article className="provider-service-card" key={`${service.category}-${index}`}>
                                            <div className="provider-service-card-heading">
                                                <span className="provider-service-icon"><i className="bi bi-tools"></i></span>
                                                <div>
                                                    <h4>{service.category}</h4>
                                                    <small>{service.capabilities.length} types of work offered</small>
                                                </div>
                                                <button type="button" aria-label={`Edit ${service.category} services`} onClick={() => goToSection('profile', '/provider-profile')}>
                                                    <i className="bi bi-three-dots-vertical"></i>
                                                </button>
                                            </div>
                                            <div className="provider-service-capabilities">
                                                {service.capabilities.map((capability) => {
                                                    const rate = service.service_rates?.[capability];
                                                    return (
                                                        <span key={capability}>
                                                            {capability}
                                                            {rate != null && <strong> · ₱{rate}</strong>}
                                                        </span>
                                                    );
                                                })}
                                                {!service.capabilities.length && <span>Service capabilities not listed yet</span>}
                                            </div>
                                            <button type="button" className="provider-service-edit" onClick={() => goToSection('profile', '/provider-profile')}>
                                                Edit Service
                                            </button>
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <div className="provider-services-empty">
                                    <i className="bi bi-tools"></i>
                                    <p>You haven't selected the specific services you can provide yet.</p>
                                    <button type="button" onClick={() => goToSection('profile', '/provider-profile')}>Add My Services</button>
                                </div>
                            )}
                        </section>


                        {/* =================================
                            QUICK ACTIONS
                        ================================== */}

                        <section className="provider-quick-actions-card">

                            <div className="provider-card-header">

                                <div>
                                    <h3>
                                        <i className="bi bi-lightning-charge"></i>
                                        Quick Actions
                                    </h3>

                                    <p>
                                        Manage your provider account
                                    </p>
                                </div>

                            </div>


                            <div className="provider-quick-actions">


                                <button
                                    type="button"
                                    onClick={() =>
                                        goToSection(
                                            'bookings',
                                            '/provider-bookings'
                                        )
                                    }
                                >
                                    <span className="quick-action-icon">
                                        <i className="bi bi-calendar-check"></i>
                                    </span>

                                    <span>
                                        <strong>
                                            Booking System
                                        </strong>

                                        <small>
                                            Manage requests
                                        </small>
                                    </span>

                                    <i className="bi bi-chevron-right"></i>
                                </button>


                                <button
                                    type="button"
                                    onClick={() =>
                                        goToSection(
                                            'myjobs',
                                            '/provider-jobs'
                                        )
                                    }
                                >
                                    <span className="quick-action-icon">
                                        <i className="bi bi-briefcase"></i>
                                    </span>

                                    <span>
                                        <strong>
                                            My Jobs
                                        </strong>

                                        <small>
                                            View your jobs
                                        </small>
                                    </span>

                                    <i className="bi bi-chevron-right"></i>
                                </button>


                                <button
                                    type="button"
                                    onClick={() =>
                                        goToSection(
                                            'schedule',
                                            '/provider-schedule'
                                        )
                                    }
                                >
                                    <span className="quick-action-icon">
                                        <i className="bi bi-calendar-event"></i>
                                    </span>

                                    <span>
                                        <strong>
                                            Calendar &amp; Schedule
                                        </strong>

                                        <small>
                                            View your appointments
                                        </small>
                                    </span>

                                    <i className="bi bi-chevron-right"></i>
                                </button>

                            </div>

                        </section>

                    </>

                )}


                {/* =====================================
                    OTHER PROVIDER SECTIONS
                ====================================== */}

                {activeSection === 'bookings' && (
                    <div className="provider-placeholder-page">
                        <i className="bi bi-calendar-check"></i>
                        <h2>Booking System</h2>
                        <p>
                            Manage incoming booking requests from homeowners.
                        </p>
                    </div>
                )}


                {activeSection === 'myjobs' && (
                    <ProviderJobs />
                )}


                {activeSection === 'schedule' && (
                    <section className="provider-calendar-page">
                        <header className="provider-calendar-heading">
                            <div>
                                <span>YOUR WORK PLAN</span>
                                <h1>Calendar &amp; Schedule</h1>
                                <p>Requested and confirmed appointments appear here in date order.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => goToSection('bookings', '/provider-bookings')}
                            >
                                <i className="bi bi-calendar-check"></i>
                                Manage Bookings
                            </button>
                        </header>
                        {calendarBookings.length === 0 ? (
                            <div className="provider-calendar-empty">
                                <i className="bi bi-calendar2-check"></i>
                                <h2>No scheduled appointments yet</h2>
                                <p>Requested or accepted appointment dates will appear here. Check for new booking requests.</p>
                                <button
                                    type="button"
                                    onClick={() => goToSection('bookings', '/provider-bookings')}
                                >
                                    View Booking Requests
                                </button>
                            </div>
                        ) : (
                            <div className="provider-calendar-list">
                                {calendarBookings.map((booking) => (
                                    <article className="provider-calendar-item" key={booking.id}>
                                        <div className="provider-calendar-date">
                                            <strong>
                                                {booking.preferredDate
                                                    ? new Date(`${booking.preferredDate}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric' })
                                                    : '—'}
                                            </strong>
                                            <span>
                                                {booking.preferredDate
                                                    ? new Date(`${booking.preferredDate}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', year: 'numeric' })
                                                    : 'Date not set'}
                                            </span>
                                        </div>
                                        <div className="provider-calendar-details">
                                            <h2>{booking.serviceName || booking.category || 'Service appointment'}</h2>
                                            <p><i className="bi bi-clock"></i>{booking.preferredTime || 'Time not set'}</p>
                                            <p><i className="bi bi-person"></i>{booking.customerName || 'Homeowner'}</p>
                                            <p><i className="bi bi-geo-alt"></i>{booking.address || 'Address not provided'}</p>
                                        </div>
                                        <span className={`provider-calendar-status ${String(booking.status || '').toLowerCase().replace(/[^a-z]+/g, '-')}`}>
                                            {booking.status || 'Pending'}
                                        </span>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                )}


                {activeSection === 'messages' && (
                    <Messages embedded bookings={bookings} />
                )}


                {activeSection === 'reviews' && (
                    <section className="provider-reviews-page">
                        <header className="provider-calendar-heading">
                            <div>
                                <span>HOMEOWNER FEEDBACK</span>
                                <h1>Ratings &amp; Reviews</h1>
                                <p>See feedback homeowners have left after completed services.</p>
                            </div>
                        </header>
                        {reviewsError && <div className="alert alert-danger" role="alert">{reviewsError}</div>}
                        {reviewsLoading ? (
                            <p className="provider-reviews-state">Loading your reviews...</p>
                        ) : reviews.length === 0 ? (
                            <div className="provider-calendar-empty">
                                <i className="bi bi-star"></i>
                                <h2>No reviews yet</h2>
                                <p>Homeowner ratings and comments will appear here after a completed service.</p>
                            </div>
                        ) : (
                            <>
                                <div className="provider-rating-summary">
                                    <strong>{averageRating.toFixed(1)}</strong>
                                    <span>{'★'.repeat(Math.round(averageRating))}{'☆'.repeat(5 - Math.round(averageRating))}</span>
                                    <small>Average from {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</small>
                                </div>
                                <div className="provider-review-list">
                                    {reviews.map((review) => (
                                        <article className="provider-review-card" key={review.id}>
                                            <div className="provider-review-card-heading">
                                                <div>
                                                    <strong>{review.homeownerName || 'Homeowner'}</strong>
                                                    <span>{review.service || 'Home service'}</span>
                                                </div>
                                                <time dateTime={review.createdAt || undefined}>
                                                    {review.createdAt
                                                        ? new Date(review.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                                                        : ''}
                                                </time>
                                            </div>
                                            <div className="provider-review-stars" aria-label={`${review.rating} out of 5 stars`}>
                                                {'★'.repeat(Number(review.rating) || 0)}{'☆'.repeat(5 - (Number(review.rating) || 0))}
                                            </div>
                                            {review.comment && <p>{review.comment}</p>}
                                        </article>
                                    ))}
                                </div>
                            </>
                        )}
                    </section>
                )}



                {activeSection === 'notifications' && (
                    <ProviderNotifications bookings={bookings} />
                )}



                {activeSection === 'profile' && (
                    <ProviderAccountProfile
                        onProfileUpdated={handleProfileUpdated}
                    />
                )}


            </main>

        </div >
    );
};

export default ProviderDashboard;
