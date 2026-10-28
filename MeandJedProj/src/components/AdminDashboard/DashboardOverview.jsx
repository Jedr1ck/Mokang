import { useEffect, useState } from 'react';
import { getAdminDashboard } from '../../services/api';

import 'bootstrap/dist/css/bootstrap.min.css';

import 'bootstrap-icons/font/bootstrap-icons.css';

import "./AdminDashboard.css";

function DashboardOverview() {
    const [showAllBookings, setShowAllBookings] = useState(false);
    const [showAllCustomers, setShowAllCustomers] = useState(false);
    const [showAllApprovals, setShowAllApprovals] = useState(false);
    const [showAllAnnouncements, setShowAllAnnouncements] = useState(false);
    const [dashboard, setDashboard] = useState(null);
    const [loadError, setLoadError] = useState('');

    useEffect(() => {
        let active = true;
        getAdminDashboard()
            .then((data) => {
                if (active) setDashboard(data);
            })
            .catch((error) => {
                if (active) setLoadError(error.message || 'Unable to load dashboard data.');
            });

        return () => {
            active = false;
        };
    }, []);

    if (loadError) {
        return (
            <div className="admin-overview">
                <div className="alert alert-danger d-flex align-items-center gap-2 shadow-sm" role="alert">
                    <i className="bi bi-exclamation-triangle-fill"></i>
                    <span>Unable to load dashboard data: {loadError}</span>
                </div>
            </div>
        );
    }

    if (!dashboard) {
        return (
            <div className="admin-overview py-5 text-center" role="status">
                <div className="spinner-border text-success" aria-hidden="true"></div>
                <p className="mt-3 mb-0 text-secondary">Loading dashboard data...</p>
            </div>
        );
    }

    const summaryData = [
        {
            title: "Total Homeowners",
            value: dashboard.counts.homeowners,
            description: "Registered customers",
            icon: "bi-people-fill",
        },
        {
            title: "Total Service Providers",
            value: dashboard.counts.providers,
            description: "Registered providers",
            icon: "bi-person-badge-fill",
        },
        {
            title: "Total Bookings",
            value: dashboard.counts.bookings,
            description: "All service bookings",
            icon: "bi-calendar-check-fill",
        },
        {
            title: "Pending Approvals",
            value: dashboard.counts.pendingApprovals,
            description: "Requires admin action",
            icon: "bi-hourglass-split",
        },
    ];

    const recentBookings = dashboard.recentBookings;
    const newCustomers = dashboard.newCustomers;
    const pendingApprovals = dashboard.pendingApprovals;

    const announcements = [];

    // =====================================================
    // HELPER
    // =====================================================

    const getVisibleItems = (items, showAll) => {
        if (showAll) {
            return items;
        }

        return items.slice(0, 5);
    };

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div className="admin-overview container-fluid px-0">

            {/* =================================================
                        PAGE INTRO
            ================================================== */}

            <div className="admin-overview-intro card border-0 shadow-sm">
                <div>
                    <span className="admin-section-label">
                        SYSTEM OVERVIEW
                    </span>

                    <h2>Dashboard Overview</h2>

                    <p>
                        Monitor your SmartHome platform and manage
                        important system activities.
                    </p>
                </div>

                <div className="admin-overview-date badge rounded-pill">
                    <i className="bi bi-calendar3"></i>

                    <span>
                        {new Date().toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                        })}
                    </span>
                </div>
            </div>

            {/* =================================================
                        SUMMARY CARDS
            ================================================== */}

            <div className="admin-overview-summary-grid row g-3">

                {summaryData.map((item) => (
                    <div
                        className="admin-overview-summary-column col-12 col-sm-6 col-xl-3"
                        key={item.title}
                    >
                        <div className={`admin-overview-summary-card card h-100 ${item.title === "Pending Approvals" ? "admin-summary-warning" : ""}`}>
                            <div className="card-body d-flex align-items-center gap-3">
                                <div className="admin-overview-summary-icon">
                                    <i className={`bi ${item.icon}`}></i>
                                </div>

                                <div className="admin-overview-summary-info">
                                    <span>{item.title}</span>
                                    <strong>{item.value.toLocaleString()}</strong>
                                    <small>{item.description}</small>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

            </div>

            {/* =================================================
                        MONITORING SECTIONS
            ================================================== */}

            <div className="admin-overview-grid row g-4">

                {/* =================================================
                            RECENT BOOKINGS
                ================================================== */}

                <section className="admin-overview-card card col-12 col-lg-6">

                    <div className="admin-overview-card-header">

                        <div className="admin-overview-heading">
                            <span className="admin-card-label">
                                ACTIVITY
                            </span>

                            <h3>Recent Bookings</h3>

                            <p>
                                Latest service booking activities
                            </p>
                        </div>

                        <button
                            type="button"
                            className="btn btn-sm btn-outline-success rounded-pill"
                            onClick={() =>
                                setShowAllBookings(!showAllBookings)
                            }
                        >
                            {showAllBookings ? "Show Less" : "View All"}

                            <i
                                className={`bi ${showAllBookings
                                    ? "bi-chevron-up"
                                    : "bi-arrow-right"
                                    }`}
                            ></i>
                        </button>

                    </div>

                    <div className="admin-overview-table-wrapper table-responsive">

                        {getVisibleItems(
                            recentBookings,
                            showAllBookings
                        ).length > 0 ? (

                            <table className="admin-overview-table table table-hover align-middle mb-0">

                                <thead>
                                    <tr>
                                        <th>Customer</th>
                                        <th>Service</th>
                                        <th>Date</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {getVisibleItems(
                                        recentBookings,
                                        showAllBookings
                                    ).map((booking, index) => (
                                        <tr key={booking.id || index}>
                                            <td>{booking.customer}</td>
                                            <td>{booking.service}</td>
                                            <td>{booking.date}</td>
                                            <td>
                                                <span className={`badge rounded-pill ${booking.status === "Completed" ? "text-bg-success" : booking.status === "Pending" ? "text-bg-warning" : booking.status === "Cancelled" || booking.status === "Rejected" ? "text-bg-danger" : "text-bg-primary"}`}>
                                                    {booking.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>

                            </table>

                        ) : (

                            <div className="admin-overview-empty">

                                <div className="admin-empty-icon">
                                    <i className="bi bi-calendar-x"></i>
                                </div>

                                <strong>No recent bookings</strong>

                                <span>
                                    New booking activities will appear here.
                                </span>

                            </div>

                        )}

                    </div>

                </section>

                {/* =================================================
                            NEW CUSTOMERS
                ================================================== */}

                <section className="admin-overview-card card col-12 col-lg-6">

                    <div className="admin-overview-card-header">

                        <div className="admin-overview-heading">
                            <span className="admin-card-label">
                                REGISTRATION
                            </span>

                            <h3>New Registered Customers</h3>

                            <p>
                                Recently registered homeowners
                            </p>
                        </div>

                        <button
                            type="button"
                            className="btn btn-sm btn-outline-success rounded-pill"
                            onClick={() =>
                                setShowAllCustomers(!showAllCustomers)
                            }
                        >
                            {showAllCustomers ? "Show Less" : "View All"}

                            <i
                                className={`bi ${showAllCustomers
                                    ? "bi-chevron-up"
                                    : "bi-arrow-right"
                                    }`}
                            ></i>
                        </button>

                    </div>

                    <div className="admin-overview-table-wrapper table-responsive">

                        {getVisibleItems(
                            newCustomers,
                            showAllCustomers
                        ).length > 0 ? (

                            <table className="admin-overview-table table table-hover align-middle mb-0">

                                <thead>
                                    <tr>
                                        <th>Full Name</th>
                                        <th>Email</th>
                                        <th>Registered</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {getVisibleItems(
                                        newCustomers,
                                        showAllCustomers
                                    ).map((customer, index) => (
                                        <tr key={customer.id || index}>
                                            <td>{customer.name}</td>
                                            <td>{customer.email}</td>
                                            <td>{customer.date}</td>
                                            <td>
                                                <span className={`badge rounded-pill ${customer.status === "Active" ? "text-bg-success" : "text-bg-secondary"}`}>
                                                    {customer.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>

                            </table>

                        ) : (

                            <div className="admin-overview-empty">

                                <div className="admin-empty-icon">
                                    <i className="bi bi-person-plus"></i>
                                </div>

                                <strong>No new customers</strong>

                                <span>
                                    Newly registered homeowners will appear
                                    here.
                                </span>

                            </div>

                        )}

                    </div>

                </section>

                {/* =================================================
                            PENDING APPROVAL
                ================================================== */}

                <section className="admin-overview-card card col-12 col-lg-6">

                    <div className="admin-overview-card-header">

                        <div className="admin-overview-heading">
                            <span className="admin-card-label">
                                APPROVAL
                            </span>

                            <h3>Pending Approval</h3>

                            <p>
                                Service providers waiting for approval
                            </p>
                        </div>

                        <button
                            type="button"
                            className="btn btn-sm btn-outline-success rounded-pill"
                            onClick={() =>
                                setShowAllApprovals(!showAllApprovals)
                            }
                        >
                            {showAllApprovals ? "Show Less" : "View All"}

                            <i
                                className={`bi ${showAllApprovals
                                    ? "bi-chevron-up"
                                    : "bi-arrow-right"
                                    }`}
                            ></i>
                        </button>

                    </div>

                    <div className="admin-overview-table-wrapper table-responsive">

                        {getVisibleItems(
                            pendingApprovals,
                            showAllApprovals
                        ).length > 0 ? (

                            <table className="admin-overview-table table table-hover align-middle mb-0">

                                <thead>
                                    <tr>
                                        <th>Provider</th>
                                        <th>Service</th>
                                        <th>Location</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {getVisibleItems(
                                        pendingApprovals,
                                        showAllApprovals
                                    ).map((provider, index) => (
                                        <tr key={provider.id || index}>
                                            <td>{provider.name}</td>
                                            <td>{provider.service}</td>
                                            <td>{provider.location}</td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-success rounded-pill"
                                                >
                                                    Review
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>

                            </table>

                        ) : (

                            <div className="admin-overview-empty">

                                <div className="admin-empty-icon">
                                    <i className="bi bi-person-check"></i>
                                </div>

                                <strong>No pending approvals</strong>

                                <span>
                                    Provider approval requests will appear
                                    here.
                                </span>

                            </div>

                        )}

                    </div>

                </section>

                {/* =================================================
                            SYSTEM ANNOUNCEMENT
                ================================================== */}

                <section className="admin-overview-card card col-12 col-lg-6">

                    <div className="admin-overview-card-header">

                        <div className="admin-overview-heading">
                            <span className="admin-card-label">
                                SYSTEM
                            </span>

                            <h3>System Announcement</h3>

                            <p>
                                Important announcements and updates
                            </p>
                        </div>

                        <button
                            type="button"
                            className="btn btn-sm btn-outline-success rounded-pill"
                            onClick={() =>
                                setShowAllAnnouncements(
                                    !showAllAnnouncements
                                )
                            }
                        >
                            {showAllAnnouncements
                                ? "Show Less"
                                : "View All"}

                            <i
                                className={`bi ${showAllAnnouncements
                                    ? "bi-chevron-up"
                                    : "bi-arrow-right"
                                    }`}
                            ></i>
                        </button>

                    </div>

                    <div className="admin-overview-announcements">

                        {getVisibleItems(
                            announcements,
                            showAllAnnouncements
                        ).length > 0 ? (

                            getVisibleItems(
                                announcements,
                                showAllAnnouncements
                            ).map((announcement, index) => (
                                <div
                                    className="admin-announcement-item"
                                    key={announcement.id || index}
                                >
                                    <div className="admin-announcement-icon">
                                        <i className="bi bi-megaphone-fill"></i>
                                    </div>

                                    <div>
                                        <strong>
                                            {announcement.title}
                                        </strong>

                                        <p>
                                            {announcement.message}
                                        </p>

                                        <small>
                                            {announcement.date}
                                        </small>
                                    </div>
                                </div>
                            ))

                        ) : (

                            <div className="admin-overview-empty">

                                <div className="admin-empty-icon">
                                    <i className="bi bi-megaphone"></i>
                                </div>

                                <strong>No announcements</strong>

                                <span>
                                    System announcements will appear here.
                                </span>

                            </div>

                        )}

                    </div>

                </section>

            </div>

        </div>
    );
}

export default DashboardOverview;