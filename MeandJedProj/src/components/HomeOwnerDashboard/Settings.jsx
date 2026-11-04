import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HomeownerSideBar from '../HomeownerSideBar/HomeownerSideBar';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../HomeownerDashboard.css';
import { getMyProfile, updateMySecurity } from '../../services/api';

const SETTINGS_TABS = [
    { id: 'General', label: 'General & Preferences', icon: 'bi-gear' },
    { id: 'Notifications', label: 'Notifications', icon: 'bi-bell' },
    { id: 'Privacy', label: 'Privacy & Security', icon: 'bi-shield-check' }
];

const loadPrivacySettings = () => {
    try {
        return {
            showProfile: true,
            showLocation: true,
            ...JSON.parse(localStorage.getItem('homeowner-privacy-settings') || '{}')
        };
    } catch {
        return { showProfile: true, showLocation: true };
    }
};

const Settings = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('General');
    const [privacy, setPrivacy] = useState(loadPrivacySettings);
    const [privacyMessage, setPrivacyMessage] = useState('');
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [securityError, setSecurityError] = useState('');
    const [securitySuccess, setSecuritySuccess] = useState('');
    const [securitySaving, setSecuritySaving] = useState(false);

    useEffect(() => {
        let active = true;
        getMyProfile()
            .then((profile) => {
                if (active) setEmail(profile.email || '');
            })
            .catch((error) => {
                if (active) setSecurityError(error.message || 'Unable to load account details.');
            });
        return () => {
            active = false;
        };
    }, []);

    const handleTogglePrivacy = (key) => {
        setPrivacy((previous) => ({ ...previous, [key]: !previous[key] }));
        setPrivacyMessage('');
    };

    const savePrivacySettings = () => {
        localStorage.setItem('homeowner-privacy-settings', JSON.stringify(privacy));
        setPrivacyMessage('Privacy preferences saved on this device.');
    };

    const handleSecuritySubmit = async (event) => {
        event.preventDefault();
        setSecurityError('');
        setSecuritySuccess('');

        if (!newEmail.trim() && !newPassword) {
            setSecurityError('Enter a new email address or password.');
            return;
        }
        if (newPassword && newPassword !== confirmPassword) {
            setSecurityError('The new passwords do not match.');
            return;
        }

        setSecuritySaving(true);
        try {
            const updatedUser = await updateMySecurity({
                currentPassword,
                ...(newEmail.trim() ? { newEmail: newEmail.trim() } : {}),
                ...(newPassword ? { newPassword } : {})
            });
            setEmail(updatedUser.email || '');
            setCurrentPassword('');
            setNewEmail('');
            setNewPassword('');
            setConfirmPassword('');
            setSecuritySuccess('Account security details updated.');
        } catch (error) {
            setSecurityError(error.message || 'Unable to update account security.');
        } finally {
            setSecuritySaving(false);
        }
    };

    return (
        <div className="profile-page-container">
            <HomeownerSideBar />
            <main className="profile-main-content">
                <header className="profile-header">
                    <h2>Account Settings</h2>
                </header>

                <div className="homeowner-settings-layout">
                    <nav className="dashboard-box homeowner-settings-nav" aria-label="Settings sections">
                        {SETTINGS_TABS.map((tab) => (
                            <button
                                type="button"
                                key={tab.id}
                                className={`homeowner-settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                                aria-current={activeTab === tab.id ? 'page' : undefined}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <i className={`bi ${tab.icon}`} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>

                    <section className="dashboard-box homeowner-settings-panel">
                        {activeTab === 'General' && (
                            <div>
                                <h3>General Preferences</h3>
                                <p className="homeowner-settings-description">
                                    Regional settings used to display dates and times.
                                </p>
                                <label className="homeowner-settings-label" htmlFor="settings-timezone">Timezone</label>
                                <input
                                    id="settings-timezone"
                                    className="form-control homeowner-settings-input"
                                    value="Philippine Standard Time (GMT+8)"
                                    readOnly
                                />
                            </div>
                        )}

                        {activeTab === 'Notifications' && (
                            <div>
                                <h3>In-app Notifications</h3>
                                <p className="homeowner-settings-description">
                                    Booking and message updates are available in your notifications center.
                                </p>
                                <div className="homeowner-settings-notice">
                                    <i className="bi bi-bell-fill" aria-hidden="true" />
                                    <span>Stay updated about new messages and booking activity in your notifications center.</span>
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-brand mt-3"
                                    onClick={() => navigate('/notifications')}
                                >
                                    <i className="bi bi-bell me-2" />
                                    Open Notifications
                                </button>
                            </div>
                        )}

                        {activeTab === 'Privacy' && (
                            <div>
                                <h3>Privacy & Security</h3>
                                <p className="homeowner-settings-description">
                                    Manage profile visibility and update your account email or password.
                                </p>

                                <div className="homeowner-settings-toggle">
                                    <div>
                                        <strong>Public Profile</strong>
                                        <p>Allow service providers to view basic profile info.</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={privacy.showProfile}
                                        onChange={() => handleTogglePrivacy('showProfile')}
                                        aria-label="Allow providers to view my profile"
                                    />
                                </div>
                                <div className="homeowner-settings-toggle">
                                    <div>
                                        <strong>Share Location Automatically</strong>
                                        <p>Share your pinned address with booked technicians.</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={privacy.showLocation}
                                        onChange={() => handleTogglePrivacy('showLocation')}
                                        aria-label="Share my location with booked technicians"
                                    />
                                </div>
                                <div className="homeowner-settings-actions">
                                    {privacyMessage && <span role="status">{privacyMessage}</span>}
                                    <button type="button" className="btn btn-brand" onClick={savePrivacySettings}>
                                        Save Privacy Preferences
                                    </button>
                                </div>

                                <form className="homeowner-security-form" onSubmit={handleSecuritySubmit}>
                                    <h4>Account Email & Password</h4>
                                    <label className="homeowner-settings-label" htmlFor="current-account-email">Current email</label>
                                    <input
                                        id="current-account-email"
                                        className="form-control homeowner-settings-input"
                                        value={email}
                                        readOnly
                                    />
                                    <label className="homeowner-settings-label" htmlFor="new-account-email">New email</label>
                                    <input
                                        id="new-account-email"
                                        className="form-control homeowner-settings-input"
                                        type="email"
                                        autoComplete="email"
                                        value={newEmail}
                                        onChange={(event) => setNewEmail(event.target.value)}
                                    />
                                    <label className="homeowner-settings-label" htmlFor="current-account-password">Current password</label>
                                    <input
                                        id="current-account-password"
                                        className="form-control homeowner-settings-input"
                                        type="password"
                                        autoComplete="current-password"
                                        value={currentPassword}
                                        onChange={(event) => setCurrentPassword(event.target.value)}
                                        required
                                    />
                                    <label className="homeowner-settings-label" htmlFor="new-account-password">New password</label>
                                    <input
                                        id="new-account-password"
                                        className="form-control homeowner-settings-input"
                                        type="password"
                                        autoComplete="new-password"
                                        minLength={8}
                                        value={newPassword}
                                        onChange={(event) => setNewPassword(event.target.value)}
                                    />
                                    <label className="homeowner-settings-label" htmlFor="confirm-account-password">Confirm new password</label>
                                    <input
                                        id="confirm-account-password"
                                        className="form-control homeowner-settings-input"
                                        type="password"
                                        autoComplete="new-password"
                                        minLength={8}
                                        value={confirmPassword}
                                        onChange={(event) => setConfirmPassword(event.target.value)}
                                    />
                                    {securityError && <p className="alert alert-danger mt-3 mb-0" role="alert">{securityError}</p>}
                                    {securitySuccess && <p className="alert alert-success mt-3 mb-0" role="status">{securitySuccess}</p>}
                                    <button type="submit" className="btn btn-brand mt-3" disabled={securitySaving}>
                                        {securitySaving ? 'Updating…' : 'Update Account Security'}
                                    </button>
                                </form>
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
};

export default Settings;
