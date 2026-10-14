
import React, { useState } from 'react';
import "./ProviderBookings.css";

const ProviderBookingCard = ({ booking, homeownerName = 'Homeowner' }) => {
    const [showDetails, setShowDetails] = useState(false);

    if (!booking) return null;

    const category =
        booking.category || booking.serviceCategory || 'Home Service';

    const address =
        booking.address || booking.location || 'Address not provided';

    const date =
        booking.preferredDate || booking.preferred_date || '';

    const time =
        booking.preferredTime || booking.preferred_time || '';

    const description =
        booking.description || 'No additional description provided.';

    const status = booking.status || 'Pending';

    const formatDate = (value) => {
        if (!value) return 'Not specified';

        const parsed = new Date(`${value}T00:00:00`);

        return Number.isNaN(parsed.getTime())
            ? value
            : parsed.toLocaleDateString('en-PH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
    };

    const statusClass = status.toLowerCase().replace(/\s+/g, '-');

    return (
        <>
            <article className="provider-booking-card">
                <div className="pbc-heading">
                    <div className="pbc-icon">
                        <i className="bi bi-house-gear-fill"></i>
                    </div>

                    <div className="pbc-heading-text">
                        <span>BOOKING REQUEST</span>
                        <h3>{category}</h3>
                    </div>

                    <span className={`pbc-status ${statusClass}`}>
                        {status}
                    </span>
                </div>

                <div className="pbc-customer">
                    <div className="pbc-avatar">
                        {homeownerName.charAt(0).toUpperCase()}
                    </div>

                    <div>
                        <span>Homeowner</span>
                        <strong>{homeownerName}</strong>
                    </div>
                </div>

                <div className="pbc-info">
                    <div className="pbc-info-row">
                        <i className="bi bi-geo-alt-fill"></i>
                        <div>
                            <span>Service Location</span>
                            <strong>{address}</strong>
                        </div>
                    </div>

                    <div className="pbc-info-row">
                        <i className="bi bi-calendar-event"></i>
                        <div>
                            <span>Preferred Schedule</span>
                            <strong>
                                {formatDate(date)}
                                {time ? ` • ${time}` : ''}
                            </strong>
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    className="pbc-view-button"
                    onClick={() => setShowDetails(true)}
                >
                    View Booking Details
                    <i className="bi bi-arrow-up-right"></i>
                </button>
            </article>

            {showDetails && (
                <div
                    className="pbc-modal-backdrop"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setShowDetails(false);
                        }
                    }}
                >
                    <section
                        className="pbc-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="pbc-modal-title"
                    >
                        <header className="pbc-modal-header">
                            <div>
                                <span>BOOKING INFORMATION</span>
                                <h2 id="pbc-modal-title">
                                    Booking Details
                                </h2>
                            </div>

                            <button
                                type="button"
                                aria-label="Close booking details"
                                onClick={() => setShowDetails(false)}
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </header>

                        <div className="pbc-modal-body">
                            <div className="pbc-detail-banner">
                                <div className="pbc-icon">
                                    <i className="bi bi-tools"></i>
                                </div>
                                <div>
                                    <h3>{category}</h3>
                                    <span>
                                        Booking ID: {booking.id ?? 'N/A'}
                                    </span>
                                </div>
                            </div>

                            <div className="pbc-detail-grid">
                                <div className="pbc-detail-item">
                                    <span>Homeowner Name</span>
                                    <strong>{homeownerName}</strong>
                                </div>

                                <div className="pbc-detail-item">
                                    <span>Booking Status</span>
                                    <strong>{status}</strong>
                                </div>

                                <div className="pbc-detail-item">
                                    <span>Service Date</span>
                                    <strong>{formatDate(date)}</strong>
                                </div>

                                <div className="pbc-detail-item">
                                    <span>Preferred Time</span>
                                    <strong>{time || 'Not specified'}</strong>
                                </div>

                                <div className="pbc-detail-item pbc-full-width">
                                    <span>
                                        <i className="bi bi-geo-alt"></i>
                                        Complete Service Address
                                    </span>
                                    <strong>{address}</strong>
                                </div>

                                <div className="pbc-detail-item pbc-full-width">
                                    <span>Service Description</span>
                                    <p>{description}</p>
                                </div>
                            </div>

                            <p className="pbc-private-note">
                                <i className="bi bi-shield-check"></i>
                                Customer information is shown according to
                                the booking details available to your account.
                            </p>
                        </div>

                        <footer className="pbc-modal-footer">
                            <button
                                type="button"
                                className="pbc-close-button"
                                onClick={() => setShowDetails(false)}
                            >
                                Close Details
                            </button>
                        </footer>
                    </section>
                </div>
            )}
        </>
    );
};

export default ProviderBookingCard;
