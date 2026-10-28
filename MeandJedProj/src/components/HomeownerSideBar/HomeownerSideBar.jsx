
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import 'bootstrap-icons/font/bootstrap-icons.css';
import './HomeownerSideBar.css';

import myLogo from '../../assets/images/logo.png';
import ConfirmDialog from '../ConfirmDialog';

const HomeownerSideBar = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const isActive = (path) => location.pathname === path;

    const confirmLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('loggedInHomeowner');
        localStorage.removeItem('access_token');

        setShowLogoutModal(false);
        navigate('/');
    };

    return (
        <aside className="green-wavy-sidebar">
            <div className="sidebar-content">
                {/* LOGO */}
                <Link
                    to="/homeowner-dashboard"
                    className="top-brand-icon"
                    title="Dashboard"
                >
                    <img
                        src={myLogo}
                        alt="SmartHome Logo"
                        className="brand-logo-img"
                    />
                </Link>

                {/* NAVIGATION */}
                <nav className="nav-items-container">
                    <Link
                        to="/homeowner-dashboard"
                        title="Dashboard"
                        className={`sidebar-btn ${isActive('/homeowner-dashboard') ? 'active' : ''
                            }`}
                    >
                        <i className="bi bi-grid" />
                        <span className="link-text">Dashboard</span>
                    </Link>

                    <Link
                        to="/services"
                        title="Services"
                        className={`sidebar-btn ${isActive('/services') ? 'active' : ''
                            }`}
                    >
                        <i className="bi bi-tools" />
                        <span className="link-text">Services</span>
                    </Link>

                    <Link
                        to="/history"
                        title="History"
                        className={`sidebar-btn ${isActive('/history') ? 'active' : ''
                            }`}
                    >
                        <i className="bi bi-clock-history" />
                        <span className="link-text">History</span>
                    </Link>

                    <Link
                        to="/messages"
                        title="Messages"
                        className={`sidebar-btn ${isActive('/messages') ? 'active' : ''
                            }`}
                    >
                        <i className="bi bi-chat-dots" />
                        <span className="link-text">Messages</span>
                    </Link>

                    <Link
                        to="/calendar"
                        title="Calendar"
                        className={`sidebar-btn ${isActive('/calendar') ? 'active' : ''
                            }`}
                    >
                        <i className="bi bi-calendar-event" />
                        <span className="link-text">Calendar</span>
                    </Link>

                    <Link
                        to="/settings"
                        title="Settings"
                        className={`sidebar-btn ${isActive('/settings') ? 'active' : ''
                            }`}
                    >
                        <i className="bi bi-gear" />
                        <span className="link-text">Settings</span>
                    </Link>

                    <button
                        type="button"
                        className="sidebar-btn homeowner-logout-btn"
                        title="Logout"
                        onClick={() => setShowLogoutModal(true)}
                    >
                        <i className="bi bi-box-arrow-right" />
                        <span className="link-text">Logout</span>
                    </button>
                </nav>
            </div>

            <ConfirmDialog
                open={showLogoutModal}
                title="Log out?"
                message="Are you sure you want to end your session?"
                confirmLabel="Log out"
                icon="bi-box-arrow-right"
                tone="danger"
                onConfirm={confirmLogout}
                onCancel={() => setShowLogoutModal(false)}
            />
        </aside>
    );
};

export default HomeownerSideBar;
