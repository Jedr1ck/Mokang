import React, { useState } from 'react';
import HomeownerSideBar from '../HomeownerSideBar/HomeownerSideBar';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../HomeownerDashboard.css';

const getStoredUser = () => {
    try {
        return JSON.parse(localStorage.getItem('user')) || {};
    } catch {
        return {};
    }
};

const Profile = () => {
    const storedUser = getStoredUser();
    const defaultUsername = storedUser.email
        ? `@${storedUser.email.split('@')[0].replace(/[^A-Za-z0-9_]/g, '').slice(0, 30)}`
        : '@homeowner';
    const [profileData, setProfileData] = useState({
        name: storedUser.fullName || 'Homeowner',
        username: defaultUsername,
        memberSince: 'Member since registration',
        location: 'Not provided',
        birthdate: 'Not provided',
        gender: 'Not provided',
        workStatus: 'Not provided',
        email: storedUser.email || 'Not provided',
        phone: storedUser.mobileNumber || 'Not provided',
        facebook: '',
        instagram: '',
        telegram: ''
    });

    // --- Modal States ---
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

    // Temp states for editing
    const [tempProfile, setTempProfile] = useState({ ...profileData });
    const [tempPrivacy, setTempPrivacy] = useState({
        email: profileData.email,
        phone: profileData.phone,
        currentPassword: '',
        newPassword: ''
    });

    // Save Edit Profile
    const handleSaveProfile = (e) => {
        e.preventDefault();
        if (!/^[A-Za-z][A-Za-z .'-]{1,149}$/.test(tempProfile.name.trim()) || !/^@[A-Za-z0-9_]{3,30}$/.test(tempProfile.username)) {
            alert('Enter a valid full name and username (username must start with @).');
            return;
        }
        setProfileData(prev => ({
            ...prev,
            ...tempProfile
        }));
        setIsEditModalOpen(false);
    };

    // Save Privacy & Account Settings
    const handleSavePrivacy = (e) => {
        e.preventDefault();
        if (!/^\+?[0-9 ()-]{10,20}$/.test(tempPrivacy.phone) || (tempPrivacy.newPassword && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/.test(tempPrivacy.newPassword))) {
            alert('Enter a valid phone number. New passwords must be 8+ characters with uppercase, lowercase, and a number.');
            return;
        }
        setProfileData(prev => ({
            ...prev,
            email: tempPrivacy.email,
            phone: tempPrivacy.phone
        }));
        alert("Privacy & Security details updated successfully!");
        setIsPrivacyModalOpen(false);
    };

    return (
        <div className="profile-page-container">
            {/* Sidebar */}
            <HomeownerSideBar />

            {/* Main Content Area */}
            <main className="profile-main-content">
                {/* Header Bar */}
                <header className="profile-header">
                    <h2>My Profile</h2>
                    <div className="header-actions">
                        <div className="search-box">
                            <i className="bi bi-search"></i>
                            <input type="text" placeholder="Search..." />
                        </div>

                        {/* Privacy / Security Button (...) */}
                        <button
                            className="icon-btn privacy-three-dots-btn"
                            title="Privacy & Security Settings"
                            onClick={() => {
                                setTempPrivacy({
                                    email: profileData.email,
                                    phone: profileData.phone,
                                    currentPassword: '',
                                    newPassword: ''
                                });
                                setIsPrivacyModalOpen(true);
                            }}
                            style={{
                                borderRadius: '50%',
                                border: '1px solid #ccc',
                                width: '40px',
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#fff',
                                cursor: 'pointer'
                            }}
                        >
                            <i className="bi bi-three-dots" style={{ fontSize: '1.2rem', color: '#333' }}></i>
                        </button>

                        <button className="icon-btn">
                            <i className="bi bi-bell"></i>
                        </button>
                    </div>
                </header>

                {/* Profile Details Card */}
                <section className="profile-card">
                    <div className="info-section">
                        <div className="info-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <h3>{profileData.name} <span style={{ fontSize: '0.9rem', color: '#666', fontWeight: 'normal' }}>({profileData.username})</span></h3>

                            {/* Edit Profile Button */}
                            <button
                                className="edit-btn"
                                title="Edit Profile"
                                onClick={() => {
                                    setTempProfile({ ...profileData });
                                    setIsEditModalOpen(true);
                                }}
                            >
                                <i className="bi bi-pencil-square"></i>
                            </button>
                        </div>

                        <div className="info-grid">
                            <p><i className="bi bi-calendar3"></i> <strong>Member Since:</strong> {profileData.memberSince}</p>
                            <p><i className="bi bi-geo-alt"></i> <strong>Location:</strong> {profileData.location}</p>
                            <p><i className="bi bi-cake2"></i> <strong>Birthdate:</strong> {profileData.birthdate}</p>
                            <p><i className="bi bi-gender-ambiguous"></i> <strong>Gender:</strong> {profileData.gender}</p>
                            <p><i className="bi bi-briefcase"></i> <strong>Work Status:</strong> {profileData.workStatus}</p>
                            <p><i className="bi bi-envelope"></i> <strong>Email:</strong> {profileData.email} <i className="bi bi-lock-fill" title="Locked - Change via Privacy Settings" style={{ color: '#888', marginLeft: '4px' }}></i></p>
                            <p><i className="bi bi-telephone"></i> <strong>Phone:</strong> {profileData.phone} <i className="bi bi-lock-fill" title="Locked - Change via Privacy Settings" style={{ color: '#888', marginLeft: '4px' }}></i></p>
                        </div>

                        {/* Social Links (Facebook, Instagram, Telegram) */}
                        <div className="social-links" style={{ marginTop: '15px', display: 'flex', gap: '12px' }}>
                            {profileData.facebook && <a href={profileData.facebook} target="_blank" rel="noreferrer"><i className="bi bi-facebook" style={{ fontSize: '1.3rem' }}></i></a>}
                            {profileData.instagram && <a href={profileData.instagram} target="_blank" rel="noreferrer"><i className="bi bi-instagram" style={{ fontSize: '1.3rem' }}></i></a>}
                            {profileData.telegram && <a href={profileData.telegram} target="_blank" rel="noreferrer"><i className="bi bi-telegram" style={{ fontSize: '1.3rem' }}></i></a>}
                        </div>
                    </div>
                </section>

                {/* Bottom Grid Layout */}
                <div className="profile-grid">
                    <section className="dashboard-box activities-box">
                        <h4>My Service Requests</h4>
                        <div className="activity-list">
                            <div className="activity-item">
                                <div className="activity-icon green"><i className="bi bi-tools"></i></div>
                                <div className="activity-details">
                                    <h5>Plumbing Repair</h5>
                                    <p>Kitchen Sink Repair • 3 Modules</p>
                                </div>
                                <span className="status-badge completed">Completed</span>
                            </div>

                            <div className="activity-item">
                                <div className="activity-icon green"><i className="bi bi-lightning-charge"></i></div>
                                <div className="activity-details">
                                    <h5>Electrical Checkup</h5>
                                    <p>Main Breaker Maintenance</p>
                                </div>
                                <span className="status-badge completed">Completed</span>
                            </div>

                            <div className="activity-item">
                                <div className="activity-icon green"><i className="bi bi-paint-bucket"></i></div>
                                <div className="activity-details">
                                    <h5>House Painting</h5>
                                    <p>Exterior Walls Painting</p>
                                </div>
                                <span className="status-badge in-progress">In Progress</span>
                            </div>
                        </div>
                    </section>

                    <div className="right-column">
                        <section className="dashboard-box payment-box">
                            <h4>Payment Method</h4>
                            <p className="sub-text">Saved Card</p>
                            <div className="card-preview">
                                <span>•••• •••• •••• 4242</span>
                            </div>
                            <div className="payment-icons">
                                <i className="bi bi-credit-card-2-front-fill"></i>
                                <i className="bi bi-paypal"></i>
                                <i className="bi bi-wallet2"></i>
                            </div>
                        </section>

                        <section className="dashboard-box membership-card">
                            <h4>Homeowner Membership</h4>
                            <ul>
                                <li><i className="bi bi-check-circle-fill"></i> Priority Maintenance</li>
                                <li><i className="bi bi-check-circle-fill"></i> Free Monthly Inspection</li>
                                <li><i className="bi bi-check-circle-fill"></i> 24/7 Support Hotline</li>
                            </ul>
                            <button className="upgrade-btn">Manage Subscription</button>
                        </section>
                    </div>
                </div>
            </main>

            {/* --- MODAL 1: Edit Profile --- */}
            {isEditModalOpen && (
                <div className="modal-overlay" style={modalOverlayStyle}>
                    <div className="modal-content" style={modalContentStyle}>
                        <h3>Edit Profile Details</h3>
                        <form onSubmit={handleSaveProfile}>
                            <div style={formGroupStyle}>
                                <label>Full Name:</label>
                                <input type="text" value={tempProfile.name} onChange={e => setTempProfile({ ...tempProfile, name: e.target.value })} style={inputStyle} minLength="2" maxLength="150" pattern="[A-Za-z][A-Za-z .'-]{1,149}" required />
                            </div>
                            <div style={formGroupStyle}>
                                <label>Username:</label>
                                <input type="text" value={tempProfile.username} onChange={e => setTempProfile({ ...tempProfile, username: e.target.value })} style={inputStyle} pattern="@[A-Za-z0-9_]{3,30}" maxLength="31" required />
                            </div>
                            <div style={formGroupStyle}>
                                <label>Current Location:</label>
                                <input type="text" value={tempProfile.location} onChange={e => setTempProfile({ ...tempProfile, location: e.target.value })} style={inputStyle} maxLength="255" />
                            </div>
                            <div style={formGroupStyle}>
                                <label>Gender:</label>
                                <select value={tempProfile.gender} onChange={e => setTempProfile({ ...tempProfile, gender: e.target.value })} style={inputStyle}>
                                    <option value="Female">Female</option>
                                    <option value="Male">Male</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div style={formGroupStyle}>
                                <label>Work Status:</label>
                                <input type="text" value={tempProfile.workStatus} onChange={e => setTempProfile({ ...tempProfile, workStatus: e.target.value })} style={inputStyle} maxLength="100" />
                            </div>

                            <hr style={{ margin: '15px 0' }} />
                            <h4>Social Links</h4>
                            <div style={formGroupStyle}>
                                <label><i className="bi bi-facebook"></i> Facebook Link:</label>
                                <input type="url" value={tempProfile.facebook} onChange={e => setTempProfile({ ...tempProfile, facebook: e.target.value })} style={inputStyle} maxLength="2048" placeholder="https://facebook.com/..." />
                            </div>
                            <div style={formGroupStyle}>
                                <label><i className="bi bi-instagram"></i> Instagram Link:</label>
                                <input type="url" value={tempProfile.instagram} onChange={e => setTempProfile({ ...tempProfile, instagram: e.target.value })} style={inputStyle} maxLength="2048" placeholder="https://instagram.com/..." />
                            </div>
                            <div style={formGroupStyle}>
                                <label><i className="bi bi-telegram"></i> Telegram Link:</label>
                                <input type="url" value={tempProfile.telegram} onChange={e => setTempProfile({ ...tempProfile, telegram: e.target.value })} style={inputStyle} maxLength="2048" placeholder="https://t.me/..." />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                                <button type="button" onClick={() => setIsEditModalOpen(false)} style={cancelBtnStyle}>Cancel</button>
                                <button type="submit" style={saveBtnStyle}>Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL 2: Privacy & Account Settings (3 Dots Button) --- */}
            {isPrivacyModalOpen && (
                <div className="modal-overlay" style={modalOverlayStyle}>
                    <div className="modal-content" style={modalContentStyle}>
                        <h3>Privacy & Security Settings</h3>
                        <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '15px' }}>Manage your sensitive contact information and account security.</p>

                        <form onSubmit={handleSavePrivacy}>
                            <div style={formGroupStyle}>
                                <label>Email Address:</label>
                                <input type="email" value={tempPrivacy.email} onChange={e => setTempPrivacy({ ...tempPrivacy, email: e.target.value })} style={inputStyle} maxLength="254" required />
                            </div>
                            <div style={formGroupStyle}>
                                <label>Phone Number:</label>
                                <input type="tel" value={tempPrivacy.phone} onChange={e => setTempPrivacy({ ...tempPrivacy, phone: e.target.value })} style={inputStyle} pattern="\\+?[0-9 ()-]{10,20}" maxLength="20" required />
                            </div>

                            <hr style={{ margin: '15px 0' }} />
                            <h4>Change Password</h4>
                            <div style={formGroupStyle}>
                                <label>Current Password:</label>
                                <input type="password" value={tempPrivacy.currentPassword} onChange={e => setTempPrivacy({ ...tempPrivacy, currentPassword: e.target.value })} style={inputStyle} minLength="8" maxLength="128" placeholder="Enter current password" />
                            </div>
                            <div style={formGroupStyle}>
                                <label>New Password:</label>
                                <input type="password" value={tempPrivacy.newPassword} onChange={e => setTempPrivacy({ ...tempPrivacy, newPassword: e.target.value })} style={inputStyle} minLength="8" maxLength="128" placeholder="Enter new password" />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                                <button type="button" onClick={() => setIsPrivacyModalOpen(false)} style={cancelBtnStyle}>Cancel</button>
                                <button type="submit" style={saveBtnStyle}>Update Privacy Settings</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Inline Styles para sa Modals ---
const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
};

const modalContentStyle = {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '480px',
    maxHeight: '85vh',
    overflowY: 'auto',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
};

const formGroupStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    marginBottom: '12px'
};

const inputStyle = {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '0.95rem'
};

const saveBtnStyle = {
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold'
};

const cancelBtnStyle = {
    backgroundColor: '#e5e7eb',
    color: '#374151',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer'
};

export default Profile;
