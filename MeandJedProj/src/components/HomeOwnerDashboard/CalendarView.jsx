import { useEffect, useState } from 'react';
import HomeownerSideBar from '../HomeownerSideBar/HomeownerSideBar';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../HomeownerDashboard.css';
import { api } from '../../services/api';

const CalendarView = () => {
    const today = new Date();
    const toDateString = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [selectedDate, setSelectedDate] = useState(toDateString(today));
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    useEffect(() => {
        api('/bookings/my')
            .then((bookings) => setEvents(bookings.map((booking) => ({
                id: booking.id,
                date: booking.preferredDate,
                time: booking.preferredTime,
                title: booking.serviceName || booking.category || 'Service Request',
                provider: booking.providerName || 'Provider not assigned',
                type: 'Service Booking',
                status: booking.status
            }))))
            .catch((error) => setLoadError(error.message || 'Unable to load scheduled bookings.'))
            .finally(() => setLoading(false));
    }, []);

    // Helpers for Calendar calculation
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();

    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const formatDateString = (dayNum) => {
        return toDateString(new Date(year, month, dayNum));
    };

    // Filter events for currently selected date
    const selectedEvents = events.filter(e => e.date === selectedDate);

    return (
        <div className="profile-page-container">
            {/* Sidebar */}
            <HomeownerSideBar />

            {/* Main Content */}
            <main className="profile-main-content">
                {/* Header */}
                <header className="profile-header">
                    <h2>Schedule & Calendar</h2>
                    <div className="header-actions">
                        <button className="icon-btn">
                            <i className="bi bi-bell"></i>
                        </button>
                    </div>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginTop: '20px' }}>

                    {/* Left Side: Calendar Grid */}
                    <section className="dashboard-box" style={{ padding: '20px' }}>
                        {/* Month Navigation */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, color: '#111827' }}>
                                {monthNames[month]} {year}
                            </h3>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={handlePrevMonth} style={navBtnStyle}><i className="bi bi-chevron-left"></i></button>
                                <button onClick={handleNextMonth} style={navBtnStyle}><i className="bi bi-chevron-right"></i></button>
                            </div>
                        </div>

                        {/* Day Names Header */}
                        <div style={gridHeaderStyle}>
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                                <div key={d} style={{ fontWeight: 'bold', color: '#6b7280', textAlign: 'center' }}>{d}</div>
                            ))}
                        </div>

                        {/* Days Grid */}
                        <div style={gridDaysStyle}>
                            {/* Empty cells before 1st day */}
                            {Array.from({ length: firstDayIndex }).map((_, i) => (
                                <div key={`empty-${i}`} style={emptyCellStyle} />
                            ))}

                            {/* Actual Month Days */}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const dayNum = i + 1;
                                const dateStr = formatDateString(dayNum);
                                const isSelected = selectedDate === dateStr;
                                const dayEvents = events.filter((event) => event.date === dateStr);
                                const statuses = [...new Set(dayEvents.map((event) => getStatusStyle(event.status).color))];
                                const statusNames = [...new Set(dayEvents.map((event) => event.status || 'Unknown'))];

                                return (
                                    <button
                                        type="button"
                                        key={dayNum}
                                        onClick={() => setSelectedDate(dateStr)}
                                        aria-label={`${dateStr}${dayEvents.length ? `, ${dayEvents.length} scheduled ${dayEvents.length === 1 ? 'booking' : 'bookings'}: ${statusNames.join(', ')}` : ''}`}
                                        aria-pressed={isSelected}
                                        style={{
                                            ...dayCellStyle,
                                            backgroundColor: isSelected ? '#10b981' : '#fff',
                                            color: isSelected ? '#fff' : '#111827',
                                            border: isSelected ? '1px solid #10b981' : '1px solid #f3f4f6'
                                        }}
                                    >
                                        <span>{dayNum}</span>
                                        {statuses.length > 0 && (
                                            <span aria-hidden="true" style={eventDotsStyle}>
                                                {statuses.map((color) => (
                                                    <span
                                                        key={color}
                                                        style={{
                                                            ...dotStyle,
                                                            backgroundColor: color,
                                                            border: isSelected ? '1px solid #fff' : 'none'
                                                        }}
                                                    />
                                                ))}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        <div role="group" aria-label="Booking status color legend" style={statusLegendStyle}>
                            {statusLegend.map((status) => (
                                <span key={status.label} style={legendItemStyle}>
                                    <span aria-hidden="true" style={{ ...legendDotStyle, backgroundColor: status.color }} />
                                    {status.label}
                                </span>
                            ))}
                        </div>
                    </section>

                    {/* Right Side: Selected Date Schedules */}
                    <section className="dashboard-box" style={{ padding: '20px' }}>
                        <h4 style={{ margin: '0 0 15px 0', color: '#111827' }}>
                            Events on {selectedDate}
                        </h4>

                        {selectedEvents.length > 0 ? (
                            selectedEvents.map((item) => (
                                <div key={item.id} style={{ ...eventCardStyle, borderLeftColor: getStatusStyle(item.status).color }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={typeBadgeStyle}>{item.type}</span>
                                        <span
                                            style={{ ...statusBadgeStyle, ...getStatusStyle(item.status) }}
                                            aria-label={`Booking status: ${item.status || 'Unknown'}`}
                                        >
                                            {item.status || 'Unknown'}
                                        </span>
                                    </div>
                                    <h5 style={{ margin: '8px 0 4px 0', fontSize: '1rem', color: '#1f2937' }}>{item.title}</h5>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>
                                        <i className="bi bi-person"></i> {item.provider}
                                    </p>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#9ca3af' }}>
                                        <i className="bi bi-clock"></i> {item.time}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', color: '#9ca3af', padding: '30px 0' }}>
                                <i className="bi bi-calendar-x" style={{ fontSize: '2rem' }}></i>
                                <p style={{ marginTop: '8px', fontSize: '0.9rem' }}>
                                    {loading ? 'Loading bookings...' : loadError || 'No scheduled bookings for this date.'}
                                </p>
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
};

// Inline Styles
const navBtnStyle = {
    backgroundColor: '#f3f4f6',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#374151'
};

const gridHeaderStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '8px',
    marginBottom: '10px'
};

const gridDaysStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '8px'
};

const emptyCellStyle = {
    height: '48px'
};

const dayCellStyle = {
    height: '48px',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    position: 'relative',
    fontWeight: '500',
    fontSize: '0.95rem',
    transition: 'all 0.15s ease',
    width: '100%',
    padding: 0,
    fontFamily: 'inherit'
};

const dotStyle = {
    width: '5px',
    height: '5px',
    borderRadius: '50%'
};

const eventDotsStyle = {
    position: 'absolute',
    bottom: '6px',
    display: 'flex',
    gap: '3px'
};

const eventCardStyle = {
    backgroundColor: '#f9fafb',
    borderLeft: '4px solid #10b981',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '12px'
};

const typeBadgeStyle = {
    backgroundColor: '#e5e7eb',
    color: '#374151',
    fontSize: '0.7rem',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: 'bold'
};

const statusBadgeStyle = {
    fontSize: '0.75rem',
    fontWeight: 'bold',
    padding: '3px 7px',
    borderRadius: '999px'
};

const statusLegend = [
    { label: 'Pending', color: '#b45309' },
    { label: 'Confirmed / Accepted', color: '#1d4ed8' },
    { label: 'In Progress', color: '#6d28d9' },
    { label: 'Completed', color: '#15803d' },
    { label: 'Cancelled / Rejected', color: '#b91c1c' },
    { label: 'Other', color: '#4b5563' }
];

const statusLegendStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px 14px',
    marginTop: '16px',
    fontSize: '0.75rem',
    color: '#4b5563'
};

const legendItemStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px'
};

const legendDotStyle = {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0
};

const getStatusStyle = (status) => {
    const normalizedStatus = String(status || '').trim().toLowerCase().replace(/[_-]+/g, ' ');

    if (normalizedStatus === 'pending') {
        return { color: '#b45309', backgroundColor: '#fef3c7' };
    }
    if (['confirmed', 'accepted', 'matched'].includes(normalizedStatus)) {
        return { color: '#1d4ed8', backgroundColor: '#dbeafe' };
    }
    if (normalizedStatus === 'in progress') {
        return { color: '#6d28d9', backgroundColor: '#ede9fe' };
    }
    if (normalizedStatus === 'completed') {
        return { color: '#15803d', backgroundColor: '#dcfce7' };
    }
    if (['cancelled', 'canceled', 'rejected'].includes(normalizedStatus)) {
        return { color: '#b91c1c', backgroundColor: '#fee2e2' };
    }

    return { color: '#4b5563', backgroundColor: '#f3f4f6' };
};

export default CalendarView;