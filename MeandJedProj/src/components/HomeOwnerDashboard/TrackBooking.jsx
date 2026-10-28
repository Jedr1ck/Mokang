import { Fragment, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { getMyBookings } from '../../services/api';
import './TrackBooking.css';

const TrackBooking = () => {
    const location = useLocation();
    const selectedBookingId = location.state?.booking?.id;
    const [bookingData, setBookingData] = useState(location.state?.booking || null);
    const [loading, setLoading] = useState(!location.state?.booking);
    const [loadError, setLoadError] = useState('');

    useEffect(() => {
        let active = true;
        const loadBooking = () => {
            getMyBookings()
                .then((bookings) => {
                    if (!active) return;
                    const latestBooking = selectedBookingId
                        ? bookings.find((booking) => String(booking.id) === String(selectedBookingId))
                        : bookings[0];
                    if (latestBooking) {
                        setBookingData(latestBooking);
                        setLoadError('');
                    } else {
                        setLoadError('This booking is no longer available.');
                    }
                })
                .catch((error) => {
                    if (active) setLoadError(error.message || 'Unable to load booking status.');
                })
                .finally(() => {
                    if (active) setLoading(false);
                });
        };
        loadBooking();
        const intervalId = window.setInterval(loadBooking, 15000);
        return () => {
            active = false;
            window.clearInterval(intervalId);
        };
    }, [selectedBookingId]);

    // Listahan ng lahat ng steps
    const steps = [
        { label: 'Pending', icon: 'bi-clock-history' },
        { label: 'Matched', icon: 'bi-person-check-fill' },
        { label: 'Accepted', icon: 'bi-person-badge-fill' },
        { label: 'On the Way', icon: 'bi-truck' },
        { label: 'In Progress', icon: 'bi-tools' },
        { label: 'Completed', icon: 'bi-check-circle-fill' }
    ];

    // Hanapin ang index base sa status ng booking (Halimbawa: "Pending" = Index 0)
    const status = (bookingData?.status || 'pending').toLowerCase();
    const currentStep = steps.findIndex((step) => step.label.toLowerCase() === status);

    // Siguraduhing valid ang step index (0 kung di mahanap)
    const activeIndex = currentStep !== -1 ? currentStep : 0;
    const isCompleted = status === 'completed';
    const isClosed = ['cancelled', 'rejected'].includes(status);
    const statusTone = isClosed
        ? 'closed'
        : isCompleted
            ? 'completed'
            : ['on the way', 'in progress'].includes(status)
                ? 'in-progress'
                : ['matched', 'accepted'].includes(status)
                    ? 'confirmed'
                    : 'pending';

    const getStatusText = (stepIndex) => {
        switch (stepIndex) {
            case 0:
                return { title: "Waiting for Provider", desc: "Your booking request is currently pending review." };
            case 1:
                return { title: "Provider Matched", desc: "A service provider has been assigned to your request." };
            case 2:
                return { title: "Request Accepted", desc: "Provider has accepted your booking request." };
            case 3:
                return { title: "Provider On the Way", desc: "The provider is traveling to your location." };
            case 4:
                return { title: "Service In Progress", desc: "The provider is currently working on your request." };
            case 5:
                return { title: "Service Completed", desc: "Job has been completed successfully." };
            default:
                return { title: "", desc: "" };
        }
    };

    if (loading) {
        return <div className="tracking-page tracking-loading"><div className="spinner-border text-success" role="status"><span className="visually-hidden">Loading booking...</span></div></div>;
    }

    if (loadError || !bookingData) {
        return (
            <div className="tracking-page">
                <Link to="/homeowner-dashboard" className="text-decoration-none text-dark fw-bold">
                    <i className="bi bi-arrow-left me-2"></i>Back to Dashboard
                </Link>
                <div className="alert alert-info mt-4" role="status">{loadError || 'No booking selected.'}</div>
                <Link to="/bookings" className="btn btn-success rounded-pill">View My Bookings</Link>
            </div>
        );
    }

    return (
        <main className="tracking-page">
            {/* Header */}
            <div className="tracking-header">
                <Link to="/homeowner-dashboard" className="text-decoration-none text-dark fw-bold d-flex align-items-center gap-2">
                    <i className="bi bi-arrow-left fs-5"></i> Back to Dashboard
                </Link>
                <h1>Track Booking</h1>
            </div>

            {/* Main Card */}
            <section className="tracking-card">

                <div className="tracking-card-heading">
                    <div>
                        <small>REQUEST NUMBER</small>
                        <strong>{bookingData.bookingCode || bookingData.id}</strong>
                    </div>
                    <span className={`tracking-status tracking-status-${statusTone}`}>
                        {isClosed ? bookingData.status : steps[activeIndex].label}
                    </span>
                </div>

                <div className="tracking-booking-summary">
                    <strong>{bookingData.serviceName || bookingData.category || 'Service booking'}</strong>
                    <span>{bookingData.preferredDate || 'Date to be confirmed'}{bookingData.preferredTime ? ` at ${bookingData.preferredTime}` : ''}</span>
                    {bookingData.providerName && <span>Provider: {bookingData.providerName}</span>}
                </div>

                {/* Stepper Bar */}
                {!isClosed && <div className="tracking-stepper-scroll"><div className="tracking-stepper">
                    {steps.map((step, index) => {
                        const isPassed = index < activeIndex;
                        const isCurrent = index === activeIndex;
                        const hasLine = index < steps.length - 1;
                        let bgColor = '#e9ecef';
                        let textColor = '#adb5bd';

                        if (isCurrent && index === 5) {
                            bgColor = '#15803d';
                            textColor = '#ffffff';
                        } else if (isCurrent || isPassed) {
                            bgColor = '#198754';
                            textColor = '#ffffff';
                        }

                        return (
                            <Fragment key={index}>
                                <div className="tracking-step">
                                    <div
                                        className="tracking-step-icon"
                                        style={{
                                            width: isCurrent ? '48px' : '40px',
                                            height: isCurrent ? '48px' : '40px',
                                            backgroundColor: bgColor,
                                            color: textColor,
                                            fontSize: isCurrent ? '1.2rem' : '1rem'
                                        }}
                                    >
                                        <i className={`bi ${isPassed ? 'bi-check-lg' : step.icon}`} />
                                    </div>
                                    <small className={isCurrent || isPassed ? 'active' : ''}>
                                        {step.label}
                                    </small>
                                </div>

                                {hasLine && (
                                    <div
                                        className="tracking-step-line"
                                        style={{
                                            backgroundColor: (index < activeIndex) ? '#198754' : '#e9ecef',
                                        }}
                                    />
                                )}
                            </Fragment>
                        );
                    })}
                </div></div>}

                {/* Status Message */}
                <div className={`tracking-status-message tracking-status-message-${statusTone}`}>
                    <h2>
                        {isClosed ? `Booking ${bookingData.status.toLowerCase()}` : getStatusText(activeIndex).title}
                    </h2>
                    <p>
                        {isClosed ? 'This booking is no longer active.' : getStatusText(activeIndex).desc}
                    </p>
                </div>
                {loadError && <p className="tracking-refresh-note" role="status">Live status refresh unavailable: {loadError}</p>}
                <p className="tracking-refresh-note">Booking status refreshes automatically.</p>
            </section>
        </main>
    );
};

export default TrackBooking;