import { useEffect, useState } from "react";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import { updateMyProfile, updateMySecurity } from "../../services/api";

const defaultProfile = {
    firstName: "Jedrick",
    lastName: "Revilla",
    contactNumber: "+63 912 345 6789",
    address: "123 Main Street, Manila, Philippines",
    displayName: "Admin",
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
    const fullName = user?.fullName || defaultProfile.displayName;
    const [firstName, ...lastNameParts] = fullName.split(" ");

    return {
        ...defaultProfile,
        firstName: firstName || defaultProfile.firstName,
        lastName: lastNameParts.join(" ") || defaultProfile.lastName,
        contactNumber: user?.mobileNumber || defaultProfile.contactNumber,
        address: user?.address || defaultProfile.address,
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
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

    useEffect(() => {
        const nextProfile = buildInitialProfile(user);
        setProfile(nextProfile);
        setDraft(nextProfile);
    }, [user]);

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

    return (
        <div className="admin-profile-page !space-y-6">
            <div className="admin-profile-header-wrap !mb-1">
                <div>
                    <span className="!text-xs !font-bold !tracking-[0.18em] !text-orange-600">ACCOUNT SETTINGS</span>
                    <h1 className="!mt-2 !text-3xl !font-bold !tracking-tight !text-slate-950 md:!text-4xl">Admin Profile</h1>
                    <p className="!mt-2 !text-sm !text-slate-500 md:!text-base">Manage your profile information and account settings.</p>
                </div>
            </div>

            <div className="admin-profile-hero-card !grid !grid-cols-1 !gap-6 !rounded-3xl !border !border-slate-800 !bg-gradient-to-br !from-slate-950 !via-slate-900 !to-orange-950 !p-6 !shadow-xl !shadow-slate-900/10 md:!p-8 lg:!grid-cols-[auto_minmax(0,1fr)_320px] lg:!items-center">
                <div className="admin-profile-avatar-shell">
                    <div className="admin-profile-avatar !h-28 !w-28 !border-4 !border-white/90 !shadow-xl md:!h-32 md:!w-32">
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

                <div className="admin-profile-identity !text-center lg:!text-left">
                    <h2 className="!text-4xl !font-bold !tracking-tight !text-white md:!text-5xl">{profile.displayName}</h2>
                    <div className="admin-profile-role !mt-2 !text-sm !font-semibold !text-orange-200">{profile.role}</div>
                    <div className="admin-profile-email !mt-5 !inline-flex !rounded-full !border !border-white/15 !bg-white/10 !px-4 !py-2 !text-sm !text-white">
                        <span className="admin-profile-email-icon !text-orange-200">
                            <i className="bi bi-envelope-fill" />
                        </span>
                        <span>{profile.email}</span>
                    </div>
                </div>

                <div className="admin-profile-account-card !rounded-2xl !border !border-white/60 !bg-white !p-5 !shadow-lg !shadow-slate-950/10">
                    <h3 className="!mb-4 !text-base !font-bold !text-slate-900">Account Details</h3>

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

            <div className="admin-profile-lower-grid !grid !grid-cols-1 !gap-5 lg:!grid-cols-[1.2fr_0.9fr]">
                <div className="admin-profile-panel !rounded-2xl !border !border-slate-200 !bg-white !p-5 !shadow-sm md:!p-7">
                    <div className="admin-profile-panel-header !mb-6 !border-slate-100 !pb-4">
                        <span className="admin-panel-icon admin-panel-icon-person !rounded-xl !bg-orange-50 !text-orange-600">
                            <i className="bi bi-person-fill" />
                        </span>
                        <h3 className="!text-lg !font-bold !text-slate-900">Personal Information</h3>
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

                <div className="admin-profile-panel !rounded-2xl !border !border-slate-200 !bg-white !p-5 !shadow-sm md:!p-7">
                    <div className="admin-profile-panel-header !mb-6 !border-slate-100 !pb-4">
                        <span className="admin-panel-icon admin-panel-icon-security !rounded-xl !bg-orange-50 !text-orange-600">
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
                            <p>Add an extra layer of security to your account.</p>
                        </div>
                        <button
                            type="button"
                            className={`admin-profile-toggle ${twoFactorEnabled ? "active" : ""}`}
                            aria-label="Toggle two-factor authentication"
                            onClick={() => setTwoFactorEnabled((current) => !current)}
                        >
                            <span className="admin-profile-toggle-thumb" />
                        </button>
                    </div>
                    </div>
                </div>
            </div>

            <div className="admin-profile-actions !mt-0 !flex !justify-end !gap-3">
                {saveMessage.text && (
                    <div className={`admin-profile-save-message ${saveMessage.type === "error" ? "error" : "success"}`}>
                    {saveMessage.text}
                    </div>
                )}
                <button type="button" className="admin-profile-primary-btn !rounded-xl !bg-orange-600 !px-5 !py-3 !font-semibold !text-white !shadow-lg !shadow-orange-600/20 hover:!bg-orange-700" onClick={handleSave} disabled={isSaving}>
                    <i className="bi bi-check2-square" />
                    {isSaving ? "Saving..." : "Save Changes"}
                </button>
                <button type="button" className="admin-profile-secondary-btn !rounded-xl !border !border-slate-200 !bg-white !px-5 !py-3 !font-semibold !text-slate-700 hover:!bg-slate-50" onClick={handleCancel}>
                    <i className="bi bi-x-lg" />
                    Cancel
                </button>
            </div>
        </div>
    );
}

export default AdminProfile;
