
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HomeownerSideBar from '../HomeownerSideBar/HomeownerSideBar';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../HomeownerDashboard.css';
import { api, getMyBookings } from '../../services/api';
import HomeAddressMap from './HomeAddressMap';
import { reverseGeocodeLocation } from './addressGeocoding';

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

const normalizeProfile = (data = {}) => ({
    ...EMPTY_PROFILE,
    ...data,
    fullName: data.fullName || data.full_name || '',
    mobileNumber: data.mobileNumber || data.mobile_number || '',
    profilePicture: data.profilePicture || data.profile_picture || '',
    birthday: data.birthday ? String(data.birthday).slice(0, 10) : '',
});

const statusOf = (booking) =>
    booking.status || booking.booking_status || booking.bookingStatus || 'Pending';

const titleOf = (booking) =>
    booking.category || booking.service_name || booking.serviceName || 'Service Request';

const dateOf = (booking) =>
    booking.preferred_date || booking.preferredDate || booking.booking_date || '';

const statusKey = (status) => {
    const value = String(status).toLowerCase();

    if (value.includes('accept') || value.includes('confirm')) return 'accepted';
    if (value.includes('complete')) return 'completed';
    if (value.includes('cancel') || value.includes('reject')) return 'cancelled';

    return 'pending';
};

const prettyDate = (value) => {
    if (!value) return 'Not provided';

    const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);

    if (Number.isNaN(date.getTime())) return 'Not provided';

    return date.toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
};

const ageFromBirthday = (value) => {
    if (!value) return null;
    const birthday = new Date(`${String(value).slice(0, 10)}T00:00:00`);
    if (Number.isNaN(birthday.getTime()) || birthday > new Date()) return null;
    const today = new Date();
    return today.getFullYear() - birthday.getFullYear() -
        (today.getMonth() < birthday.getMonth() ||
            (today.getMonth() === birthday.getMonth() && today.getDate() < birthday.getDate()) ? 1 : 0);
};

const isValidMobileNumber = (value) => /^09\d{9}$/.test(value);

export default function Profile() {
    const navigate = useNavigate();

    const [profile, setProfile] = useState(EMPTY_PROFILE);
    const [draft, setDraft] = useState(EMPTY_PROFILE);
    const [bookings, setBookings] = useState([]);

    const [editing, setEditing] = useState(false);
    const [editingAddress, setEditingAddress] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingPhoto, setSavingPhoto] = useState(false);

    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [notice, setNotice] = useState('');
    const [bookingFilter, setBookingFilter] = useState('all');

    const [coords, setCoords] = useState(null);
    const [locating, setLocating] = useState(false);

    const [memberSince] = useState(() => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            return user.createdAt || user.created_at || user.memberSince || '';
        } catch {
            return '';
        }
    });

    const memberDate = memberSince ? prettyDate(memberSince) : 'Not available';

    useEffect(() => {
        let active = true;

        const loadProfilePage = async () => {
            setLoading(true);

            const [profileResult, bookingsResult] = await Promise.allSettled([
                api('/profile/me'),
                getMyBookings(),
            ]);

            if (!active) return;

            if (profileResult.status === 'fulfilled') {
                const normalized = normalizeProfile(profileResult.value || {});
                setProfile(normalized);
                setDraft(normalized);
            } else {
                setError('Unable to load your profile. Please check your connection and backend.');
            }

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
        setFieldErrors((previous) => ({ ...previous, [field]: '' }));
        setError('');
    };

    const pickPhoto = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            setError('Choose a JPG, PNG, or WEBP profile photo.');
            event.target.value = '';
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            setError('Profile photo must be 2 MB or smaller.');
            event.target.value = '';
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            updateDraft('profilePicture', String(reader.result || ''));
            setError('');
        };

        reader.onerror = () => {
            setError('Unable to read the selected profile photo.');
        };

        reader.readAsDataURL(file);
    };

    const updateCachedProfile = (updatedProfile) => {
        let cacheUpdated = true;
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            localStorage.setItem('user', JSON.stringify({ ...user, ...updatedProfile }));
        } catch (cacheError) {
            console.error('Profile saved, but the local profile cache could not be updated:', cacheError);
            cacheUpdated = false;
        }
        window.dispatchEvent(new CustomEvent('homeowner-profile-updated', { detail: updatedProfile }));
        return cacheUpdated;
    };

    const saveProfilePicture = async () => {
        if (!draft.profilePicture || draft.profilePicture === profile.profilePicture) return;
        setSavingPhoto(true);
        setError('');
        setNotice('');
        try {
            const saved = await api('/profile/me', {
                method: 'PUT',
                body: JSON.stringify({ profilePicture: draft.profilePicture }),
            });
            const normalized = normalizeProfile({
                ...profile,
                ...(saved || {}),
                profilePicture: saved?.profilePicture ?? draft.profilePicture,
            });
            setProfile(normalized);
            setDraft((current) => ({ ...current, profilePicture: normalized.profilePicture }));
            const cacheUpdated = updateCachedProfile(normalized);
            setNotice(cacheUpdated
                ? 'Your profile picture has been saved.'
                : 'Your profile picture was saved to your account, but the local cache could not be updated.');
        } catch (saveError) {
            setError(saveError.message || 'Unable to save your profile picture.');
        } finally {
            setSavingPhoto(false);
        }
    };

    const saveProfile = async (event) => {
        event.preventDefault();
        setError('');
        setNotice('');

        const validationErrors = {};
        if (editingAddress) {
            if (draft.address.trim().length < 10) {
                validationErrors.address = 'Enter a home address of at least 10 characters.';
            }
        } else {
            if (draft.fullName.trim().length < 2) validationErrors.fullName = 'Enter your full name.';
            if (!draft.birthday) validationErrors.birthday = 'Enter your birthday.';
            const birthday = new Date(`${draft.birthday}T00:00:00`);
            if (draft.birthday && (Number.isNaN(birthday.getTime()) || birthday > new Date())) {
                validationErrors.birthday = 'Enter a valid birthday that is not in the future.';
            }
            if (!draft.gender) validationErrors.gender = 'Select your gender.';
            if (!isValidMobileNumber(draft.mobileNumber)) {
                validationErrors.mobileNumber = 'Enter an 11-digit Philippine mobile number starting with 09.';
            }
        }
        setFieldErrors(validationErrors);
        if (Object.keys(validationErrors).length) {
            setError('Please correct the highlighted fields.');
            return;
        }

        setSaving(true);

        try {
            const payload = editingAddress
                ? { address: draft.address.trim() }
                : {
                    fullName: draft.fullName.trim(),
                    mobileNumber: draft.mobileNumber.trim(),
                    gender: draft.gender,
                    birthday: draft.birthday,
                    profilePicture: draft.profilePicture || null,
                };

            const saved = await api('/profile/me', {
                method: 'PUT',
                body: JSON.stringify(payload),
            });

            const normalized = normalizeProfile({
                ...profile,
                ...(saved || {}),
                ...payload,
                profilePicture: saved?.profilePicture ?? payload.profilePicture ?? profile.profilePicture,
            });

            setProfile(normalized);
            setDraft(normalized);
            setEditing(false);
            setEditingAddress(false);
            const savedMessage = editingAddress
                ? 'Your home address has been saved successfully.'
                : 'Your personal information has been saved successfully.';
            const cacheUpdated = updateCachedProfile(normalized);
            setNotice(cacheUpdated
                ? savedMessage
                : `${savedMessage} The local cache could not be updated.`);

            updateCachedProfile(normalized);
        } catch (err) {
            setError(err.message || 'Unable to save your profile.');
        } finally {
            setSaving(false);
        }
    };

    const useCurrentLocation = () => {
        setError('');
        setNotice('');

        if (!navigator.geolocation) {
            setError('Location is not supported by this browser.');
            return;
        }

        setLocating(true);

        navigator.geolocation.getCurrentPosition(
            async ({ coords: location }) => {
                const nextCoords = { lat: location.latitude, lng: location.longitude };
                setCoords(nextCoords);
                try {
                    const address = await reverseGeocodeLocation(nextCoords.lat, nextCoords.lng);
                    if (!address) {
                        setNotice('Location found, but no address was returned. Enter your home address manually.');
                        return;
                    }
                    updateDraft('address', address);
                    setNotice('Current location and home address found. Save your profile to keep the address.');
                } catch (geocodeError) {
                    setError(geocodeError.message || 'Unable to look up this address. You can enter it manually.');
                } finally {
                    setLocating(false);
                }
            },
            (locationError) => {
                setLocating(false);

                setError(
                    locationError.code === 1
                        ? 'Location permission was denied. You can still enter your address manually.'
                        : 'Unable to get your location. Please try again or enter your address manually.'
                );
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000,
            }
        );
    };

    const filteredBookings = useMemo(() => {
        if (bookingFilter === 'all') return bookings;

        return bookings.filter(
            (booking) => statusKey(statusOf(booking)) === bookingFilter
        );
    }, [bookings, bookingFilter]);

    const startEdit = (addressOnly = false) => {
        setDraft(profile);
        setEditing(!addressOnly);
        setEditingAddress(addressOnly);
        setError('');
        setNotice('');
    };

    const cancelEdit = () => {
        setDraft(profile);
        setEditing(false);
        setEditingAddress(false);
        setError('');
        setNotice('');
    };

    return (
        <div className="profile-page-container homeowner-profile-v2">
            <HomeownerSideBar />

            <main className="profile-main-content homeowner-profile-main">
                <header className="profile-header homeowner-profile-header">
                    <div>
                        <h2>My Profile</h2>
                        <p>Manage your homeowner account and profile.</p>
                    </div>

                    <div className="header-actions profile-header-actions">
                        <button
                            type="button"
                            className="profile-header-icon-btn"
                            title="Messages"
                            aria-label="Messages"
                            onClick={() => navigate('/messages')}
                        >
                            <i className="bi bi-chat-dots" />
                        </button>

                        <button
                            type="button"
                            className="profile-header-icon-btn"
                            title="Notifications"
                            aria-label="Notifications"
                            onClick={() => navigate('/notifications')}
                        >
                            <i className="bi bi-bell" />
                        </button>

                        <div className="profile-header-user">
                            {profile.profilePicture ? (
                                <img src={profile.profilePicture} alt="" />
                            ) : (
                                <i className="bi bi-person-circle" />
                            )}

                            <span>
                                <strong>{profile.fullName || 'Homeowner'}</strong>
                                <small>Homeowner</small>
                            </span>
                        </div>
                    </div>
                </header>

                {error && (
                    <div className="profile-message profile-error" role="alert">
                        <i className="bi bi-exclamation-circle" /> {error}
                    </div>
                )}

                {notice && (
                    <div className="profile-message profile-success" role="status">
                        <i className="bi bi-check-circle" /> {notice}
                    </div>
                )}

                {loading ? (
                    <section className="profile-card profile-loading">
                        <div className="profile-spinner" />
                        <p>Loading your profile...</p>
                    </section>
                ) : (
                    <div className="homeowner-profile-layout">
                        <div className="homeowner-profile-left">
                            <section className="profile-card hp-panel hp-overview">
                                <div className="hp-section-heading">
                                    <h3><i className="bi bi-person-fill" /> Profile Overview</h3>

                                    <div className="hp-overview-actions">
                                    {editing && draft.profilePicture !== profile.profilePicture && (
                                        <button
                                            type="button"
                                            className="hp-button hp-button-primary"
                                            onClick={saveProfilePicture}
                                            disabled={savingPhoto}
                                        >
                                            <i className="bi bi-cloud-arrow-up" /> {savingPhoto ? 'Saving Photo...' : 'Save Photo'}
                                        </button>
                                    )}
                                    {!editing && !editingAddress && (
                                        <button
                                            type="button"
                                            className="hp-button hp-button-primary"
                                            onClick={() => startEdit(false)}
                                        >
                                            <i className="bi bi-pencil-fill" /> Edit Profile
                                        </button>
                                    )}
                                    </div>
                                </div>

                                <div className="hp-overview-body">
                                    <div className="hp-avatar-wrap">
                                        {(editing || editingAddress) && draft.profilePicture ? (
                                            <img className="hp-avatar" src={draft.profilePicture} alt="Homeowner profile" />
                                        ) : profile.profilePicture ? (
                                            <img className="hp-avatar" src={profile.profilePicture} alt="Homeowner profile" />
                                        ) : (
                                            <div className="hp-avatar hp-avatar-empty">
                                                <i className="bi bi-person-fill" />
                                            </div>
                                        )}

                                        {(editing || editingAddress) && (
                                            <label className="hp-camera-button" title="Change profile picture">
                                                <i className="bi bi-camera-fill" />
                                                <input
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/webp"
                                                    onChange={pickPhoto}
                                                />
                                            </label>
                                        )}
                                    </div>

                                    <div className="hp-overview-details">
                                        <h2>{profile.fullName || 'Homeowner'}</h2>
                                        <span className="hp-role-pill">Homeowner Account</span>
                                        <p><i className="bi bi-envelope-fill" /> {profile.email || 'Email not provided'}</p>
                                        <p><i className="bi bi-telephone-fill" /> {profile.mobileNumber || 'Not provided'}</p>
                                        <p><i className="bi bi-geo-alt-fill" /> {profile.address || 'Address not provided'}</p>
                                    </div>
                                </div>
                            </section>

                            <section className="profile-card hp-panel">
                                <div className="hp-section-heading">
                                    <h3><i className="bi bi-person-lines-fill" /> Personal Information</h3>

                                    {!editing && !editingAddress && (
                                        <button
                                            type="button"
                                            className="hp-button hp-button-outline"
                                            onClick={() => startEdit(false)}
                                        >
                                            <i className="bi bi-pencil-fill" /> Edit
                                        </button>
                                    )}
                                </div>

                                {editing && !editingAddress ? (
                                    <form className="hp-edit-form" onSubmit={saveProfile}>
                                        <label>
                                            Full Name
                                            <input
                                                className={fieldErrors.fullName ? 'is-invalid' : ''}
                                                value={draft.fullName}
                                                onChange={(event) => updateDraft('fullName', event.target.value)}
                                                minLength={2}
                                                maxLength={150}
                                                required
                                            />
                                            {fieldErrors.fullName && <small className="invalid-feedback d-block">{fieldErrors.fullName}</small>}
                                        </label>

                                        <label>
                                            Email Address
                                            <input value={draft.email} readOnly />
                                        </label>

                                        <label>
                                            Birthday
                                            <input
                                                type="date"
                                                className={fieldErrors.birthday ? 'is-invalid' : ''}
                                                value={draft.birthday}
                                                max={new Date().toISOString().slice(0, 10)}
                                                onChange={(event) => updateDraft('birthday', event.target.value)}
                                                required
                                            />
                                            {fieldErrors.birthday && <small className="invalid-feedback d-block">{fieldErrors.birthday}</small>}
                                        </label>

                                        <label>
                                            Age
                                            <input value={ageFromBirthday(draft.birthday) ?? 'Enter birthday to calculate age'} readOnly />
                                        </label>

                                        <label>
                                            Gender
                                            <select
                                                className={fieldErrors.gender ? 'is-invalid' : ''}
                                                value={draft.gender}
                                                onChange={(event) => updateDraft('gender', event.target.value)}
                                                required
                                            >
                                                <option value="">Select gender</option>
                                                <option>Female</option>
                                                <option>Male</option>
                                                <option>Other</option>
                                                <option>Prefer not to say</option>
                                            </select>
                                            {fieldErrors.gender && <small className="invalid-feedback d-block">{fieldErrors.gender}</small>}
                                        </label>

                                        <label>
                                            Mobile Number
                                            <input
                                                type="tel"
                                                inputMode="numeric"
                                                autoComplete="tel-national"
                                                className={fieldErrors.mobileNumber ? 'is-invalid' : ''}
                                                value={draft.mobileNumber}
                                                onChange={(event) => updateDraft('mobileNumber', event.target.value.replace(/\D/g, '').slice(0, 11))}
                                                minLength={11}
                                                maxLength={11}
                                                pattern="09[0-9]{9}"
                                                placeholder="09XXXXXXXXX"
                                                required
                                            />
                                            {fieldErrors.mobileNumber && <small className="invalid-feedback d-block">{fieldErrors.mobileNumber}</small>}
                                        </label>

                                        <div className="hp-form-actions">
                                            <button type="button" className="hp-button hp-button-muted" onClick={cancelEdit}>
                                                Cancel
                                            </button>

                                            <button type="submit" className="hp-button hp-button-primary" disabled={saving}>
                                                {saving ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="hp-info-grid">
                                        <div className="hp-info-item">
                                            <span className="hp-info-icon"><i className="bi bi-person-fill" /></span>
                                            <div><small>Full Name</small><strong>{profile.fullName || 'Not provided'}</strong></div>
                                        </div>

                                        <div className="hp-info-item">
                                            <span className="hp-info-icon"><i className="bi bi-calendar-event-fill" /></span>
                                            <div><small>Birthday</small><strong>{prettyDate(profile.birthday)}</strong></div>
                                        </div>

                                        <div className="hp-info-item">
                                            <span className="hp-info-icon"><i className="bi bi-person-vcard-fill" /></span>
                                            <div><small>Age</small><strong>{ageFromBirthday(profile.birthday) ?? 'Not provided'}</strong></div>
                                        </div>

                                        <div className="hp-info-item">
                                            <span className="hp-info-icon"><i className="bi bi-envelope-fill" /></span>
                                            <div><small>Email Address</small><strong>{profile.email || 'Not provided'}</strong></div>
                                        </div>

                                        <div className="hp-info-item">
                                            <span className="hp-info-icon"><i className="bi bi-gender-ambiguous" /></span>
                                            <div><small>Gender</small><strong>{profile.gender || 'Not provided'}</strong></div>
                                        </div>

                                        <div className="hp-info-item">
                                            <span className="hp-info-icon"><i className="bi bi-telephone-fill" /></span>
                                            <div><small>Mobile Number</small><strong>{profile.mobileNumber || 'Not provided'}</strong></div>
                                        </div>
                                    </div>
                                )}
                            </section>

                            <section className="profile-card hp-panel hp-address-panel">
                                <div className="hp-section-heading">
                                    <div>
                                        <h3><i className="bi bi-geo-alt-fill" /> Home Address &amp; Location</h3>
                                        <p>Set your home address so providers can locate you easily.</p>
                                    </div>

                                    {!editingAddress && !editing && (
                                        <button
                                            type="button"
                                            className="hp-button hp-button-primary"
                                            onClick={() => startEdit(true)}
                                        >
                                            <i className="bi bi-pencil-fill" /> Edit Address
                                        </button>
                                    )}
                                </div>

                                <div className="hp-address-layout">
                                    <div className="hp-address-fields">
                                        <div><i className="bi bi-house-fill" /><span><small>Saved Home Address</small><strong>{profile.address || 'Not provided'}</strong></span></div>
                                        {editingAddress && (
                                            <form className="hp-address-edit-form" onSubmit={saveProfile}>
                                                <label htmlFor="profile-home-address">Home Address</label>
                                                <textarea
                                                    id="profile-home-address"
                                                    className={fieldErrors.address ? 'is-invalid' : ''}
                                                    value={draft.address}
                                                    onChange={(event) => updateDraft('address', event.target.value)}
                                                    minLength={10}
                                                    maxLength={500}
                                                    rows={4}
                                                    placeholder="House no., street, barangay, city/municipality, province, ZIP code"
                                                    required
                                                />
                                                {fieldErrors.address && <small className="invalid-feedback d-block">{fieldErrors.address}</small>}
                                                <div className="hp-form-actions">
                                                    <button type="button" className="hp-button hp-button-muted" onClick={cancelEdit}>Cancel</button>
                                                    <button type="submit" className="hp-button hp-button-primary" disabled={saving}>
                                                        {saving ? 'Saving...' : 'Save Address'}
                                                    </button>
                                                </div>
                                            </form>
                                        )}
                                    </div>

                                    <div className="hp-map-column">
                                        <HomeAddressMap
                                            value={editingAddress ? draft.address : profile.address}
                                            coords={coords}
                                            disabled={!editingAddress}
                                            onAddressChange={(address) => updateDraft('address', address)}
                                            onLocationChange={({ address, lat, lng }) => {
                                                setCoords({ lat, lng });
                                                if (address) updateDraft('address', address);
                                            }}
                                        />

                                        <button
                                            type="button"
                                            className="hp-location-button"
                                            onClick={useCurrentLocation}
                                            disabled={locating || !editingAddress}
                                        >
                                            <i className="bi bi-crosshair" /> {locating ? 'Finding location...' : 'Use My Current Location'}
                                        </button>

                                        <p className="hp-map-note">
                                            <i className="bi bi-info-circle-fill" /> {editingAddress
                                                ? 'Search for an address, choose a suggestion, or use your current location. You can also type the address above.'
                                                : 'Your saved home address is shown here. Choose Edit Address to update it.'}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <section className="dashboard-box activities-box hp-panel hp-bookings">
                                <div className="hp-section-heading">
                                    <div>
                                        <h3><i className="bi bi-file-earmark-text-fill" /> My Service Requests</h3>
                                        <p>Track and manage your home service bookings.</p>
                                    </div>

                                    <button
                                        type="button"
                                        className="hp-button hp-button-orange"
                                        onClick={() => navigate('/services')}
                                    >
                                        <i className="bi bi-calendar-plus" /> Book a New Service
                                    </button>
                                </div>

                                <div className="hp-booking-tabs" role="tablist" aria-label="Filter service requests">
                                    {[
                                        ['all', 'All'],
                                        ['pending', 'Pending'],
                                        ['accepted', 'Accepted'],
                                        ['completed', 'Completed'],
                                        ['cancelled', 'Cancelled'],
                                    ].map(([id, label]) => (
                                        <button
                                            type="button"
                                            role="tab"
                                            aria-selected={bookingFilter === id}
                                            className={bookingFilter === id ? 'active' : ''}
                                            key={id}
                                            onClick={() => setBookingFilter(id)}
                                        >
                                            {label}
                                            <span>
                                                {id === 'all'
                                                    ? bookings.length
                                                    : bookings.filter((booking) => statusKey(statusOf(booking)) === id).length}
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                {filteredBookings.length === 0 ? (
                                    <div className="profile-empty-state">
                                        <span className="hp-empty-icon"><i className="bi bi-file-earmark" /></span>
                                        <h5>{bookingFilter === 'all' ? 'No service requests yet' : `No ${bookingFilter} requests`}</h5>
                                        <p>
                                            {bookingFilter === 'all'
                                                ? 'Your bookings will appear here after you request a home service.'
                                                : 'Requests with this status will appear here.'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="activity-list">
                                        {filteredBookings.map((booking, index) => {
                                            const status = statusOf(booking);

                                            return (
                                                <article className="activity-item" key={booking.id ?? booking.booking_id ?? index}>
                                                    <div className="activity-icon"><i className="bi bi-tools" /></div>
                                                    <div className="activity-details">
                                                        <h5>{titleOf(booking)}</h5>
                                                        <p>
                                                            {booking.description || 'No description provided'}
                                                            {dateOf(booking) ? ` · ${prettyDate(dateOf(booking))}` : ''}
                                                        </p>
                                                    </div>
                                                    <span className={`status-badge ${statusKey(status)}`}>{status}</span>
                                                </article>
                                            );
                                        })}
                                    </div>
                                )}
                            </section>
                        </div>

                        <aside className="homeowner-profile-right">
                            <section className="profile-card hp-panel hp-status-card">
                                <div className="hp-status-heading">
                                    <span><i className="bi bi-check-circle-fill" /> Account Status</span>
                                    <b>Active</b>
                                </div>
                                <p>Your account is active and ready to book home services.</p>
                                <div className="hp-member-since">
                                    <i className="bi bi-calendar-event" />
                                    <span><small>Member Since</small><strong>{memberDate}</strong></span>
                                </div>
                            </section>

                        </aside>
                    </div>
                )}
            </main>
        </div>
    );
}
