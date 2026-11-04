import { useState } from "react";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import { updateMyProfile, updateMySecurity } from "../../services/api";

const defaultProfile = {
    firstName: "",
    lastName: "",
    contactNumber: "",
    address: "",
    displayName: "Administrator",
    role: "Administrator",
};

const formatAccountDate = (value, includeTime = false) => {
    if (!value) return "Not available";

    const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
    const date = new Date(hasTimezone ? value : `${value}Z`);
    if (Number.isNaN(date.getTime())) return "Not available";

    return date.toLocaleString(undefined, includeTime
        ? {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        }
        : {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
};

const buildInitialProfile = (user) => {
    const fullName = user?.fullName || "Administrator";
    const [firstName, ...lastNameParts] = fullName.split(" ");

    return {
        ...defaultProfile,
        firstName: firstName === "Administrator" ? "" : firstName,
        lastName: lastNameParts.join(" "),
        contactNumber: user?.mobileNumber || "",
        address: user?.address || "",
        displayName: fullName,
        role: user?.role === "admin" ? "Administrator" : defaultProfile.role,
        email: user?.email || "Not available",
        createdAt: formatAccountDate(user?.createdAt),
        lastLogin: formatAccountDate(user?.lastLoginAt, true),
    };
};

function AdminProfile({ user }) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState({ type: "", text: "" });
    const [profile, setProfile] = useState(() => buildInitialProfile(user));
    const [draft, setDraft] = useState(() => buildInitialProfile(user));
    const [passwords, setPasswords] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const handleInputChange = (field, value) => {
        setDraft((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const handleSave = async () => {
        if (isSaving) return;

        setSaveMessage({ type: "", text: "" });

        try {
            setIsSaving(true);

            const fullName = [draft.firstName, draft.lastName].map((value) => value?.trim()).filter(Boolean).join(" ");
            await updateMyProfile({
                fullName: fullName || profile.displayName,
                mobileNumber: draft.contactNumber.trim(),
                address: draft.address.trim(),
            });

            if (passwords.newPassword || passwords.confirmPassword || passwords.currentPassword) {
                if (!passwords.currentPassword) {
                    throw new Error("Current password is required to change your password.");
                }
                if (!passwords.newPassword || !passwords.confirmPassword) {
                    throw new Error("Please complete both password fields.");
                }
                if (passwords.newPassword !== passwords.confirmPassword) {
                    throw new Error("The new passwords do not match.");
                }

                await updateMySecurity({
                    currentPassword: passwords.currentPassword,
                    newPassword: passwords.newPassword,
                });
            }

            const nextProfile = {
                ...draft,
                displayName: fullName || profile.displayName,
                email: profile.email,
                createdAt: profile.createdAt,
                lastLogin: profile.lastLogin,
                role: profile.role,
            };

            setProfile(nextProfile);
            setDraft(nextProfile);
            setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
            setIsEditing(false);
            setSaveMessage({ type: "success", text: "Account settings updated successfully." });
        } catch (error) {
            setSaveMessage({
                type: "error",
                text: error?.message || "Unable to save admin profile settings.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setDraft(profile);
        setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setSaveMessage({ type: "", text: "" });
        setIsEditing(false);
    };

    const handlePasswordChange = (field, value) => {
        setPasswords((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const profileInitials = profile.displayName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("");

    return (
        <div className="admin-profile-page">
            <div className="admin-profile-header-wrap">
                <div>
                    <span className="admin-profile-eyebrow">ACCOUNT SETTINGS</span>
                    <h1>Admin Profile</h1>
                    <p>Manage your profile information and account settings.</p>
                </div>
            </div>

            <div className="admin-profile-hero-card">
                <div className="admin-profile-avatar-shell">
                    <div className="admin-profile-avatar-initials" aria-hidden="true">
                        {profileInitials}
                    </div>
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
                        <h3 className="!text-lg !font-bold !text-slate-900">Personal Information</h3>
                    </div>

                    <div className="admin-profile-fields">
                        <div className="admin-profile-field">
                            <label htmlFor="admin-profile-first-name">First Name</label>
                            <input
                                id="admin-profile-first-name"
                                type="text"
                                value={draft.firstName}
                                placeholder="Not provided"
                                onChange={(event) => handleInputChange("firstName", event.target.value)}
                                readOnly={!isEditing}
                            />
                        </div>

                        <div className="admin-profile-field">
                            <label htmlFor="admin-profile-last-name">Last Name</label>
                            <input
                                id="admin-profile-last-name"
                                type="text"
                                value={draft.lastName}
                                placeholder="Not provided"
                                onChange={(event) => handleInputChange("lastName", event.target.value)}
                                readOnly={!isEditing}
                            />
                        </div>

                        <div className="admin-profile-field">
                            <label htmlFor="admin-profile-contact-number">Contact Number</label>
                            <div className="admin-profile-input-with-icon">
                                <i className="bi bi-telephone-fill" />
                                <input
                                    id="admin-profile-contact-number"
                                    type="text"
                                    value={draft.contactNumber}
                                    placeholder="Not provided"
                                    onChange={(event) => handleInputChange("contactNumber", event.target.value)}
                                    readOnly={!isEditing}
                                />
                            </div>
                        </div>

                        <div className="admin-profile-field">
                            <label htmlFor="admin-profile-address">Address</label>
                            <div className="admin-profile-input-with-icon">
                                <i className="bi bi-geo-alt-fill" />
                                <input
                                    id="admin-profile-address"
                                    type="text"
                                    value={draft.address}
                                    placeholder="Not provided"
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
                        <h3 className="!text-lg !font-bold !text-slate-900">Account Security</h3>
                    </div>

                    <div className="admin-profile-security-box">
                        <h4>Change Password</h4>
                        <div className="admin-profile-security-row">
                            <div className="admin-profile-password-field">
                                <i className="bi bi-lock-fill" />
                                <input
                                    type="password"
                                placeholder="Current Password"
                                value={passwords.currentPassword}
                                onChange={(event) => handlePasswordChange("currentPassword", event.target.value)}
                                />
                            </div>
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
                            <p>Two-factor authentication is not configured for this account.</p>
                        </div>
                        <span className="admin-profile-security-status">Not enabled</span>
                    </div>
                    </div>
                </div>
            </div>

            <div className="admin-profile-actions">
                {saveMessage.text && (
                    <div className={`admin-profile-save-message ${saveMessage.type === "error" ? "error" : "success"}`}>
                    {saveMessage.text}
                    </div>
                )}
                <button type="button" className="admin-profile-primary-btn" onClick={handleSave} disabled={isSaving}>
                    <i className="bi bi-check2-square" />
                    {isSaving ? "Saving..." : "Save Changes"}
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
