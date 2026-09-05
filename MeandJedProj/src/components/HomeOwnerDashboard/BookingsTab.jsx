import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { api } from '../../services/api';

const BookingsTab = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);

    useEffect(() => {
        api('/bookings/my').then(setBookings).catch((e) => console.error(e));
    }, []);

    // Color helper para sa mga status badges
    const getStatusBadge = (status) => {
        switch (status) {
            case 'Pending':
                return <span className="badge bg-secondary-subtle text-secondary rounded-pill px-3 py-2 fw-semibold">Pending</span>;
            case 'Matched':
                return <span className="badge bg-info-subtle text-info-emphasis rounded-pill px-3 py-2 fw-semibold">Matched</span>;
            case 'Accepted':
                return <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-2 fw-semibold">Accepted</span>;
            case 'On the Way':
                return <span className="badge bg-warning-subtle text-warning-emphasis rounded-pill px-3 py-2 fw-semibold">On the Way</span>;
            case 'In Progress':
                return <span className="badge bg-primary rounded-pill px-3 py-2 fw-semibold">In Progress</span>;
            case 'Completed':
                return <span className="badge bg-warning text-white rounded-pill px-3 py-2 fw-semibold" style={{ backgroundColor: '#fd7e14' }}>Completed</span>;
            default:
                return <span className="badge bg-secondary-subtle text-secondary rounded-pill px-3 py-2 fw-semibold">Pending</span>;
        }
    };

    // Handler para sa pag-pass ng tiyak na booking data sa Tracking page
    const handleTrackBooking = (booking) => {
        navigate('/track-booking', { state: { booking } });
    };

    return (
        <div className="container py-3">
            <h4 className="fw-bold mb-4" style={{ color: '#0f3a2e' }}>My Bookings</h4>

            {bookings.length === 0 ? (
                <div className="text-center py-5 bg-white rounded-4 shadow-sm">
                    <i className="bi bi-calendar-x display-4 text-muted mb-3 d-block"></i>
                    <h5 className="fw-bold text-muted">No Bookings Yet</h5>
                    <p className="text-muted small">You haven't requested any services yet.</p>
                </div>
            ) : (
                <div className="row g-3">
                    {bookings.map((booking, index) => (
                        <div key={index} className="col-12">
                            <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
                                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">

                                    {/* Left Info */}
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="rounded-circle bg-light p-3 d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                                            <i className="bi bi-tools text-success fs-4"></i>
                                        </div>
                                        <div>
                                            <span className="text-muted extra-small d-block fw-bold">{booking.bookingCode || booking.id || `REQ-#00${index + 1}`}</span>
                                            <h6 className="fw-bold text-dark m-0">{booking.category} {booking.description ? `- ${booking.description}` : ''}</h6>
                                            <small className="text-muted d-flex align-items-center gap-2 mt-1">
                                                <span><i className="bi bi-calendar3"></i> {booking.preferredDate}</span>
                                                <span><i className="bi bi-clock"></i> {booking.preferredTime}</span>
                                            </small>
                                        </div>
                                    </div>

                                    {/* Right Status & Action */}
                                    <div className="d-flex align-items-center gap-3 ms-auto">
                                        {getStatusBadge(booking.status || 'Pending')}

                                        <button
                                            className="btn btn-outline-success btn-sm rounded-pill px-3 fw-bold d-flex align-items-center gap-1"
                                            onClick={() => handleTrackBooking(booking)}
                                        >
                                            <i className="bi bi-geo-alt"></i> Track Status
                                        </button>
                                    </div>

                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BookingsTab;