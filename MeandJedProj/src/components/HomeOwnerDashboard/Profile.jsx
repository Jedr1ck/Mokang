
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

        </div>
    );
};

export default Profile;
