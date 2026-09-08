import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import "./SideBarAdmin.css";

function SideBarAdmin({
    activePage,
    setActivePage,
    sidebarOpen,
    setSidebarOpen,
    handleLogout,
}) {

    const menuItems = [
        {
            label: "Dashboard",
            icon: "bi-grid-1x2-fill",
        },
        {
            label: "Manage Homeowners",
            icon: "bi-people-fill",
        },
        {
            label: "Manage Service Providers",
            icon: "bi-person-badge-fill",
        },
        {
            label: "Booking Management",
            icon: "bi-calendar-check-fill",
        },
        {
            label: "Service Categories",
            icon: "bi-grid-fill",
        },
        {
            label: "Reviews and Complaints",
            icon: "bi-chat-left-text-fill",
        },
        {
            label: "Report and Analytics",
            icon: "bi-bar-chart-fill",
        },
        {
            label: "Notification",
            icon: "bi-bell-fill",
        },
        {
            label: "Admin Profile",
            icon: "bi-person-circle",
        },
        {
            label: "System Setting",
            icon: "bi-gear-fill",
        },
    ];

    const handleMenuClick = (label) => {
        setActivePage(label);

        // Close sidebar on mobile after selecting a menu
        if (window.innerWidth <= 768) {
            setSidebarOpen(false);
        }
    };

    return (
        <aside className="admin-sidebar">

            {/* =================================================
                        SIDEBAR LOGO
            ================================================== */}

            <div className="admin-sidebar-logo">

                <div className="admin-logo-icon">
                    <i className="bi bi-house-heart-fill"></i>
                </div>

                {sidebarOpen && (
                    <div className="admin-logo-text">
                        <strong>SmartHome</strong>
                        <span>ADMIN PANEL</span>
                    </div>
                )}

            </div>


            {/* =================================================
                        SIDEBAR NAVIGATION
            ================================================== */}

            <nav className="admin-sidebar-nav">

                <span className="admin-nav-title">
                    {sidebarOpen ? "MAIN MENU" : "MENU"}
                </span>


                <div className="admin-nav-list">

                    {menuItems.map((item) => (

                        <button
                            key={item.label}
                            type="button"

                            className={`admin-nav-item ${activePage === item.label
                                    ? "active"
                                    : ""
                                }`}

                            onClick={() =>
                                handleMenuClick(item.label)
                            }

                            title={
                                !sidebarOpen
                                    ? item.label
                                    : undefined
                            }
                        >

                            <span className="admin-nav-icon">
                                <i
                                    className={`bi ${item.icon}`}
                                ></i>
                            </span>


                            {sidebarOpen && (
                                <span className="admin-nav-label">
                                    {item.label}
                                </span>
                            )}


                            {/* Notification count */}

                            {item.label === "Notification" && (
                                <span className="admin-notification-badge">
                                    0
                                </span>
                            )}

                        </button>

                    ))}

                </div>

            </nav>


            {/* =================================================
                        SIDEBAR FOOTER / LOGOUT
            ================================================== */}

            <div className="admin-sidebar-bottom">

                <button
                    type="button"
                    className="admin-logout-button"

                    onClick={handleLogout}

                    title={
                        !sidebarOpen
                            ? "Log Out"
                            : undefined
                    }
                >

                    <span className="admin-logout-icon">
                        <i className="bi bi-box-arrow-right"></i>
                    </span>

                    {sidebarOpen && (
                        <span className="admin-logout-label">
                            Log Out
                        </span>
                    )}

                </button>

            </div>

        </aside>
    );
}

export default SideBarAdmin;