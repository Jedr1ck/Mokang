import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api, logout } from "../../services/api";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import "./AdminDashboard.css";

import SideBarAdmin from "../SideBarAdmin/SideBarAdmin";

import DashboardOverview from "./DashboardOverview";
import ManageHomeowners from "./ManageHomeowners";
import ManageProviders from "./ManageProviders";
import BookingManagement from "./BookingManagement";
import ServiceCategories from "./ServiceCategories";
import ReviewsComplaints from "./ReviewsComplaints";
import ReportsAnalytics from "./ReportsAnalytics";
import Notifications from "./Notifications";
import AdminProfile from "./AdminProfile";
import SystemSettings from "./SystemSettings";


function AdminDashboard() {

    const navigate = useNavigate();


    /* =========================================================
       STATE
    ========================================================= */

    const [user, setUser] = useState(null);

    const [activePage, setActivePage] =
        useState("Dashboard");

    const [sidebarOpen, setSidebarOpen] =
        useState(true);


    /* =========================================================
       ADMIN AUTHENTICATION
    ========================================================= */

    useEffect(() => {

        const checkAdmin = async () => {

            try {

                const currentUser =
                    await api("/auth/me");

                if (
                    !currentUser ||
                    currentUser.role !== "admin"
                ) {
                    throw new Error(
                        "Not an administrator"
                    );
                }

                setUser(currentUser);

            } catch (error) {

                console.error(
                    "Admin authentication error:",
                    error
                );

                navigate(
                    "/admin-login",
                    {
                        replace: true,
                    }
                );

            }

        };

        checkAdmin();

    }, [navigate]);


    /* =========================================================
       LOGOUT
    ========================================================= */

    const handleLogout = () => {

        logout();

        navigate(
            "/admin-login",
            {
                replace: true,
            }
        );

    };


    /* =========================================================
       PAGE CHANGE
    ========================================================= */

    const handlePageChange = (page) => {

        setActivePage(page);

        if (window.innerWidth <= 768) {

            setSidebarOpen(false);

        }

    };


    /* =========================================================
       PAGE CONTENT
    ========================================================= */

    const renderPageContent = () => {

        switch (activePage) {

            case "Dashboard":
                return <DashboardOverview />;

            case "Manage Homeowners":
                return <ManageHomeowners />;

            case "Manage Service Providers":
                return <ManageProviders />;

            case "Booking Management":
                return <BookingManagement />;

            case "Service Categories":
                return <ServiceCategories />;

            case "Reviews and Complaints":
                return <ReviewsComplaints />;

            case "Report and Analytics":
                return <ReportsAnalytics />;

            case "Notification":
                return <Notifications />;

            case "Admin Profile":
                return <AdminProfile />;

            case "System Setting":
                return <SystemSettings />;

            default:
                return <DashboardOverview />;

        }

    };


    /* =========================================================
       LOADING
    ========================================================= */

    if (!user) {

        return (

            <div className="admin-dashboard-loading">

                <div className="admin-loading-card">

                    <div className="admin-loading-logo">

                        <i className="bi bi-house-heart-fill"></i>

                    </div>

                    <div className="admin-loading-spinner"></div>

                    <h5>
                        SmartHome Admin
                    </h5>

                    <p>
                        Loading administrator dashboard...
                    </p>

                </div>

            </div>

        );

    }


    /* =========================================================
       MAIN DASHBOARD
    ========================================================= */

    return (

        <div
            className={`
                admin-dashboard-page
                ${sidebarOpen
                    ? "sidebar-open"
                    : "sidebar-collapsed"
                }
            `}
        >


            {/* =================================================
                SIDEBAR
            ================================================= */}

            <SideBarAdmin
                activePage={activePage}
                setActivePage={handlePageChange}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                handleLogout={handleLogout}
            />


            {/* =================================================
                MAIN AREA
            ================================================= */}

            <main className="admin-main-content">


                {/* =================================================
                    TOPBAR
                ================================================= */}

                <header className="admin-topbar">

                    <div className="admin-topbar-left">

                        {/* MENU BUTTON */}

                        <button
                            type="button"
                            className="admin-sidebar-toggle"
                            onClick={() =>
                                setSidebarOpen(
                                    (previous) =>
                                        !previous
                                )
                            }
                            title="Toggle sidebar"
                            aria-label="Toggle sidebar"
                        >

                            <i className="bi bi-list"></i>

                        </button>


                        {/* PAGE TITLE */}

                        <div className="admin-page-heading">

                            <span>
                                ADMINISTRATION
                            </span>

                            <h1>
                                {activePage}
                            </h1>

                        </div>

                    </div>


                    {/* =================================================
                        TOPBAR RIGHT
                    ================================================= */}

                    <div className="admin-topbar-right">


                        {/* NOTIFICATION */}

                        <button
                            type="button"
                            className="admin-topbar-icon-button"
                            onClick={() =>
                                handlePageChange(
                                    "Notification"
                                )
                            }
                            title="Notifications"
                        >

                            <i className="bi bi-bell"></i>

                            <span className="admin-topbar-notification-dot">
                            </span>

                        </button>


                        {/* PROFILE */}

                        <button
                            type="button"
                            className="admin-profile-button"
                            onClick={() =>
                                handlePageChange(
                                    "Admin Profile"
                                )
                            }
                            title="Administrator Profile"
                        >

                            <div className="admin-profile-avatar">

                                <i className="bi bi-person-fill"></i>

                            </div>


                            <div className="admin-profile-info">

                                <strong>

                                    {user?.fullName ||
                                        user?.username ||
                                        user?.name ||
                                        "Administrator"}

                                </strong>

                                <span>
                                    Administrator
                                </span>

                            </div>


                            <i className="bi bi-chevron-down"></i>

                        </button>

                    </div>

                </header>


                {/* =================================================
                    PAGE CONTENT
                ================================================= */}

                <section className="admin-content-container">


                    {/* BREADCRUMB */}

                    <div className="admin-breadcrumb">

                        <i className="bi bi-house-door-fill"></i>

                        <span>
                            Admin
                        </span>

                        <i className="bi bi-chevron-right"></i>

                        <span className="current">
                            {activePage}
                        </span>

                    </div>


                    {/* PAGE */}

                    <div className="admin-page-content">

                        {renderPageContent()}

                    </div>

                </section>

            </main>

        </div>

    );

}


export default AdminDashboard;