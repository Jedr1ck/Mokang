import { useState, useEffect } from "react"; import { createPortal } from "react-dom"; import { useNavigate } from "react-router-dom";

import {
    api,
    getAdminNotifications,
    logout,
} from "../../services/api";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import logo from "../../assets/images/logo.png";
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
    const [unreadNotificationCount, setUnreadNotificationCount] =
        useState(0);
    const [showLogoutModal, setShowLogoutModal] =
        useState(false);


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

    useEffect(() => {
        if (!user) {
            return undefined;
        }

        let active = true;
        const refreshUnreadNotificationCount = async () => {
            try {
                const notifications = await getAdminNotifications();
                if (active) {
                    setUnreadNotificationCount(
                        notifications.filter((notification) => !notification.isRead).length
                    );
                }
            } catch (error) {
                if (active) {
                    console.error(
                        "Unable to refresh admin notification count:",
                        error
                    );
                }
            }
        };

        refreshUnreadNotificationCount();
        const intervalId = window.setInterval(
            refreshUnreadNotificationCount,
            8000
        );

        return () => {
            active = false;
            window.clearInterval(intervalId);
        };
    }, [user]);


    /* =========================================================
       LOGOUT
    ========================================================= */

    const handleLogout = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = () => {
        logout();
        setShowLogoutModal(false);
        navigate(
            "/admin-login",
            {
                replace: true,
            }
        );
    };

    const cancelLogout = () => {
        setShowLogoutModal(false);
    };

    useEffect(() => {
        if (!showLogoutModal) {
            return undefined;
        }

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                cancelLogout();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [showLogoutModal]);


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
                return (
                    <>
                        <DashboardOverview />
                        <ReportsAnalytics />
                    </>
                );

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

            case "Notification":
                return <Notifications />;

            case "Admin Profile":
                return <AdminProfile user={user} />;

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
                        <img src={logo} alt="SmartHome logo" className="admin-loading-logo-image" />
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
        <>
            <div
                className={`
                    admin-dashboard-page !bg-slate-50 !text-slate-900
                    ${sidebarOpen
                        ? "sidebar-open"
                        : "sidebar-collapsed"
                    }
                `}
            >
                <SideBarAdmin
                    activePage={activePage}
                    setActivePage={handlePageChange}
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    handleLogout={handleLogout}
                    unreadNotificationCount={unreadNotificationCount}
                />

                <main className="admin-main-content min-h-screen">
                    <header className="admin-topbar !border-b !border-slate-200/80 !bg-white/90 !shadow-sm !backdrop-blur-xl">
                        <div className="admin-topbar-left">
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

                            <div className="admin-page-heading">
                                <span>
                                    ADMINISTRATION
                                </span>

                                <h1>
                                    {activePage}
                                </h1>
                            </div>
                        </div>

                        <div className="admin-topbar-right">
                            <button
                                type="button"
                                className="admin-topbar-icon-button"
                                onClick={() =>
                                    handlePageChange(
                                        "Notification"
                                    )
                                }
                                title="Notifications"
                                aria-label={
                                    unreadNotificationCount > 0
                                        ? `${unreadNotificationCount} unread notifications`
                                        : "Notifications"
                                }
                            >
                                <i className="bi bi-bell"></i>
                                {unreadNotificationCount > 0 && (
                                    <span className="admin-topbar-notification-dot"></span>
                                )}
                            </button>

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

                    <section className="admin-content-container !mx-auto !max-w-[1680px] !px-5 !py-7 sm:!px-8 xl:!px-10">
                        <div className="admin-breadcrumb">
                            <i className="bi bi-house-door-fill"></i>
                            <span>Admin</span>
                            <i className="bi bi-chevron-right"></i>
                            <span className="current">{activePage}</span>
                        </div>

                        <div className="admin-page-content !space-y-7
                            [&_.admin-management-header]:!rounded-3xl [&_.admin-management-header]:!border [&_.admin-management-header]:!border-slate-800 [&_.admin-management-header]:!bg-gradient-to-r [&_.admin-management-header]:!from-slate-950 [&_.admin-management-header]:!to-slate-800 [&_.admin-management-header]:!px-7 [&_.admin-management-header]:!py-8 [&_.admin-management-header]:!shadow-lg [&_.admin-management-header]:!shadow-slate-900/10
                            [&_.providers-page-header]:!rounded-3xl [&_.providers-page-header]:!border-slate-800 [&_.providers-page-header]:!bg-gradient-to-r [&_.providers-page-header]:!from-slate-950 [&_.providers-page-header]:!to-slate-800 [&_.providers-page-header]:!px-7 [&_.providers-page-header]:!py-8 [&_.providers-page-header]:!shadow-lg
                            [&_.booking-page-header]:!rounded-3xl [&_.booking-page-header]:!border-slate-800 [&_.booking-page-header]:!bg-gradient-to-r [&_.booking-page-header]:!from-slate-950 [&_.booking-page-header]:!to-slate-800 [&_.booking-page-header]:!px-7 [&_.booking-page-header]:!py-8 [&_.booking-page-header]:!shadow-lg
                            [&_.service-categories-header]:!rounded-3xl [&_.service-categories-header]:!border [&_.service-categories-header]:!border-slate-800 [&_.service-categories-header]:!bg-gradient-to-r [&_.service-categories-header]:!from-slate-950 [&_.service-categories-header]:!to-slate-800 [&_.service-categories-header]:!px-7 [&_.service-categories-header]:!py-8 [&_.service-categories-header]:!shadow-lg
                            [&_.reviews-page-header]:!rounded-3xl [&_.reviews-page-header]:!border [&_.reviews-page-header]:!border-slate-800 [&_.reviews-page-header]:!bg-gradient-to-r [&_.reviews-page-header]:!from-slate-950 [&_.reviews-page-header]:!to-slate-800 [&_.reviews-page-header]:!px-7 [&_.reviews-page-header]:!py-8 [&_.reviews-page-header]:!shadow-lg
                            [&_.admin-management-header_h2]:!text-white [&_.providers-page-header_h2]:!text-white [&_.booking-page-header_h2]:!text-white [&_.service-categories-header_h2]:!text-white [&_.reviews-page-header_h2]:!text-white
                            [&_.admin-management-header_p]:!text-slate-300 [&_.providers-page-header_p]:!text-slate-300 [&_.booking-page-header_p]:!text-slate-300 [&_.service-categories-header_p]:!text-slate-300 [&_.reviews-page-header_p]:!text-slate-300
                            [&_.admin-section-label]:!text-orange-300 [&_.providers-section-label]:!text-orange-300 [&_.booking-section-label]:!text-orange-300 [&_.service-categories-label]:!text-orange-300 [&_.reviews-section-label]:!text-orange-300
                            [&_.admin-homeowner-summary_.card]:!rounded-2xl [&_.admin-homeowner-summary_.card]:!border-slate-200 [&_.admin-homeowner-summary_.card]:!shadow-md [&_.admin-homeowner-summary_.card]:!shadow-slate-900/5 [&_.providers-summary-card]:!rounded-2xl [&_.providers-summary-card]:!border-slate-200 [&_.providers-summary-card]:!shadow-md [&_.providers-summary-card]:!shadow-slate-900/5 [&_.booking-summary-card]:!rounded-2xl [&_.booking-summary-card]:!border-slate-200 [&_.booking-summary-card]:!shadow-md [&_.booking-summary-card]:!shadow-slate-900/5 [&_.service-summary-card]:!rounded-2xl [&_.service-summary-card]:!border-slate-200 [&_.service-summary-card]:!shadow-md [&_.service-summary-card]:!shadow-slate-900/5 [&_.reviews-summary-card]:!rounded-2xl [&_.reviews-summary-card]:!border-slate-200 [&_.reviews-summary-card]:!shadow-md [&_.reviews-summary-card]:!shadow-slate-900/5 [&_.admin-management-summary-card]:!rounded-2xl [&_.admin-management-summary-card]:!border-slate-200 [&_.admin-management-summary-card]:!shadow-md [&_.admin-management-summary-card]:!shadow-slate-900/5
                            [&_.admin-management-toolbar]:!rounded-2xl [&_.admin-management-toolbar]:!border-slate-200 [&_.admin-management-toolbar]:!bg-white [&_.admin-management-toolbar]:!p-4 [&_.admin-management-toolbar]:!shadow-sm [&_.providers-filter-card]:!rounded-2xl [&_.providers-filter-card]:!border-slate-200 [&_.providers-filter-card]:!bg-white [&_.providers-filter-card]:!shadow-sm [&_.booking-filter-card]:!rounded-2xl [&_.booking-filter-card]:!border-slate-200 [&_.booking-filter-card]:!bg-white [&_.booking-filter-card]:!shadow-sm [&_.service-filter-card]:!rounded-2xl [&_.service-filter-card]:!border-slate-200 [&_.service-filter-card]:!bg-white [&_.service-filter-card]:!shadow-sm [&_.reviews-filter-card]:!rounded-2xl [&_.reviews-filter-card]:!border-slate-200 [&_.reviews-filter-card]:!bg-white [&_.reviews-filter-card]:!shadow-sm
                            [&_.admin-management-card]:!overflow-hidden [&_.admin-management-card]:!rounded-2xl [&_.admin-management-card]:!border-slate-200 [&_.admin-management-card]:!shadow-md [&_.admin-management-card]:!shadow-slate-900/5 [&_.providers-table-card]:!overflow-hidden [&_.providers-table-card]:!rounded-2xl [&_.providers-table-card]:!border-slate-200 [&_.providers-table-card]:!shadow-md [&_.providers-table-card]:!shadow-slate-900/5 [&_.booking-table-card]:!overflow-hidden [&_.booking-table-card]:!rounded-2xl [&_.booking-table-card]:!border-slate-200 [&_.booking-table-card]:!shadow-md [&_.booking-table-card]:!shadow-slate-900/5 [&_.service-table-card]:!overflow-hidden [&_.service-table-card]:!rounded-2xl [&_.service-table-card]:!border-slate-200 [&_.service-table-card]:!shadow-md [&_.service-table-card]:!shadow-slate-900/5 [&_.reviews-table-card]:!overflow-hidden [&_.reviews-table-card]:!rounded-2xl [&_.reviews-table-card]:!border-slate-200 [&_.reviews-table-card]:!shadow-md [&_.reviews-table-card]:!shadow-slate-900/5 [&_.admin-table-card]:!overflow-hidden [&_.admin-table-card]:!rounded-2xl [&_.admin-table-card]:!border-slate-200 [&_.admin-table-card]:!shadow-md [&_.admin-table-card]:!shadow-slate-900/5
                            [&_.admin-settings-card]:!overflow-hidden [&_.admin-settings-card]:!rounded-2xl [&_.admin-settings-card]:!border-slate-200 [&_.admin-settings-card]:!bg-white [&_.admin-settings-card]:!shadow-md [&_.admin-settings-card]:!shadow-slate-900/5
                            [&_.admin-management-header_.btn]:!border-orange-500 [&_.admin-management-header_.btn]:!bg-orange-500 [&_.admin-management-header_.btn]:!text-white [&_.providers-page-header_.btn]:!border-orange-500 [&_.providers-page-header_.btn]:!bg-orange-500 [&_.providers-page-header_.btn]:!text-white [&_.service-add-button]:!rounded-xl [&_.service-add-button]:!bg-orange-500 [&_.service-add-button]:!text-white [&_.admin-add-button]:!rounded-xl [&_.admin-add-button]:!bg-orange-500 [&_.admin-add-button]:!text-white
                        ">
                            {renderPageContent()}
                        </div>
                    </section>
                </main>
            </div>

            {showLogoutModal && createPortal(
                <div
                    className="admin-logout-modal-overlay"
                    onClick={cancelLogout}
                >
                    <div
                        className="admin-logout-modal"
                        onClick={(event) => event.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="admin-logout-title"
                        aria-describedby="admin-logout-description"
                    >
                        <div className="admin-logout-modal-content">
                            <span className="admin-logout-modal-icon" aria-hidden="true">
                                <i className="bi bi-box-arrow-right"></i>
                            </span>
                            <div>
                                <h3 id="admin-logout-title">Log out of your account?</h3>
                                <p id="admin-logout-description">
                                    You will need to sign in again to access the admin dashboard.
                                </p>
                            </div>
                        </div>

                        <div className="admin-logout-modal-actions">
                            <button
                                type="button"
                                className="admin-logout-cancel-btn"
                                onClick={cancelLogout}
                            >
                                Stay logged in
                            </button>

                            <button
                                type="button"
                                className="admin-logout-confirm-btn"
                                onClick={confirmLogout}
                            >
                                Log out
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );

}


export default AdminDashboard;
