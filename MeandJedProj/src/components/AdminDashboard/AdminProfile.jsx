import { useState } from "react";


import 'bootstrap/dist/css/bootstrap.min.css';

import 'bootstrap-icons/font/bootstrap-icons.css';

import "./AdminDashboard.css";

function AdminProfile() {
    const [profile, setProfile] = useState(null);

    const [isEditing, setIsEditing] = useState(false);

    const [fullName, setFullName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [contact, setContact] = useState("");

    const [showPasswordModal, setShowPasswordModal] =
        useState(false);

    const [currentPassword, setCurrentPassword] =
        useState("");
    const [newPassword, setNewPassword] =
        useState("");
    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [showCurrentPassword, setShowCurrentPassword] =
        useState(false);
    const [showNewPassword, setShowNewPassword] =
        useState(false);
    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    /*
     * Backend-ready.
     *
     * The profile will be populated from the authenticated
     * administrator account once the backend is connected.
     *
     * No sample administrator information is included.
     */

    const handleEdit = () => {
        if (!profile) {
            return;
        }

        setFullName(profile.fullName || "");
        setUsername(profile.username || "");
        setEmail(profile.email || "");
        setContact(profile.contact || "");

        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);

        setFullName("");
        setUsername("");
        setEmail("");
        setContact("");
    };

    const handleSaveProfile = (event) => {
        event.preventDefault();

        /*
         * Frontend-only update for now.
         * This will be replaced by the backend API request.
         */

        setProfile((previousProfile) => ({
            ...previousProfile,
            fullName: fullName.trim(),
            username: username.trim(),
            email: email.trim(),
            contact: contact.trim(),
        }));

        setIsEditing(false);
    };

    const handleChangePassword = (event) => {
        event.preventDefault();

        if (!currentPassword || !newPassword || !confirmPassword) {
            return;
        }

        if (newPassword !== confirmPassword) {
            return;
        }

        /*
         * Password update will be connected to the
         * authentication backend later.
         */

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        setShowPasswordModal(false);
    };

    return (
        <div className="admin-profile-page">

            {/* PROFILE HEADER */}
            <div className="admin-profile-page-header">

                <div>
                    <span className="admin-section-label">
                        ACCOUNT MANAGEMENT
                    </span>

                    <h2>Admin Profile</h2>

                    <p>
                        Manage your administrator account
                        information and security settings.
                    </p>
                </div>

                {!isEditing && profile && (
                    <button
                        type="button"
                        className="admin-add-button"
                        onClick={handleEdit}
                    >
                        <i className="bi bi-pencil"></i>
                        Edit Profile
                    </button>
                )}

            </div>

            {/* PROFILE CONTENT */}
            {profile ? (
                <div className="admin-profile-grid">

                    {/* PERSONAL INFORMATION */}
                    <section className="admin-profile-card">

                        <div className="admin-profile-card-header">

                            <div className="admin-profile-card-icon">
                                <i className="bi bi-person-fill"></i>
                            </div>

                            <div>
                                <h3>Personal Information</h3>

                                <p>
                                    Your administrator account
                                    information.
                                </p>
                            </div>

                        </div>

                        {isEditing ? (

                            <form
                                className="admin-profile-form"
                                onSubmit={handleSaveProfile}
                            >

                                <div className="admin-profile-form-grid">

                                    <div className="admin-form-group">

                                        <label htmlFor="admin-full-name">
                                            Full Name
                                        </label>

                                        <input
                                            id="admin-full-name"
                                            type="text"
                                            value={fullName}
                                            onChange={(event) =>
                                                setFullName(
                                                    event.target.value
                                                )
                                            }
                                            required
                                        />

                                    </div>

                                    <div className="admin-form-group">

                                        <label htmlFor="admin-username">
                                            Username
                                        </label>

                                        <input
                                            id="admin-username"
                                            type="text"
                                            value={username}
                                            onChange={(event) =>
                                                setUsername(
                                                    event.target.value
                                                )
                                            }
                                            required
                                        />

                                    </div>

                                    <div className="admin-form-group">

                                        <label htmlFor="admin-email">
                                            Email Address
                                        </label>

                                        <input
                                            id="admin-email"
                                            type="email"
                                            value={email}
                                            onChange={(event) =>
                                                setEmail(
                                                    event.target.value
                                                )
                                            }
                                            required
                                        />

                                    </div>

                                    <div className="admin-form-group">

                                        <label htmlFor="admin-contact">
                                            Contact Number
                                        </label>

                                        <input
                                            id="admin-contact"
                                            type="text"
                                            value={contact}
                                            onChange={(event) =>
                                                setContact(
                                                    event.target.value
                                                )
                                            }
                                        />

                                    </div>

                                </div>

                                <div className="admin-profile-form-actions">

                                    <button
                                        type="button"
                                        className="admin-modal-secondary-button"
                                        onClick={
                                            handleCancelEdit
                                        }
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="admin-modal-primary-button"
                                    >
                                        <i className="bi bi-check-lg"></i>
                                        Save Changes
                                    </button>

                                </div>

                            </form>

                        ) : (

                            <div className="admin-profile-details">

                                <div className="admin-profile-detail">

                                    <span>Full Name</span>

                                    <strong>
                                        {profile.fullName ||
                                            "—"}
                                    </strong>

                                </div>

                                <div className="admin-profile-detail">

                                    <span>Username</span>

                                    <strong>
                                        {profile.username ||
                                            "—"}
                                    </strong>

                                </div>

                                <div className="admin-profile-detail">

                                    <span>Email Address</span>

                                    <strong>
                                        {profile.email ||
                                            "—"}
                                    </strong>

                                </div>

                                <div className="admin-profile-detail">

                                    <span>Contact Number</span>

                                    <strong>
                                        {profile.contact ||
                                            "—"}
                                    </strong>

                                </div>

                            </div>

                        )}

                    </section>

                    {/* ACCOUNT INFORMATION */}
                    <section className="admin-profile-card">

                        <div className="admin-profile-card-header">

                            <div className="admin-profile-card-icon">
                                <i className="bi bi-shield-check"></i>
                            </div>

                            <div>
                                <h3>Account Information</h3>

                                <p>
                                    Administrator account status
                                    and access information.
                                </p>
                            </div>

                        </div>

                        <div className="admin-profile-account-info">

                            <div className="admin-profile-account-row">

                                <div>
                                    <span>Account Role</span>

                                    <strong>
                                        Administrator
                                    </strong>
                                </div>

                                <i className="bi bi-person-badge"></i>

                            </div>

                            <div className="admin-profile-account-row">

                                <div>
                                    <span>Account Status</span>

                                    <strong className="admin-profile-active">
                                        Active
                                    </strong>
                                </div>

                                <i className="bi bi-check-circle-fill"></i>

                            </div>

                            <div className="admin-profile-account-row">

                                <div>
                                    <span>Authentication</span>

                                    <strong>
                                        Protected Account
                                    </strong>
                                </div>

                                <i className="bi bi-lock-fill"></i>

                            </div>

                        </div>

                    </section>

                    {/* SECURITY */}
                    <section className="admin-profile-card">

                        <div className="admin-profile-card-header">

                            <div className="admin-profile-card-icon">
                                <i className="bi bi-lock-fill"></i>
                            </div>

                            <div>
                                <h3>Security</h3>

                                <p>
                                    Manage your administrator
                                    account security.
                                </p>
                            </div>

                        </div>

                        <div className="admin-security-content">

                            <div>
                                <strong>
                                    Password
                                </strong>

                                <span>
                                    Keep your administrator
                                    password secure and updated.
                                </span>
                            </div>

                            <button
                                type="button"
                                className="admin-security-button"
                                onClick={() =>
                                    setShowPasswordModal(true)
                                }
                            >
                                <i className="bi bi-key-fill"></i>
                                Change Password
                            </button>

                        </div>

                    </section>

                </div>
            ) : (

                /* EMPTY STATE */
                <div className="admin-profile-empty">

                    <div className="admin-profile-empty-icon">
                        <i className="bi bi-person-circle"></i>
                    </div>

                    <h3>
                        Administrator Profile
                    </h3>

                    <p>
                        Administrator account information will
                        appear here once the account data is
                        connected.
                    </p>

                    <span>
                        No profile data is currently available.
                    </span>

                </div>

            )}

            {/* CHANGE PASSWORD MODAL */}
            {showPasswordModal && (
                <div
                    className="admin-modal-overlay"
                    onClick={() =>
                        setShowPasswordModal(false)
                    }
                >

                    <div
                        className="admin-modal admin-small-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <div className="admin-modal-header">

                            <div>
                                <span>
                                    ACCOUNT SECURITY
                                </span>

                                <h3>
                                    Change Password
                                </h3>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowPasswordModal(
                                        false
                                    )
                                }
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>

                        </div>

                        <form
                            onSubmit={
                                handleChangePassword
                            }
                        >

                            <div className="admin-modal-body">

                                <div className="admin-form-group">

                                    <label htmlFor="current-password">
                                        Current Password
                                    </label>

                                    <div className="admin-password-input">

                                        <input
                                            id="current-password"
                                            type={
                                                showCurrentPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            value={
                                                currentPassword
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setCurrentPassword(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            required
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowCurrentPassword(
                                                    (
                                                        value
                                                    ) =>
                                                        !value
                                                )
                                            }
                                        >
                                            <i
                                                className={`bi ${showCurrentPassword
                                                    ? "bi-eye-slash"
                                                    : "bi-eye"
                                                    }`}
                                            ></i>
                                        </button>

                                    </div>

                                </div>

                                <div className="admin-form-group">

                                    <label htmlFor="new-password">
                                        New Password
                                    </label>

                                    <div className="admin-password-input">

                                        <input
                                            id="new-password"
                                            type={
                                                showNewPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            value={
                                                newPassword
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setNewPassword(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            required
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowNewPassword(
                                                    (
                                                        value
                                                    ) =>
                                                        !value
                                                )
                                            }
                                        >
                                            <i
                                                className={`bi ${showNewPassword
                                                    ? "bi-eye-slash"
                                                    : "bi-eye"
                                                    }`}
                                            ></i>
                                        </button>

                                    </div>

                                </div>

                                <div className="admin-form-group">

                                    <label htmlFor="confirm-password">
                                        Confirm New Password
                                    </label>

                                    <div className="admin-password-input">

                                        <input
                                            id="confirm-password"
                                            type={
                                                showConfirmPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            value={
                                                confirmPassword
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setConfirmPassword(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            required
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowConfirmPassword(
                                                    (
                                                        value
                                                    ) =>
                                                        !value
                                                )
                                            }
                                        >
                                            <i
                                                className={`bi ${showConfirmPassword
                                                    ? "bi-eye-slash"
                                                    : "bi-eye"
                                                    }`}
                                            ></i>
                                        </button>

                                    </div>

                                </div>

                            </div>

                            <div className="admin-modal-footer">

                                <button
                                    type="button"
                                    className="admin-modal-secondary-button"
                                    onClick={() =>
                                        setShowPasswordModal(
                                            false
                                        )
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="admin-modal-primary-button"
                                >
                                    Update Password
                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

        </div>
    );
}

export default AdminProfile;