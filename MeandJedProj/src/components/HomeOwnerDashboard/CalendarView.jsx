import React, { useState } from 'react';
import HomeownerSideBar from '../HomeownerSideBar/HomeownerSideBar';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../HomeownerDashboard.css';

const CalendarView = () => {
    const [currentDate, setCurrentDate] = useState(new Date(2026, 8, 1)); // September 2026
    const [selectedDate, setSelectedDate] = useState('2026-09-15');

    // Sample Scheduled Events & Bookings
    const [events] = useState([
        {
            id: 1,
            date: '2026-09-10',
            time: '09:00 AM - 11:00 AM',
            title: 'Plumbing Service',
            provider: 'Mario Plumbing Services',
            type: 'Service Request',
            status: 'Confirmed'
        },
        {
            id: 2,
            date: '2026-09-15',
            time: '02:00 PM - 04:00 PM',
            title: 'AC Cleaning & Maintenance',
            provider: 'Cool Breeze Tech',
            type: 'Service Request',
            status: 'Pending'
        },
        {
            id: 3,
            date: '2026-09-20',
            time: '10:00 AM',
            title: 'Monthly Subscription Renewal',
            provider: 'Homeowner Membership',
            type: 'Billing',
            status: 'Upcoming'
        }
    ]);

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
        const formattedMonth = String(month + 1).padStart(2, '0');
        const formattedDay = String(dayNum).padStart(2, '0');
        return `${year}-${formattedMonth}-${formattedDay}`;
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
                                const hasEvent = events.some(e => e.date === dateStr);

                                return (
                                    <div
                                        key={dayNum}
                                        onClick={() => setSelectedDate(dateStr)}
                                        style={{
                                            ...dayCellStyle,
                                            backgroundColor: isSelected ? '#10b981' : '#fff',
                                            color: isSelected ? '#fff' : '#111827',
                                            border: isSelected ? '1px solid #10b981' : '1px solid #f3f4f6'
                                        }}
                                    >
                                        <span>{dayNum}</span>
                                        {hasEvent && (
                                            <span style={{
                                                ...dotStyle,
                                                backgroundColor: isSelected ? '#fff' : '#10b981'
                                            }} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* Right Side: Selected Date Schedules */}
                    <section className="dashboard-box" style={{ padding: '20px' }}>
                        <h4 style={{ margin: '0 0 15px 0', color: '#111827' }}>
                            Events on {selectedDate}
                        </h4>

                        {selectedEvents.length > 0 ? (
                            selectedEvents.map((item) => (
                                <div key={item.id} style={eventCardStyle}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={typeBadgeStyle}>{item.type}</span>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#059669' }}>{item.status}</span>
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
                                <p style={{ marginTop: '8px', fontSize: '0.9rem' }}>No scheduled bookings for this date.</p>
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
    transition: 'all 0.15s ease'
};

const dotStyle = {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    position: 'absolute',
    bottom: '6px'
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

export default CalendarView;