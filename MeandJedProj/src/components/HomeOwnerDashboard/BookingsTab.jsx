import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../HomeownerDashboard.css';
import { api, getMyBookings } from '../../services/api';
import HomeownerSideBar from '../HomeownerSideBar/HomeownerSideBar';
import ConfirmDialog from '../ConfirmDialog';

const BOOKING_FILTERS = [
    { label: 'All', matches: () => true },
    { label: 'Pending', matches: (status) => status === 'Pending' },
    { label: 'Confirmed', matches: (status) => ['Matched', 'Accepted'].includes(status) },
    { label: 'In Progress', matches: (status) => ['On the Way', 'In Progress'].includes(status) },
    { label: 'Completed', matches: (status) => status === 'Completed' },
    { label: 'Cancelled', matches: (status) => ['Cancelled', 'Rejected'].includes(status) },
];

const BookingsTab = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [activeFilter, setActiveFilter] = useState('All');
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [actionError, setActionError] = useState('');
    const [cancellingId, setCancellingId] = useState(null);
    const [bookingToCancel, setBookingToCancel] = useState(null);

    useEffect(() => {
        let active = true;
        getMyBookings()
            .then((rows) => { if (active) setBookings(rows); })
            .catch((error) => { if (active) setLoadError(error.message || 'Unable to load your bookings.'); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);

    const filteredBookings = useMemo(() => {
        const filter = BOOKING_FILTERS.find((item) => item.label === activeFilter);
        return bookings.filter((booking) => filter.matches(booking.status || 'Pending'));
    }, [activeFilter, bookings]);

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
            case 'Cancelled':
            case 'Rejected':
                return <span className="badge bg-danger-subtle text-danger rounded-pill px-3 py-2 fw-semibold">{status}</span>;
            default:
                return <span className="badge bg-secondary-subtle text-secondary rounded-pill px-3 py-2 fw-semibold">{status || 'Pending'}</span>;
        }
    };

    const handleTrackBooking = (booking) => {
        navigate('/track-booking', { state: { booking } });
    };

    const handleCancelBooking = async () => {
        if (!bookingToCancel) return;
        setActionError('');
        setCancellingId(bookingToCancel.id);
        try {
            const updatedBooking = await api(`/bookings/${bookingToCancel.id}/cancel`, { method: 'PATCH' });
            setBookings((current) => current.map((item) => item.id === bookingToCancel.id ? updatedBooking : item));
            setBookingToCancel(null);
        } catch (error) {
            setActionError(error.message || 'Unable to cancel this booking.');
        } finally {
            setCancellingId(null);
        }
    };

    return (
        <div className="profile-page-container">
            <HomeownerSideBar />
            <main className="profile-main-content">
                <header className="profile-header">
                    <div>
                        <h2>My Bookings</h2>
                        <p className="text-muted mb-0">Check requests, track service progress, and view completed services.</p>
                    </div>
                    <button type="button" className="btn btn-success rounded-pill px-3" onClick={() => navigate('/services')}>
                        <i className="bi bi-plus-lg me-2" />Book a Service
                    </button>
                </header>

                <nav className="d-flex flex-wrap gap-2 my-4" aria-label="Filter bookings">
                    {BOOKING_FILTERS.map((filter) => (
                        <button
                            type="button"
                            key={filter.label}
                            className={`btn btn-sm rounded-pill px-3 ${activeFilter === filter.label ? 'btn-success' : 'btn-outline-secondary'}`}
                            aria-pressed={activeFilter === filter.label}
                            onClick={() => setActiveFilter(filter.label)}
                        >
                            {filter.label}
                            <span className="ms-2">{bookings.filter((booking) => filter.matches(booking.status || 'Pending')).length}</span>
                        </button>
                    ))}
                </nav>

                {loadError && <div className="alert alert-danger" role="alert">{loadError}</div>}
                {actionError && <div className="alert alert-danger" role="alert">{actionError}</div>}
                {loading ? (
                    <div className="text-center py-5" role="status">
                        <span className="spinner-border text-success" aria-hidden="true" />
                        <span className="visually-hidden">Loading bookings...</span>
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <div className="text-center py-5 bg-white rounded-4 shadow-sm">
                        <i className="bi bi-calendar-x display-4 text-muted mb-3 d-block" />
                        <h5 className="fw-bold text-muted">{bookings.length ? `No ${activeFilter.toLowerCase()} bookings` : 'No Bookings Yet'}</h5>
                        <p className="text-muted small">{bookings.length ? 'Bookings in this category will appear here.' : "You haven't requested any services yet."}</p>
                        {!bookings.length && (
                            <button type="button" className="btn btn-success rounded-pill px-3" onClick={() => navigate('/services')}>Browse Services</button>
                        )}
                    </div>
                ) : (
                    <div className="row g-3">
                        {filteredBookings.map((booking) => {
                            const status = booking.status || 'Pending';
                            const canCancel = ['Pending', 'Matched'].includes(status);
                            const isClosed = ['Cancelled', 'Rejected'].includes(status);
                            return (
                                <div key={booking.id} className="col-12">
                                    <article className="card border-0 shadow-sm rounded-4 p-3 p-md-4 bg-white">
                                        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="rounded-circle bg-light p-3 d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                                                    <i className={`bi ${status === 'Completed' ? 'bi-check-circle-fill' : 'bi-tools'} text-success fs-4`} />
                                                </div>
                                                <div>
                                                    <span className="text-muted extra-small d-block fw-bold">{booking.bookingCode || `REQ-${booking.id}`}</span>
                                                    <h6 className="fw-bold text-dark m-0">{booking.serviceName || booking.category || 'Service'}{booking.description ? ` - ${booking.description}` : ''}</h6>
                                                    <small className="text-muted d-flex flex-wrap align-items-center gap-2 mt-1">
                                                        <span><i className="bi bi-calendar3 me-1" />{booking.preferredDate || 'Date to be confirmed'}</span>
                                                        {booking.preferredTime && <span><i className="bi bi-clock me-1" />{booking.preferredTime}</span>}
                                                    </small>
                                                    {booking.providerName && <small className="text-muted d-block mt-1">Provider: {booking.providerName}</small>}
                                                </div>
                                            </div>
                                            <div className="d-flex flex-wrap align-items-center gap-2 ms-auto">
                                                {getStatusBadge(status)}
                                                {!isClosed && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-success btn-sm rounded-pill px-3 fw-bold d-flex align-items-center gap-1"
                                                        onClick={() => handleTrackBooking(booking)}
                                                    >
                                                        <i className="bi bi-geo-alt" /> Track Status
                                                    </button>
                                                )}
                                                {canCancel && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-danger btn-sm rounded-pill px-3 fw-bold"
                                                        disabled={cancellingId === booking.id}
                                                        onClick={() => setBookingToCancel(booking)}
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </article>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
            <ConfirmDialog
                open={Boolean(bookingToCancel)}
                title="Cancel booking?"
                message={`Are you sure you want to cancel your ${bookingToCancel?.category || 'service'} booking request? The provider will be notified.`}
                confirmLabel="Cancel booking"
                icon="bi-calendar-x"
                tone="danger"
                busy={Boolean(cancellingId)}
                onConfirm={handleCancelBooking}
                onCancel={() => setBookingToCancel(null)}
            />
        </div>
    );
};

export default BookingsTab;