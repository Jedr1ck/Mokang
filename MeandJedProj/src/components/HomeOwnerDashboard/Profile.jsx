
import React, { useEffect, useMemo, useState } from 'react';
import HomeownerSideBar from '../HomeownerSideBar/HomeownerSideBar';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../HomeownerDashboard.css';
import { api, getMyBookings } from '../../services/api';

const EMPTY_PROFILE = {
    fullName: '',
    email: '',
    mobileNumber: '',
    gender: '',
    address: '',
    birthday: '',
    profilePicture: '',
    role: '',
};

const formatBirthday = (value) => {
    if (!value) return 'Not provided';

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return 'Not provided';
    }

    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();

    return `${month}/${day}/${year}`;
};

const calculateAge = (value) => {
    if (!value) return null;

    const birthday = new Date(`${value}T00:00:00`);

    if (Number.isNaN(birthday.getTime())) return null;

    const today = new Date();

    let age = today.getFullYear() - birthday.getFullYear();

    const birthdayPassed =
        today.getMonth() > birthday.getMonth() ||
        (
            today.getMonth() === birthday.getMonth() &&
            today.getDate() >= birthday.getDate()
        );

    if (!birthdayPassed) age--;

    return age >= 0 ? age : null;
};

const getBookingTitle = (booking) =>
    booking.category ||
    booking.service_name ||
    booking.serviceName ||
    'Service Request';

const getBookingStatus = (booking) =>
    booking.status ||
    booking.booking_status ||
    booking.bookingStatus ||
    'Pending';

const getBookingDate = (booking) =>
    booking.preferred_date ||
    booking.preferredDate ||
    '';

const getStatusClass = (status) => {
    const value = String(status).toLowerCase();

    if (value.includes('complete')) return 'completed';
    if (value.includes('progress')) return 'in-progress';
    if (value.includes('cancel')) return 'cancelled';

    return 'pending';
};

const Profile = () => {
    const [profile, setProfile] = useState(EMPTY_PROFILE);
    const [draft, setDraft] = useState(EMPTY_PROFILE);
    const [bookings, setBookings] = useState([]);

    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    const age = useMemo(
        () => calculateAge(profile.birthday),
        [profile.birthday]
    );

    useEffect(() => {
        let active = true;

        const loadProfilePage = async () => {
            setLoading(true);
            setError('');

            const results = await Promise.allSettled([
                api('/profile/me'),
                getMyBookings(),
            ]);

            if (!active) return;

            const profileResult = results[0];

            if (profileResult.status === 'fulfilled') {
                const data = profileResult.value || {};

                const normalized = {
                    ...EMPTY_PROFILE,
                    ...data,

                    fullName:
                        data.fullName ||
                        data.full_name ||
                        '',

                    mobileNumber:
                        data.mobileNumber ||
                        data.mobile_number ||
                        '',

                    profilePicture:
                        data.profilePicture ||
                        data.profile_picture ||
                        '',

                    birthday: data.birthday
                        ? String(data.birthday).slice(0, 10)
                        : '',
                };

                setProfile(normalized);
                setDraft(normalized);
            } else {
                setError(
                    'Unable to load your profile. Please check your connection and backend.'
                );
            }

            const bookingsResult = results[1];

            if (bookingsResult.status === 'fulfilled') {
                const data = bookingsResult.value;

                setBookings(
                    Array.isArray(data)
                        ? data
                        : Array.isArray(data?.items)
                            ? data.items
                            : []
                );
            } else {
                setBookings([]);
            }

            setLoading(false);
        };

        loadProfilePage();

        return () => {
            active = false;
        };
    }, []);

    const updateDraft = (field, value) => {
        setDraft((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    const handlePictureChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Please select a valid image file.');
            event.target.value = '';
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            setError('Please select an image smaller than 2 MB.');
            event.target.value = '';
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            updateDraft('profilePicture', String(reader.result || ''));
            setError('');
        };

        reader.onerror = () => {
            setError('Unable to read the selected image.');
        };

        reader.readAsDataURL(file);
    };

    const handleSaveProfile = async (event) => {
        event.preventDefault();

        setError('');
        setNotice('');

        if (
            !draft.fullName.trim() ||
            !draft.mobileNumber.trim() ||
            !draft.gender ||
            !draft.address.trim() ||
            !draft.birthday
        ) {
            setError(
                'Please complete your full name, birthday, gender, phone number, and address.'
            );
            return;
        }

        const birthdayDate = new Date(`${draft.birthday}T00:00:00`);

        if (
            Number.isNaN(birthdayDate.getTime()) ||
            birthdayDate > new Date()
        ) {
            setError('Please enter a valid birthday that is not in the future.');
            return;
        }

        setSaving(true);

        try {
            const payload = {
                fullName: draft.fullName.trim(),
                mobileNumber: draft.mobileNumber.trim(),
                gender: draft.gender,
                address: draft.address.trim(),
                birthday: draft.birthday,
                profilePicture: draft.profilePicture || null,
            };

            const saved = await api('/profile/me', {
                method: 'PUT',
                body: JSON.stringify(payload),
            });

            const normalized = {
                ...draft,
                ...(saved || {}),

                fullName:
                    saved?.fullName ||
                    payload.fullName,

                mobileNumber:
                    saved?.mobileNumber ||
                    payload.mobileNumber,

                gender:
                    saved?.gender ||
                    payload.gender,

                address:
                    saved?.address ||
                    payload.address,

                birthday: saved?.birthday
                    ? String(saved.birthday).slice(0, 10)
                    : payload.birthday,

                profilePicture:
                    saved?.profilePicture ??
                    payload.profilePicture ??
                    '',
            };

            setProfile(normalized);
            setDraft(normalized);
            setIsEditing(false);
            setNotice('Your profile has been saved successfully.');

            const storedUser = JSON.parse(
                localStorage.getItem('user') || '{}'
            );

            localStorage.setItem(
                'user',
                JSON.stringify({
                    ...storedUser,
                    fullName: normalized.fullName,
                    email: normalized.email,
                    mobileNumber: normalized.mobileNumber,
                    gender: normalized.gender,
                    address: normalized.address,
                    birthday: normalized.birthday,
                    profilePicture: normalized.profilePicture,
                    role: normalized.role,
                })
            );
        } catch (err) {
            setError(
                err.message ||
                'Unable to save your profile. Please check the backend.'
            );
        } finally {
            setSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setDraft(profile);
        setIsEditing(false);
        setError('');
        setNotice('');
    };

    const handleNavigate = (path) => {
        window.location.href = path;
    };

    return (
        <div className="profile-page-container">
            <HomeownerSideBar />

            <main className="profile-main-content">

                {/* Header */}
                <header className="profile-header">
                    <h2>My Profile</h2>

                    <div className="header-actions profile-header-actions">

                        <button
                            type="button"
                            className="profile-header-icon-btn"
                            title="Messages"
                            aria-label="Messages"
                            onClick={() => handleNavigate('/messages')}
                        >
                            <i className="bi bi-chat-dots" />
                        </button>

                        <button
                            type="button"
                            className="profile-header-icon-btn"
                            title="Notifications"
                            aria-label="Notifications"
                            onClick={() => handleNavigate('/notifications')}
                        >
                            <i className="bi bi-bell" />
                        </button>

                        <span className="profile-page-label">
                            Homeowner Account
                        </span>
                    </div>
                </header>

                {/* Feedback messages */}
                {error && (
                    <div className="profile-message profile-error" role="alert">
                        <i className="bi bi-exclamation-circle" />
                        {' '}{error}
                    </div>
                )}

                {notice && (
                    <div className="profile-message profile-success" role="status">
                        <i className="bi bi-check-circle" />
                        {' '}{notice}
                    </div>
                )}

                {loading ? (
                    <section className="profile-card profile-loading">
                        <div className="profile-spinner" />
                        <p>Loading your profile...</p>
                    </section>
                ) : (
                    <>
                        {/* Profile Card */}
                        <section className="profile-card">

                            <div className="profile-avatar-section">
                                {(isEditing
                                    ? draft.profilePicture
                                    : profile.profilePicture
                                ) ? (
                                    <img
                                        className="profile-avatar"
                                        src={
                                            isEditing
                                                ? draft.profilePicture
                                                : profile.profilePicture
                                        }
                                        alt="Homeowner profile"
                                    />
                                ) : (
                                    <div className="profile-avatar profile-avatar-placeholder">
                                        <i className="bi bi-person-fill" />
                                    </div>
                                )}

                                {isEditing && (
                                    <label className="profile-picture-upload">
                                        <i className="bi bi-camera" />
                                        {' '}Change picture

                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handlePictureChange}
                                        />
                                    </label>
                                )}

                                {!isEditing && (
                                    <span className="profile-account-label">
                                        Homeowner
                                    </span>
                                )}
                            </div>

                            <div className="profile-details-section">

                                <div className="profile-title-row">
                                    <div>
                                        <h3>
                                            {profile.fullName || 'Homeowner'}
                                        </h3>

                                        <p className="profile-subtitle">
                                            <i className="bi bi-envelope" />
                                            {' '}
                                            {profile.email || 'Email not provided'}
                                        </p>
                                    </div>

                                    {!isEditing && (
                                        <button
                                            type="button"
                                            className="profile-edit-button"
                                            onClick={() => {
                                                setDraft(profile);
                                                setError('');
                                                setNotice('');
                                                setIsEditing(true);
                                            }}
                                        >
                                            <i className="bi bi-pencil-square" />
                                            {' '}Edit Profile
                                        </button>
                                    )}
                                </div>

                                {isEditing ? (
                                    <form
                                        className="profile-edit-form"
                                        onSubmit={handleSaveProfile}
                                    >
                                        <label>
                                            Full Name

                                            <input
                                                type="text"
                                                value={draft.fullName}
                                                onChange={(event) =>
                                                    updateDraft(
                                                        'fullName',
                                                        event.target.value
                                                    )
                                                }
                                                minLength={2}
                                                maxLength={150}
                                                required
                                            />
                                        </label>

                                        <label>
                                            Birthday

                                            <input
                                                type="date"
                                                value={draft.birthday}
                                                max={new Date()
                                                    .toISOString()
                                                    .slice(0, 10)}
                                                onChange={(event) =>
                                                    updateDraft(
                                                        'birthday',
                                                        event.target.value
                                                    )
                                                }
                                                required
                                            />

                                            {draft.birthday && (
                                                <small className="profile-age-preview">
                                                    {formatBirthday(draft.birthday)}
                                                    {calculateAge(draft.birthday) !== null
                                                        ? ` / ${calculateAge(draft.birthday)} yrs old`
                                                        : ''}
                                                </small>
                                            )}
                                        </label>

                                        <label>
                                            Gender

                                            <select
                                                value={draft.gender}
                                                onChange={(event) =>
                                                    updateDraft(
                                                        'gender',
                                                        event.target.value
                                                    )
                                                }
                                                required
                                            >
                                                <option value="">
                                                    Select gender
                                                </option>
                                                <option value="Female">Female</option>
                                                <option value="Male">Male</option>
                                                <option value="Other">Other</option>
                                                <option value="Prefer not to say">
                                                    Prefer not to say
                                                </option>
                                            </select>
                                        </label>

                                        <label>
                                            Phone Number

                                            <input
                                                type="tel"
                                                value={draft.mobileNumber}
                                                onChange={(event) =>
                                                    updateDraft(
                                                        'mobileNumber',
                                                        event.target.value
                                                    )
                                                }
                                                minLength={7}
                                                maxLength={30}
                                                required
                                            />
                                        </label>

                                        <label className="profile-address-field">
                                            Complete Address

                                            <textarea
                                                value={draft.address}
                                                onChange={(event) =>
                                                    updateDraft(
                                                        'address',
                                                        event.target.value
                                                    )
                                                }
                                                minLength={10}
                                                maxLength={500}
                                                rows={3}
                                                required
                                            />
                                        </label>

                                        <div className="profile-form-actions">
                                            <button
                                                type="button"
                                                className="profile-cancel-btn"
                                                onClick={handleCancelEdit}
                                            >
                                                Cancel
                                            </button>

                                            <button
                                                type="submit"
                                                className="profile-save-btn"
                                                disabled={saving}
                                            >
                                                {saving ? (
                                                    <>
                                                        <i className="bi bi-arrow-repeat" />
                                                        {' '}Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="bi bi-check2" />
                                                        {' '}Save Profile
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="profile-info-grid">

                                        <div className="profile-info-item">
                                            <i className="bi bi-calendar3" />
                                            <div>
                                                <span>Birthday</span>
                                                <strong>
                                                    {profile.birthday
                                                        ? `${formatBirthday(profile.birthday)}${age !== null
                                                            ? ` / ${age} yrs old`
                                                            : ''
                                                        }`
                                                        : 'Not provided'}
                                                </strong>
                                            </div>
                                        </div>

                                        <div className="profile-info-item">
                                            <i className="bi bi-gender-ambiguous" />
                                            <div>
                                                <span>Gender</span>
                                                <strong>
                                                    {profile.gender || 'Not provided'}
                                                </strong>
                                            </div>
                                        </div>

                                        <div className="profile-info-item">
                                            <i className="bi bi-telephone" />
                                            <div>
                                                <span>Phone Number</span>
                                                <strong>
                                                    {profile.mobileNumber || 'Not provided'}
                                                </strong>
                                            </div>
                                        </div>

                                        <div className="profile-info-item">
                                            <i className="bi bi-geo-alt" />
                                            <div>
                                                <span>Address</span>
                                                <strong>
                                                    {profile.address || 'Not provided'}
                                                </strong>
                                            </div>
                                        </div>

                                        <div className="profile-info-item">
                                            <i className="bi bi-envelope" />
                                            <div>
                                                <span>Email Address</span>
                                                <strong>
                                                    {profile.email || 'Not provided'}
                                                </strong>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Real service requests */}
                        <section className="dashboard-box activities-box">
                            <div className="profile-section-heading">
                                <div>
                                    <h4>My Service Requests</h4>
                                    <p>Track your home service bookings.</p>
                                </div>

                                <i className="bi bi-clipboard-check" />
                            </div>

                            {bookings.length === 0 ? (
                                <div className="profile-empty-state">
                                    <i className="bi bi-inbox" />
                                    <h5>No service requests yet</h5>
                                    <p>
                                        Your bookings will appear here after you
                                        request a home service.
                                    </p>
                                </div>
                            ) : (
                                <div className="activity-list">
                                    {bookings.map((booking, index) => {
                                        const status = getBookingStatus(booking);
                                        const bookingId =
                                            booking.id ??
                                            booking.booking_id ??
                                            index;

                                        const date = getBookingDate(booking);

                                        return (
                                            <div
                                                className="activity-item"
                                                key={bookingId}
                                            >
                                                <div className="activity-icon green">
                                                    <i className="bi bi-tools" />
                                                </div>

                                                <div className="activity-details">
                                                    <h5>{getBookingTitle(booking)}</h5>

                                                    <p>
                                                        {booking.description ||
                                                            'No description provided'}

                                                        {date
                                                            ? ` • ${String(date).slice(0, 10)}`
                                                            : ''}
                                                    </p>
                                                </div>

                                                <span
                                                    className={`status-badge ${getStatusClass(status)}`}
                                                >
                                                    {status}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    </>
                )}
            </main>

            {/* Page styles */}
            <style>{`
                .profile-main-content {
                    min-width: 0;
                    padding-bottom: 40px;
                }

                .profile-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 20px;
                    flex-wrap: wrap;
                    margin-bottom: 24px;
                }

                .profile-header h2 {
                    margin: 0;
                    color: #065f46;
                }

                .profile-header-actions {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 12px;
                }

                .profile-header-icon-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    flex: 0 0 auto;
                    width: 42px;
                    height: 42px;
                    border: 1px solid #e5e7eb;
                    border-radius: 50%;
                    background: #ffffff;
                    color: #047857;
                    font-size: 1.15rem;
                    cursor: pointer;
                    transition: all .2s ease;
                }

                .profile-header-icon-btn:hover {
                    background: #ecfdf5;
                    border-color: #10b981;
                    transform: translateY(-1px);
                }

                .profile-page-label {
                    color: #64748b;
                    font-size: .9rem;
                    white-space: nowrap;
                }

                .profile-card {
                    display: flex;
                    align-items: flex-start;
                    gap: 30px;
                    padding: 30px 36px;
                    margin-bottom: 26px;
                    border-radius: 20px;
                    background: #ffffff;
                    box-shadow: 0 5px 24px rgba(15, 23, 42, .05);
                }

                .profile-avatar-section {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                    flex: 0 0 140px;
                    min-width: 140px;
                }

                .profile-avatar {
                    width: 120px;
                    height: 120px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 4px solid #e5f7ef;
                    background: #f3f4f6;
                }

                .profile-avatar-placeholder {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #6b7280;
                    font-size: 3.3rem;
                }

                .profile-account-label {
                    padding: 5px 12px;
                    border-radius: 20px;
                    background: #ecfdf5;
                    color: #047857;
                    font-size: .8rem;
                    font-weight: 600;
                }

                .profile-picture-upload {
                    color: #059669;
                    font-size: .85rem;
                    cursor: pointer;
                    text-align: center;
                }

                .profile-picture-upload input {
                    display: block;
                    width: 165px;
                    max-width: 100%;
                    margin-top: 7px;
                    font-size: .75rem;
                }

                .profile-details-section {
                    flex: 1;
                    min-width: 0;
                }

                .profile-title-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 20px;
                    flex-wrap: wrap;
                    margin-bottom: 22px;
                }

                .profile-title-row h3 {
                    margin: 0;
                    color: #064e3b;
                    font-size: 1.5rem;
                    font-weight: 700;
                    overflow-wrap: anywhere;
                }

                .profile-subtitle {
                    margin: 7px 0 0;
                    color: #64748b;
                    overflow-wrap: anywhere;
                }

                .profile-edit-button {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 7px;
                    flex: 0 0 auto;
                    padding: 10px 16px;
                    border: none;
                    border-radius: 9px;
                    background: #059669;
                    color: #ffffff;
                    font-weight: 600;
                    white-space: nowrap;
                    cursor: pointer;
                    transition: background .2s ease;
                }

                .profile-edit-button:hover,
                .profile-save-btn:hover {
                    background: #047857;
                }

                .profile-info-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 20px 28px;
                }

                .profile-info-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 11px;
                    min-width: 0;
                }

                .profile-info-item > i {
                    margin-top: 3px;
                    color: #059669;
                    font-size: 1.1rem;
                }

                .profile-info-item div {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    min-width: 0;
                }

                .profile-info-item span {
                    color: #64748b;
                    font-size: .8rem;
                }

                .profile-info-item strong {
                    color: #1f2937;
                    font-size: .92rem;
                    font-weight: 600;
                    overflow-wrap: anywhere;
                }

                .profile-edit-form {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 18px;
                    margin-top: 20px;
                }

                .profile-edit-form label {
                    display: flex;
                    flex-direction: column;
                    gap: 7px;
                    min-width: 0;
                    color: #374151;
                    font-size: .9rem;
                    font-weight: 600;
                }

                .profile-edit-form input,
                .profile-edit-form select,
                .profile-edit-form textarea {
                    box-sizing: border-box;
                    width: 100%;
                    min-width: 0;
                    padding: 11px 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 8px;
                    background: #ffffff;
                    color: #111827;
                    font: inherit;
                    font-weight: 400;
                    outline: none;
                }

                .profile-edit-form input:focus,
                .profile-edit-form select:focus,
                .profile-edit-form textarea:focus {
                    border-color: #10b981;
                    box-shadow: 0 0 0 3px rgba(16, 185, 129, .12);
                }

                .profile-age-preview {
                    color: #059669;
                    font-size: .85rem;
                    font-weight: 600;
                }

                .profile-address-field {
                    grid-column: 1 / -1;
                }

                .profile-form-actions {
                    grid-column: 1 / -1;
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    margin-top: 5px;
                }

                .profile-save-btn,
                .profile-cancel-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    padding: 10px 17px;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                }

                .profile-save-btn {
                    background: #059669;
                    color: #ffffff;
                }

                .profile-save-btn:disabled {
                    opacity: .65;
                    cursor: wait;
                }

                .profile-cancel-btn {
                    background: #e5e7eb;
                    color: #374151;
                }

                .profile-cancel-btn:hover {
                    background: #d1d5db;
                }

                .profile-message {
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    padding: 12px 15px;
                    margin-bottom: 18px;
                    border-radius: 9px;
                    overflow-wrap: anywhere;
                }

                .profile-error {
                    background: #fef2f2;
                    color: #991b1b;
                }

                .profile-success {
                    background: #ecfdf5;
                    color: #065f46;
                }

                .profile-loading {
                    align-items: center;
                    min-height: 140px;
                    color: #64748b;
                }

                .profile-spinner {
                    width: 25px;
                    height: 25px;
                    border: 3px solid #d1fae5;
                    border-top-color: #059669;
                    border-radius: 50%;
                    animation: profile-spin .8s linear infinite;
                }

                @keyframes profile-spin {
                    to { transform: rotate(360deg); }
                }

                .activities-box {
                    width: 100%;
                    min-width: 0;
                    padding: 26px;
                    border-radius: 18px;
                    background: #ffffff;
                    box-shadow: 0 5px 24px rgba(15, 23, 42, .04);
                }

                .profile-section-heading {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 15px;
                    margin-bottom: 12px;
                }

                .profile-section-heading h4 {
                    margin: 0;
                    color: #111827;
                    font-size: 1.1rem;
                    font-weight: 700;
                }

                .profile-section-heading p {
                    margin: 6px 0 0;
                    color: #64748b;
                    font-size: .88rem;
                }

                .profile-section-heading > i {
                    color: #059669;
                    font-size: 1.6rem;
                }

                .activity-item {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 17px 0;
                    border-bottom: 1px solid #f1f5f9;
                }

                .activity-item:last-child {
                    border-bottom: none;
                }

                .activity-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex: 0 0 44px;
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                    background: #ecfdf5;
                    color: #059669;
                    font-size: 1.2rem;
                }

                .activity-details {
                    flex: 1;
                    min-width: 0;
                }

                .activity-details h5 {
                    margin: 0 0 5px;
                    color: #1f2937;
                    font-weight: 600;
                }

                .activity-details p {
                    margin: 0;
                    color: #64748b;
                    font-size: .88rem;
                    overflow-wrap: anywhere;
                }

                .status-badge {
                    flex: 0 0 auto;
                    padding: 6px 10px;
                    border-radius: 20px;
                    background: #fef3c7;
                    color: #92400e;
                    font-size: .75rem;
                    font-weight: 600;
                    white-space: nowrap;
                }

                .status-badge.completed {
                    background: #d1fae5;
                    color: #065f46;
                }

                .status-badge.in-progress {
                    background: #dbeafe;
                    color: #1d4ed8;
                }

                .status-badge.cancelled {
                    background: #fee2e2;
                    color: #991b1b;
                }

                .status-badge.pending {
                    background: #fef3c7;
                    color: #92400e;
                }

                .profile-empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 35px 15px;
                    text-align: center;
                }

                .profile-empty-state > i {
                    color: #9ca3af;
                    font-size: 2.4rem;
                    margin-bottom: 10px;
                }

                .profile-empty-state h5 {
                    margin: 0 0 7px;
                    color: #374151;
                }

                .profile-empty-state p {
                    margin: 0;
                    color: #64748b;
                    font-size: .9rem;
                }

                @media (max-width: 900px) {
                    .profile-card {
                        gap: 22px;
                        padding: 24px;
                    }

                    .profile-avatar-section {
                        flex-basis: 110px;
                        min-width: 110px;
                    }

                    .profile-avatar {
                        width: 100px;
                        height: 100px;
                    }
                }

                @media (max-width: 600px) {
                    .profile-header {
                        align-items: flex-start;
                    }

                    .profile-header-actions {
                        gap: 8px;
                        flex-wrap: wrap;
                    }

                    .profile-page-label {
                        font-size: .78rem;
                    }

                    .profile-card {
                        flex-direction: column;
                        align-items: stretch;
                        padding: 22px 16px;
                    }

                    .profile-avatar-section {
                        flex-basis: auto;
                        min-width: 0;
                    }

                    .profile-details-section {
                        width: 100%;
                    }

                    .profile-title-row {
                        align-items: flex-start;
                        flex-direction: column;
                    }

                    .profile-info-grid,
                    .profile-edit-form {
                        grid-template-columns: 1fr;
                    }

                    .profile-address-field,
                    .profile-form-actions {
                        grid-column: auto;
                    }

                    .activities-box {
                        padding: 20px 16px;
                    }

                    .activity-item {
                        align-items: flex-start;
                        flex-wrap: wrap;
                    }

                    .status-badge {
                        margin-left: 60px;
                    }
                }
            `}</style>
        </div>
    );
};

export default Profile;
