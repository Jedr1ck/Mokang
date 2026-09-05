import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import "bootstrap-icons/font/bootstrap-icons.css";
import "./ProviderSideBar.css";

import myLogo from "../../assets/images/logo.png";


const ProviderSideBar = () => {

    const location = useLocation();
    const navigate = useNavigate();


    // =========================================
    // ACTIVE LINK
    // =========================================

    const isActive = (path) => {
        return location.pathname === path;
    };


    // =========================================
    // LOGOUT
    // =========================================

    const handleLogout = () => {

        const confirmLogout =
            window.confirm(
                "Are you sure you want to logout?"
            );

        if (!confirmLogout) {
            return;
        }


        // Remove provider login information
        localStorage.removeItem("user");

        localStorage.removeItem(
            "loggedInProvider"
        );


        // Return to landing page
        navigate("/");

    };


    return (

        <aside className="provider-sidebar">

            <div className="provider-sidebar-content">


                {/* =====================================
                    LOGO
                ====================================== */}

                <Link
                    to="/provider-dashboard"
                    className="provider-top-brand-icon"
                    title="Provider Dashboard"
                >

                    <img
                        src={myLogo}
                        alt="Provider Logo"
                        className="provider-brand-logo-img"
                    />

                </Link>


                {/* =====================================
                    NAVIGATION
                ====================================== */}

                <nav className="provider-nav-items-container">


                    {/* =================================
                        DASHBOARD
                    ================================== */}

                    <Link
                        to="/provider-dashboard"
                        className={`provider-sidebar-btn ${isActive(
                            "/provider-dashboard"
                        )
                                ? "active"
                                : ""
                            }`}
                        title="Dashboard"
                    >

                        <i className="bi bi-grid"></i>

                        <span className="provider-link-text">
                            Dashboard
                        </span>

                    </Link>


                    {/* =================================
                        BOOKING SYSTEM
                    ================================== */}

                    <Link
                        to="/provider-bookings"
                        className={`provider-sidebar-btn ${isActive(
                            "/provider-bookings"
                        )
                                ? "active"
                                : ""
                            }`}
                        title="Booking System"
                    >

                        <i className="bi bi-calendar-check"></i>

                        <span className="badge-dot-yellow"></span>

                        <span className="provider-link-text">
                            Booking System
                        </span>

                    </Link>


                    {/* =================================
                        MY JOBS
                    ================================== */}

                    <Link
                        to="/provider-jobs"
                        className={`provider-sidebar-btn ${isActive(
                            "/provider-jobs"
                        )
                                ? "active"
                                : ""
                            }`}
                        title="My Jobs"
                    >

                        <i className="bi bi-briefcase"></i>

                        <span className="provider-link-text">
                            My Jobs
                        </span>

                    </Link>


                    {/* =================================
                        SCHEDULE
                    ================================== */}

                    <Link
                        to="/provider-schedule"
                        className={`provider-sidebar-btn ${isActive(
                            "/provider-schedule"
                        )
                                ? "active"
                                : ""
                            }`}
                        title="Schedule"
                    >

                        <i className="bi bi-calendar-event"></i>

                        <span className="provider-link-text">
                            Schedule
                        </span>

                    </Link>


                    {/* =================================
                        MESSAGES
                    ================================== */}

                    <Link
                        to="/provider-messages"
                        className={`provider-sidebar-btn ${isActive(
                            "/provider-messages"
                        )
                                ? "active"
                                : ""
                            }`}
                        title="Messages"
                    >

                        <i className="bi bi-chat-dots"></i>

                        <span className="badge-dot-yellow"></span>

                        <span className="provider-link-text">
                            Messages
                        </span>

                    </Link>


                    {/* =================================
                        RATINGS & REVIEWS
                    ================================== */}

                    <Link
                        to="/provider-reviews"
                        className={`provider-sidebar-btn ${isActive(
                            "/provider-reviews"
                        )
                                ? "active"
                                : ""
                            }`}
                        title="Ratings & Reviews"
                    >

                        <i className="bi bi-star"></i>

                        <span className="provider-link-text">
                            Ratings & Reviews
                        </span>

                    </Link>


                    {/* =================================
                        EARNINGS
                    ================================== */}

                    <Link
                        to="/provider-earnings"
                        className={`provider-sidebar-btn ${isActive(
                            "/provider-earnings"
                        )
                                ? "active"
                                : ""
                            }`}
                        title="Earnings"
                    >

                        <i className="bi bi-wallet2"></i>

                        <span className="provider-link-text">
                            Earnings
                        </span>

                    </Link>


                    {/* =================================
                        NOTIFICATIONS
                    ================================== */}

                    <Link
                        to="/provider-notifications"
                        className={`provider-sidebar-btn ${isActive(
                            "/provider-notifications"
                        )
                                ? "active"
                                : ""
                            }`}
                        title="Notifications"
                    >

                        <i className="bi bi-bell"></i>

                        <span className="badge-dot-yellow"></span>

                        <span className="provider-link-text">
                            Notifications
                        </span>

                    </Link>


                    {/* =================================
                        MY PROFILE
                    ================================== */}

                    <Link
                        to="/provider-profile"
                        className={`provider-sidebar-btn ${isActive(
                            "/provider-profile"
                        )
                                ? "active"
                                : ""
                            }`}
                        title="My Profile"
                    >

                        <i className="bi bi-person-circle"></i>

                        <span className="provider-link-text">
                            My Profile
                        </span>

                    </Link>


                    {/* =================================
                        AVAILABILITY
                    ================================== */}

                    <Link
                        to="/provider-availability"
                        className={`provider-sidebar-btn ${isActive(
                            "/provider-availability"
                        )
                                ? "active"
                                : ""
                            }`}
                        title="Availability"
                    >

                        <i className="bi bi-clock"></i>

                        <span className="provider-link-text">
                            Availability
                        </span>

                    </Link>


                    {/* =================================
                        LOGOUT
                    ================================== */}

                    <button
                        type="button"
                        className="provider-sidebar-btn provider-logout-btn"
                        onClick={handleLogout}
                        title="Logout"
                    >

                        <i className="bi bi-box-arrow-right"></i>

                        <span className="provider-link-text">
                            Logout
                        </span>

                    </button>


                </nav>

            </div>

        </aside>

    );

};


export default ProviderSideBar;