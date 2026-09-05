import React, { useState } from 'react';
import HomeownerSideBar from '../HomeownerSideBar/HomeownerSideBar';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../HomeownerDashboard.css';

const Settings = () => {
    // --- State Settings ---
    const [notifications, setNotifications] = useState({
        emailAlerts: true,
        smsAlerts: false,
        bookingUpdates: true,
        promotions: false
    });

    const [privacy, setPrivacy] = useState({
        showProfile: true,
        showLocation: true
    });

    const [activeTab, setActiveTab] = useState('General');

    const handleToggleNotification = (key) => {
        setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleTogglePrivacy = (key) => {
        setPrivacy(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSaveSettings = (e) => {
        e.preventDefault();
        alert('Settings updated successfully!');
    };

    return (
        <div className="profile-page-container">
            {/* Sidebar */}
            <HomeownerSideBar />

            {/* Main Content Area */}
            <main className="profile-main-content">
                <header className="profile-header">
                    <h2>Account Settings</h2>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '20px', marginTop: '20px' }}>

                    {/* Left Panel: Settings Tabs */}
                    <div className="dashboard-box" style={{ padding: '15px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {[
                                { id: 'General', label: 'General & Preferences', icon: 'bi-gear' },
                                { id: 'Notifications', label: 'Notifications', icon: 'bi-bell' },
                                { id: 'Privacy', label: 'Privacy & Security', icon: 'bi-shield-check' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    style={{
                                        ...navTabStyle,
                                        backgroundColor: activeTab === tab.id ? '#10b981' : 'transparent',
                                        color: activeTab === tab.id ? '#fff' : '#374151',
                                        fontWeight: activeTab === tab.id ? 'bold' : 'normal'
                                    }}
                                >
                                    <i className={`bi ${tab.icon}`}></i> {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right Panel: Tab Content */}
                    <div className="dashboard-box" style={{ padding: '24px' }}>
                        <form onSubmit={handleSaveSettings}>

                            {/* --- TAB 1: General Preferences --- */}
                            {activeTab === 'General' && (
                                <div>
                                    <h3 style={sectionTitleStyle}>General Preferences</h3>
                                    <p style={sectionSubStyle}>Manage language, theme, and region defaults.</p>

                                    <div style={formGroupStyle}>
                                        <label style={labelStyle}>Language</label>
                                        <select style={selectStyle} defaultValue="English">
                                            <option value="English">English</option>
                                            <option value="Tagalog">Tagalog / Filipino</option>
                                        </select>
                                    </div>

                                    <div style={formGroupStyle}>
                                        <label style={labelStyle}>Timezone</label>
                                        <select style={selectStyle} defaultValue="PST">
                                            <option value="PST">Philippine Standard Time (GMT+8)</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* --- TAB 2: Notifications --- */}
                            {activeTab === 'Notifications' && (
                                <div>
                                    <h3 style={sectionTitleStyle}>Notification Preferences</h3>
                                    <p style={sectionSubStyle}>Choose how and when you receive updates.</p>

                                    <div style={toggleItemStyle}>
                                        <div>
                                            <strong style={{ color: '#111827' }}>Email Alerts</strong>
                                            <p style={toggleSubStyle}>Receive emails for major updates and invoices.</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={notifications.emailAlerts}
                                            onChange={() => handleToggleNotification('emailAlerts')}
                                            style={checkboxStyle}
                                        />
                                    </div>

                                    <div style={toggleItemStyle}>
                                        <div>
                                            <strong style={{ color: '#111827' }}>SMS Notifications</strong>
                                            <p style={toggleSubStyle}>Receive text messages when a service provider arrives.</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={notifications.smsAlerts}
                                            onChange={() => handleToggleNotification('smsAlerts')}
                                            style={checkboxStyle}
                                        />
                                    </div>

                                    <div style={toggleItemStyle}>
                                        <div>
                                            <strong style={{ color: '#111827' }}>Booking Updates</strong>
                                            <p style={toggleSubStyle}>Real-time updates regarding your active service requests.</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={notifications.bookingUpdates}
                                            onChange={() => handleToggleNotification('bookingUpdates')}
                                            style={checkboxStyle}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* --- TAB 3: Privacy & Security --- */}
                            {activeTab === 'Privacy' && (
                                <div>
                                    <h3 style={sectionTitleStyle}>Privacy & Safety</h3>
                                    <p style={sectionSubStyle}>Control who can view your information on the platform.</p>

                                    <div style={toggleItemStyle}>
                                        <div>
                                            <strong style={{ color: '#111827' }}>Public Profile</strong>
                                            <p style={toggleSubStyle}>Allow service providers to view basic profile info.</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={privacy.showProfile}
                                            onChange={() => handleTogglePrivacy('showProfile')}
                                            style={checkboxStyle}
                                        />
                                    </div>

                                    <div style={toggleItemStyle}>
                                        <div>
                                            <strong style={{ color: '#111827' }}>Share Location Automatically</strong>
                                            <p style={toggleSubStyle}>Share pinned address with booked technicians.</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={privacy.showLocation}
                                            onChange={() => handleTogglePrivacy('showLocation')}
                                            style={checkboxStyle}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div style={{ marginTop: '30px', borderTop: '1px solid #f3f4f6', paddingTop: '15px', textAlign: 'right' }}>
                                <button type="submit" style={saveBtnStyle}>
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
};

// Inline Styles
const navTabStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    borderRadius: '8px',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.15s ease'
};

const sectionTitleStyle = {
    margin: '0 0 4px 0',
    color: '#111827',
    fontSize: '1.1rem'
};

const sectionSubStyle = {
    margin: '0 0 20px 0',
    color: '#6b7280',
    fontSize: '0.85rem'
};

const formGroupStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '16px'
};

const labelStyle = {
    fontSize: '0.85rem',
    fontWeight: 'bold',
    color: '#374151'
};

const selectStyle = {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '0.9rem',
    backgroundColor: '#fff'
};

const toggleItemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #f3f4f6'
};

const toggleSubStyle = {
    margin: '2px 0 0 0',
    fontSize: '0.8rem',
    color: '#6b7280'
};

const checkboxStyle = {
    width: '18px',
    height: '18px',
    accentColor: '#10b981',
    cursor: 'pointer'
};

const saveBtnStyle = {
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    padding: '9px 20px',
    borderRadius: '6px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '0.9rem'
};

export default Settings;