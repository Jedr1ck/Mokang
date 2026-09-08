import React, { useState, useMemo } from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';

import 'bootstrap-icons/font/bootstrap-icons.css';

import "./AdminDashboard.css";

function Notifications() {
    const [notifications, setNotifications] = useState([]);

    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("All");
    const [readFilter, setReadFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);

    const [selectedNotification, setSelectedNotification] =
        useState(null);
    const [showViewModal, setShowViewModal] = useState(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [notificationToDelete, setNotificationToDelete] =
        useState(null);

    const itemsPerPage = 5;

    const filteredNotifications = useMemo(() => {
        return notifications.filter((notification) => {
            const search = searchTerm.toLowerCase();

            const matchesSearch =
                String(notification.title || "")
                    .toLowerCase()
                    .includes(search) ||
                String(notification.message || "")
                    .toLowerCase()
                    .includes(search) ||
                String(notification.type || "")
                    .toLowerCase()
                    .includes(search);

            const matchesType =
                typeFilter === "All" ||
                notification.type === typeFilter;

            const matchesRead =
                readFilter === "All" ||
                (readFilter === "Read" &&
                    notification.isRead === true) ||
                (readFilter === "Unread" &&
                    notification.isRead === false);

            return (
                matchesSearch &&
                matchesType &&
                matchesRead
            );
        });
    }, [
        notifications,
        searchTerm,
        typeFilter,
        readFilter,
    ]);

    const totalPages = Math.ceil(
        filteredNotifications.length / itemsPerPage
    );

    const paginatedNotifications =
        filteredNotifications.slice(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage
        );

    const unreadCount = notifications.filter(
        (notification) => !notification.isRead
    ).length;

    const readCount = notifications.filter(
        (notification) => notification.isRead
    ).length;

    const systemCount = notifications.filter(
        (notification) => notification.type === "System"
    ).length;

    const bookingCount = notifications.filter(
        (notification) => notification.type === "Booking"
    ).length;

    const handleSearch = (value) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    const handleTypeFilter = (value) => {
        setTypeFilter(value);
        setCurrentPage(1);
    };

    const handleReadFilter = (value) => {
        setReadFilter(value);
        setCurrentPage(1);
    };

    const handleView = (notification) => {
        setSelectedNotification(notification);
        setShowViewModal(true);

        if (!notification.isRead) {
            setNotifications((previousNotifications) =>
                previousNotifications.map((item) =>
                    item.id === notification.id
                        ? {
                            ...item,
                            isRead: true,
                        }
                        : item
                )
            );
        }
    };

    const handleMarkAsRead = (notification) => {
        setNotifications((previousNotifications) =>
            previousNotifications.map((item) =>
                item.id === notification.id
                    ? {
                        ...item,
                        isRead: true,
                    }
                    : item
            )
        );
    };

    const handleMarkAsUnread = (notification) => {
        setNotifications((previousNotifications) =>
            previousNotifications.map((item) =>
                item.id === notification.id
                    ? {
                        ...item,
                        isRead: false,
                    }
                    : item
            )
        );
    };

    const handleMarkAllAsRead = () => {
        setNotifications((previousNotifications) =>
            previousNotifications.map((notification) => ({
                ...notification,
                isRead: true,
            }))
        );
    };

    const openDeleteModal = (notification) => {
        setNotificationToDelete(notification);
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setNotificationToDelete(null);
        setShowDeleteModal(false);
    };

    const handleDelete = () => {
        if (!notificationToDelete) {
            return;
        }

        setNotifications((previousNotifications) =>
            previousNotifications.filter(
                (notification) =>
                    notification.id !==
                    notificationToDelete.id
            )
        );

        closeDeleteModal();

        if (
            currentPage > 1 &&
            paginatedNotifications.length === 1
        ) {
            setCurrentPage((page) =>
                Math.max(page - 1, 1)
            );
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case "Booking":
                return "bi-calendar-check-fill";

            case "Provider":
                return "bi-person-badge-fill";

            case "User":
                return "bi-person-fill";

            case "System":
                return "bi-megaphone-fill";

            case "Complaint":
                return "bi-exclamation-circle-fill";

            case "Review":
                return "bi-star-fill";

            default:
                return "bi-bell-fill";
        }
    };

    const getTypeClass = (type) => {
        switch (type) {
            case "Booking":
                return "notification-type-booking";

            case "Provider":
                return "notification-type-provider";

            case "User":
                return "notification-type-user";

            case "Complaint":
                return "notification-type-complaint";

            default:
                return "notification-type-system";
        }
    };

    const getShowingText = () => {
        if (filteredNotifications.length === 0) {
            return "Showing 0 to 0 of 0";
        }

        const start =
            (currentPage - 1) * itemsPerPage + 1;

        const end = Math.min(
            currentPage * itemsPerPage,
            filteredNotifications.length
        );

        return `Showing ${start} to ${end} of ${filteredNotifications.length}`;
    };

    return (
        <div className="admin-management-page">

            {/* PAGE HEADER */}
            <div className="admin-management-header">

                <div>
                    <h2>Notifications</h2>

                    <p>
                        Monitor system notifications and important
                        platform activities.
                    </p>
                </div>

                <button
                    type="button"
                    className="admin-add-button"
                    onClick={handleMarkAllAsRead}
                    disabled={unreadCount === 0}
                >
                    <i className="bi bi-check2-all"></i>
                    Mark All as Read
                </button>

            </div>

            {/* SUMMARY */}
            <div className="admin-management-summary">

                <div className="admin-management-summary-card">

                    <div className="admin-summary-icon">
                        <i className="bi bi-bell-fill"></i>
                    </div>

                    <div>
                        <span>Total Notifications</span>
                        <strong>
                            {notifications.length}
                        </strong>
                    </div>

                </div>

                <div className="admin-management-summary-card">

                    <div className="admin-summary-icon">
                        <i className="bi bi-envelope-fill"></i>
                    </div>

                    <div>
                        <span>Unread</span>
                        <strong>
                            {unreadCount}
                        </strong>
                    </div>

                </div>

                <div className="admin-management-summary-card">

                    <div className="admin-summary-icon">
                        <i className="bi bi-envelope-open-fill"></i>
                    </div>

                    <div>
                        <span>Read</span>
                        <strong>
                            {readCount}
                        </strong>
                    </div>

                </div>

                <div className="admin-management-summary-card">

                    <div className="admin-summary-icon">
                        <i className="bi bi-megaphone-fill"></i>
                    </div>

                    <div>
                        <span>System</span>
                        <strong>
                            {systemCount}
                        </strong>
                    </div>

                </div>

            </div>

            {/* FILTERS */}
            <div className="admin-management-toolbar">

                <div className="admin-search-box">

                    <i className="bi bi-search"></i>

                    <input
                        type="text"
                        placeholder="Search notifications..."
                        value={searchTerm}
                        onChange={(event) =>
                            handleSearch(
                                event.target.value
                            )
                        }
                    />

                </div>

                <div className="admin-filter-group">

                    <label htmlFor="notification-type-filter">
                        Type
                    </label>

                    <select
                        id="notification-type-filter"
                        value={typeFilter}
                        onChange={(event) =>
                            handleTypeFilter(
                                event.target.value
                            )
                        }
                    >
                        <option value="All">
                            All Types
                        </option>

                        <option value="System">
                            System
                        </option>

                        <option value="Booking">
                            Booking
                        </option>

                        <option value="Provider">
                            Provider
                        </option>

                        <option value="User">
                            User
                        </option>

                        <option value="Complaint">
                            Complaint
                        </option>

                        <option value="Review">
                            Review
                        </option>
                    </select>

                </div>

                <div className="admin-filter-group">

                    <label htmlFor="notification-read-filter">
                        Status
                    </label>

                    <select
                        id="notification-read-filter"
                        value={readFilter}
                        onChange={(event) =>
                            handleReadFilter(
                                event.target.value
                            )
                        }
                    >
                        <option value="All">
                            All
                        </option>

                        <option value="Unread">
                            Unread
                        </option>

                        <option value="Read">
                            Read
                        </option>
                    </select>

                </div>

            </div>

            {/* NOTIFICATION TABLE */}
            <div className="admin-table-card">

                <div className="admin-table-header">

                    <div>
                        <h3>System Notifications</h3>

                        <p>
                            Important updates and activities
                            from the SmartHome platform.
                        </p>
                    </div>

                    <div className="admin-table-count">
                        {filteredNotifications.length} notification
                        {filteredNotifications.length !== 1
                            ? "s"
                            : ""}
                    </div>

                </div>

                <div className="admin-table-wrapper">

                    <table className="admin-management-table">

                        <thead>
                            <tr>
                                <th>Notification</th>
                                <th>Type</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>

                            {paginatedNotifications.length >
                                0 ? (

                                paginatedNotifications.map(
                                    (notification) => (
                                        <tr
                                            key={
                                                notification.id
                                            }
                                            className={
                                                !notification.isRead
                                                    ? "notification-unread-row"
                                                    : ""
                                            }
                                        >

                                            <td>
                                                <div className="admin-category-name">

                                                    <div
                                                        className={`admin-category-icon ${getTypeClass(
                                                            notification.type
                                                        )}`}
                                                    >
                                                        <i
                                                            className={`bi ${getNotificationIcon(
                                                                notification.type
                                                            )}`}
                                                        ></i>
                                                    </div>

                                                    <div>
                                                        <strong>
                                                            {notification.title ||
                                                                "—"}
                                                        </strong>

                                                        <small>
                                                            {notification.message ||
                                                                "No message"}
                                                        </small>
                                                    </div>

                                                </div>
                                            </td>

                                            <td>
                                                {notification.type ||
                                                    "—"}
                                            </td>

                                            <td>
                                                {notification.date ||
                                                    "—"}
                                            </td>

                                            <td>

                                                <span
                                                    className={`admin-status-badge ${notification.isRead
                                                        ? "status-completed"
                                                        : "status-pending"
                                                        }`}
                                                >
                                                    {notification.isRead
                                                        ? "Read"
                                                        : "Unread"}
                                                </span>

                                            </td>

                                            <td>

                                                <div className="admin-action-buttons">

                                                    <button
                                                        type="button"
                                                        className="admin-action-button view"
                                                        title="View Notification"
                                                        onClick={() =>
                                                            handleView(
                                                                notification
                                                            )
                                                        }
                                                    >
                                                        <i className="bi bi-eye"></i>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="admin-action-button edit"
                                                        title={
                                                            notification.isRead
                                                                ? "Mark as Unread"
                                                                : "Mark as Read"
                                                        }
                                                        onClick={() =>
                                                            notification.isRead
                                                                ? handleMarkAsUnread(
                                                                    notification
                                                                )
                                                                : handleMarkAsRead(
                                                                    notification
                                                                )
                                                        }
                                                    >
                                                        <i
                                                            className={`bi ${notification.isRead
                                                                ? "bi-envelope"
                                                                : "bi-envelope-open"
                                                                }`}
                                                        ></i>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="admin-action-button delete"
                                                        title="Delete Notification"
                                                        onClick={() =>
                                                            openDeleteModal(
                                                                notification
                                                            )
                                                        }
                                                    >
                                                        <i className="bi bi-trash3"></i>
                                                    </button>

                                                </div>

                                            </td>

                                        </tr>
                                    )
                                )

                            ) : (

                                <tr>

                                    <td
                                        colSpan="5"
                                        className="admin-table-empty"
                                    >

                                        <div className="admin-empty-state">

                                            <i className="bi bi-bell-slash"></i>

                                            <p>
                                                No notifications
                                                found
                                            </p>

                                            <span>
                                                Notifications will
                                                appear here once
                                                system activity is
                                                available.
                                            </span>

                                        </div>

                                    </td>

                                </tr>

                            )}

                        </tbody>

                    </table>

                </div>

                {/* PAGINATION */}
                <div className="admin-pagination">

                    <span>
                        {getShowingText()}
                    </span>

                    <div className="admin-pagination-buttons">

                        <button
                            type="button"
                            disabled={
                                currentPage === 1
                            }
                            onClick={() =>
                                setCurrentPage(
                                    (page) =>
                                        Math.max(
                                            page - 1,
                                            1
                                        )
                                )
                            }
                        >
                            <i className="bi bi-chevron-left"></i>
                        </button>

                        {totalPages > 0 &&
                            Array.from(
                                {
                                    length: totalPages,
                                },
                                (_, index) =>
                                    index + 1
                            ).map((page) => (
                                <button
                                    type="button"
                                    key={page}
                                    className={
                                        currentPage ===
                                            page
                                            ? "active"
                                            : ""
                                    }
                                    onClick={() =>
                                        setCurrentPage(
                                            page
                                        )
                                    }
                                >
                                    {page}
                                </button>
                            ))}

                        <button
                            type="button"
                            disabled={
                                totalPages === 0 ||
                                currentPage ===
                                totalPages
                            }
                            onClick={() =>
                                setCurrentPage(
                                    (page) =>
                                        Math.min(
                                            page + 1,
                                            totalPages
                                        )
                                )
                            }
                        >
                            <i className="bi bi-chevron-right"></i>
                        </button>

                    </div>

                </div>

            </div>

            {/* VIEW MODAL */}
            {showViewModal &&
                selectedNotification && (
                    <div
                        className="admin-modal-overlay"
                        onClick={() =>
                            setShowViewModal(false)
                        }
                    >

                        <div
                            className="admin-modal"
                            onClick={(event) =>
                                event.stopPropagation()
                            }
                        >

                            <div className="admin-modal-header">

                                <div>
                                    <span>
                                        NOTIFICATION DETAILS
                                    </span>

                                    <h3>
                                        {selectedNotification.title ||
                                            "Notification"}
                                    </h3>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowViewModal(
                                            false
                                        )
                                    }
                                >
                                    <i className="bi bi-x-lg"></i>
                                </button>

                            </div>

                            <div className="admin-modal-body">

                                <div className="admin-detail-grid">

                                    <div className="admin-detail-item">
                                        <span>
                                            Notification ID
                                        </span>

                                        <strong>
                                            {selectedNotification.id ||
                                                "—"}
                                        </strong>
                                    </div>

                                    <div className="admin-detail-item">
                                        <span>
                                            Type
                                        </span>

                                        <strong>
                                            {selectedNotification.type ||
                                                "—"}
                                        </strong>
                                    </div>

                                    <div className="admin-detail-item">
                                        <span>
                                            Date
                                        </span>

                                        <strong>
                                            {selectedNotification.date ||
                                                "—"}
                                        </strong>
                                    </div>

                                    <div className="admin-detail-item">
                                        <span>
                                            Status
                                        </span>

                                        <strong>
                                            {selectedNotification.isRead
                                                ? "Read"
                                                : "Unread"}
                                        </strong>
                                    </div>

                                    <div className="admin-detail-item full">

                                        <span>
                                            Message
                                        </span>

                                        <strong>
                                            {selectedNotification.message ||
                                                "—"}
                                        </strong>

                                    </div>

                                </div>

                            </div>

                            <div className="admin-modal-footer">

                                <button
                                    type="button"
                                    className="admin-modal-secondary-button"
                                    onClick={() =>
                                        setShowViewModal(
                                            false
                                        )
                                    }
                                >
                                    Close
                                </button>

                            </div>

                        </div>

                    </div>
                )}

            {/* DELETE MODAL */}
            {showDeleteModal &&
                notificationToDelete && (
                    <div
                        className="admin-modal-overlay"
                        onClick={closeDeleteModal}
                    >

                        <div
                            className="admin-modal admin-small-modal"
                            onClick={(event) =>
                                event.stopPropagation()
                            }
                        >

                            <div className="admin-modal-header">

                                <div>
                                    <span>
                                        DELETE NOTIFICATION
                                    </span>

                                    <h3>
                                        Confirm Deletion
                                    </h3>
                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        closeDeleteModal
                                    }
                                >
                                    <i className="bi bi-x-lg"></i>
                                </button>

                            </div>

                            <div className="admin-modal-body">

                                <div className="admin-confirm-icon">
                                    <i className="bi bi-trash3"></i>
                                </div>

                                <p className="admin-modal-message">
                                    Are you sure you want to
                                    delete this notification?
                                </p>

                                <span className="admin-modal-warning">
                                    This action cannot be
                                    undone.
                                </span>

                            </div>

                            <div className="admin-modal-footer">

                                <button
                                    type="button"
                                    className="admin-modal-secondary-button"
                                    onClick={
                                        closeDeleteModal
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    className="admin-modal-danger-button"
                                    onClick={handleDelete}
                                >
                                    Delete
                                </button>

                            </div>

                        </div>

                    </div>
                )}

        </div>
    );
}

export default Notifications;