import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HomeownerSideBar from '../HomeownerSideBar/HomeownerSideBar';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../HomeownerDashboard.css';
import { api } from '../../services/api';

const History = () => {
    const navigate = useNavigate();
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [feedbackBooking, setFeedbackBooking] = useState(null);
    const [feedbackType, setFeedbackType] = useState('review');
    const [rating, setRating] = useState(0);
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [feedbackError, setFeedbackError] = useState('');
    const [feedbackSaving, setFeedbackSaving] = useState(false);

    useEffect(() => {
        api('/bookings/my')
            .then((bookings) => setHistoryData(bookings.map((booking) => ({
                id: booking.bookingCode || `REQ-${booking.id}`,
                bookingId: booking.id,
                type: 'Service Request',
                title: booking.serviceName || booking.category || 'Service Request',
                detail: booking.description || 'No description provided',
                date: booking.preferredDate,
                time: booking.preferredTime,
                amount: '-',
                status: booking.status,
                provider: booking.providerName || 'Not assigned'
            }))))
            .catch((error) => setLoadError(error.message || 'Unable to load service history.'))
            .finally(() => setLoading(false));
    }, []);

    // --- State Filters ---
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');

    // Filter Logic
    const filteredHistory = historyData.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.detail.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'All' || item.status === filterType;
        return matchesSearch && matchesType;
    });

    // Helper badge colors
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'Completed':
            case 'Paid':
                return 'badge text-bg-success rounded-pill px-3 py-2';
            case 'Pending':
                return 'badge text-bg-warning rounded-pill px-3 py-2';
            case 'Matched':
            case 'Accepted':
                return 'badge text-bg-info rounded-pill px-3 py-2';
            case 'In Progress':
            case 'On the Way':
            case 'Awaiting Confirmation':
                return 'badge text-bg-primary rounded-pill px-3 py-2';
            case 'Cancelled':
            case 'Rejected':
                return 'badge text-bg-danger rounded-pill px-3 py-2';
            default:
                return 'badge text-bg-secondary rounded-pill px-3 py-2';
        }
    };

    const submitFeedback = async (event) => {
        event.preventDefault();
        if (!feedbackBooking) return;
        if (feedbackType === 'review' && rating === 0) {
            setFeedbackError('Choose a star rating before submitting.');
            return;
        }
        setFeedbackError('');
        setFeedbackSaving(true);
        try {
            const endpoint = feedbackType === 'review'
                ? `/bookings/${feedbackBooking.bookingId}/reviews`
                : `/bookings/${feedbackBooking.bookingId}/complaints`;
            const payload = feedbackType === 'review'
                ? { rating: Number(rating), comment: message }
                : { subject, message };
            await api(endpoint, { method: 'POST', body: JSON.stringify(payload) });
            setFeedbackBooking(null);
            setSubject('');
            setMessage('');
        } catch (error) {
            setFeedbackError(error.message || 'Unable to submit feedback.');
        } finally {
            setFeedbackSaving(false);
        }
    };

    return (
        <div className="profile-page-container">
            {/* Sidebar */}
            <HomeownerSideBar />

            {/* Main Content Area */}
            <main className="profile-main-content">
                {/* Header */}
                <header className="profile-header">
                    <h2>Activity & Request History</h2>
                    <div className="header-actions">
                        <div className="search-box">
                            <i className="bi bi-search"></i>
                            <input
                                type="text"
                                placeholder="Search history ID, title..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            type="button"
                            className="icon-btn homeowner-notification-button"
                            aria-label="Open notifications"
                            onClick={() => navigate('/notifications')}
                        >
                            <i className="bi bi-bell"></i>
                        </button>
                    </div>
                </header>

                {/* Filter Bar */}
                <div style={filterContainerStyle}>
                    <div className="homeowner-history-filters">
                        {['All', 'Pending', 'Accepted', 'In Progress', 'Awaiting Confirmation', 'Completed', 'Cancelled', 'Rejected'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                style={{
                                    ...filterBtnStyle,
                                    backgroundColor: filterType === type ? '#FF6900' : '#fff',
                                    color: filterType === type ? '#fff' : '#6B6B6B',
                                    border: filterType === type ? 'none' : '1px solid #F5F5F5'
                                }}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                {loadError && <div className="alert alert-danger mt-3" role="alert">{loadError}</div>}

                {/* History Table Container */}
                <section className="dashboard-box" style={{ marginTop: '20px', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #F5F5F5', color: '#6b7280', fontSize: '0.9rem' }}>
                                <th style={thStyle}>Ref / Log ID</th>
                                <th style={thStyle}>Type</th>
                                <th style={thStyle}>Activity / Service</th>
                                <th style={thStyle}>Date & Time</th>
                                <th style={thStyle}>Provider / Source</th>
                                <th style={thStyle}>Amount</th>
                                <th style={thStyle}>Status</th>
                                <th style={thStyle}>Feedback</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '30px' }}>Loading service history...</td></tr>
                            ) : filteredHistory.length > 0 ? (
                                filteredHistory.map((item) => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid #F5F5F5' }}>
                                        <td style={tdStyle}><strong>{item.id}</strong></td>
                                        <td style={tdStyle}>
                                            <span style={{ fontSize: '0.85rem', color: '#4b5563', backgroundColor: '#F5F5F5', padding: '4px 8px', borderRadius: '4px' }}>
                                                {item.type}
                                            </span>
                                        </td>
                                        <td style={tdStyle}>
                                            <div style={{ fontWeight: 'bold', color: '#303030' }}>{item.title}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{item.detail}</div>
                                        </td>
                                        <td style={tdStyle}>
                                            <div>{item.date}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{item.time}</div>
                                        </td>
                                        <td style={tdStyle}>{item.provider}</td>
                                        <td style={{ ...tdStyle, fontWeight: 'bold', color: 'var(--theme-text)' }}>{item.amount}</td>
                                        <td style={tdStyle}>
                                            <span className={getStatusBadgeClass(item.status)}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td style={tdStyle}>
                                            <div className="homeowner-history-feedback-actions">
                                            {item.status === 'Completed' && (
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-warning"
                                                    onClick={() => {
                                                        setFeedbackBooking(item);
                                                        setFeedbackType('review');
                                                        setRating(0);
                                                        setFeedbackError('');
                                                    }}
                                                >
                                                    Review
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-secondary"
                                                onClick={() => {
                                                    setFeedbackBooking(item);
                                                    setFeedbackType('complaint');
                                                    setFeedbackError('');
                                                }}
                                            >
                                                Report
                                            </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#9ca3af' }}>
                                        No history logs found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </section>
            </main>
            {feedbackBooking && (
                <div className="modal show d-block bg-dark bg-opacity-50" role="dialog" aria-modal="true">
                    <div className="modal-dialog modal-dialog-centered">
                        <form className="modal-content" onSubmit={submitFeedback}>
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {feedbackType === 'review' ? 'Review completed service' : 'Report a service issue'}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setFeedbackBooking(null)} aria-label="Close" />
                            </div>
                            <div className="modal-body">
                                {feedbackError && <div className="alert alert-danger" role="alert">{feedbackError}</div>}
                                {feedbackType === 'review' ? (
                                    <div className="mb-3">
                                        <span className="form-label d-block" id="service-rating-label">Rating</span>
                                        <div className="homeowner-review-stars" role="group" aria-labelledby="service-rating-label">
                                            {[1, 2, 3, 4, 5].map((value) => (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    className={value <= rating ? 'selected' : ''}
                                                    aria-label={`${value} star${value === 1 ? '' : 's'}`}
                                                    aria-pressed={rating === value}
                                                    onClick={() => {
                                                        setRating(value);
                                                        setFeedbackError('');
                                                    }}
                                                >
                                                    <i className={`bi ${value <= rating ? 'bi-star-fill' : 'bi-star'}`} />
                                                </button>
                                            ))}
                                            <span>{rating ? `${rating} of 5` : 'Select a rating'}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mb-3">
                                        <label className="form-label" htmlFor="complaint-subject">Subject</label>
                                        <input id="complaint-subject" className="form-control" value={subject} onChange={(event) => setSubject(event.target.value)} minLength="3" maxLength="150" required />
                                    </div>
                                )}
                                <label className="form-label" htmlFor="feedback-message">
                                    {feedbackType === 'review' ? 'Comment (optional)' : 'Describe the issue'}
                                </label>
                                <textarea
                                    id="feedback-message"
                                    className="form-control"
                                    value={message}
                                    onChange={(event) => setMessage(event.target.value)}
                                    minLength={feedbackType === 'review' ? undefined : 10}
                                    maxLength="2000"
                                    required={feedbackType === 'complaint'}
                                    rows="4"
                                />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-light" onClick={() => setFeedbackBooking(null)}>Cancel</button>
                                <button type="submit" className="btn btn-brand" disabled={feedbackSaving || (feedbackType === 'review' && rating === 0)}>
                                    {feedbackSaving ? 'Submitting...' : 'Submit'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// Inline Styles
const filterContainerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '15px'
};

const filterBtnStyle = {
    padding: '8px 16px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '600',
    transition: 'all 0.2s ease'
};

const thStyle = {
    padding: '12px 16px',
    fontWeight: '600'
};

const tdStyle = {
    padding: '14px 16px',
    fontSize: '0.9rem'
};

export default History;
