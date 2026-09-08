import React, { useState, useMemo } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./AdminDashboard.css";

function ReviewsComplaints() {
    const [feedback, setFeedback] = useState([]);

    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);

    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);

    const [showStatusModal, setShowStatusModal] = useState(false);
    const [feedbackForStatus, setFeedbackForStatus] = useState(null);
    const [newStatus, setNewStatus] = useState("");

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [feedbackToDelete, setFeedbackToDelete] = useState(null);

    const itemsPerPage = 5;

    const filteredFeedback = useMemo(() => {
        return feedback.filter((item) => {
            const search = searchTerm.toLowerCase();

            const matchesSearch =
                String(item.id || "")
                    .toLowerCase()
                    .includes(search) ||
                String(item.homeownerName || "")
                    .toLowerCase()
                    .includes(search) ||
                String(item.providerName || "")
                    .toLowerCase()
                    .includes(search) ||
                String(item.service || "")
                    .toLowerCase()
                    .includes(search) ||
                String(item.message || "")
                    .toLowerCase()
                    .includes(search);

            const matchesType =
                typeFilter === "All" ||
                item.type === typeFilter;

            const matchesStatus =
                statusFilter === "All" ||
                item.status === statusFilter;

            return (
                matchesSearch &&
                matchesType &&
                matchesStatus
            );
        });
    }, [
        feedback,
        searchTerm,
        typeFilter,
        statusFilter,
    ]);

    const totalPages = Math.ceil(
        filteredFeedback.length / itemsPerPage
    );

    const paginatedFeedback = filteredFeedback.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const reviewCount = feedback.filter(
        (item) => item.type === "Review"
    ).length;

    const complaintCount = feedback.filter(
        (item) => item.type === "Complaint"
    ).length;

    const pendingCount = feedback.filter(
        (item) => item.status === "Pending"
    ).length;

    const resolvedCount = feedback.filter(
        (item) => item.status === "Resolved"
    ).length;

    const handleSearch = (value) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    const handleTypeFilter = (value) => {
        setTypeFilter(value);
        setCurrentPage(1);
    };

    const handleStatusFilter = (value) => {
        setStatusFilter(value);
        setCurrentPage(1);
    };

    const handleView = (item) => {
        setSelectedFeedback(item);
        setShowViewModal(true);
    };

    const closeViewModal = () => {
        setSelectedFeedback(null);
        setShowViewModal(false);
    };

    const openStatusModal = (item) => {
        setFeedbackForStatus(item);
        setNewStatus(item.status || "Pending");
        setShowStatusModal(true);
    };

    const closeStatusModal = () => {
        setShowStatusModal(false);
        setFeedbackForStatus(null);
        setNewStatus("");
    };

    const handleStatusUpdate = () => {
        if (!feedbackForStatus || !newStatus) {
            return;
        }

        setFeedback((previousFeedback) =>
            previousFeedback.map((item) =>
                item.id === feedbackForStatus.id
                    ? {
                        ...item,
                        status: newStatus,
                    }
                    : item
            )
        );

        closeStatusModal();
    };

    const openDeleteModal = (item) => {
        setFeedbackToDelete(item);
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setFeedbackToDelete(null);
        setShowDeleteModal(false);
    };

    const handleDelete = () => {
        if (!feedbackToDelete) {
            return;
        }

        setFeedback((previousFeedback) =>
            previousFeedback.filter(
                (item) => item.id !== feedbackToDelete.id
            )
        );

        closeDeleteModal();

        if (
            currentPage > 1 &&
            paginatedFeedback.length === 1
        ) {
            setCurrentPage((page) =>
                Math.max(page - 1, 1)
            );
        }
    };

    const getTypeClass = (type) => {
        if (type === "Complaint") {
            return "feedback-type-complaint";
        }

        return "feedback-type-review";
    };

    const getStatusClass = (status) => {
        switch (status) {
            case "Pending":
                return "status-pending";

            case "Resolved":
                return "status-completed";

            case "Under Review":
                return "status-progress";

            case "Rejected":
                return "status-rejected";

            default:
                return "status-default";
        }
    };

    const getRatingStars = (rating) => {
        if (!rating) {
            return "—";
        }

        return (
            <div className="reviews-rating">
                {Array.from(
                    { length: 5 },
                    (_, index) => (
                        <i
                            key={index}
                            className={
                                index < Number(rating)
                                    ? "bi bi-star-fill"
                                    : "bi bi-star"
                            }
                        ></i>
                    )
                )}
            </div>
        );
    };

    const getShowingText = () => {
        if (filteredFeedback.length === 0) {
            return "Showing 0 to 0 of 0";
        }

        const start =
            (currentPage - 1) * itemsPerPage + 1;

        const end = Math.min(
            currentPage * itemsPerPage,
            filteredFeedback.length
        );

        return `Showing ${start} to ${end} of ${filteredFeedback.length}`;
    };

    return (
        <div className="reviews-complaints-page">

            {/* HEADER */}
            <div className="reviews-page-header">
                <div>
                    <span className="reviews-section-label">
                        FEEDBACK MANAGEMENT
                    </span>

                    <h2>Reviews and Complaints</h2>

                    <p>
                        Monitor homeowner feedback, reviews,
                        and service-related complaints.
                    </p>
                </div>
            </div>

            {/* SUMMARY */}
            <div className="reviews-summary-grid">

                <div className="reviews-summary-card">
                    <div className="reviews-summary-icon green">
                        <i className="bi bi-chat-square-text-fill"></i>
                    </div>

                    <div>
                        <span>Total Feedback</span>
                        <strong>{feedback.length}</strong>
                    </div>
                </div>

                <div className="reviews-summary-card">
                    <div className="reviews-summary-icon orange">
                        <i className="bi bi-star-fill"></i>
                    </div>

                    <div>
                        <span>Reviews</span>
                        <strong>{reviewCount}</strong>
                    </div>
                </div>

                <div className="reviews-summary-card">
                    <div className="reviews-summary-icon red">
                        <i className="bi bi-exclamation-circle-fill"></i>
                    </div>

                    <div>
                        <span>Complaints</span>
                        <strong>{complaintCount}</strong>
                    </div>
                </div>

                <div className="reviews-summary-card">
                    <div className="reviews-summary-icon gray">
                        <i className="bi bi-hourglass-split"></i>
                    </div>

                    <div>
                        <span>Pending</span>
                        <strong>{pendingCount}</strong>
                    </div>
                </div>

            </div>

            {/* FILTERS */}
            <div className="reviews-filter-card">

                <div className="reviews-search-box">
                    <i className="bi bi-search"></i>

                    <input
                        type="text"
                        placeholder="Search feedback, homeowner, provider, or service..."
                        value={searchTerm}
                        onChange={(event) =>
                            handleSearch(event.target.value)
                        }
                    />
                </div>

                <div className="reviews-filter-box">
                    <label htmlFor="feedback-type-filter">
                        Type
                    </label>

                    <select
                        id="feedback-type-filter"
                        value={typeFilter}
                        onChange={(event) =>
                            handleTypeFilter(event.target.value)
                        }
                    >
                        <option value="All">
                            All Types
                        </option>

                        <option value="Review">
                            Reviews
                        </option>

                        <option value="Complaint">
                            Complaints
                        </option>
                    </select>
                </div>

                <div className="reviews-filter-box">
                    <label htmlFor="feedback-status-filter">
                        Status
                    </label>

                    <select
                        id="feedback-status-filter"
                        value={statusFilter}
                        onChange={(event) =>
                            handleStatusFilter(event.target.value)
                        }
                    >
                        <option value="All">
                            All Status
                        </option>

                        <option value="Pending">
                            Pending
                        </option>

                        <option value="Under Review">
                            Under Review
                        </option>

                        <option value="Resolved">
                            Resolved
                        </option>

                        <option value="Rejected">
                            Rejected
                        </option>
                    </select>
                </div>

            </div>

            {/* TABLE */}
            <div className="reviews-table-card">

                <div className="reviews-table-header">

                    <div>
                        <h3>Customer Feedback</h3>

                        <p>
                            Review feedback and handle complaints
                            submitted by homeowners.
                        </p>
                    </div>

                    <div className="reviews-table-count">
                        {filteredFeedback.length}{" "}
                        {filteredFeedback.length === 1
                            ? "item"
                            : "items"}
                    </div>

                </div>

                <div className="reviews-table-wrapper">

                    <table className="reviews-table">

                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Homeowner</th>
                                <th>Provider</th>
                                <th>Service</th>
                                <th>Type</th>
                                <th>Rating</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>

                            {paginatedFeedback.length > 0 ? (
                                paginatedFeedback.map((item) => (
                                    <tr key={item.id}>

                                        <td>
                                            <strong className="feedback-id">
                                                {item.id}
                                            </strong>
                                        </td>

                                        <td>
                                            <span className="feedback-person">
                                                {item.homeownerName || "—"}
                                            </span>
                                        </td>

                                        <td>
                                            <span className="feedback-person">
                                                {item.providerName || "—"}
                                            </span>
                                        </td>

                                        <td>
                                            <span className="feedback-service">
                                                {item.service || "—"}
                                            </span>
                                        </td>

                                        <td>
                                            <span
                                                className={`feedback-type ${getTypeClass(
                                                    item.type
                                                )}`}
                                            >
                                                <i
                                                    className={`bi ${item.type ===
                                                        "Complaint"
                                                        ? "bi-exclamation-circle"
                                                        : "bi-star-fill"
                                                        }`}
                                                ></i>

                                                {item.type || "—"}
                                            </span>
                                        </td>

                                        <td>
                                            {item.type === "Review"
                                                ? getRatingStars(
                                                    item.rating
                                                )
                                                : "—"}
                                        </td>

                                        <td>
                                            <span className="feedback-date">
                                                {item.date || "—"}
                                            </span>
                                        </td>

                                        <td>
                                            <span
                                                className={`feedback-status ${getStatusClass(
                                                    item.status
                                                )}`}
                                            >
                                                <span className="feedback-status-dot"></span>
                                                {item.status ||
                                                    "Pending"}
                                            </span>
                                        </td>

                                        <td>
                                            <div className="reviews-action-buttons">

                                                <button
                                                    type="button"
                                                    className="reviews-action-button view"
                                                    title="View Details"
                                                    onClick={() =>
                                                        handleView(item)
                                                    }
                                                >
                                                    <i className="bi bi-eye"></i>
                                                </button>

                                                <button
                                                    type="button"
                                                    className="reviews-action-button edit"
                                                    title="Update Status"
                                                    onClick={() =>
                                                        openStatusModal(
                                                            item
                                                        )
                                                    }
                                                >
                                                    <i className="bi bi-pencil"></i>
                                                </button>

                                                <button
                                                    type="button"
                                                    className="reviews-action-button delete"
                                                    title="Delete"
                                                    onClick={() =>
                                                        openDeleteModal(
                                                            item
                                                        )
                                                    }
                                                >
                                                    <i className="bi bi-trash3"></i>
                                                </button>

                                            </div>
                                        </td>

                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan="9"
                                        className="reviews-table-empty"
                                    >
                                        <div className="reviews-empty-state">

                                            <div className="reviews-empty-icon">
                                                <i className="bi bi-chat-square-text"></i>
                                            </div>

                                            <h4>
                                                No reviews or complaints found
                                            </h4>

                                            <p>
                                                Customer feedback will appear
                                                here once data is available.
                                            </p>

                                        </div>
                                    </td>
                                </tr>
                            )}

                        </tbody>

                    </table>

                </div>

                {/* PAGINATION */}
                <div className="reviews-pagination">

                    <span>
                        {getShowingText()}
                    </span>

                    <div className="reviews-pagination-buttons">

                        <button
                            type="button"
                            disabled={currentPage === 1}
                            onClick={() =>
                                setCurrentPage((page) =>
                                    Math.max(page - 1, 1)
                                )
                            }
                        >
                            <i className="bi bi-chevron-left"></i>
                        </button>

                        {totalPages > 0 &&
                            Array.from(
                                { length: totalPages },
                                (_, index) => index + 1
                            ).map((page) => (
                                <button
                                    type="button"
                                    key={page}
                                    className={
                                        currentPage === page
                                            ? "active"
                                            : ""
                                    }
                                    onClick={() =>
                                        setCurrentPage(page)
                                    }
                                >
                                    {page}
                                </button>
                            ))}

                        <button
                            type="button"
                            disabled={
                                totalPages === 0 ||
                                currentPage === totalPages
                            }
                            onClick={() =>
                                setCurrentPage((page) =>
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
            {showViewModal && selectedFeedback && (
                <div
                    className="reviews-modal-overlay"
                    onClick={closeViewModal}
                >
                    <div
                        className="reviews-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <div className="reviews-modal-header">

                            <div>
                                <span>FEEDBACK DETAILS</span>

                                <h3>
                                    {selectedFeedback.id}
                                </h3>
                            </div>

                            <button
                                type="button"
                                onClick={closeViewModal}
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>

                        </div>

                        <div className="reviews-modal-body">

                            <div className="reviews-detail-grid">

                                <div className="reviews-detail-item">
                                    <span>Homeowner</span>
                                    <strong>
                                        {selectedFeedback.homeownerName ||
                                            "—"}
                                    </strong>
                                </div>

                                <div className="reviews-detail-item">
                                    <span>Homeowner Contact</span>
                                    <strong>
                                        {selectedFeedback.homeownerContact ||
                                            "—"}
                                    </strong>
                                </div>

                                <div className="reviews-detail-item">
                                    <span>Service Provider</span>
                                    <strong>
                                        {selectedFeedback.providerName ||
                                            "—"}
                                    </strong>
                                </div>

                                <div className="reviews-detail-item">
                                    <span>Provider Contact</span>
                                    <strong>
                                        {selectedFeedback.providerContact ||
                                            "—"}
                                    </strong>
                                </div>

                                <div className="reviews-detail-item">
                                    <span>Service</span>
                                    <strong>
                                        {selectedFeedback.service ||
                                            "—"}
                                    </strong>
                                </div>

                                <div className="reviews-detail-item">
                                    <span>Type</span>
                                    <strong>
                                        {selectedFeedback.type ||
                                            "—"}
                                    </strong>
                                </div>

                                <div className="reviews-detail-item">
                                    <span>Rating</span>
                                    <strong>
                                        {selectedFeedback.rating
                                            ? `${selectedFeedback.rating}/5`
                                            : "—"}
                                    </strong>
                                </div>

                                <div className="reviews-detail-item">
                                    <span>Date</span>
                                    <strong>
                                        {selectedFeedback.date ||
                                            "—"}
                                    </strong>
                                </div>

                                <div className="reviews-detail-item">
                                    <span>Status</span>
                                    <strong>
                                        {selectedFeedback.status ||
                                            "Pending"}
                                    </strong>
                                </div>

                                <div className="reviews-detail-item full">
                                    <span>Subject</span>
                                    <strong>
                                        {selectedFeedback.subject ||
                                            "—"}
                                    </strong>
                                </div>

                                <div className="reviews-detail-item full">
                                    <span>Message</span>
                                    <strong className="reviews-message">
                                        {selectedFeedback.message ||
                                            "—"}
                                    </strong>
                                </div>

                            </div>

                        </div>

                        <div className="reviews-modal-footer">

                            <button
                                type="button"
                                className="reviews-modal-cancel"
                                onClick={closeViewModal}
                            >
                                Close
                            </button>

                        </div>

                    </div>
                </div>
            )}

            {/* STATUS MODAL */}
            {showStatusModal && feedbackForStatus && (
                <div
                    className="reviews-modal-overlay"
                    onClick={closeStatusModal}
                >
                    <div
                        className="reviews-modal reviews-small-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <div className="reviews-modal-header">

                            <div>
                                <span>FEEDBACK STATUS</span>

                                <h3>
                                    Update Status
                                </h3>
                            </div>

                            <button
                                type="button"
                                onClick={closeStatusModal}
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>

                        </div>

                        <div className="reviews-modal-body">

                            <p className="reviews-modal-message">
                                Update the status of{" "}
                                <strong>
                                    {feedbackForStatus.id}
                                </strong>
                                .
                            </p>

                            <div className="reviews-form-group">

                                <label htmlFor="feedback-new-status">
                                    Status
                                </label>

                                <select
                                    id="feedback-new-status"
                                    value={newStatus}
                                    onChange={(event) =>
                                        setNewStatus(
                                            event.target.value
                                        )
                                    }
                                >
                                    <option value="Pending">
                                        Pending
                                    </option>

                                    <option value="Under Review">
                                        Under Review
                                    </option>

                                    <option value="Resolved">
                                        Resolved
                                    </option>

                                    <option value="Rejected">
                                        Rejected
                                    </option>
                                </select>

                            </div>

                        </div>

                        <div className="reviews-modal-footer">

                            <button
                                type="button"
                                className="reviews-modal-cancel"
                                onClick={closeStatusModal}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="reviews-modal-primary"
                                onClick={handleStatusUpdate}
                            >
                                <i className="bi bi-check-lg"></i>
                                Update Status
                            </button>

                        </div>

                    </div>
                </div>
            )}

            {/* DELETE MODAL */}
            {showDeleteModal && feedbackToDelete && (
                <div
                    className="reviews-modal-overlay"
                    onClick={closeDeleteModal}
                >
                    <div
                        className="reviews-modal reviews-small-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <div className="reviews-modal-header">

                            <div>
                                <span>DELETE FEEDBACK</span>

                                <h3>
                                    Confirm Deletion
                                </h3>
                            </div>

                            <button
                                type="button"
                                onClick={closeDeleteModal}
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>

                        </div>

                        <div className="reviews-delete-body">

                            <div className="reviews-delete-icon">
                                <i className="bi bi-trash3"></i>
                            </div>

                            <h4>
                                Delete this feedback?
                            </h4>

                            <p>
                                Are you sure you want to delete feedback{" "}
                                <strong>
                                    {feedbackToDelete.id}
                                </strong>
                                ?
                            </p>

                            <span>
                                This action cannot be undone.
                            </span>

                        </div>

                        <div className="reviews-modal-footer">

                            <button
                                type="button"
                                className="reviews-modal-cancel"
                                onClick={closeDeleteModal}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="reviews-modal-delete"
                                onClick={handleDelete}
                            >
                                <i className="bi bi-trash3"></i>
                                Delete
                            </button>

                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}

export default ReviewsComplaints;