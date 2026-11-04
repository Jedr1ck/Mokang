import { useState } from "react";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const defaultProfile = {
    firstName: "Jedrick",
    lastName: "Revilla",
    contactNumber: "+63 912 345 6789",
    address: "123 Main Street, Manila, Philippines",
    displayName: "Admin",
    role: "Administrator",
    email: "admin@appointment.com",
    createdAt: "Jan 15, 2025",
    lastLogin: "Nov 3, 2026 · 7:24 PM",
};

function AdminProfile() {
    const [isEditing, setIsEditing] = useState(false);
    const [profile, setProfile] = useState(defaultProfile);
    const [draft, setDraft] = useState(defaultProfile);
    const [passwords, setPasswords] = useState({
        newPassword: "",
        confirmPassword: "",
    });

    const handleInputChange = (field, value) => {
        setDraft((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const handleSave = () => {
        setProfile(draft);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setDraft(profile);
        setPasswords({ newPassword: "", confirmPassword: "" });
        setIsEditing(false);
    };

    const handlePasswordChange = (field, value) => {
        setPasswords((current) => ({
            ...current,
            [field]: value,
        }));
    };

    return (
        <div className="admin-profile-page">
            <div className="admin-profile-header-wrap">
                <div>
                    <h1>Admin Profile</h1>
                    <p>Manage your profile information and account settings.</p>
                </div>
            </div>

            <div className="admin-profile-hero-card">
                <div className="admin-profile-avatar-shell">
                    <div className="admin-profile-avatar">
                        <div className="admin-avatar-face">
                            <span className="admin-avatar-hair" />
                            <span className="admin-avatar-head" />
                            <span className="admin-avatar-neck" />
                            <span className="admin-avatar-shirt" />
                        </div>
                    </div>
                    <button type="button" className="admin-avatar-camera" aria-label="Upload profile picture">
                        <i className="bi bi-camera-fill" />
                    </button>
                </div>

                <div className="admin-profile-identity">
                    <h2>{profile.displayName}</h2>
                    <div className="admin-profile-role">{profile.role}</div>
                    <div className="admin-profile-email">
                        <span className="admin-profile-email-icon">
                            <i className="bi bi-envelope-fill" />
                        </span>
                        <span>{profile.email}</span>
                    </div>
                </div>

                <div className="admin-profile-account-card">
                    <h3>Account Details</h3>

                    <div className="admin-profile-detail-row">
                        <div className="admin-profile-detail-icon">
                            <i className="bi bi-calendar3" />
                        </div>
                        <div className="admin-profile-detail-copy">
                            <span>Account Created</span>
                            <strong>{profile.createdAt}</strong>
                        </div>
                    </div>

                    <div className="admin-profile-detail-row">
                        <div className="admin-profile-detail-icon">
                            <i className="bi bi-clock-history" />
                        </div>
                        <div className="admin-profile-detail-copy">
                            <span>Last Login</span>
                            <strong>{profile.lastLogin}</strong>
                        </div>
                    </div>
                </div>
            </div>

            <div className="admin-profile-lower-grid">
                <div className="admin-profile-panel">
                    <div className="admin-profile-panel-header">
                        <span className="admin-panel-icon admin-panel-icon-person">
                            <i className="bi bi-person-fill" />
                        </span>
                        <h3>Personal Information</h3>
                    </div>

                    <div className="admin-profile-fields">
                        <div className="admin-profile-field">
                            <label>First Name</label>
                            <input
                                type="text"
                                value={draft.firstName}
                                onChange={(event) => handleInputChange("firstName", event.target.value)}
                                readOnly={!isEditing}
                            />
                        </div>

                        <div className="admin-profile-field">
                            <label>Last Name</label>
                            <input
                                type="text"
                                value={draft.lastName}
                                onChange={(event) => handleInputChange("lastName", event.target.value)}
                                readOnly={!isEditing}
                            />
                        </div>

                        <div className="admin-profile-field">
                            <label>Contact Number</label>
                            <div className="admin-profile-input-with-icon">
                                <i className="bi bi-telephone-fill" />
                                <input
                                    type="text"
                                    value={draft.contactNumber}
                                    onChange={(event) => handleInputChange("contactNumber", event.target.value)}
                                    readOnly={!isEditing}
                                />
                            </div>
                        </div>

                        <div className="admin-profile-field">
                            <label>Address</label>
                            <div className="admin-profile-input-with-icon">
                                <i className="bi bi-geo-alt-fill" />
                                <input
                                    type="text"
                                    value={draft.address}
                                    onChange={(event) => handleInputChange("address", event.target.value)}
                                    readOnly={!isEditing}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="admin-profile-panel">
                    <div className="admin-profile-panel-header">
                        <span className="admin-panel-icon admin-panel-icon-security">
                            <i className="bi bi-shield-fill-check" />
                        </span>
                        <h3>Account Security</h3>
                    </div>

                    <div className="admin-profile-security-box">
                        <h4>Change Password</h4>
                        <div className="admin-profile-security-row">
                            <div className="admin-profile-password-field">
                                <i className="bi bi-lock-fill" />
                                <input
                                    type="password"
                                    placeholder="New Password"
                                    value={passwords.newPassword}
                                    onChange={(event) => handlePasswordChange("newPassword", event.target.value)}
                                />
                            </div>
                            <div className="admin-profile-password-field">
                                <i className="bi bi-lock-fill" />
                                <input
                                    type="password"
                                    placeholder="Confirm Password"
                                    value={passwords.confirmPassword}
                                    onChange={(event) => handlePasswordChange("confirmPassword", event.target.value)}
                                />
                            </div>
                        </div>

                        <div className="admin-profile-toggle-row">
                            <div>
                                <h4>Two-Factor Authentication</h4>
                                <p>Add an extra layer of security to your account.</p>
                            </div>
                            <button type="button" className="admin-profile-toggle active" aria-label="Toggle two-factor authentication">
                                <span className="admin-profile-toggle-thumb" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="admin-profile-actions">
                <button type="button" className="admin-profile-primary-btn" onClick={handleSave}>
                    <i className="bi bi-check2-square" />
                    Save Changes
                </button>
                <button type="button" className="admin-profile-secondary-btn" onClick={handleCancel}>
                    <i className="bi bi-x-lg" />
                    Cancel
                </button>
            </div>
        </div>
    );
}

export default AdminProfile;
