import React, { useEffect, useState } from 'react';
import HomeownerSideBar from '../HomeownerSideBar/HomeownerSideBar';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../HomeownerDashboard.css';
import { api } from '../../services/api';

const History = () => {
    const [historyData, setHistoryData] = useState([]);

    useEffect(() => {
        api('/bookings/my')
            .then((bookings) => setHistoryData(bookings.map((booking) => ({
                id: booking.bookingCode || `REQ-${booking.id}`,
                type: 'Service Request',
                title: booking.category || 'Service Request',
                detail: booking.description || 'No description provided',
                date: booking.preferredDate,
                time: booking.preferredTime,
                amount: '-',
                status: booking.status,
                provider: booking.providerId ? `Provider #${booking.providerId}` : 'Not assigned'
            }))))
            .catch((error) => console.error('Unable to load history:', error));
    }, []);

    // --- State Filters ---
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');

    // Filter Logic
    const filteredHistory = historyData.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.detail.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'All' || item.type === filterType;
        return matchesSearch && matchesType;
    });

    // Helper badge colors
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'Completed':
            case 'Paid':
                return 'status-badge completed';
            case 'In Progress':
                return 'status-badge in-progress';
            case 'Cancelled':
                return 'status-badge cancelled';
            default:
                return 'status-badge neutral';
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
                        <button className="icon-btn">
                            <i className="bi bi-bell"></i>
                        </button>
                    </div>
                </header>

                {/* Filter Bar */}
                <div style={filterContainerStyle}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {['All', 'Service Request', 'Payment', 'Account Update'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                style={{
                                    ...filterBtnStyle,
                                    backgroundColor: filterType === type ? '#10b981' : '#fff',
                                    color: filterType === type ? '#fff' : '#374151',
                                    border: filterType === type ? 'none' : '1px solid #e5e7eb'
                                }}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* History Table Container */}
                <section className="dashboard-box" style={{ marginTop: '20px', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #f3f4f6', color: '#6b7280', fontSize: '0.9rem' }}>
                                <th style={thStyle}>Ref / Log ID</th>
                                <th style={thStyle}>Type</th>
                                <th style={thStyle}>Activity / Service</th>
                                <th style={thStyle}>Date & Time</th>
                                <th style={thStyle}>Provider / Source</th>
                                <th style={thStyle}>Amount</th>
                                <th style={thStyle}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredHistory.length > 0 ? (
                                filteredHistory.map((item) => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={tdStyle}><strong>{item.id}</strong></td>
                                        <td style={tdStyle}>
                                            <span style={{ fontSize: '0.85rem', color: '#4b5563', backgroundColor: '#f3f4f6', padding: '4px 8px', borderRadius: '4px' }}>
                                                {item.type}
                                            </span>
                                        </td>
                                        <td style={tdStyle}>
                                            <div style={{ fontWeight: 'bold', color: '#111827' }}>{item.title}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{item.detail}</div>
                                        </td>
                                        <td style={tdStyle}>
                                            <div>{item.date}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{item.time}</div>
                                        </td>
                                        <td style={tdStyle}>{item.provider}</td>
                                        <td style={{ ...tdStyle, fontWeight: 'bold', color: '#059669' }}>{item.amount}</td>
                                        <td style={tdStyle}>
                                            <span className={getStatusBadgeClass(item.status)}>
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#9ca3af' }}>
                                        No history logs found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </section>
            </main>
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