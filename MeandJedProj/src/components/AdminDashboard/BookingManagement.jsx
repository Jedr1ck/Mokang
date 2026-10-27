import { useEffect, useMemo, useState } from "react";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import "./AdminDashboard.css";
import { api } from "../../services/api";


function BookingManagement() {

    /* =========================================================
       BOOKING DATA
       Backend-ready
    ========================================================= */

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [actionError, setActionError] = useState("");


    /* =========================================================
       FILTERS
    ========================================================= */

    const [searchTerm, setSearchTerm] =
        useState("");

    const [statusFilter, setStatusFilter] =
        useState("All");

    const [currentPage, setCurrentPage] =
        useState(1);


    /* =========================================================
       VIEW MODAL
    ========================================================= */

    const [selectedBooking, setSelectedBooking] =
        useState(null);

    const [showViewModal, setShowViewModal] =
        useState(false);


    /* =========================================================
       STATUS MODAL
    ========================================================= */

    const [showStatusModal, setShowStatusModal] =
        useState(false);

    const [bookingForStatusChange, setBookingForStatusChange] =
        useState(null);

    const [newStatus, setNewStatus] =
        useState("");


    const itemsPerPage = 5;

    const normalizeBooking = (booking) => ({
        bookingId: booking.bookingCode || `REQ-${booking.id}`,
        id: booking.id,
        homeownerName: booking.customerName,
        homeownerContact: booking.customerPhone,
        providerName: booking.providerName,
        service: booking.category,
        date: booking.preferredDate,
        time: booking.preferredTime,
        location: booking.address,
        notes: booking.description,
        status: booking.status,
    });

    useEffect(() => {
        let active = true;
        api("/admin/bookings")
            .then((items) => {
                if (active) setBookings(items.map(normalizeBooking));
            })
            .catch((error) => {
                if (active) setLoadError(error.message || "Unable to load bookings.");
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, []);


    /* =========================================================
       FILTER BOOKINGS
    ========================================================= */

    const filteredBookings = useMemo(() => {

        const search =
            searchTerm
                .toLowerCase()
                .trim();

        return bookings.filter((booking) => {

            const matchesSearch =
                String(
                    booking.bookingId || ""
                )
                    .toLowerCase()
                    .includes(search)

                ||

                String(
                    booking.homeownerName || ""
                )
                    .toLowerCase()
                    .includes(search)

                ||

                String(
                    booking.providerName || ""
                )
                    .toLowerCase()
                    .includes(search)

                ||

                String(
                    booking.service || ""
                )
                    .toLowerCase()
                    .includes(search);


            const matchesStatus =
                statusFilter === "All" ||
                booking.status === statusFilter;


            return (
                matchesSearch &&
                matchesStatus
            );

        });

    }, [
        bookings,
        searchTerm,
        statusFilter
    ]);


    /* =========================================================
       SUMMARY
    ========================================================= */

    const totalBookings =
        bookings.length;

    const pendingBookings =
        bookings.filter(
            (booking) =>
                booking.status === "Pending"
        ).length;

    const confirmedBookings =
        bookings.filter(
            (booking) =>
                ["Accepted", "Matched"].includes(booking.status)
        ).length;

    const completedBookings =
        bookings.filter(
            (booking) =>
                booking.status === "Completed"
        ).length;


    /* =========================================================
       PAGINATION
    ========================================================= */

    const totalPages =
        Math.ceil(
            filteredBookings.length /
            itemsPerPage
        );

    const paginatedBookings =
        filteredBookings.slice(
            (currentPage - 1) *
            itemsPerPage,

            currentPage *
            itemsPerPage
        );


    /* =========================================================
       SEARCH
    ========================================================= */

    const handleSearch = (value) => {

        setSearchTerm(value);

        setCurrentPage(1);

    };


    /* =========================================================
       STATUS FILTER
    ========================================================= */

    const handleStatusFilter = (value) => {

        setStatusFilter(value);

        setCurrentPage(1);

    };


    /* =========================================================
       VIEW BOOKING
    ========================================================= */

    const handleView = (booking) => {

        setSelectedBooking(booking);

        setShowViewModal(true);

    };


    /* =========================================================
       CLOSE VIEW MODAL
    ========================================================= */

    const closeViewModal = () => {

        setShowViewModal(false);

        setSelectedBooking(null);

    };


    /* =========================================================
       OPEN STATUS MODAL
    ========================================================= */

    const openStatusModal = (booking) => {

        setBookingForStatusChange(booking);

        setNewStatus(
            booking.status || "Pending"
        );

        setShowStatusModal(true);

    };


    /* =========================================================
       CLOSE STATUS MODAL
    ========================================================= */

    const closeStatusModal = () => {

        setShowStatusModal(false);

        setBookingForStatusChange(null);

        setNewStatus("");

    };


    /* =========================================================
       UPDATE STATUS
    ========================================================= */

    const handleStatusUpdate = async () => {

        if (
            !bookingForStatusChange ||
            !newStatus
        ) {
            return;
        }

        setActionError("");
        try {
            const updated = await api(`/admin/bookings/${bookingForStatusChange.id}/status`, {
                method: "PATCH",
                body: JSON.stringify({ status: newStatus }),
            });
            const normalized = normalizeBooking(updated);

        setBookings(
            (previousBookings) =>

                previousBookings.map(
                    (booking) =>

                        booking.id ===
                            bookingForStatusChange.id

                            ? normalized

                            : booking
                )
        );


        setSelectedBooking(
            (previous) => {

                if (
                    !previous ||
                    previous.id !==
                    bookingForStatusChange.id
                ) {
                    return previous;
                }

                return {
                    ...normalized,
                };

            }
        );


        closeStatusModal();
        } catch (error) {
            setActionError(error.message || "Unable to update booking status.");
        }

    };


    /* =========================================================
       STATUS STYLE
    ========================================================= */

    const getStatusClass = (status) => {

        switch (status) {

            case "Pending":
                return "booking-status-pending";

            case "Confirmed":
            case "Accepted":
            case "Matched":
                return "booking-status-confirmed";

            case "In Progress":
                return "booking-status-progress";

            case "Completed":
                return "booking-status-completed";

            case "Cancelled":
                return "booking-status-cancelled";

            case "Rejected":
                return "booking-status-rejected";

            default:
                return "booking-status-default";

        }

    };


    /* =========================================================
       SHOWING TEXT
    ========================================================= */

    const getShowingText = () => {

        if (
            filteredBookings.length === 0
        ) {
            return "Showing 0 to 0 of 0";
        }


        const start =
            (currentPage - 1) *
            itemsPerPage + 1;


        const end =
            Math.min(
                currentPage *
                itemsPerPage,

                filteredBookings.length
            );


        return `Showing ${start} to ${end} of ${filteredBookings.length}`;

    };


    /* =========================================================
       PAGE
    ========================================================= */

    return (

        <div className="booking-management">


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="booking-page-header">

                <div>

                    <span className="booking-section-label">
                        BOOKING MANAGEMENT
                    </span>

                    <h2>
                        Booking Management
                    </h2>

                    <p>
                        Monitor and manage all service bookings
                        on the SmartHome platform.
                    </p>

                </div>

                <div className="booking-header-icon">

                    <i className="bi bi-calendar2-check"></i>

                </div>

            </div>


            {/* =================================================
                SUMMARY CARDS
            ================================================= */}

            <div className="booking-summary-grid">


                {/* TOTAL */}

                <div className="booking-summary-card">

                    <div className="booking-summary-icon green">

                        <i className="bi bi-calendar-check-fill"></i>

                    </div>

                    <div className="booking-summary-info">

                        <span>
                            Total Bookings
                        </span>

                        <strong>
                            {totalBookings}
                        </strong>

                        <small>
                            All service bookings
                        </small>

                    </div>

                </div>


                {/* PENDING */}

                <div className="booking-summary-card">

                    <div className="booking-summary-icon orange">

                        <i className="bi bi-hourglass-split"></i>

                    </div>

                    <div className="booking-summary-info">

                        <span>
                            Pending
                        </span>

                        <strong>
                            {pendingBookings}
                        </strong>

                        <small>
                            Awaiting action
                        </small>

                    </div>

                </div>


                {/* CONFIRMED */}

                <div className="booking-summary-card">

                    <div className="booking-summary-icon blue">

                        <i className="bi bi-check-circle-fill"></i>

                    </div>

                    <div className="booking-summary-info">

                        <span>
                            Accepted / Matched
                        </span>

                        <strong>
                            {confirmedBookings}
                        </strong>

                        <small>
                            Approved bookings
                        </small>

                    </div>

                </div>


                {/* COMPLETED */}

                <div className="booking-summary-card">

                    <div className="booking-summary-icon green">

                        <i className="bi bi-check2-all"></i>

                    </div>

                    <div className="booking-summary-info">

                        <span>
                            Completed
                        </span>

                        <strong>
                            {completedBookings}
                        </strong>

                        <small>
                            Finished services
                        </small>

                    </div>

                </div>

            </div>


            {/* =================================================
                FILTER CARD
            ================================================= */}

            <div className="booking-filter-card">

                <div className="booking-filter-title">

                    <div className="booking-filter-title-icon">

                        <i className="bi bi-sliders"></i>

                    </div>

                    <div>

                        <strong>
                            Find Bookings
                        </strong>

                        <span>
                            Search and filter service bookings
                        </span>

                    </div>

                </div>


                <div className="booking-filter-controls">


                    {/* SEARCH */}

                    <div className="booking-search">

                        <i className="bi bi-search"></i>

                        <input
                            type="text"
                            placeholder="Search booking, homeowner, provider, or service..."
                            value={searchTerm}
                            onChange={(event) =>
                                handleSearch(
                                    event.target.value
                                )
                            }
                        />

                        {searchTerm && (

                            <button
                                type="button"
                                className="booking-search-clear"
                                onClick={() =>
                                    handleSearch("")
                                }
                                aria-label="Clear search"
                            >

                                <i className="bi bi-x"></i>

                            </button>

                        )}

                    </div>


                    {/* STATUS */}

                    <div className="booking-status-filter">

                        <label htmlFor="booking-status-filter">
                            Status
                        </label>

                        <div className="booking-select">

                            <i className="bi bi-funnel"></i>

                            <select
                                id="booking-status-filter"
                                value={statusFilter}
                                onChange={(event) =>
                                    handleStatusFilter(
                                        event.target.value
                                    )
                                }
                            >

                                <option value="All">
                                    All Status
                                </option>

                                <option value="Pending">
                                    Pending
                                </option>

                                <option value="Accepted">
                                    Accepted
                                </option>
                                <option value="Matched">Matched</option>
                                <option value="On the Way">On the Way</option>

                                <option value="In Progress">
                                    In Progress
                                </option>

                                <option value="Completed">
                                    Completed
                                </option>

                                <option value="Cancelled">
                                    Cancelled
                                </option>

                                <option value="Rejected">
                                    Rejected
                                </option>

                            </select>

                        </div>

                    </div>

                </div>

            </div>


            {/* =================================================
                TABLE CARD
            ================================================= */}

            <div className="booking-table-card">


                {/* TABLE HEADER */}

                <div className="booking-table-header">

                    <div>

                        <span className="booking-table-label">
                            SERVICE BOOKINGS
                        </span>

                        <h3>
                            All Bookings
                        </h3>

                        <p>
                            View and manage homeowner service requests.
                        </p>

                    </div>


                    <div className="booking-count">

                        <i className="bi bi-calendar3"></i>

                        <span>
                            {filteredBookings.length}
                        </span>

                        booking
                        {filteredBookings.length !== 1
                            ? "s"
                            : ""}

                    </div>

                </div>


                {/* TABLE */}

                {loadError && <div className="alert alert-danger" role="alert">{loadError}</div>}
                {actionError && <div className="alert alert-danger" role="alert">{actionError}</div>}

                <div className="booking-table-wrapper">

                    <table className="booking-table">

                        <thead>

                            <tr>

                                <th>
                                    Booking ID
                                </th>

                                <th>
                                    Homeowner
                                </th>

                                <th>
                                    Service Provider
                                </th>

                                <th>
                                    Service
                                </th>

                                <th>
                                    Date & Time
                                </th>

                                <th>
                                    Status
                                </th>

                                <th>
                                    Actions
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {loading ? (
                                <tr><td colSpan="7">Loading bookings...</td></tr>
                            ) : paginatedBookings.length > 0 ? (

                                paginatedBookings.map(
                                    (booking) => (

                                        <tr
                                            key={
                                                booking.bookingId
                                            }
                                        >

                                            <td>

                                                <div className="booking-id">

                                                    <span>
                                                        #
                                                    </span>

                                                    <strong>
                                                        {
                                                            booking.bookingId
                                                        }
                                                    </strong>

                                                </div>

                                            </td>


                                            <td>

                                                <div className="booking-person">

                                                    <div className="booking-person-avatar green">

                                                        <i className="bi bi-person-fill"></i>

                                                    </div>

                                                    <span>
                                                        {
                                                            booking.homeownerName ||
                                                            "—"
                                                        }
                                                    </span>

                                                </div>

                                            </td>


                                            <td>

                                                <div className="booking-person">

                                                    <div className="booking-person-avatar orange">

                                                        <i className="bi bi-person-badge-fill"></i>

                                                    </div>

                                                    <span>
                                                        {
                                                            booking.providerName ||
                                                            "—"
                                                        }
                                                    </span>

                                                </div>

                                            </td>


                                            <td>

                                                <div className="booking-service">

                                                    <i className="bi bi-tools"></i>

                                                    <span>
                                                        {
                                                            booking.service ||
                                                            "—"
                                                        }
                                                    </span>

                                                </div>

                                            </td>


                                            <td>

                                                <div className="booking-date">

                                                    <span>
                                                        <i className="bi bi-calendar3"></i>

                                                        {
                                                            booking.date ||
                                                            "—"
                                                        }
                                                    </span>

                                                    {booking.time && (

                                                        <small>

                                                            <i className="bi bi-clock"></i>

                                                            {
                                                                booking.time
                                                            }

                                                        </small>

                                                    )}

                                                </div>

                                            </td>


                                            <td>

                                                <span
                                                    className={`
                                                        booking-status
                                                        ${getStatusClass(
                                                        booking.status
                                                    )}
                                                    `}
                                                >

                                                    <span className="booking-status-dot"></span>

                                                    {
                                                        booking.status ||
                                                        "Pending"
                                                    }

                                                </span>

                                            </td>


                                            <td>

                                                <div className="booking-actions">

                                                    <button
                                                        type="button"
                                                        className="booking-action view"
                                                        onClick={() =>
                                                            handleView(
                                                                booking
                                                            )
                                                        }
                                                        title="View Booking"
                                                    >

                                                        <i className="bi bi-eye"></i>

                                                    </button>


                                                    <button
                                                        type="button"
                                                        className="booking-action edit"
                                                        onClick={() =>
                                                            openStatusModal(
                                                                booking
                                                            )
                                                        }
                                                        title="Update Status"
                                                    >

                                                        <i className="bi bi-pencil"></i>

                                                    </button>

                                                </div>

                                            </td>

                                        </tr>

                                    )

                                )

                            ) : (

                                <tr>

                                    <td
                                        colSpan="7"
                                        className="booking-empty-cell"
                                    >

                                        <div className="booking-empty-state">

                                            <div className="booking-empty-icon">

                                                <i className="bi bi-calendar-x"></i>

                                            </div>

                                            <h4>
                                                No bookings found
                                            </h4>

                                            <p>
                                                Booking information will appear
                                                here once service requests are available.
                                            </p>

                                        </div>

                                    </td>

                                </tr>

                            )}

                        </tbody>

                    </table>

                </div>


                {/* =================================================
                    PAGINATION
                ================================================= */}

                <div className="booking-pagination">

                    <span>
                        {getShowingText()}
                    </span>


                    <div className="booking-pagination-buttons">

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
                            title="Previous page"
                        >

                            <i className="bi bi-chevron-left"></i>

                        </button>


                        {totalPages > 0 &&

                            Array.from(
                                {
                                    length:
                                        totalPages
                                },
                                (_, index) =>
                                    index + 1
                            ).map(
                                (page) => (

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

                                )
                            )

                        }


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
                            title="Next page"
                        >

                            <i className="bi bi-chevron-right"></i>

                        </button>

                    </div>

                </div>

            </div>


            {/* =================================================
                VIEW BOOKING MODAL
            ================================================= */}

            {showViewModal &&
                selectedBooking && (

                    <div
                        className="booking-modal-overlay"
                        onClick={closeViewModal}
                    >

                        <div
                            className="booking-modal"
                            onClick={(event) =>
                                event.stopPropagation()
                            }
                        >

                            <div className="booking-modal-header">

                                <div>

                                    <span>
                                        BOOKING DETAILS
                                    </span>

                                    <h3>
                                        #{selectedBooking.bookingId}
                                    </h3>

                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        closeViewModal
                                    }
                                    className="booking-modal-close"
                                >

                                    <i className="bi bi-x-lg"></i>

                                </button>

                            </div>


                            <div className="booking-modal-body">

                                <div className="booking-detail-status">

                                    <span>
                                        Current Status
                                    </span>

                                    <strong
                                        className={
                                            getStatusClass(
                                                selectedBooking.status
                                            )
                                        }
                                    >
                                        {
                                            selectedBooking.status ||
                                            "Pending"
                                        }
                                    </strong>

                                </div>


                                <div className="booking-detail-grid">


                                    <div className="booking-detail-item">

                                        <span>
                                            Homeowner
                                        </span>

                                        <strong>
                                            {
                                                selectedBooking.homeownerName ||
                                                "—"
                                            }
                                        </strong>

                                    </div>


                                    <div className="booking-detail-item">

                                        <span>
                                            Contact
                                        </span>

                                        <strong>
                                            {
                                                selectedBooking.homeownerContact ||
                                                "—"
                                            }
                                        </strong>

                                    </div>


                                    <div className="booking-detail-item">

                                        <span>
                                            Service Provider
                                        </span>

                                        <strong>
                                            {
                                                selectedBooking.providerName ||
                                                "—"
                                            }
                                        </strong>

                                    </div>


                                    <div className="booking-detail-item">

                                        <span>
                                            Provider Contact
                                        </span>

                                        <strong>
                                            {
                                                selectedBooking.providerContact ||
                                                "—"
                                            }
                                        </strong>

                                    </div>


                                    <div className="booking-detail-item">

                                        <span>
                                            Service Category
                                        </span>

                                        <strong>
                                            {
                                                selectedBooking.service ||
                                                "—"
                                            }
                                        </strong>

                                    </div>


                                    <div className="booking-detail-item">

                                        <span>
                                            Date
                                        </span>

                                        <strong>
                                            {
                                                selectedBooking.date ||
                                                "—"
                                            }
                                        </strong>

                                    </div>


                                    <div className="booking-detail-item">

                                        <span>
                                            Time
                                        </span>

                                        <strong>
                                            {
                                                selectedBooking.time ||
                                                "—"
                                            }
                                        </strong>

                                    </div>


                                    <div className="booking-detail-item">

                                        <span>
                                            Location
                                        </span>

                                        <strong>
                                            {
                                                selectedBooking.location ||
                                                "—"
                                            }
                                        </strong>

                                    </div>


                                    <div className="booking-detail-item full">

                                        <span>
                                            Additional Notes
                                        </span>

                                        <strong>
                                            {
                                                selectedBooking.notes ||
                                                "—"
                                            }
                                        </strong>

                                    </div>

                                </div>

                            </div>


                            <div className="booking-modal-footer">

                                <button
                                    type="button"
                                    className="booking-secondary-button"
                                    onClick={
                                        closeViewModal
                                    }
                                >
                                    Close
                                </button>

                            </div>

                        </div>

                    </div>

                )
            }


            {/* =================================================
                UPDATE STATUS MODAL
            ================================================= */}

            {showStatusModal &&
                bookingForStatusChange && (

                    <div
                        className="booking-modal-overlay"
                        onClick={
                            closeStatusModal
                        }
                    >

                        <div
                            className="booking-modal booking-small-modal"
                            onClick={(event) =>
                                event.stopPropagation()
                            }
                        >

                            <div className="booking-modal-header">

                                <div>

                                    <span>
                                        BOOKING STATUS
                                    </span>

                                    <h3>
                                        Update Booking
                                    </h3>

                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        closeStatusModal
                                    }
                                    className="booking-modal-close"
                                >

                                    <i className="bi bi-x-lg"></i>

                                </button>

                            </div>


                            <div className="booking-modal-body">

                                <div className="booking-status-message">

                                    <div className="booking-status-message-icon">

                                        <i className="bi bi-arrow-repeat"></i>

                                    </div>

                                    <p>

                                        Update the status of booking{" "}

                                        <strong>
                                            #
                                            {
                                                bookingForStatusChange.bookingId
                                            }
                                        </strong>

                                    </p>

                                </div>


                                <div className="booking-form-group">

                                    <label htmlFor="booking-new-status">

                                        Booking Status

                                    </label>

                                    <div className="booking-modal-select">

                                        <i className="bi bi-list-check"></i>

                                        <select
                                            id="booking-new-status"
                                            value={
                                                newStatus
                                            }
                                            onChange={(event) =>
                                                setNewStatus(
                                                    event.target.value
                                                )
                                            }
                                        >

                                            <option value="Pending">
                                                Pending
                                            </option>

                                            <option value="Accepted">
                                                Accepted
                                            </option>
                                            <option value="Matched">Matched</option>
                                            <option value="On the Way">On the Way</option>

                                            <option value="In Progress">
                                                In Progress
                                            </option>

                                            <option value="Completed">
                                                Completed
                                            </option>

                                            <option value="Cancelled">
                                                Cancelled
                                            </option>

                                            <option value="Rejected">
                                                Rejected
                                            </option>

                                        </select>

                                    </div>

                                </div>

                            </div>


                            <div className="booking-modal-footer">

                                <button
                                    type="button"
                                    className="booking-secondary-button"
                                    onClick={
                                        closeStatusModal
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    className="booking-primary-button"
                                    onClick={
                                        handleStatusUpdate
                                    }
                                >

                                    <i className="bi bi-check2"></i>

                                    Update Status

                                </button>

                            </div>

                        </div>

                    </div>

                )
            }

        </div>

    );

}


export default BookingManagement;