import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import ProviderSideBar from '../ProviderSideBar/ProviderSideBar';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import '../../ProviderDashboard.css';

const ProviderDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [user, setUser] = useState({
        fullName: 'Provider',
        profileImage: ''
    });

    const [activeSection, setActiveSection] = useState('dashboard');

    useEffect(() => {
        const storedUser = localStorage.getItem('user');

        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);

                setUser({
                    fullName:
                        parsedUser.fullName ||
                        parsedUser.name ||
                        'Provider',

                    profileImage:
                        parsedUser.profileImage ||
                        parsedUser.profilePhoto ||
                        parsedUser.photo ||
                        parsedUser.image ||
                        ''
                });
            } catch (error) {
                console.error('Unable to read provider account:', error);
            }
        }
    }, []);

    /*
     * Keep dashboard section synchronized
     * with the provider URL.
     */
    useEffect(() => {
        const path = location.pathname;

        if (path === '/provider-dashboard') {
            setActiveSection('dashboard');
        } else if (path === '/provider-bookings') {
            setActiveSection('bookings');
        } else if (path === '/provider-jobs') {
            setActiveSection('myjobs');
        } else if (path === '/provider-schedule') {
            setActiveSection('schedule');
        } else if (path === '/provider-messages') {
            setActiveSection('messages');
        } else if (path === '/provider-reviews') {
            setActiveSection('reviews');
        } else if (path === '/provider-earnings') {
            setActiveSection('earnings');
        } else if (path === '/provider-notifications') {
            setActiveSection('notifications');
        } else if (path === '/provider-profile') {
            setActiveSection('profile');
        } else if (path === '/provider-availability') {
            setActiveSection('availability');
        }
    }, [location.pathname]);


    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/auth/provider');
    };


    const goToSection = (section, route) => {
        setActiveSection(section);

        if (route) {
            navigate(route);
        }
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
                activeSection={activeSection}
                setActiveSection={setActiveSection}
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

                    {/* Notification */}
                    <button
                        type="button"
                        className="provider-header-icon position-relative"
                        onClick={() =>
                            goToSection(
                                'notifications',
                                '/provider-notifications'
                            )
                        }
                        title="Notifications"
                    >
                        <i className="bi bi-bell fs-5"></i>

                        <span className="provider-notification-count">
                            3
                        </span>
                    </button>


                    {/* Messages */}
                    <button
                        type="button"
                        className="provider-header-icon"
                        onClick={() =>
                            goToSection(
                                'messages',
                                '/provider-messages'
                            )
                        }
                        title="Messages"
                    >
                        <i className="bi bi-chat-dots fs-5"></i>
                    </button>


                    {/* Provider Profile */}
                    <button
                        type="button"
                        className="provider-profile-header"
                        onClick={() =>
                            goToSection(
                                'profile',
                                '/provider-profile'
                            )
                        }
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

                                <h1>
                                    Welcome Back, {user.fullName}! 👋
                                </h1>

                                <p>
                                    Here's what's happening with your
                                    services today.
                                </p>

                            </div>


                            <div className="provider-welcome-date">

                                <i className="bi bi-calendar3"></i>

                                <span>
                                    Today's Overview
                                </span>

                            </div>

                        </section>


                        {/* =================================
                            STATISTICS
                        ================================== */}

                        <section className="provider-stat-grid">


                            {/* Today's Bookings */}
                            <div className="provider-stat-card stat-green">

                                <div className="provider-stat-icon">
                                    <i className="bi bi-calendar-check"></i>
                                </div>

                                <div>
                                    <span className="provider-stat-label">
                                        Today's Bookings
                                    </span>

                                    <strong>
                                        5
                                    </strong>

                                    <small>
                                        <i className="bi bi-arrow-up"></i>
                                        2 new today
                                    </small>
                                </div>

                            </div>


                            {/* Pending Requests */}
                            <div className="provider-stat-card stat-orange">

                                <div className="provider-stat-icon">
                                    <i className="bi bi-hourglass-split"></i>
                                </div>

                                <div>
                                    <span className="provider-stat-label">
                                        Pending Requests
                                    </span>

                                    <strong>
                                        3
                                    </strong>

                                    <small>
                                        Requires your action
                                    </small>
                                </div>

                            </div>


                            {/* Ongoing Jobs */}
                            <div className="provider-stat-card stat-blue">

                                <div className="provider-stat-icon">
                                    <i className="bi bi-tools"></i>
                                </div>

                                <div>
                                    <span className="provider-stat-label">
                                        Ongoing Jobs
                                    </span>

                                    <strong>
                                        2
                                    </strong>

                                    <small>
                                        Currently in progress
                                    </small>
                                </div>

                            </div>


                            {/* Completed Jobs */}
                            <div className="provider-stat-card stat-purple">

                                <div className="provider-stat-icon">
                                    <i className="bi bi-check-circle"></i>
                                </div>

                                <div>
                                    <span className="provider-stat-label">
                                        Completed Jobs
                                    </span>

                                    <strong>
                                        28
                                    </strong>

                                    <small>
                                        Total completed
                                    </small>
                                </div>

                            </div>


                            {/* Average Rating */}
                            <div className="provider-stat-card stat-yellow">

                                <div className="provider-stat-icon">
                                    <i className="bi bi-star-fill"></i>
                                </div>

                                <div>
                                    <span className="provider-stat-label">
                                        Average Rating
                                    </span>

                                    <strong>
                                        4.9
                                    </strong>

                                    <small>
                                        From 32 reviews
                                    </small>
                                </div>

                            </div>


                            {/* Total Earnings */}
                            <div className="provider-stat-card stat-teal">

                                <div className="provider-stat-icon">
                                    <i className="bi bi-wallet2"></i>
                                </div>

                                <div>
                                    <span className="provider-stat-label">
                                        Total Earnings
                                    </span>

                                    <strong>
                                        ₱24,850
                                    </strong>

                                    <small>
                                        This month
                                    </small>
                                </div>

                            </div>

                        </section>


                        {/* =================================
                            LOWER DASHBOARD
                        ================================== */}

                        <section className="provider-dashboard-columns">


                            {/* =================================
                                TODAY'S SCHEDULE
                            ================================== */}

                            <div className="provider-dashboard-card">

                                <div className="provider-card-header">

                                    <div>
                                        <h3>
                                            <i className="bi bi-calendar-event"></i>
                                            Today's Schedule
                                        </h3>

                                        <p>
                                            Your appointments for today
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


                                    {/* Schedule 1 */}
                                    <div className="provider-schedule-item">

                                        <div className="provider-time">
                                            <strong>
                                                09:00 AM
                                            </strong>

                                            <span>
                                                11:00 AM
                                            </span>
                                        </div>


                                        <div className="provider-schedule-line"></div>


                                        <div className="provider-schedule-details">

                                            <h4>
                                                Electrical Wiring
                                            </h4>

                                            <p>
                                                <i className="bi bi-person"></i>
                                                Juan Dela Cruz
                                            </p>

                                            <p>
                                                <i className="bi bi-geo-alt"></i>
                                                Brgy. 12, Subdivision
                                            </p>

                                        </div>


                                        <span className="provider-status ongoing">
                                            Ongoing
                                        </span>

                                    </div>


                                    {/* Schedule 2 */}
                                    <div className="provider-schedule-item">

                                        <div className="provider-time">
                                            <strong>
                                                01:00 PM
                                            </strong>

                                            <span>
                                                03:00 PM
                                            </span>
                                        </div>


                                        <div className="provider-schedule-line"></div>


                                        <div className="provider-schedule-details">

                                            <h4>
                                                Air Conditioner Service
                                            </h4>

                                            <p>
                                                <i className="bi bi-person"></i>
                                                Maria Santos
                                            </p>

                                            <p>
                                                <i className="bi bi-geo-alt"></i>
                                                Block 4 Lot 12, Phase 2
                                            </p>

                                        </div>


                                        <span className="provider-status confirmed">
                                            Confirmed
                                        </span>

                                    </div>


                                    {/* Schedule 3 */}
                                    <div className="provider-schedule-item">

                                        <div className="provider-time">
                                            <strong>
                                                04:00 PM
                                            </strong>

                                            <span>
                                                05:30 PM
                                            </span>
                                        </div>


                                        <div className="provider-schedule-line"></div>


                                        <div className="provider-schedule-details">

                                            <h4>
                                                Plumbing Repair
                                            </h4>

                                            <p>
                                                <i className="bi bi-person"></i>
                                                Ana Reyes
                                            </p>

                                            <p>
                                                <i className="bi bi-geo-alt"></i>
                                                Phase 1, Brgy. 8
                                            </p>

                                        </div>


                                        <span className="provider-status confirmed">
                                            Confirmed
                                        </span>

                                    </div>

                                </div>

                            </div>


                            {/* =================================
                                RECENT NOTIFICATIONS
                            ================================== */}

                            <div className="provider-dashboard-card">

                                <div className="provider-card-header">

                                    <div>
                                        <h3>
                                            <i className="bi bi-bell"></i>
                                            Recent Notifications
                                        </h3>

                                        <p>
                                            Your latest updates
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            goToSection(
                                                'notifications',
                                                '/provider-notifications'
                                            )
                                        }
                                    >
                                        View All
                                    </button>

                                </div>


                                <div className="provider-notification-list">


                                    {/* Notification 1 */}
                                    <div className="provider-notification-item unread">

                                        <div className="provider-notification-icon green">
                                            <i className="bi bi-calendar-plus"></i>
                                        </div>

                                        <div className="provider-notification-content">

                                            <strong>
                                                New booking request
                                            </strong>

                                            <p>
                                                Juan Dela Cruz requested
                                                Electrical Wiring.
                                            </p>

                                            <small>
                                                10 minutes ago
                                            </small>

                                        </div>

                                    </div>


                                    {/* Notification 2 */}
                                    <div className="provider-notification-item unread">

                                        <div className="provider-notification-icon orange">
                                            <i className="bi bi-star-fill"></i>
                                        </div>

                                        <div className="provider-notification-content">

                                            <strong>
                                                New customer review
                                            </strong>

                                            <p>
                                                Maria Santos gave you a
                                                5-star rating.
                                            </p>

                                            <small>
                                                1 hour ago
                                            </small>

                                        </div>

                                    </div>


                                    {/* Notification 3 */}
                                    <div className="provider-notification-item">

                                        <div className="provider-notification-icon blue">
                                            <i className="bi bi-wallet2"></i>
                                        </div>

                                        <div className="provider-notification-content">

                                            <strong>
                                                Payment received
                                            </strong>

                                            <p>
                                                ₱1,200 payment has been
                                                added to your earnings.
                                            </p>

                                            <small>
                                                Yesterday
                                            </small>

                                        </div>

                                    </div>


                                    {/* Notification 4 */}
                                    <div className="provider-notification-item">

                                        <div className="provider-notification-icon purple">
                                            <i className="bi bi-check-circle"></i>
                                        </div>

                                        <div className="provider-notification-content">

                                            <strong>
                                                Job completed
                                            </strong>

                                            <p>
                                                Air Conditioner Service
                                                was marked completed.
                                            </p>

                                            <small>
                                                Yesterday
                                            </small>

                                        </div>

                                    </div>

                                </div>


                                <button
                                    type="button"
                                    className="provider-see-all-button"
                                    onClick={() =>
                                        goToSection(
                                            'notifications',
                                            '/provider-notifications'
                                        )
                                    }
                                >
                                    View All Notifications
                                    <i className="bi bi-arrow-right"></i>
                                </button>

                            </div>

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
                                            'availability',
                                            '/provider-availability'
                                        )
                                    }
                                >
                                    <span className="quick-action-icon">
                                        <i className="bi bi-clock"></i>
                                    </span>

                                    <span>
                                        <strong>
                                            Availability
                                        </strong>

                                        <small>
                                            Set your schedule
                                        </small>
                                    </span>

                                    <i className="bi bi-chevron-right"></i>
                                </button>


                                <button
                                    type="button"
                                    onClick={() =>
                                        goToSection(
                                            'earnings',
                                            '/provider-earnings'
                                        )
                                    }
                                >
                                    <span className="quick-action-icon">
                                        <i className="bi bi-wallet2"></i>
                                    </span>

                                    <span>
                                        <strong>
                                            Earnings
                                        </strong>

                                        <small>
                                            View your income
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
                    <div className="provider-placeholder-page">
                        <i className="bi bi-briefcase"></i>
                        <h2>My Jobs</h2>
                        <p>
                            View your ongoing and completed jobs.
                        </p>
                    </div>
                )}


                {activeSection === 'schedule' && (
                    <div className="provider-placeholder-page">
                        <i className="bi bi-calendar-event"></i>
                        <h2>Schedule</h2>
                        <p>
                            Manage your appointments and daily schedule.
                        </p>
                    </div>
                )}


                {activeSection === 'messages' && (
                    <div className="provider-placeholder-page">
                        <i className="bi bi-chat-dots"></i>
                        <h2>Messages</h2>
                        <p>
                            Communicate with your homeowners.
                        </p>
                    </div>
                )}


                {activeSection === 'reviews' && (
                    <div className="provider-placeholder-page">
                        <i className="bi bi-star"></i>
                        <h2>Ratings & Reviews</h2>
                        <p>
                            View ratings and feedback from homeowners.
                        </p>
                    </div>
                )}


                {activeSection === 'earnings' && (
                    <div className="provider-placeholder-page">
                        <i className="bi bi-wallet2"></i>
                        <h2>Earnings</h2>
                        <p>
                            View your earnings and payment history.
                        </p>
                    </div>
                )}


                {activeSection === 'notifications' && (
                    <div className="provider-placeholder-page">
                        <i className="bi bi-bell"></i>
                        <h2>Notifications</h2>
                        <p>
                            View all your provider notifications.
                        </p>
                    </div>
                )}


                {activeSection === 'profile' && (
                    <div className="provider-placeholder-page">
                        <i className="bi bi-person-circle"></i>
                        <h2>My Profile</h2>
                        <p>
                            Manage your provider profile and account details.
                        </p>
                    </div>
                )}


                {activeSection === 'availability' && (
                    <div className="provider-placeholder-page">
                        <i className="bi bi-clock"></i>
                        <h2>Availability</h2>
                        <p>
                            Set the days and hours when you are available.
                        </p>
                    </div>
                )}

            </main>

        </div>
    );
};

export default ProviderDashboard;