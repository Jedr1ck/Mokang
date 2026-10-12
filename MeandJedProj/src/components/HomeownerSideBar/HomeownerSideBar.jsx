import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './HomeownerSideBar.css';

// Relative path batay sa file tree (3 levels up)
// 2 levels up para makarating sa src folder:
// HomeownerSideBar (1) -> components (2) -> src
import myLogo from '../../assets/images/logo.png';

const HomeownerSideBar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const isActive = (path) => location.pathname === path;

    const handleLogout = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('loggedInHomeowner');
        setShowLogoutModal(false);
        navigate('/');
    };

    const cancelLogout = () => {
        setShowLogoutModal(false);
    };

    return (
        <aside className="green-wavy-sidebar">
            <div className="sidebar-content">

                {/* Top Brand Logo */}
                <Link to="/homeowner-dashboard" className="top-brand-icon" title="Go to Dashboard">
                    <img src={myLogo} alt="Logo" className="brand-logo-img" />
                </Link>

                {/* Nav Items */}
                <nav className="nav-items-container">
                    <Link
                        to="/profile"
                        className={`sidebar-btn ${isActive('/profile') ? 'active' : ''}`}
                    >
                        <i className="bi bi-person"></i>
                        <span className="link-text">Profile</span>
                    </Link>

                    <Link
                        to="/history"
                        className={`sidebar-btn ${isActive('/history') ? 'active' : ''}`}
                    >
                        <i className="bi bi-clock-history"></i>
                        <span className="badge-pill"></span>
                        <span className="link-text">History</span>
                    </Link>

                    <Link
                        to="/notifications"
                        className={`sidebar-btn ${isActive('/notifications') ? 'active' : ''}`}
                    >
                        <i className="bi bi-bell"></i>
                        <span className="link-text">Notifications</span>
                    </Link>

                    <Link
                        to="/calendar"
                        className={`sidebar-btn ${isActive('/calendar') ? 'active' : ''}`}
                    >
                        <i className="bi bi-calendar-event"></i>
                        <span className="link-text">Calendar</span>
                    </Link>

                    <Link
                        to="/messages"
                        className={`sidebar-btn ${isActive('/messages') ? 'active' : ''}`}
                    >
                        <i className="bi bi-envelope"></i>
                        <span className="badge-dot-yellow"></span>
                        <span className="link-text">Messages</span>
                    </Link>

                    <Link
                        to="/settings"
                        className={`sidebar-btn ${isActive('/settings') ? 'active' : ''}`}
                    >
                        <i className="bi bi-gear"></i>
                        <span className="link-text">Settings</span>
                    </Link>

                    <button
                        type="button"
                        className="sidebar-btn homeowner-logout-btn"
                        onClick={handleLogout}
                    >
                        <i className="bi bi-box-arrow-right"></i>
                        <span className="badge-dot-lightgreen"></span>
                        <span className="link-text">Logout</span>
                    </button>
                </nav>

            </div>

            {showLogoutModal && createPortal(
                <div
                    className="homeowner-logout-modal-overlay"
                    onClick={cancelLogout}
                >
                    <div
                        className="homeowner-logout-modal"
                        onClick={(event) => event.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="homeowner-logout-title"
                    >
                        <div className="homeowner-logout-modal-content">
                            <h3 id="homeowner-logout-title">Logout</h3>
                            <p>Are you sure you want to log out?</p>
                        </div>

                        <div className="homeowner-logout-modal-actions">
                            <button
                                type="button"
                                className="homeowner-logout-confirm-btn"
                                onClick={confirmLogout}
                            >
                                OK
                            </button>
                            <button
                                type="button"
                                className="homeowner-logout-cancel-btn"
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

export default HomeownerSideBar;