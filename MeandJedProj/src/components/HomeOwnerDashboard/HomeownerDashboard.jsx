import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import "../../HomeownerDashboard.css";

import HomeownerSideBar from '../../components/HomeownerSideBar/HomeownerSideBar';
import BookingModal from "./BookingModal";
import BookingsTab from './BookingsTab';

const HomeownerDashboard = () => {
    const [userName, setUserName] = useState('Homeowner');

    // Active Tab State ('dashboard' o 'bookings')
    const [activeTab, setActiveTab] = useState('dashboard');

    // States para sa Booking Modal
    const [showModal, setShowModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('');

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUserName(parsedUser.fullName || 'Homeowner');
        }
    }, []);

    const handleOpenBooking = (categoryName) => {
        setSelectedCategory(categoryName);
        setShowModal(true);
    };

    return (
        <div className="dashboard-wrapper d-flex">
            <HomeownerSideBar />

            <main className="main-content flex-grow-1 p-4" style={{ marginLeft: '80px' }}>

                {/* Top Header Navigation */}
                <header className="d-flex justify-content-between align-items-center mb-4">
                    <div className="d-flex align-items-center gap-3">
                        <button
                            className={`btn btn-link nav-link-custom text-decoration-none fs-5 p-0 ${activeTab === 'dashboard' ? 'active-link fw-bold' : 'text-muted'}`}
                            onClick={() => setActiveTab('dashboard')}
                        >
                            Dashboard
                        </button>
                        <button
                            className={`btn btn-link nav-link-custom text-decoration-none fs-5 p-0 ${activeTab === 'bookings' ? 'active-link fw-bold' : 'text-muted'}`}
                            onClick={() => setActiveTab('bookings')}
                        >
                            Bookings
                        </button>
                        <Link to="/services" className="nav-link-custom text-decoration-none text-muted fs-5">
                            Services
                        </Link>
                    </div>

                    <div className="position-relative" style={{ width: '300px' }}>
                        <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted z-1"></i>
                        <input
                            type="text"
                            className="form-control rounded-pill ps-5 bg-white border-0 shadow-sm"
                            placeholder="Search service or provider..."
                        />
                    </div>

                    <div className="d-flex align-items-center gap-3">
                        <button className="btn btn-light rounded-circle shadow-sm"><i className="bi bi-bell"></i></button>
                        <button className="btn btn-light rounded-circle shadow-sm"><i className="bi bi-gear"></i></button>

                        <button
                            className="btn btn-theme text-white rounded-pill px-3 py-2 btn-sm fw-bold"
                            onClick={() => handleOpenBooking('General Service')}
                        >
                            + New Booking
                        </button>
                    </div>
                </header>

                {/* TAB 1: MAIN DASHBOARD VIEW */}
                {activeTab === 'dashboard' && (
                    <>
                        {/* Hero Section */}
                        <div className="row mb-4">
                            <div className="col-lg-4">
                                <h2 className="fw-bold theme-text">Welcome, {userName}! 👋</h2>
                                <h3 className="fw-semibold">What service do you need today?</h3>
                                <p className="text-muted extra-small">Connect with verified service providers in your neighborhood easily.</p>
                            </div>

                            <div className="col-lg-8">
                                <div className="d-flex gap-3 overflow-auto pb-2">
                                    <div
                                        className="quick-card bg-white p-3 rounded-4 shadow-sm text-center flex-fill"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleOpenBooking('Electrical Repair')}
                                    >
                                        <i className="bi bi-lightning-charge fs-2 theme-text mb-2"></i>
                                        <h6 className="fw-bold mb-1">Electrical</h6>
                                        <p className="text-muted extra-small mb-0">Repair & Wiring</p>
                                    </div>

                                    <div
                                        className="quick-card bg-white p-3 rounded-4 shadow-sm text-center flex-fill"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleOpenBooking('Plumbing')}
                                    >
                                        <i className="bi bi-droplet fs-2 theme-text mb-2"></i>
                                        <h6 className="fw-bold mb-1">Plumbing</h6>
                                        <p className="text-muted extra-small mb-0">Pipes & Leaks</p>
                                    </div>

                                    <div
                                        className="quick-card bg-white p-3 rounded-4 shadow-sm text-center flex-fill"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleOpenBooking('AC Cleaning')}
                                    >
                                        <i className="bi bi-wind fs-2 theme-text mb-2"></i>
                                        <h6 className="fw-bold mb-1">AC Cleaning</h6>
                                        <p className="text-muted extra-small mb-0">Maintenance</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Middle Grid */}
                        <div className="row g-4 mb-4">
                            <div className="col-md-4">
                                <div className="dashboard-card bg-white p-3 rounded-4 shadow-sm h-100">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h6 className="fw-bold m-0">Notifications</h6>
                                        <button className="btn btn-link text-muted p-0 extra-small">Clear</button>
                                    </div>
                                    <div className="notification-item p-2 mb-2 rounded-3 bg-light">
                                        <p className="fw-bold mb-0 small">Upcoming Service</p>
                                        <small className="text-muted extra-small"><i className="bi bi-calendar"></i> Sat, 10 May | 11:00 AM</small>
                                    </div>
                                    <div className="notification-item p-2 rounded-3 bg-light">
                                        <p className="fw-bold mb-0 small">Provider Message</p>
                                        <small className="text-muted extra-small">John replied to your inquiry...</small>
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-4">
                                <div className="dashboard-card bg-white p-3 rounded-4 shadow-sm h-100">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h6 className="fw-bold m-0">Active Request</h6>
                                        <i className="bi bi-pencil text-muted extra-small"></i>
                                    </div>
                                    <div className="p-3 border rounded-3 mb-3">
                                        <span className="badge bg-warning text-dark mb-2">Pending</span>
                                        <h6 className="fw-bold mb-1">Air Conditioner Repair</h6>
                                        <small className="text-muted">Tech Solutions Inc.</small>
                                    </div>
                                    <button
                                        className="btn btn-light w-100 rounded-pill fw-bold text-muted btn-sm"
                                        onClick={() => handleOpenBooking('Custom Request')}
                                    >
                                        + Add New Request
                                    </button>
                                </div>
                            </div>

                            <div className="col-md-4">
                                <div className="dashboard-card bg-white p-3 rounded-4 shadow-sm h-100">
                                    <h6 className="fw-bold mb-3">May 2026 Schedule</h6>
                                    <div className="d-flex justify-content-between mb-3 text-center">
                                        <span className="small text-muted">M<br />14</span>
                                        <span className="small text-muted">T<br />15</span>
                                        <span className="small text-muted">W<br />16</span>
                                        <span className="small fw-bold theme-text">T<br />17</span>
                                        <span className="small text-muted">F<br />18</span>
                                    </div>
                                    <div className="p-2 border-start border-3 border-primary bg-light mb-2 rounded-end">
                                        <small className="fw-bold d-block">Pipe Inspection</small>
                                        <small className="text-muted extra-small">10:00 AM - 11:30 AM</small>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Grid */}
                        <div className="row g-4">
                            <div className="col-md-8">
                                <div className="dashboard-card bg-white p-3 rounded-4 shadow-sm">
                                    <h6 className="fw-bold mb-3">Service History</h6>
                                    <div className="table-responsive">
                                        <table className="table align-middle">
                                            <thead>
                                                <tr className="text-muted extra-small">
                                                    <th>SERVICE</th>
                                                    <th>DURATION</th>
                                                    <th>STATUS</th>
                                                </tr>
                                            </thead>
                                            <tbody className="small">
                                                <tr>
                                                    <td className="fw-bold">House Cleaning</td>
                                                    <td className="text-muted">02 h 45 m</td>
                                                    <td><span className="badge bg-success-subtle text-success">Completed</span></td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-bold">Roof Repair</td>
                                                    <td className="text-muted">01 h 30 m</td>
                                                    <td><span className="badge bg-primary-subtle theme-text">In Progress</span></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-4">
                                <div className="promo-card p-4 rounded-4 text-white text-center d-flex flex-column justify-content-center align-items-center">
                                    <i className="bi bi-shield-check fs-1 mb-2"></i>
                                    <h5 className="fw-bold">Verified Guarantee</h5>
                                    <p className="extra-small opacity-75">All our home service professionals undergo strict background checks.</p>
                                    <button className="btn btn-light rounded-pill btn-sm fw-bold px-4">Learn More</button>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* TAB 2: BOOKINGS LIST VIEW */}
                {activeTab === 'bookings' && (
                    <BookingsTab />
                )}

            </main>

            {/* Modal */}
            <BookingModal
                show={showModal}
                handleClose={() => setShowModal(false)}
                initialCategory={selectedCategory}
            />
        </div>
    );
};

export default HomeownerDashboard;