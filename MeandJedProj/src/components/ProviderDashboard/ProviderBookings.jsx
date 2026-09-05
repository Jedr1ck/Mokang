import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProviderSideBar from "../ProviderSideBar/ProviderSideBar";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import "./ProviderBookings.css";


const ProviderBookings = () => {

    const navigate = useNavigate();


    // =====================================================
    // PROVIDER INFORMATION
    // =====================================================

    const [provider, setProvider] = useState(() => {

        try {

            const saved =
                localStorage.getItem("user") ||
                localStorage.getItem("loggedInProvider");

            return saved
                ? JSON.parse(saved)
                : {};

        } catch (error) {

            console.error(
                "Provider data error:",
                error
            );

            return {};

        }

    });


    const providerName =
        provider.fullName ||
        provider.name ||
        "Provider";


    // =====================================================
    // BOOKING DATA
    // =====================================================

    const [bookings, setBookings] = useState([

        {
            id: 1,
            requestNo: "REQ-2026-0901",

            customerName: "Juan Dela Cruz",
            customerImage: "",

            phone: "0917 123 4567",
            email: "juan.delacruz@email.com",

            service: "Electrical Wiring",
            category: "Electrical",

            location: "Brgy. 12, Subdivision",

            fullAddress:
                "Block 8 Lot 15, Brgy. 12, Subdivision",

            date: "Sep 03, 2026",
            time: "09:00 AM - 11:00 AM",

            status: "New",

            estimatedFee: "₱1,500.00",

            description:
                "Installation of additional electrical outlets and checking of existing wiring in the living room.",

            specialInstructions:
                "Please bring the necessary wiring materials and tools.",

            requestedAt:
                "Sep 02, 2026 • 08:35 PM"
        },


        {
            id: 2,
            requestNo: "REQ-2026-0902",

            customerName: "Maria Santos",
            customerImage: "",

            phone: "0918 234 5678",
            email: "maria.santos@email.com",

            service: "Air Conditioner Service",
            category: "Appliance",

            location: "Block 4 Lot 12, Phase 2",

            fullAddress:
                "Block 4 Lot 12, Phase 2, Brgy. San Jose",

            date: "Sep 03, 2026",
            time: "01:00 PM - 03:00 PM",

            status: "New",

            estimatedFee: "₱1,200.00",

            description:
                "General cleaning and maintenance of one split-type air conditioner.",

            specialInstructions:
                "The unit is located in the second-floor bedroom.",

            requestedAt:
                "Sep 02, 2026 • 06:15 PM"
        },


        {
            id: 3,
            requestNo: "REQ-2026-0903",

            customerName: "Ana Reyes",
            customerImage: "",

            phone: "0919 345 6789",
            email: "ana.reyes@email.com",

            service: "Plumbing Repair",
            category: "Plumbing",

            location: "Phase 1, Brgy. 8",

            fullAddress:
                "Lot 10 Block 3, Phase 1, Brgy. 8",

            date: "Sep 04, 2026",
            time: "10:00 AM - 12:00 PM",

            status: "New",

            estimatedFee: "₱950.00",

            description:
                "Repair of a leaking kitchen sink and replacement of damaged pipe connection.",

            specialInstructions:
                "Please inspect the water line before starting the repair.",

            requestedAt:
                "Sep 02, 2026 • 03:20 PM"
        },


        {
            id: 4,
            requestNo: "REQ-2026-0904",

            customerName: "Robert Garcia",
            customerImage: "",

            phone: "0920 456 7890",
            email: "robert.garcia@email.com",

            service: "House Cleaning",
            category: "Cleaning",

            location: "Brgy. Mabini",

            fullAddress:
                "Block 2 Lot 6, Brgy. Mabini",

            date: "Sep 05, 2026",
            time: "08:00 AM - 11:00 AM",

            status: "Confirmed",

            estimatedFee: "₱1,800.00",

            description:
                "General house cleaning including living room, bedrooms and kitchen.",

            specialInstructions:
                "Customer requested eco-friendly cleaning products.",

            requestedAt:
                "Sep 01, 2026 • 10:10 AM"
        },


        {
            id: 5,
            requestNo: "REQ-2026-0905",

            customerName: "Sofia Mendoza",
            customerImage: "",

            phone: "0921 567 8901",
            email: "sofia.mendoza@email.com",

            service: "Painting Service",
            category: "Painting",

            location: "Brgy. San Miguel",

            fullAddress:
                "Block 7 Lot 2, Brgy. San Miguel",

            date: "Sep 07, 2026",
            time: "09:00 AM - 04:00 PM",

            status: "New",

            estimatedFee: "₱4,500.00",

            description:
                "Interior repainting of the living room and two bedrooms.",

            specialInstructions:
                "Customer prefers light neutral colors.",

            requestedAt:
                "Sep 02, 2026 • 01:45 PM"
        },


        {
            id: 6,
            requestNo: "REQ-2026-0906",

            customerName: "Carlos Navarro",
            customerImage: "",

            phone: "0922 678 9012",
            email: "carlos.navarro@email.com",

            service: "Carpentry & Woodwork",
            category: "Carpentry",

            location: "Brgy. San Isidro",

            fullAddress:
                "Block 5 Lot 9, Brgy. San Isidro",

            date: "Sep 03, 2026",
            time: "03:00 PM - 05:00 PM",

            status: "New",

            estimatedFee: "₱2,000.00",

            description:
                "Repair of wooden cabinet doors and replacement of damaged hinges.",

            specialInstructions:
                "Customer will provide the replacement hinges.",

            requestedAt:
                "Sep 02, 2026 • 09:15 AM"
        }

    ]);


    // =====================================================
    // STATES
    // =====================================================

    const [activeFilter, setActiveFilter] =
        useState("All");

    const [searchTerm, setSearchTerm] =
        useState("");

    const [selectedBooking, setSelectedBooking] =
        useState(null);

    const [showDetails, setShowDetails] =
        useState(false);


    // =====================================================
    // FILTER
    // =====================================================

    const filteredBookings = useMemo(() => {

        let result = [...bookings];


        if (activeFilter === "New") {

            result = result.filter(
                booking =>
                    booking.status === "New"
            );

        }


        if (activeFilter === "Today") {

            result = result.filter(
                booking =>
                    booking.date === "Sep 03, 2026"
            );

        }


        if (activeFilter === "Tomorrow") {

            result = result.filter(
                booking =>
                    booking.date === "Sep 04, 2026"
            );

        }


        if (activeFilter === "This Week") {

            result = result.filter(
                booking =>
                    [
                        "Sep 03, 2026",
                        "Sep 04, 2026",
                        "Sep 05, 2026",
                        "Sep 06, 2026",
                        "Sep 07, 2026"
                    ].includes(booking.date)
            );

        }


        if (searchTerm.trim() !== "") {

            const search =
                searchTerm.toLowerCase();

            result = result.filter(
                booking =>

                    booking.requestNo
                        .toLowerCase()
                        .includes(search)

                    ||

                    booking.customerName
                        .toLowerCase()
                        .includes(search)

                    ||

                    booking.service
                        .toLowerCase()
                        .includes(search)

                    ||

                    booking.location
                        .toLowerCase()
                        .includes(search)

            );

        }


        return result;

    }, [
        bookings,
        activeFilter,
        searchTerm
    ]);


    // =====================================================
    // COUNTS
    // =====================================================

    const allCount =
        bookings.length;

    const newCount =
        bookings.filter(
            item => item.status === "New"
        ).length;

    const todayCount =
        bookings.filter(
            item =>
                item.date === "Sep 03, 2026"
        ).length;

    const tomorrowCount =
        bookings.filter(
            item =>
                item.date === "Sep 04, 2026"
        ).length;

    const weekCount =
        bookings.filter(
            item =>
                [
                    "Sep 03, 2026",
                    "Sep 04, 2026",
                    "Sep 05, 2026",
                    "Sep 06, 2026",
                    "Sep 07, 2026"
                ].includes(item.date)
        ).length;


    // =====================================================
    // VIEW DETAILS
    // =====================================================

    const handleViewDetails = (booking) => {

        setSelectedBooking(booking);

        setShowDetails(true);

    };


    const closeDetails = () => {

        setSelectedBooking(null);

        setShowDetails(false);

    };


    // =====================================================
    // ACCEPT BOOKING
    // =====================================================

    const handleAccept = (id) => {

        const booking =
            bookings.find(
                item => item.id === id
            );


        if (!booking) return;


        const confirmAction =
            window.confirm(
                `Accept ${booking.requestNo} from ${booking.customerName}?`
            );


        if (!confirmAction) return;


        const updatedBooking = {

            ...booking,

            status: "Confirmed"

        };


        setBookings(prev =>
            prev.map(item =>
                item.id === id
                    ? updatedBooking
                    : item
            )
        );


        setSelectedBooking(
            updatedBooking
        );


        alert(
            `${booking.requestNo} has been accepted.`
        );

    };


    // =====================================================
    // DECLINE BOOKING
    // =====================================================

    const handleDecline = (id) => {

        const booking =
            bookings.find(
                item => item.id === id
            );


        if (!booking) return;


        const confirmAction =
            window.confirm(
                `Decline ${booking.requestNo} from ${booking.customerName}?`
            );


        if (!confirmAction) return;


        const updatedBooking = {

            ...booking,

            status: "Declined"

        };


        setBookings(prev =>
            prev.map(item =>
                item.id === id
                    ? updatedBooking
                    : item
            )
        );


        setSelectedBooking(
            updatedBooking
        );


        alert(
            `${booking.requestNo} has been declined.`
        );

    };


    // =====================================================
    // LOGOUT
    // =====================================================

    const handleLogout = () => {

        localStorage.removeItem("user");

        localStorage.removeItem(
            "loggedInProvider"
        );

        navigate("/");

    };


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div className="provider-bookings-layout">


            {/* SIDEBAR */}

            <ProviderSideBar
                activeSection="bookings"
                handleLogout={handleLogout}
            />


            {/* MAIN CONTENT */}

            <main className="provider-bookings-main">


                {/* =========================================
                    HEADER
                ========================================== */}

                <div className="provider-bookings-header">

                    <div>

                        <span className="provider-page-label">
                            PROVIDER PORTAL
                        </span>

                        <h1>
                            Booking Requests
                        </h1>

                        <p>
                            Manage and respond to booking requests from homeowners.
                        </p>

                    </div>


                    <div className="provider-header-actions">

                        <button
                            className="booking-header-button"
                            onClick={() =>
                                navigate(
                                    "/provider-notifications"
                                )
                            }
                        >

                            <i className="bi bi-bell"></i>

                            <span>
                                Notifications
                            </span>

                        </button>


                        <button
                            className="booking-header-profile"
                            onClick={() =>
                                navigate(
                                    "/provider-profile"
                                )
                            }
                        >

                            <span className="booking-profile-icon">

                                <i className="bi bi-person"></i>

                            </span>

                            <span>
                                {providerName}
                            </span>

                            <i className="bi bi-chevron-down"></i>

                        </button>

                    </div>

                </div>


                {/* =========================================
                    SUMMARY
                ========================================== */}

                <div className="booking-summary-grid">


                    <div
                        className={`booking-summary-card ${activeFilter === "All"
                            ? "selected"
                            : ""
                            }`}
                        onClick={() =>
                            setActiveFilter("All")
                        }
                    >

                        <div className="summary-icon green">

                            <i className="bi bi-inbox"></i>

                        </div>

                        <div>

                            <span>
                                Total Requests
                            </span>

                            <strong>
                                {allCount}
                            </strong>

                        </div>

                    </div>


                    <div
                        className={`booking-summary-card ${activeFilter === "New"
                            ? "selected"
                            : ""
                            }`}
                        onClick={() =>
                            setActiveFilter("New")
                        }
                    >

                        <div className="summary-icon orange">

                            <i className="bi bi-stars"></i>

                        </div>

                        <div>

                            <span>
                                New Requests
                            </span>

                            <strong>
                                {newCount}
                            </strong>

                        </div>

                    </div>


                    <div
                        className={`booking-summary-card ${activeFilter === "Today"
                            ? "selected"
                            : ""
                            }`}
                        onClick={() =>
                            setActiveFilter("Today")
                        }
                    >

                        <div className="summary-icon blue">

                            <i className="bi bi-calendar-day"></i>

                        </div>

                        <div>

                            <span>
                                Today
                            </span>

                            <strong>
                                {todayCount}
                            </strong>

                        </div>

                    </div>


                    <div
                        className={`booking-summary-card ${activeFilter === "Tomorrow"
                            ? "selected"
                            : ""
                            }`}
                        onClick={() =>
                            setActiveFilter("Tomorrow")
                        }
                    >

                        <div className="summary-icon purple">

                            <i className="bi bi-calendar-plus"></i>

                        </div>

                        <div>

                            <span>
                                Tomorrow
                            </span>

                            <strong>
                                {tomorrowCount}
                            </strong>

                        </div>

                    </div>


                    <div
                        className={`booking-summary-card ${activeFilter === "This Week"
                            ? "selected"
                            : ""
                            }`}
                        onClick={() =>
                            setActiveFilter("This Week")
                        }
                    >

                        <div className="summary-icon teal">

                            <i className="bi bi-calendar-week"></i>

                        </div>

                        <div>

                            <span>
                                This Week
                            </span>

                            <strong>
                                {weekCount}
                            </strong>

                        </div>

                    </div>

                </div>


                {/* =========================================
                    REQUEST PANEL
                ========================================== */}

                <section className="booking-request-panel">


                    <div className="booking-panel-header">

                        <div>

                            <h2>
                                Service Requests
                            </h2>

                            <p>
                                Review homeowner requests and manage your bookings.
                            </p>

                        </div>


                        <div className="booking-search">

                            <i className="bi bi-search"></i>

                            <input
                                type="text"
                                placeholder="Search request, customer, service..."
                                value={searchTerm}
                                onChange={(e) =>
                                    setSearchTerm(
                                        e.target.value
                                    )
                                }
                            />

                        </div>

                    </div>


                    {/* FILTERS */}

                    <div className="booking-filter-tabs">

                        {[
                            "All",
                            "New",
                            "Today",
                            "Tomorrow",
                            "This Week"
                        ].map(filter => (

                            <button
                                key={filter}
                                className={
                                    activeFilter === filter
                                        ? "active"
                                        : ""
                                }
                                onClick={() =>
                                    setActiveFilter(
                                        filter
                                    )
                                }
                            >

                                {filter}

                                <span>

                                    {
                                        filter === "All"
                                            ? allCount
                                            : filter === "New"
                                                ? newCount
                                                : filter === "Today"
                                                    ? todayCount
                                                    : filter === "Tomorrow"
                                                        ? tomorrowCount
                                                        : weekCount
                                    }

                                </span>

                            </button>

                        ))}

                    </div>


                    {/* TABLE HEADER */}

                    <div className="booking-table-head">

                        <div>REQUEST NO.</div>

                        <div>CUSTOMER</div>

                        <div>SERVICE</div>

                        <div>LOCATION</div>

                        <div>DATE & TIME</div>

                        <div>STATUS</div>

                        <div>ACTION</div>

                    </div>


                    {/* BOOKINGS */}

                    <div className="booking-list">

                        {filteredBookings.length === 0 ? (

                            <div className="booking-empty">

                                <i className="bi bi-inbox"></i>

                                <h3>
                                    No booking requests found
                                </h3>

                                <p>
                                    Try another filter or search keyword.
                                </p>

                            </div>

                        ) : (

                            filteredBookings.map(
                                booking => (

                                    <div
                                        className="booking-row"
                                        key={booking.id}
                                    >


                                        {/* REQUEST */}

                                        <div className="booking-request-number">

                                            <strong>
                                                {booking.requestNo}
                                            </strong>

                                            <small>
                                                Booking Request
                                            </small>

                                        </div>


                                        {/* CUSTOMER */}

                                        <div className="booking-customer">

                                            {booking.customerImage ? (

                                                <img
                                                    src={
                                                        booking.customerImage
                                                    }
                                                    alt={
                                                        booking.customerName
                                                    }
                                                />

                                            ) : (

                                                <div className="customer-placeholder">

                                                    <i className="bi bi-person"></i>

                                                </div>

                                            )}


                                            <div>

                                                <strong>
                                                    {booking.customerName}
                                                </strong>

                                                <small>

                                                    <i className="bi bi-phone"></i>

                                                    {booking.phone}

                                                </small>

                                            </div>

                                        </div>


                                        {/* SERVICE */}

                                        <div className="booking-service">

                                            <strong>
                                                {booking.service}
                                            </strong>

                                            <span>
                                                {booking.category}
                                            </span>

                                        </div>


                                        {/* LOCATION */}

                                        <div className="booking-location">

                                            <i className="bi bi-geo-alt"></i>

                                            <span>
                                                {booking.location}
                                            </span>

                                        </div>


                                        {/* DATE */}

                                        <div className="booking-date">

                                            <strong>
                                                {booking.date}
                                            </strong>

                                            <span>

                                                <i className="bi bi-clock"></i>

                                                {booking.time}

                                            </span>

                                        </div>


                                        {/* STATUS */}

                                        <div>

                                            <span
                                                className={`booking-status ${booking.status.toLowerCase()}`}
                                            >
                                                {booking.status}
                                            </span>

                                        </div>


                                        {/* ACTIONS */}

                                        <div className="booking-actions">

                                            <button
                                                className="view-details-button"
                                                onClick={() =>
                                                    handleViewDetails(
                                                        booking
                                                    )
                                                }
                                            >
                                                View Details
                                            </button>


                                            {booking.status === "New" && (

                                                <>

                                                    <button
                                                        className="accept-button"
                                                        onClick={() =>
                                                            handleAccept(
                                                                booking.id
                                                            )
                                                        }
                                                    >
                                                        Accept
                                                    </button>


                                                    <button
                                                        className="decline-button"
                                                        onClick={() =>
                                                            handleDecline(
                                                                booking.id
                                                            )
                                                        }
                                                    >
                                                        Decline
                                                    </button>

                                                </>

                                            )}

                                        </div>

                                    </div>

                                )
                            )

                        )}

                    </div>

                </section>

            </main>


            {/* =================================================
                DETAILS MODAL
            ================================================== */}

            {showDetails &&
                selectedBooking && (

                    <div
                        className="booking-modal-overlay"
                        onClick={closeDetails}
                    >

                        <div
                            className="booking-details-modal"
                            onClick={(e) =>
                                e.stopPropagation()
                            }
                        >


                            {/* MODAL HEADER */}

                            <div className="booking-modal-header">

                                <div>

                                    <span>
                                        BOOKING REQUEST
                                    </span>

                                    <h2>
                                        {selectedBooking.requestNo}
                                    </h2>

                                </div>


                                <button
                                    className="modal-close-button"
                                    onClick={
                                        closeDetails
                                    }
                                >

                                    <i className="bi bi-x-lg"></i>

                                </button>

                            </div>


                            {/* CUSTOMER PROFILE */}

                            <div className="booking-customer-profile">

                                {selectedBooking.customerImage ? (

                                    <img
                                        src={
                                            selectedBooking.customerImage
                                        }
                                        alt={
                                            selectedBooking.customerName
                                        }
                                    />

                                ) : (

                                    <div className="large-customer-placeholder">

                                        <i className="bi bi-person"></i>

                                    </div>

                                )}


                                <div>

                                    <span>
                                        CUSTOMER
                                    </span>

                                    <h3>
                                        {selectedBooking.customerName}
                                    </h3>

                                    <p>
                                        <i className="bi bi-phone"></i>
                                        {selectedBooking.phone}
                                    </p>

                                    <p>
                                        <i className="bi bi-envelope"></i>
                                        {selectedBooking.email}
                                    </p>

                                </div>

                            </div>


                            {/* STATUS */}

                            <div className="details-status-row">

                                <span>
                                    Booking Status
                                </span>

                                <span
                                    className={`booking-status ${selectedBooking.status.toLowerCase()}`}
                                >
                                    {selectedBooking.status}
                                </span>

                            </div>


                            {/* SERVICE */}

                            <div className="details-section">

                                <h3>

                                    <i className="bi bi-tools"></i>

                                    Service Details

                                </h3>


                                <div className="details-grid">

                                    <div>

                                        <span>
                                            Service
                                        </span>

                                        <strong>
                                            {selectedBooking.service}
                                        </strong>

                                    </div>


                                    <div>

                                        <span>
                                            Category
                                        </span>

                                        <strong>
                                            {selectedBooking.category}
                                        </strong>

                                    </div>


                                    <div>

                                        <span>
                                            Estimated Fee
                                        </span>

                                        <strong className="fee-text">
                                            {selectedBooking.estimatedFee}
                                        </strong>

                                    </div>


                                    <div>

                                        <span>
                                            Requested On
                                        </span>

                                        <strong>
                                            {selectedBooking.requestedAt}
                                        </strong>

                                    </div>

                                </div>

                            </div>


                            {/* SCHEDULE */}

                            <div className="details-section">

                                <h3>

                                    <i className="bi bi-calendar-event"></i>

                                    Schedule

                                </h3>


                                <div className="schedule-detail-box">

                                    <div>

                                        <i className="bi bi-calendar3"></i>

                                        <span>
                                            Date
                                        </span>

                                        <strong>
                                            {selectedBooking.date}
                                        </strong>

                                    </div>


                                    <div>

                                        <i className="bi bi-clock"></i>

                                        <span>
                                            Time
                                        </span>

                                        <strong>
                                            {selectedBooking.time}
                                        </strong>

                                    </div>

                                </div>

                            </div>


                            {/* LOCATION */}

                            <div className="details-section">

                                <h3>

                                    <i className="bi bi-geo-alt"></i>

                                    Service Location

                                </h3>


                                <div className="address-box">

                                    <strong>
                                        {selectedBooking.location}
                                    </strong>

                                    <p>
                                        {selectedBooking.fullAddress}
                                    </p>

                                </div>

                            </div>


                            {/* DESCRIPTION */}

                            <div className="details-section">

                                <h3>

                                    <i className="bi bi-card-text"></i>

                                    Request Description

                                </h3>


                                <p className="request-description">
                                    {selectedBooking.description}
                                </p>

                            </div>


                            {/* SPECIAL INSTRUCTIONS */}

                            <div className="details-section">

                                <h3>

                                    <i className="bi bi-info-circle"></i>

                                    Special Instructions

                                </h3>


                                <div className="special-instructions">

                                    {selectedBooking.specialInstructions}

                                </div>

                            </div>


                            {/* MODAL ACTIONS */}

                            {selectedBooking.status === "New" && (

                                <div className="modal-actions">

                                    <button
                                        className="modal-decline-button"
                                        onClick={() =>
                                            handleDecline(
                                                selectedBooking.id
                                            )
                                        }
                                    >

                                        <i className="bi bi-x-circle"></i>

                                        Decline Request

                                    </button>


                                    <button
                                        className="modal-accept-button"
                                        onClick={() =>
                                            handleAccept(
                                                selectedBooking.id
                                            )
                                        }
                                    >

                                        <i className="bi bi-check-circle"></i>

                                        Accept Request

                                    </button>

                                </div>

                            )}

                        </div>

                    </div>

                )}

        </div>

    );

};


export default ProviderBookings;