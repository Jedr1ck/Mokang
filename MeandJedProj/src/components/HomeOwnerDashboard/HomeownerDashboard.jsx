
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../HomeownerDashboard.css';

import HomeownerSideBar from '../HomeownerSideBar/HomeownerSideBar';
import BookingModal from './BookingModal';

const SERVICES = [
    { name: 'Electrical', description: 'Repair & Wiring', category: 'Electrical Repair', icon: 'bi-lightning-charge' },
    { name: 'Plumbing', description: 'Pipes & Leaks', category: 'Plumbing', icon: 'bi-droplet' },
    { name: 'AC Cleaning', description: 'Maintenance', category: 'AC Cleaning', icon: 'bi-wind' },
    { name: 'Carpentry', description: 'Furniture & Woodwork', category: 'Carpentry', icon: 'bi-hammer' },
    { name: 'Pest Control', description: 'Pest Removal', category: 'Pest Control Technician', icon: 'bi-bug' },
    { name: 'Painting', description: 'Interior & Exterior', category: 'Painter', icon: 'bi-brush' },
    { name: 'Appliance Repair', description: 'Home Appliances', category: 'Appliance Repair Technician', icon: 'bi-tools' },
    { name: 'Locksmith', description: 'Locks & Keys', category: 'Locksmith', icon: 'bi-key' },
    { name: 'Deep Cleaning', description: 'Full Home Cleaning', category: 'Deep Cleaner', icon: 'bi-house' },
    { name: 'Massage Therapy', description: 'Home Wellness', category: 'Massage Therapist', icon: 'bi-heart-pulse' },
    { name: 'Hair Styling', description: 'Haircut & Styling', category: 'Hair Stylist / Barber', icon: 'bi-scissors' },
    { name: 'Nail Services', description: 'Manicure & Pedicure', category: 'Nail Technician (Manicurist/Pedicurist)', icon: 'bi-stars' },
    { name: 'Makeup Artist', description: 'Beauty Services', category: 'Makeup Artist', icon: 'bi-palette' },
    { name: 'Nursing & Care', description: 'Personal Care', category: 'Private Nurse / Caregiver', icon: 'bi-heart' },
    { name: 'Physical Therapy', description: 'Mobility & Recovery', category: 'Physical Therapist', icon: 'bi-person-walking' },
    { name: 'Computer & CCTV', description: 'Technical Support', category: 'Computer / CCTV Technician', icon: 'bi-pc-display' },
    { name: 'Tutoring & Training', description: 'Learning & Fitness', category: 'Private Tutor / Personal Fitness Trainer', icon: 'bi-book' }
];

const HomeownerDashboard = () => {
    const navigate = useNavigate();

    const [userName, setUserName] = useState('Homeowner');
    const [showModal, setShowModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('General Service');
    const [servicePage, setServicePage] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('user');

            if (storedUser) {
                const user = JSON.parse(storedUser);

                setUserName(
                    user.fullName ||
                    user.full_name ||
                    user.name ||
                    'Homeowner'
                );
            }
        } catch (error) {
            console.error('Unable to read saved user:', error);
        }
    }, []);

    const filteredServices = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        if (!query) {
            return SERVICES;
        }

        return SERVICES.filter((service) =>
            `${service.name} ${service.description} ${service.category}`
                .toLowerCase()
                .includes(query)
        );
    }, [searchQuery]);

    const totalPages = Math.ceil(filteredServices.length / 3);

    const visibleServices = filteredServices.slice(
        servicePage * 3,
        servicePage * 3 + 3
    );

    useEffect(() => {
        setServicePage((page) =>
            Math.min(page, Math.max(totalPages - 1, 0))
        );
    }, [totalPages]);

    const openBooking = (category = 'General Service') => {
        setSelectedCategory(category);
        setShowModal(true);
    };

    return (
        <div className="dashboard-wrapper d-flex">
            <HomeownerSideBar />

            <main
                className="main-content flex-grow-1 p-4"
                style={{ marginLeft: '80px', minWidth: 0 }}
            >
                {/* HEADER */}
                <header className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                    <button
                        type="button"
                        className="btn btn-link nav-link-custom active-link text-decoration-none fs-5 fw-bold p-0"
                        onClick={() => navigate('/homeowner-dashboard')}
                    >
                        Dashboard
                    </button>

                    {/* SEARCH */}
                    <div
                        className="position-relative"
                        style={{ width: 'min(100%, 330px)' }}
                    >
                        <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />

                        <input
                            type="search"
                            className="form-control rounded-pill ps-5 bg-white border-0 shadow-sm"
                            placeholder="Search service or provider..."
                            value={searchQuery}
                            onChange={(event) => {
                                setSearchQuery(event.target.value);
                                setServicePage(0);
                            }}
                        />
                    </div>

                    {/* HEADER ACTIONS */}
                    <div className="d-flex align-items-center gap-3">
                        <button
                            type="button"
                            className="btn btn-light rounded-circle shadow-sm"
                            title="Notifications"
                            aria-label="Notifications"
                            onClick={() => navigate('/notifications')}
                        >
                            <i className="bi bi-bell" />
                        </button>

                        {/* PROFILE DROPDOWN */}
                        <div className="position-relative">
                            <button
                                type="button"
                                className="btn btn-light rounded-pill shadow-sm d-flex align-items-center gap-2"
                                onClick={() =>
                                    setShowProfileMenu((value) => !value)
                                }
                                aria-expanded={showProfileMenu}
                            >
                                <i className="bi bi-person-circle theme-text fs-5" />

                                <span className="d-none d-md-inline">
                                    {userName}
                                </span>

                                <i className="bi bi-chevron-down small" />
                            </button>

                            {showProfileMenu && (
                                <div
                                    className="homeowner-profile-dropdown position-absolute end-0 mt-2 bg-white rounded-3 shadow p-2"
                                    style={{
                                        width: '190px',
                                        zIndex: 1050
                                    }}
                                >
                                    <button
                                        type="button"
                                        className="btn btn-light w-100 text-start mb-1"
                                        onClick={() => {
                                            setShowProfileMenu(false);
                                            navigate('/profile');
                                        }}
                                    >
                                        <i className="bi bi-person me-2" />
                                        My Profile
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-light w-100 text-start"
                                        onClick={() => {
                                            setShowProfileMenu(false);
                                            navigate('/settings');
                                        }}
                                    >
                                        <i className="bi bi-gear me-2" />
                                        Settings
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* NEW BOOKING */}
                        <button
                            type="button"
                            className="btn btn-theme text-white rounded-pill px-3 py-2 fw-bold"
                            onClick={() => openBooking()}
                        >
                            <i className="bi bi-plus-lg me-1" />
                            New Booking
                        </button>
                    </div>
                </header>

                {/* WELCOME */}
                <section className="mb-4">
                    <h2 className="fw-bold theme-text">
                        Welcome, {userName}! 👋
                    </h2>

                    <h3 className="fw-semibold">
                        What service do you need today?
                    </h3>

                    <p className="text-muted">
                        Connect with verified service providers in your
                        neighborhood easily.
                    </p>
                </section>

                {/* SERVICES CAROUSEL */}
                <section className="dashboard-card bg-white rounded-4 shadow-sm p-4 mb-4">
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                        <div>
                            <h4 className="fw-bold mb-1">
                                <i className="bi bi-grid-fill theme-text me-2" />
                                Explore Services
                            </h4>

                            <p className="text-muted small mb-0">
                                Choose a category to start your booking.
                            </p>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                            <span className="small text-muted">
                                {totalPages > 0
                                    ? `${servicePage + 1} / ${totalPages}`
                                    : '0 / 0'}
                            </span>

                            <button
                                type="button"
                                className="btn btn-light border rounded-circle"
                                aria-label="Previous services"
                                title="Previous services"
                                disabled={servicePage === 0}
                                onClick={() =>
                                    setServicePage((page) =>
                                        Math.max(0, page - 1)
                                    )
                                }
                            >
                                <i className="bi bi-chevron-left" />
                            </button>

                            <button
                                type="button"
                                className="btn btn-light border rounded-circle"
                                aria-label="Next services"
                                title="Next services"
                                disabled={
                                    totalPages === 0 ||
                                    servicePage >= totalPages - 1
                                }
                                onClick={() =>
                                    setServicePage((page) =>
                                        Math.min(totalPages - 1, page + 1)
                                    )
                                }
                            >
                                <i className="bi bi-chevron-right" />
                            </button>
                        </div>
                    </div>

                    <div className="row g-3">
                        {visibleServices.map((service) => (
                            <div
                                className="col-12 col-md-6 col-xl-4"
                                key={service.name}
                            >
                                <button
                                    type="button"
                                    className="quick-card bg-white p-4 rounded-4 shadow-sm text-center w-100 h-100"
                                    style={{ minHeight: '145px' }}
                                    onClick={() =>
                                        openBooking(service.category)
                                    }
                                >
                                    <i
                                        className={`bi ${service.icon} fs-2 theme-text d-block mb-2`}
                                    />

                                    <h6 className="fw-bold mb-1">
                                        {service.name}
                                    </h6>

                                    <p className="text-muted small mb-0">
                                        {service.description}
                                    </p>
                                </button>
                            </div>
                        ))}

                        {visibleServices.length === 0 && (
                            <div className="col-12 text-center text-muted py-5">
                                No matching services found.
                            </div>
                        )}
                    </div>
                </section>

                {/* DASHBOARD CARDS */}
                <div className="row g-4 mb-4">
                    {/* NOTIFICATIONS */}
                    <div className="col-12 col-lg-4">
                        <section className="dashboard-card bg-white p-3 rounded-4 shadow-sm h-100">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="fw-bold m-0">
                                    Notifications
                                </h6>

                                <button
                                    type="button"
                                    className="btn btn-link text-muted p-0 small"
                                    onClick={() =>
                                        navigate('/notifications')
                                    }
                                >
                                    View all
                                </button>
                            </div>

                            <div className="notification-item p-3 mb-2 rounded-3 bg-light">
                                <p className="fw-bold mb-1 small">
                                    Upcoming Service
                                </p>

                                <small className="text-muted">
                                    Check your bookings for schedule updates.
                                </small>
                            </div>

                            <div className="notification-item p-3 rounded-3 bg-light">
                                <p className="fw-bold mb-1 small">
                                    Provider Updates
                                </p>

                                <small className="text-muted">
                                    View updates from your service providers.
                                </small>
                            </div>
                        </section>
                    </div>

                    {/* ACTIVE REQUEST */}
                    <div className="col-12 col-lg-4">
                        <section className="dashboard-card bg-white p-3 rounded-4 shadow-sm h-100">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="fw-bold m-0">
                                    Active Request
                                </h6>

                                <i className="bi bi-calendar-check theme-text" />
                            </div>

                            <div className="p-3 border rounded-3 mb-3">
                                <span className="badge bg-warning text-dark mb-2">
                                    Booking
                                </span>

                                <h6 className="fw-bold mb-1">
                                    Need a service?
                                </h6>

                                <small className="text-muted">
                                    Create a new request to get started.
                                </small>
                            </div>

                            <button
                                type="button"
                                className="btn btn-light w-100 rounded-pill fw-bold btn-sm"
                                onClick={() => openBooking()}
                            >
                                <i className="bi bi-plus-lg me-1" />
                                Add New Request
                            </button>
                        </section>
                    </div>

                    {/* SCHEDULE */}
                    <div className="col-12 col-lg-4">
                        <section className="dashboard-card bg-white p-3 rounded-4 shadow-sm h-100">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="fw-bold m-0">
                                    My Schedule
                                </h6>

                                <button
                                    type="button"
                                    className="btn btn-link text-decoration-none small theme-text p-0"
                                    onClick={() => navigate('/calendar')}
                                >
                                    View
                                </button>
                            </div>

                            <div className="text-center py-4">
                                <i className="bi bi-calendar-week fs-1 theme-text" />

                                <p className="text-muted small mt-2 mb-0">
                                    Visit your calendar to view scheduled services.
                                </p>
                            </div>
                        </section>
                    </div>
                </div>

                {/* VERIFIED GUARANTEE */}
                <section className="promo-card p-4 rounded-4 text-white text-center d-flex flex-column justify-content-center align-items-center">
                    <i className="bi bi-shield-check fs-1 mb-2" />

                    <h5 className="fw-bold">
                        Verified Guarantee
                    </h5>

                    <p className="small opacity-75 mb-3">
                        Connect with home service professionals for your needs.
                    </p>

                    <button
                        type="button"
                        className="btn btn-light rounded-pill btn-sm fw-bold px-4"
                        onClick={() => navigate('/services')}
                    >
                        Explore Providers
                    </button>
                </section>
            </main>

            {/* BOOKING MODAL */}
            <BookingModal
                show={showModal}
                handleClose={() => setShowModal(false)}
                initialCategory={selectedCategory}
            />
        </div>
    );
};

export default HomeownerDashboard;
