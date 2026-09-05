import React, { useState } from 'react';
import HomeownerSideBar from '../HomeownerSideBar/HomeownerSideBar';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../HomeownerDashboard.css';

const Notifications = () => {
    // Sample Notifications Data
    const [notifications, setNotifications] = useState([
        {
            id: 1,
            category: 'Bookings',
            title: 'Booking Confirmed',
            message: 'Mario Plumbing Services has accepted your request for Kitchen Sink Repair.',
            time: '10 mins ago',
            isRead: false,
            icon: 'bi-check-circle-fill',
            color: '#10b981'
        },
        {
            id: 2,
            category: 'System',
            title: 'Security Alert',
            message: 'Your profile contact details were recently updated.',
            time: '2 hours ago',
            isRead: false,
            icon: 'bi-shield-lock-fill',
            color: '#f59e0b'
        },
        {
            id: 3,
            category: 'Bookings',
            title: 'Service Completed',
            message: 'Electrical Checkup was marked as completed. Please rate the service.',
            time: 'Yesterday',
            isRead: true,
            icon: 'bi-tools',
            color: '#3b82f6'
        },
        {
            id: 4,
            category: 'System',
            title: 'Membership Renewal',
            message: 'Your monthly subscription successfully auto-renewed.',
            time: '3 days ago',
            isRead: true,
            icon: 'bi-card-heading',
            color: '#8b5cf6'
        }
    ]);

    const [activeTab, setActiveTab] = useState('All');

    // Mark single notification as read
    const markAsRead = (id) => {
        setNotifications(notifications.map(item =>
            item.id === id ? { ...item, isRead: true } : item
        ));
    };

    // Mark all as read
    const markAllAsRead = () => {
        setNotifications(notifications.map(item => ({ ...item, isRead: true })));
    };

    // Filter Logic
    const filteredNotifications = notifications.filter(item => {
        if (activeTab === 'Unread') return !item.isRead;
        if (activeTab === 'Bookings') return item.category === 'Bookings';
        if (activeTab === 'System') return item.category === 'System';
        return true;
    });

    return (
        <div className="profile-page-container">
            {/* Sidebar */}
            <HomeownerSideBar />

            {/* Main Content Area */}
            <main className="profile-main-content">
                {/* Header */}
                <header className="profile-header">
                    <h2>Notifications</h2>
                    <div className="header-actions">
                        <button
                            onClick={markAllAsRead}
                            style={markAllBtnStyle}
                        >
                            <i className="bi bi-check2-all"></i> Mark all as read
                        </button>
                    </div>
                </header>

                {/* Filter Tabs */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                    {['All', 'Unread', 'Bookings', 'System'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                ...tabBtnStyle,
                                backgroundColor: activeTab === tab ? '#10b981' : '#fff',
                                color: activeTab === tab ? '#fff' : '#374151',
                                border: activeTab === tab ? 'none' : '1px solid #e5e7eb'
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Notifications List */}
                <section className="dashboard-box" style={{ marginTop: '20px', padding: '10px 20px' }}>
                    {filteredNotifications.length > 0 ? (
                        filteredNotifications.map((notification) => (
                            <div
                                key={notification.id}
                                style={{
                                    ...notificationItemStyle,
                                    backgroundColor: notification.isRead ? '#fff' : '#f0fdf4'
                                }}
                            >
                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                    <div style={{
                                        ...iconContainerStyle,
                                        backgroundColor: `${notification.color}20`,
                                        color: notification.color
                                    }}>
                                        <i className={`bi ${notification.icon}`}></i>
                                    </div>
                                    <div>
                                        <h5 style={{ margin: 0, fontSize: '0.95rem', color: '#111827' }}>
                                            {notification.title}
                                            {!notification.isRead && (
                                                <span style={unreadBadgeStyle}>New</span>
                                            )}
                                        </h5>
                                        <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#4b5563' }}>
                                            {notification.message}
                                        </p>
                                        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                            {notification.time}
                                        </span>
                                    </div>
                                </div>

                                {!notification.isRead && (
                                    <button
                                        onClick={() => markAsRead(notification.id)}
                                        style={readActionBtnStyle}
                                        title="Mark as read"
                                    >
                                        <i className="bi bi-check-lg"></i>
                                    </button>
                                )}
                            </div>
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                            <i className="bi bi-bell-slash" style={{ fontSize: '2rem' }}></i>
                            <p style={{ marginTop: '10px' }}>No notifications found.</p>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

// Inline Styles
const markAllBtnStyle = {
    backgroundColor: '#fff',
    border: '1px solid #d1d5db',
    padding: '8px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#374151',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
};

const tabBtnStyle = {
    padding: '8px 16px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '600',
    transition: 'all 0.2s ease'
};

const notificationItemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    borderRadius: '8px',
    borderBottom: '1px solid #f3f4f6',
    margin: '8px 0',
    transition: 'background-color 0.2s ease'
};

const iconContainerStyle = {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.2rem',
    flexShrink: 0
};

const unreadBadgeStyle = {
    backgroundColor: '#10b981',
    color: '#fff',
    fontSize: '0.7rem',
    padding: '2px 6px',
    borderRadius: '10px',
    marginLeft: '8px',
    fontWeight: 'bold'
};

const readActionBtnStyle = {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#10b981',
    fontSize: '1.2rem',
    cursor: 'pointer',
    padding: '6px'
};

export default Notifications;