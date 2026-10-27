import { useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";

import "bootstrap-icons/font/bootstrap-icons.css";
import "./ProviderSideBar.css";

import myLogo from "../../assets/images/logo.png";

const ProviderSideBar = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // ACTIVE LINK
    const isActive = (path) => {
        return location.pathname === path ||
            (path === "/provider-schedule" && location.pathname === "/provider-availability");
    };

    // LOGOUT
    const handleLogout = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("loggedInProvider");
        localStorage.removeItem("access_token");

        setShowLogoutModal(false);
        navigate("/");
    };

    const cancelLogout = () => {
        setShowLogoutModal(false);
    };

    return (
        <aside className="provider-sidebar">
            <div className="provider-sidebar-content">

                {/* LOGO */}
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

                {/* NAVIGATION */}
                <nav className="provider-nav-items-container">

                    {/* DASHBOARD */}
                    <Link
                        to="/provider-dashboard"
                        className={`provider-sidebar-btn ${isActive("/provider-dashboard")
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

                    {/* BOOKING SYSTEM */}
                    <Link
                        to="/provider-bookings"
                        className={`provider-sidebar-btn ${isActive("/provider-bookings")
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

                    {/* MY JOBS */}
                    <Link
                        to="/provider-jobs"
                        className={`provider-sidebar-btn ${isActive("/provider-jobs")
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

                    {/* CALENDAR & SCHEDULE */}
                    <Link
                        to="/provider-schedule"
                        className={`provider-sidebar-btn ${isActive("/provider-schedule")
                                ? "active"
                                : ""
                            }`}
                        title="Calendar & Schedule"
                    >
                        <i className="bi bi-calendar-event"></i>
                        <span className="provider-link-text">
                            Calendar & Schedule
                        </span>
                    </Link>

                    {/* MESSAGES */}
                    <Link
                        to="/provider-messages"
                        className={`provider-sidebar-btn ${isActive("/provider-messages")
                                ? "active"
                                : ""
                            }`}
                        title="Messages"
                    >
                        <i className="bi bi-chat-dots"></i>
                        <span className="provider-link-text">
                            Messages
                        </span>
                    </Link>

                    {/* RATINGS & REVIEWS */}
                    <Link
                        to="/provider-reviews"
                        className={`provider-sidebar-btn ${isActive("/provider-reviews")
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

                    {/* LOGOUT */}
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

            {/* LOGOUT CONFIRMATION MODAL */}
            {showLogoutModal &&
                createPortal(
                    <div
                        className="provider-logout-modal-overlay"
                        onClick={cancelLogout}
                    >
                        <div
                            className="provider-logout-modal"
                            onClick={(event) =>
                                event.stopPropagation()
                            }
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="provider-logout-title"
                        >
                            <div className="provider-logout-modal-content">
                                <h3 id="provider-logout-title">
                                    Logout
                                </h3>

                                <p>
                                    Are you sure you want to log out?
                                </p>
                            </div>

                            <div className="provider-logout-modal-actions">
                                <button
                                    type="button"
                                    className="provider-logout-confirm-btn"
                                    onClick={confirmLogout}
                                >
                                    OK
                                </button>

                                <button
                                    type="button"
                                    className="provider-logout-cancel-btn"
                                    onClick={cancelLogout}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
        </aside>
    );
};

export default ProviderSideBar;