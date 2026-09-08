import React, { useState } from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';

import 'bootstrap-icons/font/bootstrap-icons.css';

import "./AdminDashboard.css";

function SystemSettings() {
    const [settings, setSettings] = useState({
        maintenanceMode: false,
        allowHomeownerRegistration: true,
        allowProviderRegistration: true,
        requireProviderApproval: true,
        enableNotifications: true,
        enableEmailNotifications: true,
    });

    const [saved, setSaved] = useState(false);

    const handleToggle = (settingName) => {
        setSettings((previousSettings) => ({
            ...previousSettings,
            [settingName]: !previousSettings[settingName],
        }));

        setSaved(false);
    };

    const handleSaveSettings = () => {
        /*
         * Settings are currently stored in frontend state.
         * This will be connected to the backend/system settings
         * API later.
         */

        setSaved(true);

        setTimeout(() => {
            setSaved(false);
        }, 3000);
    };

    const handleReset = () => {
        setSettings({
            maintenanceMode: false,
            allowHomeownerRegistration: true,
            allowProviderRegistration: true,
            requireProviderApproval: true,
            enableNotifications: true,
            enableEmailNotifications: true,
        });

        setSaved(false);
    };

    return (
        <div className="admin-settings-page">

            {/* PAGE HEADER */}
            <div className="admin-management-header">

                <div>
                    <span className="admin-section-label">
                        SYSTEM CONFIGURATION
                    </span>

                    <h2>System Settings</h2>

                    <p>
                        Manage SmartHome platform settings and
                        administrator controls.
                    </p>
                </div>

            </div>

            {/* SUCCESS MESSAGE */}
            {saved && (
                <div className="admin-settings-success">
                    <i className="bi bi-check-circle-fill"></i>

                    <div>
                        <strong>
                            Settings saved successfully
                        </strong>

                        <span>
                            Your system settings have been updated.
                        </span>
                    </div>
                </div>
            )}

            <div className="admin-settings-grid">

                {/* GENERAL SETTINGS */}
                <section className="admin-settings-card">

                    <div className="admin-settings-card-header">

                        <div className="admin-settings-card-icon">
                            <i className="bi bi-sliders"></i>
                        </div>

                        <div>
                            <h3>General Settings</h3>

                            <p>
                                Control the general behavior of
                                the SmartHome platform.
                            </p>
                        </div>

                    </div>

                    <div className="admin-settings-options">

                        {/* MAINTENANCE MODE */}
                        <div className="admin-setting-row">

                            <div className="admin-setting-information">

                                <div className="admin-setting-title">
                                    <i className="bi bi-tools"></i>

                                    <strong>
                                        Maintenance Mode
                                    </strong>
                                </div>

                                <span>
                                    Temporarily restrict access
                                    to the platform while system
                                    maintenance is being performed.
                                </span>

                            </div>

                            <button
                                type="button"
                                className={`admin-toggle ${settings.maintenanceMode
                                    ? "active"
                                    : ""
                                    }`}
                                onClick={() =>
                                    handleToggle(
                                        "maintenanceMode"
                                    )
                                }
                                aria-label="Toggle Maintenance Mode"
                            >
                                <span></span>
                            </button>

                        </div>

                    </div>

                </section>

                {/* REGISTRATION SETTINGS */}
                <section className="admin-settings-card">

                    <div className="admin-settings-card-header">

                        <div className="admin-settings-card-icon">
                            <i className="bi bi-person-plus-fill"></i>
                        </div>

                        <div>
                            <h3>Registration Settings</h3>

                            <p>
                                Control who can register on the
                                platform.
                            </p>
                        </div>

                    </div>

                    <div className="admin-settings-options">

                        {/* HOMEOWNER REGISTRATION */}
                        <div className="admin-setting-row">

                            <div className="admin-setting-information">

                                <div className="admin-setting-title">
                                    <i className="bi bi-house-heart-fill"></i>

                                    <strong>
                                        Homeowner Registration
                                    </strong>
                                </div>

                                <span>
                                    Allow new homeowners to create
                                    accounts.
                                </span>

                            </div>

                            <button
                                type="button"
                                className={`admin-toggle ${settings.allowHomeownerRegistration
                                    ? "active"
                                    : ""
                                    }`}
                                onClick={() =>
                                    handleToggle(
                                        "allowHomeownerRegistration"
                                    )
                                }
                                aria-label="Toggle Homeowner Registration"
                            >
                                <span></span>
                            </button>

                        </div>

                        {/* PROVIDER REGISTRATION */}
                        <div className="admin-setting-row">

                            <div className="admin-setting-information">

                                <div className="admin-setting-title">
                                    <i className="bi bi-person-badge-fill"></i>

                                    <strong>
                                        Service Provider Registration
                                    </strong>
                                </div>

                                <span>
                                    Allow new service providers to
                                    create accounts.
                                </span>

                            </div>

                            <button
                                type="button"
                                className={`admin-toggle ${settings.allowProviderRegistration
                                    ? "active"
                                    : ""
                                    }`}
                                onClick={() =>
                                    handleToggle(
                                        "allowProviderRegistration"
                                    )
                                }
                                aria-label="Toggle Service Provider Registration"
                            >
                                <span></span>
                            </button>

                        </div>

                        {/* PROVIDER APPROVAL */}
                        <div className="admin-setting-row">

                            <div className="admin-setting-information">

                                <div className="admin-setting-title">
                                    <i className="bi bi-shield-check"></i>

                                    <strong>
                                        Provider Approval Required
                                    </strong>
                                </div>

                                <span>
                                    Require administrator approval
                                    before a new provider can
                                    access provider services.
                                </span>

                            </div>

                            <button
                                type="button"
                                className={`admin-toggle ${settings.requireProviderApproval
                                    ? "active"
                                    : ""
                                    }`}
                                onClick={() =>
                                    handleToggle(
                                        "requireProviderApproval"
                                    )
                                }
                                aria-label="Toggle Provider Approval"
                            >
                                <span></span>
                            </button>

                        </div>

                    </div>

                </section>

                {/* NOTIFICATION SETTINGS */}
                <section className="admin-settings-card">

                    <div className="admin-settings-card-header">

                        <div className="admin-settings-card-icon">
                            <i className="bi bi-bell-fill"></i>
                        </div>

                        <div>
                            <h3>Notification Settings</h3>

                            <p>
                                Manage system notification behavior.
                            </p>
                        </div>

                    </div>

                    <div className="admin-settings-options">

                        {/* SYSTEM NOTIFICATIONS */}
                        <div className="admin-setting-row">

                            <div className="admin-setting-information">

                                <div className="admin-setting-title">
                                    <i className="bi bi-bell"></i>

                                    <strong>
                                        System Notifications
                                    </strong>
                                </div>

                                <span>
                                    Enable notifications for
                                    important system activities.
                                </span>

                            </div>

                            <button
                                type="button"
                                className={`admin-toggle ${settings.enableNotifications
                                    ? "active"
                                    : ""
                                    }`}
                                onClick={() =>
                                    handleToggle(
                                        "enableNotifications"
                                    )
                                }
                                aria-label="Toggle System Notifications"
                            >
                                <span></span>
                            </button>

                        </div>

                        {/* EMAIL NOTIFICATIONS */}
                        <div className="admin-setting-row">

                            <div className="admin-setting-information">

                                <div className="admin-setting-title">
                                    <i className="bi bi-envelope-fill"></i>

                                    <strong>
                                        Email Notifications
                                    </strong>
                                </div>

                                <span>
                                    Enable email notifications
                                    for supported system events.
                                </span>

                            </div>

                            <button
                                type="button"
                                className={`admin-toggle ${settings.enableEmailNotifications
                                    ? "active"
                                    : ""
                                    }`}
                                onClick={() =>
                                    handleToggle(
                                        "enableEmailNotifications"
                                    )
                                }
                                aria-label="Toggle Email Notifications"
                            >
                                <span></span>
                            </button>

                        </div>

                    </div>

                </section>

                {/* SYSTEM INFORMATION */}
                <section className="admin-settings-card">

                    <div className="admin-settings-card-header">

                        <div className="admin-settings-card-icon">
                            <i className="bi bi-info-circle-fill"></i>
                        </div>

                        <div>
                            <h3>System Information</h3>

                            <p>
                                Basic information about the
                                SmartHome platform.
                            </p>
                        </div>

                    </div>

                    <div className="admin-system-information">

                        <div className="admin-system-info-row">

                            <span>
                                Platform
                            </span>

                            <strong>
                                SmartHome
                            </strong>

                        </div>

                        <div className="admin-system-info-row">

                            <span>
                                User Role
                            </span>

                            <strong>
                                Administrator
                            </strong>

                        </div>

                        <div className="admin-system-info-row">

                            <span>
                                System Status
                            </span>

                            <strong className="admin-system-status">
                                <i className="bi bi-circle-fill"></i>
                                Operational
                            </strong>

                        </div>

                    </div>

                </section>

            </div>

            {/* ACTION BUTTONS */}
            <div className="admin-settings-actions">

                <button
                    type="button"
                    className="admin-modal-secondary-button"
                    onClick={handleReset}
                >
                    <i className="bi bi-arrow-counterclockwise"></i>
                    Reset Changes
                </button>

                <button
                    type="button"
                    className="admin-modal-primary-button"
                    onClick={handleSaveSettings}
                >
                    <i className="bi bi-check-lg"></i>
                    Save Settings
                </button>

            </div>

        </div>
    );
}

export default SystemSettings;