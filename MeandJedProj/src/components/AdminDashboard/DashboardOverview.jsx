import React, { useState, useMemo } from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';

import 'bootstrap-icons/font/bootstrap-icons.css';

import "./AdminDashboard.css";

function DashboardOverview() {
    const [showAllBookings, setShowAllBookings] = useState(false);
    const [showAllCustomers, setShowAllCustomers] = useState(false);
    const [showAllApprovals, setShowAllApprovals] = useState(false);
    const [showAllAnnouncements, setShowAllAnnouncements] = useState(false);

    // =====================================================
    // TEMPORARY DATA
    // =====================================================
    // These will later be replaced with backend data.

    const summaryData = [
        {
            title: "Total Homeowners",
            value: "0",
            description: "Registered customers",
            icon: "bi-people-fill",
        },
        {
            title: "Total Service Providers",
            value: "0",
            description: "Registered providers",
            icon: "bi-person-badge-fill",
        },
        {
            title: "Total Bookings",
            value: "0",
            description: "All service bookings",
            icon: "bi-calendar-check-fill",
        },
        {
            title: "Pending Approvals",
            value: "0",
            description: "Requires admin action",
            icon: "bi-hourglass-split",
        },
    ];

    const recentBookings = [];

    const newCustomers = [];

    const pendingApprovals = [];

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
        <div className="admin-overview">

            {/* =================================================
                        PAGE INTRO
            ================================================== */}

            <div className="admin-overview-intro">
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

                <div className="admin-overview-date">
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

            <div className="admin-overview-summary-grid">

                {summaryData.map((item) => (
                    <div
                        className="admin-overview-summary-card"
                        key={item.title}
                    >
                        <div className="admin-overview-summary-icon">
                            <i className={`bi ${item.icon}`}></i>
                        </div>

                        <div className="admin-overview-summary-info">
                            <span>{item.title}</span>

                            <strong>{item.value}</strong>

                            <small>{item.description}</small>
                        </div>
                    </div>
                ))}

            </div>

            {/* =================================================
                        MONITORING SECTIONS
            ================================================== */}

            <div className="admin-overview-grid">

                {/* =================================================
                            RECENT BOOKINGS
                ================================================== */}

                <section className="admin-overview-card">

                    <div className="admin-overview-card-header">

                        <div>
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

                    <div className="admin-overview-table-wrapper">

                        {getVisibleItems(
                            recentBookings,
                            showAllBookings
                        ).length > 0 ? (

                            <table className="admin-overview-table">

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
                                                <span
                                                    className={`admin-status ${booking.status
                                                            ?.toLowerCase()
                                                        }`}
                                                >
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

                <section className="admin-overview-card">

                    <div className="admin-overview-card-header">

                        <div>
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

                    <div className="admin-overview-table-wrapper">

                        {getVisibleItems(
                            newCustomers,
                            showAllCustomers
                        ).length > 0 ? (

                            <table className="admin-overview-table">

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
                                                <span className="admin-status active">
                                                    Active
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

                <section className="admin-overview-card">

                    <div className="admin-overview-card-header">

                        <div>
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

                    <div className="admin-overview-table-wrapper">

                        {getVisibleItems(
                            pendingApprovals,
                            showAllApprovals
                        ).length > 0 ? (

                            <table className="admin-overview-table">

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
                                                    className="admin-review-button"
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

                <section className="admin-overview-card">

                    <div className="admin-overview-card-header">

                        <div>
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