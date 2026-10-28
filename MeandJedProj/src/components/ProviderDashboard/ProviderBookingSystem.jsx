import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getMyBookings,
    rescheduleBooking,
    updateBookingStatus,
} from '../../services/api';
import ConfirmDialog from '../ConfirmDialog';
import myLogo from '../../assets/images/logo.png';
import './ProviderBookingSystem.css';

const filters = ['All Bookings', 'Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];

function getDisplayStatus(status) {
    if (status === 'Pending') return 'Pending';
    if (['Accepted', 'Matched'].includes(status)) return 'Confirmed';
    if (['On the Way', 'In Progress'].includes(status)) return 'In Progress';
    if (status === 'Completed') return 'Completed';
    if (['Cancelled', 'Rejected'].includes(status)) return 'Cancelled';
    return status || 'Pending';
}

function formatDate(value, options = { month: 'short', day: 'numeric', year: 'numeric' }) {
    if (!value) return 'Date not set';
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, options);
}

function getInitials(name) {
    return (name || 'Homeowner')
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0] || '')
        .join('')
        .toUpperCase();
}

export default function ProviderBookingSystem() {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [filter, setFilter] = useState('All Bookings');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionError, setActionError] = useState('');
    const [busy, setBusy] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [showReschedule, setShowReschedule] = useState(false);
    const [rescheduleDate, setRescheduleDate] = useState('');
    const [rescheduleTime, setRescheduleTime] = useState('');
    const [provider] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('user') || '{}');
        } catch (parseError) {
            console.error('Unable to read provider account:', parseError);
            return {};
        }
    });

    useEffect(() => {
        let active = true;
        getMyBookings()
            .then((items) => {
                if (!active) return;
                setBookings(items);
                setSelectedId(items[0]?.id ?? null);
            })
            .catch((loadError) => {
                if (active) setError(loadError.message || 'Unable to load bookings.');
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, []);

    const counts = useMemo(() => {
        const result = Object.fromEntries(filters.map((item) => [item, 0]));
        result['All Bookings'] = bookings.length;
        bookings.forEach((booking) => {
            const status = getDisplayStatus(booking.status);
            if (Object.hasOwn(result, status)) result[status] += 1;
        });
        return result;
    }, [bookings]);

    const visibleBookings = useMemo(() => {
        const query = search.trim().toLowerCase();
        return bookings.filter((booking) => {
            const status = getDisplayStatus(booking.status);
            const matchesFilter = filter === 'All Bookings' || filter === status;
            const matchesSearch = !query || [
                booking.bookingCode,
                booking.customerName,
                booking.serviceName,
                booking.category,
                booking.address,
            ].some((value) => String(value || '').toLowerCase().includes(query));
            return matchesFilter && matchesSearch;
        });
    }, [bookings, filter, search]);

    const selectedBooking = visibleBookings.find((booking) => booking.id === selectedId)
        || visibleBookings[0]
        || null;
    const selectedStatus = selectedBooking ? getDisplayStatus(selectedBooking.status) : '';
    const providerName = provider.fullName || provider.name || 'Service Provider';
    const profileImage = provider.profilePicture || provider.profileImage;

    const applyBookingUpdate = (updated) => {
        setBookings((previous) => previous.map((booking) =>
            booking.id === updated.id ? updated : booking
        ));
        setSelectedId(updated.id);
    };

    const changeStatus = async (status) => {
        if (!selectedBooking || busy) return false;
        setBusy(true);
        setActionError('');
        try {
            const updated = await updateBookingStatus(selectedBooking.id, status);
            applyBookingUpdate(updated);
            return true;
        } catch (actionFailure) {
            setActionError(actionFailure.message || 'Unable to update this booking.');
            return false;
        } finally {
            setBusy(false);
        }
    };

    const saveReschedule = async (event) => {
        event.preventDefault();
        if (!selectedBooking || busy) return;
        setBusy(true);
        setActionError('');
        try {
            const updated = await rescheduleBooking(
                selectedBooking.id,
                rescheduleDate,
                rescheduleTime
            );
            applyBookingUpdate(updated);
            setShowReschedule(false);
        } catch (actionFailure) {
            setActionError(actionFailure.message || 'Unable to reschedule this booking.');
        } finally {
            setBusy(false);
        }
    };

    const startReschedule = () => {
        if (!selectedBooking) return;
        setRescheduleDate(selectedBooking.preferredDate || '');
        setRescheduleTime(String(selectedBooking.preferredTime || '').slice(0, 5));
        setActionError('');
        setShowReschedule(true);
    };

    const sendMessage = () => {
        if (selectedBooking) {
            navigate('/provider-messages', {
                state: { bookingId: selectedBooking.id },
            });
        }
    };

    const statusStep = selectedStatus === 'Pending'
        ? 0
        : selectedStatus === 'Confirmed'
            ? 1
            : selectedStatus === 'In Progress'
                ? 2
                : selectedStatus === 'Completed'
                    ? 3
                    : selectedStatus === 'Cancelled'
                        ? 4
                        : 0;

    return (
        <main className="provider-booking-system">
            <header className="pbs-topbar">
                <button
                    type="button"
                    className="pbs-brand"
                    aria-label="Go to Provider Dashboard"
                    onClick={() => navigate('/provider-dashboard')}
                >
                    <img src={myLogo} alt="" />
                </button>
                <label className="pbs-search">
                    <i className="bi bi-search" />
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search bookings, customers, or services..."
                    />
                </label>
                <button
                    className="pbs-icon-button"
                    type="button"
                    aria-label="Notifications"
                    onClick={() => navigate('/provider-notifications')}
                >
                    <i className="bi bi-bell" />
                    <span />
                </button>
                <button
                    type="button"
                    className="pbs-profile-button"
                    onClick={() => navigate('/provider-profile')}
                >
                    {profileImage
                        ? <img src={profileImage} alt="" />
                        : <span className="pbs-avatar-fallback">{getInitials(providerName)}</span>}
                    <span>
                        <strong>{providerName}</strong>
                        <small>Service Provider</small>
                    </span>
                    <i className="bi bi-chevron-down" />
                </button>
            </header>

            <section className="pbs-page-heading">
                <div>
                    <h1>My Bookings</h1>
                    <p>Manage and track all your service bookings.</p>
                </div>
                <button type="button" onClick={() => navigate('/provider-schedule')}>
                    <i className="bi bi-calendar-event" />
                    Set Availability
                    <i className="bi bi-arrow-right" />
                </button>
            </section>

            {error && <div className="alert alert-danger" role="alert">{error}</div>}

            <nav className="pbs-filter-tabs" aria-label="Filter bookings">
                {filters.map((item) => (
                    <button
                        key={item}
                        type="button"
                        className={`pbs-filter-tab ${filter === item ? 'active' : ''} ${item.toLowerCase().replaceAll(' ', '-')}`}
                        onClick={() => setFilter(item)}
                    >
                        {item}
                        <span>{counts[item]}</span>
                    </button>
                ))}
            </nav>

            <section className="pbs-booking-workspace">
                <div className="pbs-booking-list" aria-label="Bookings">
                    {loading ? (
                        <div className="pbs-list-state">Loading bookings...</div>
                    ) : visibleBookings.length === 0 ? (
                        <div className="pbs-list-state">
                            <i className="bi bi-calendar2-x" />
                            <strong>No bookings found</strong>
                            <span>Try another filter or search term.</span>
                        </div>
                    ) : visibleBookings.map((booking) => {
                        const displayStatus = getDisplayStatus(booking.status);
                        return (
                            <button
                                type="button"
                                className={`pbs-booking-card ${selectedBooking?.id === booking.id ? 'selected' : ''}`}
                                key={booking.id}
                                onClick={() => {
                                    setSelectedId(booking.id);
                                    setActionError('');
                                }}
                            >
                                {booking.customerProfilePicture
                                    ? <img className="pbs-customer-image" src={booking.customerProfilePicture} alt="" />
                                    : <span className="pbs-customer-image pbs-avatar-fallback">{getInitials(booking.customerName)}</span>}
                                <span className="pbs-card-copy">
                                    <strong>{booking.serviceName || booking.category || 'Service request'}</strong>
                                    <span>{booking.customerName || 'Homeowner'}</span>
                                    <small><i className="bi bi-calendar-event" />{formatDate(booking.preferredDate)} <b>·</b> {booking.preferredTime || 'Time not set'}</small>
                                    <small><i className="bi bi-geo-alt" />{booking.address || 'Address not provided'}</small>
                                </span>
                                <span className={`pbs-status-pill ${displayStatus.toLowerCase().replaceAll(' ', '-')}`}>
                                    {displayStatus}
                                </span>
                                <i className="bi bi-chevron-right pbs-card-chevron" />
                            </button>
                        );
                    })}
                </div>

                <section className="pbs-booking-detail" aria-label="Selected booking details">
                    {!selectedBooking ? (
                        <div className="pbs-detail-empty">
                            <i className="bi bi-calendar-check" />
                            <h2>Select a booking</h2>
                            <p>Choose a booking from the list to see details.</p>
                        </div>
                    ) : (
                        <>
                            <header className="pbs-detail-heading">
                                <div>
                                    <span className={`pbs-status-pill ${selectedStatus.toLowerCase().replaceAll(' ', '-')}`}>
                                        {selectedStatus}
                                    </span>
                                    <h2>{selectedBooking.category || 'Service request'}</h2>
                                    <p>Booking ID: #{selectedBooking.bookingCode || selectedBooking.id}</p>
                                    <p><i className="bi bi-calendar-event" />{formatDate(selectedBooking.preferredDate)} <b>·</b> {selectedBooking.preferredTime || 'Time not set'}</p>
                                    <p><i className="bi bi-geo-alt" />{selectedBooking.address || 'Address not provided'}</p>
                                </div>
                            </header>

                            <section className="pbs-detail-section pbs-customer-section">
                                <div className="pbs-section-heading">
                                    <i className="bi bi-person" />
                                    <h3>Customer Information</h3>
                                </div>
                                <div className="pbs-customer-details">
                                    {selectedBooking.customerProfilePicture
                                        ? <img src={selectedBooking.customerProfilePicture} alt="" />
                                        : <span className="pbs-customer-image pbs-avatar-fallback">{getInitials(selectedBooking.customerName)}</span>}
                                    <div>
                                        <strong>{selectedBooking.customerName || 'Homeowner'}</strong>
                                        <span><i className="bi bi-telephone" />{selectedBooking.customerPhone || 'Phone not provided'}</span>
                                        <span><i className="bi bi-geo-alt" />{selectedBooking.address || 'Address not provided'}</span>
                                    </div>
                                    <button type="button" onClick={sendMessage}>
                                        <i className="bi bi-chat-dots" /> Message
                                    </button>
                                </div>
                            </section>

                            <section className="pbs-detail-section">
                                <div className="pbs-section-heading">
                                    <i className="bi bi-clipboard2" />
                                    <h3>Service Details</h3>
                                </div>
                                <dl className="pbs-service-details">
                                    <dt>Service Type</dt>
                                    <dd>{selectedBooking.serviceName || selectedBooking.category || 'Home service'}</dd>
                                    <dt>Description</dt>
                                    <dd>{selectedBooking.description || 'No description provided.'}</dd>
                                </dl>
                            </section>

                            <section className="pbs-detail-section pbs-status-section">
                                <div className="pbs-section-heading">
                                    <i className="bi bi-calendar-check" />
                                    <h3>Booking Status</h3>
                                </div>
                                <div className="pbs-status-content">
                                    <ol className="pbs-status-timeline">
                                        {['Request Sent', 'Accepted', 'In Progress', 'Completed', 'Cancelled'].map((step, index) => {
                                            const cancelled = selectedStatus === 'Cancelled';
                                            const isCurrent = cancelled ? index === 4 : index === statusStep;
                                            const isDone = !cancelled && index < statusStep;
                                            const isFutureCancelled = index === 4 && !cancelled;
                                            if (isFutureCancelled) return null;
                                            return (
                                                <li className={`${isCurrent ? 'current' : ''} ${isDone ? 'done' : ''} ${cancelled && index < 4 ? 'cancelled-before' : ''}`} key={step}>
                                                    <span className="pbs-timeline-dot">
                                                        {isDone ? <i className="bi bi-check-lg" /> : null}
                                                    </span>
                                                    <strong>{step}</strong>
                                                    {isCurrent && <small>{formatDate(selectedBooking.preferredDate)} · {selectedBooking.preferredTime || ''}</small>}
                                                </li>
                                            );
                                        })}
                                    </ol>
                                    <div className="pbs-booking-actions">
                                        {selectedStatus === 'Pending' && (
                                            <button type="button" className="primary" onClick={() => changeStatus('Accepted')} disabled={busy}>
                                                <i className="bi bi-check-lg" /> Accept Booking
                                            </button>
                                        )}
                                        {selectedStatus === 'Confirmed' && (
                                            <button type="button" className="primary" onClick={() => changeStatus('In Progress')} disabled={busy}>
                                                <i className="bi bi-play-fill" /> Start Service
                                            </button>
                                        )}
                                        {selectedStatus === 'In Progress' && (
                                            <button type="button" className="primary" onClick={() => changeStatus('Completed')} disabled={busy}>
                                                <i className="bi bi-check-lg" /> Mark as Completed
                                            </button>
                                        )}
                                        {!['Completed', 'Cancelled'].includes(selectedStatus) && (
                                            <>
                                                <button type="button" className="secondary" onClick={startReschedule} disabled={busy}>
                                                    <i className="bi bi-calendar-event" /> Reschedule
                                                </button>
                                                <button
                                                    type="button"
                                                    className="danger"
                                                    onClick={() => setShowCancelConfirm(true)}
                                                    disabled={busy}
                                                >
                                                    <i className="bi bi-x-lg" /> Cancel Booking
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </section>
                            {actionError && <div className="alert alert-danger pbs-action-error" role="alert">{actionError}</div>}
                        </>
                    )}
                </section>
            </section>

            {showReschedule && selectedBooking && (
                <div className="pbs-modal-backdrop" onMouseDown={(event) => {
                    if (event.target === event.currentTarget && !busy) setShowReschedule(false);
                }}>
                    <form className="pbs-reschedule-modal" onSubmit={saveReschedule}>
                        <h2>Reschedule Booking</h2>
                        <p>Choose a new date and time for this appointment.</p>
                        {actionError && <div className="alert alert-danger" role="alert">{actionError}</div>}
                        <label>
                            Date
                            <input type="date" required value={rescheduleDate} onChange={(event) => setRescheduleDate(event.target.value)} />
                        </label>
                        <label>
                            Time
                            <input type="time" required value={rescheduleTime} onChange={(event) => setRescheduleTime(event.target.value)} />
                        </label>
                        <div>
                            <button type="button" onClick={() => setShowReschedule(false)} disabled={busy}>Cancel</button>
                            <button type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save New Time'}</button>
                        </div>
                    </form>
                </div>
            )}
            <ConfirmDialog
                open={showCancelConfirm}
                title="Cancel this booking?"
                message={`The homeowner will be notified that the ${selectedBooking?.category || 'service'} booking was cancelled.`}
                confirmLabel="Cancel booking"
                tone="danger"
                icon="bi-calendar-x"
                busy={busy}
                onConfirm={async () => {
                    if (await changeStatus('Cancelled')) setShowCancelConfirm(false);
                }}
                onCancel={() => setShowCancelConfirm(false)}
            />
        </main>
    );
}
