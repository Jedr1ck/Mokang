import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { api, getCategories, getMyProfile, getProvider } from '../../services/api';
import { isWithinEchague } from '../../services/echagueLocation';
import ConfirmDialog from '../ConfirmDialog';
import { formatTime12Hour, getPhilippinesDateTime } from '../../utils/dateTime';

const EMPTY_PROVIDER_SERVICES = [];
const timeToMinutes = (time = '') => {
    const [hour, minute] = String(time).split(':').map(Number);
    return Number.isFinite(hour) && Number.isFinite(minute) ? hour * 60 + minute : 0;
};
const profileFieldLabels = {
    fullName: 'full name',
    mobileNumber: 'mobile number',
    gender: 'gender',
    address: 'address',
    birthday: 'birthday',
};

function slotsForWeeklySchedule(schedule) {
    if (!schedule || Array.isArray(schedule) || typeof schedule !== 'object') return [];
    const { date: todayValue, time: currentTime } = getPhilippinesDateTime();
    const weekStart = new Date(`${todayValue}T12:00:00`);
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    const weekStartValue = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
    if (schedule._week_start !== weekStartValue) return [];
    const slots = [];

    for (let offset = 0; offset < 7; offset += 1) {
        const date = new Date(`${todayValue}T12:00:00`);
        date.setDate(date.getDate() + offset);
        const dateValue = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const hours = schedule[date.toLocaleDateString('en-US', { weekday: 'long' })];
        if (!hours || hours.enabled !== true || !/^\d{2}:\d{2}$/.test(hours.start || '') || !/^\d{2}:\d{2}$/.test(hours.end || '')) continue;
        const [startHour, startMinute] = hours.start.split(':').map(Number);
        const [endHour, endMinute] = hours.end.split(':').map(Number);
        const start = startHour * 60 + startMinute;
        const end = endHour * 60 + endMinute;
        for (let minute = start; minute < end; minute += 30) {
            const time = `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
            if (dateValue > todayValue || time > currentTime) slots.push({ date: dateValue, time });
        }
    }
    return slots;
}

const BookingModal = ({
    show,
    handleClose,
    initialCategory = 'Electrical',
    providerId = null,
    providerServices = EMPTY_PROVIDER_SERVICES,
}) => {
    const navigate = useNavigate();

    const [bookingSubmitted, setBookingSubmitted] = useState(false);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [submittingBooking, setSubmittingBooking] = useState(false);
    const [createdBooking, setCreatedBooking] = useState(null);
    const [formError, setFormError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [missingProfileFields, setMissingProfileFields] = useState([]);
    const [checkingProfile, setCheckingProfile] = useState(false);
    const [profileCheckError, setProfileCheckError] = useState('');
    const [serviceOptions, setServiceOptions] = useState([]);
    const [selectedServiceIndex, setSelectedServiceIndex] = useState('');
    const [availabilitySlots, setAvailabilitySlots] = useState([]);
    const [bookedSlots, setBookedSlots] = useState([]);
    const [workingSchedule, setWorkingSchedule] = useState([]);
    const { date: todayValue, time: currentTime } = getPhilippinesDateTime();
    const weekEndDate = new Date(`${todayValue}T12:00:00`);
    weekEndDate.setDate(weekEndDate.getDate() + (6 - ((weekEndDate.getDay() + 6) % 7)));
    const weekEndValue = `${weekEndDate.getFullYear()}-${String(weekEndDate.getMonth() + 1).padStart(2, '0')}-${String(weekEndDate.getDate()).padStart(2, '0')}`;
    const selectedService = serviceOptions[Number(selectedServiceIndex)] || null;
    const requestedDuration = Math.max(1, Number(selectedService?.durationMinutes) || 60);
    const allAvailabilitySlots = availabilitySlots;
    const effectiveAvailabilitySlots = allAvailabilitySlots.filter((slot) => {
        if (slot.date < todayValue || slot.date > weekEndValue || (slot.date === todayValue && slot.time <= currentTime)) return false;
        const weekday = new Date(`${slot.date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long' });
        const workingHours = workingSchedule?.[weekday];
        if (workingHours?.enabled === true && timeToMinutes(slot.time) + requestedDuration > timeToMinutes(workingHours.end)) return false;
        const requestedStart = timeToMinutes(slot.time);
        const requestedEnd = requestedStart + requestedDuration;
        return !bookedSlots.some((booked) => {
            if (booked.date !== slot.date) return false;
            const bookedStart = timeToMinutes(booked.time);
            const bookedEnd = bookedStart + Math.max(1, Number(booked.durationMinutes) || 60);
            return requestedStart < bookedEnd && bookedStart < requestedEnd;
        });
    });
    const availableDates = [...new Set(effectiveAvailabilitySlots.map((slot) => slot.date))].filter((date) => date >= todayValue).sort();

    // Address autocomplete states
    const [addressSuggestions, setAddressSuggestions] = useState([]);
    const [isSearchingAddress, setIsSearchingAddress] = useState(false);
    const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
    const [addressSearchError, setAddressSearchError] = useState('');
    const [selectedAddressCoords, setSelectedAddressCoords] = useState(null);
    const [savedHomeAddress, setSavedHomeAddress] = useState('');

    const [formData, setFormData] = useState({
        category: '',
        preferredDate: '',
        preferredTime: '',
        address: '',
        description: '',
    });
    const availableTimes = effectiveAvailabilitySlots
        .filter((slot) => slot.date === formData.preferredDate)
        .map((slot) => slot.time);

    // Load service categories
    useEffect(() => {
        if (!show) return undefined;

        const loadServices = async () => {
            try {
                const options = providerServices.length
                    ? providerServices
                    : (await getCategories()).map((category) => ({
                        name: category.name,
                        category: category.name,
                    }));

                const availableOptions = options.length
                    ? options
                    : initialCategory
                        ? [{ name: initialCategory, category: initialCategory }]
                        : [];

                const initialIndex = availableOptions.findIndex(
                    (option) =>
                        option.category === initialCategory ||
                        option.name === initialCategory
                );

                const selectedIndex = initialIndex >= 0 ? initialIndex : 0;
                const initialOption = availableOptions[selectedIndex];

                setServiceOptions(availableOptions);
                setSelectedServiceIndex(
                    availableOptions.length ? String(selectedIndex) : ''
                );

                setFormData((previous) => ({
                    ...previous,
                    category: initialOption?.category || initialOption?.name || '',
                }));
            } catch (error) {
                setFormError(error.message || 'Unable to load service options.');
            }
        };

        loadServices();
    }, [show, initialCategory, providerServices]);

    useEffect(() => {
        if (!show || !providerId) return undefined;
        let active = true;
        getProvider(providerId)
            .then((provider) => {
                if (!active) return;
                const savedSlots = provider.availabilitySlots || [];
                const schedule = provider.workingSchedule || [];
                setWorkingSchedule(schedule);
                setAvailabilitySlots(savedSlots.length ? savedSlots : slotsForWeeklySchedule(schedule));
                setBookedSlots(provider.bookedSlots || []);
            })
            .catch((error) => { if (active) setFormError(error.message || 'Unable to load provider availability.'); });
        return () => { active = false; };
    }, [show, providerId]);

    useEffect(() => {
        if (!show) return undefined;

        let active = true;
        const checkProfile = async () => {
            setCheckingProfile(true);
            setProfileCheckError('');
            try {
                const profile = await getMyProfile();
                if (active) {
                    setMissingProfileFields(profile.missingProfileFields || []);
                    const homeAddress = String(profile.address || profile.homeAddress || '').trim();
                    setSavedHomeAddress(homeAddress);
                    setFormData((previous) => ({
                        ...previous,
                        address: homeAddress,
                    }));
                    setSelectedAddressCoords(null);
                }
            } catch (error) {
                if (active) setProfileCheckError(error.message || 'Unable to verify your profile.');
            } finally {
                if (active) setCheckingProfile(false);
            }
        };

        checkProfile();
        return () => {
            active = false;
        };
    }, [show]);

    // Address autocomplete using Photon / OpenStreetMap
    useEffect(() => {
        const query = formData.address.trim();

        if (!show || !showAddressSuggestions || query.length < 3) {
            return undefined;
        }

        const controller = new AbortController();

        const timeout = setTimeout(async () => {
            setIsSearchingAddress(true);

            try {
                const params = new URLSearchParams({
                    q: `${query}, Echague, Isabela, Philippines`,
                    limit: '5',
                    lang: 'en',
                    lat: '16.7',
                    lon: '121.7',
                });

                const response = await fetch(
                    `https://photon.komoot.io/api/?${params.toString()}`,
                    { signal: controller.signal }
                );

                if (!response.ok) {
                    throw new Error('Unable to search addresses.');
                }

                const data = await response.json();

                const suggestions = (data.features || [])
                    .map((feature) => {
                        const coordinates = feature?.geometry?.coordinates;
                        if (
                            coordinates?.length !== 2
                            || !isWithinEchague(coordinates[1], coordinates[0])
                        ) return null;
                        const properties = feature.properties || {};

                        const parts = [
                            properties.name,
                            properties.housenumber,
                            properties.street,
                            properties.district,
                            properties.suburb,
                            properties.city,
                            properties.county,
                            properties.state,
                            properties.country,
                        ].filter(Boolean);

                        const labelParts = parts.filter(
                            (part, index) => parts.indexOf(part) === index
                        );
                        for (const coverageName of ['Echague', 'Isabela', 'Philippines']) {
                            if (!labelParts.some((part) => String(part).toLowerCase() === coverageName.toLowerCase())) {
                                labelParts.push(coverageName);
                            }
                        }

                        return {
                            label: labelParts.join(', '),
                            lat: coordinates[1],
                            lng: coordinates[0],
                        };
                    })
                    .filter((item) => item?.label)
                    .filter(
                        (item, index, items) =>
                            items.findIndex(
                                (candidate) => candidate.label === item.label
                            ) === index
                    );

                setAddressSuggestions(suggestions);
                setAddressSearchError(
                    suggestions.length ? '' : 'No matching addresses were found within Echague. Try adding a barangay or street.'
                );
            } catch (error) {
                if (error.name !== 'AbortError') {
                    setAddressSuggestions([]);
                    setAddressSearchError(error.message || 'Address suggestions are temporarily unavailable.');
                    console.error('Address search failed:', error);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsSearchingAddress(false);
                }
            }
        }, 350);

        return () => {
            clearTimeout(timeout);
            controller.abort();
        };
    }, [formData.address, show, showAddressSuggestions]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFieldErrors((previous) => ({ ...previous, [name]: '' }));
        if (name === 'address') {
            setSelectedAddressCoords(null);
            setAddressSearchError('');
        }
        if (name === 'address' && value.trim().length < 3) {
            setAddressSuggestions([]);
            setIsSearchingAddress(false);
        }
        setFormData((previous) => ({
            ...previous,
            [name]: value,
            ...(name === 'preferredDate' ? { preferredTime: '' } : {}),
        }));
    };

    const handleServiceChange = (e) => {
        const { value } = e.target;
        const selectedService = serviceOptions[Number(value)];

        setSelectedServiceIndex(value);

        setFormData((previous) => ({
            ...previous,
            category: selectedService?.category || selectedService?.name || '',
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const errors = {};
        if (!formData.category.trim()) errors.category = 'Choose a service category.';
        if (!formData.preferredDate) errors.preferredDate = 'Choose a service date.';
        else if (providerId && !availableDates.includes(formData.preferredDate)) errors.preferredDate = 'Choose a date offered by this provider.';
        if (!formData.preferredTime) errors.preferredTime = 'Choose a service time.';
        else if (providerId && !availableTimes.includes(formData.preferredTime)) errors.preferredTime = 'Choose a time offered for the selected date.';
        if (formData.address.trim().length < 10) errors.address = 'Add a complete home address to your profile before booking.';
        const unchangedSavedAddress = formData.address.trim() === savedHomeAddress;
        if (!unchangedSavedAddress && (!selectedAddressCoords || !isWithinEchague(selectedAddressCoords.lat, selectedAddressCoords.lng))) {
            errors.address = 'Choose an address suggestion within Echague, Isabela.';
        }
        if (formData.description.trim().length < 10) errors.description = 'Describe the work needed (at least 10 characters).';
        setFieldErrors(errors);
        if (Object.keys(errors).length) {
            setFormError('Please correct the highlighted fields.');
            return;
        }
        if (checkingProfile || profileCheckError || missingProfileFields.length) {
            setFormError(
                profileCheckError ||
                (checkingProfile
                    ? 'Checking your profile. Please wait.'
                    : 'Complete your profile information before booking.')
            );
            return;
        }

        let currentUser;

        try {
            currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        } catch {
            currentUser = {};
        }

        const role =
            currentUser.role ||
            currentUser.userRole ||
            currentUser.accountType ||
            '';

        const isHomeowner =
            role === 'homeowner' ||
            (!role &&
                window.location.pathname.includes('/homeowner-dashboard'));

        if (!currentUser || !isHomeowner) {
            setFormError(
                'Only homeowners can create bookings. Please log in with a homeowner account.'
            );
            return;
        }

        setFormError('');
        setShowSubmitConfirm(true);
    };

    const submitBooking = async () => {
        if (submittingBooking) return;
        setSubmittingBooking(true);
        try {
            const booking = await api('/bookings', {
                method: 'POST',
                body: JSON.stringify({
                    category: formData.category,
                    provider_id: providerId,
                    preferred_date: formData.preferredDate,
                    preferred_time: formData.preferredTime,
                    address: formData.address,
                    description: formData.description,
                    service_name: selectedService?.name || null,
                }),
            });
            setCreatedBooking(booking);
            setBookingSubmitted(true);
            setShowSubmitConfirm(false);
        } catch (error) {
            const message = error?.message || 'Request failed';
            setFormError(
                message.includes('Homeowners only')
                    ? 'Only homeowners can create bookings. Please log in with a homeowner account.'
                    : message
            );
            setShowSubmitConfirm(false);
        } finally {
            setSubmittingBooking(false);
        }
    };

    const resetAndClose = () => {
        setBookingSubmitted(false);
        setCreatedBooking(null);
        setFormError('');
        setFieldErrors({});
        setAddressSuggestions([]);
        setIsSearchingAddress(false);
        setShowAddressSuggestions(false);
        setAddressSearchError('');
        setSelectedAddressCoords(null);
        setAvailabilitySlots([]);
        setBookedSlots([]);
        setWorkingSchedule([]);
        handleClose();
    };

    const handleTrackBooking = () => {
        const booking = createdBooking;
        resetAndClose();
        navigate('/track-booking', { state: { booking } });
    };

    if (!show) return null;

    return (
        <div
            className="modal show d-block tab-index-1 bg-dark bg-opacity-50"
            style={{ zIndex: 1050 }}
        >
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content rounded-4 border-0 shadow">

                    {/* Header */}
                    <div className="modal-header border-0 pb-0">
                        <h5 className="modal-title fw-bold">
                            {bookingSubmitted ? 'Booking Status' : 'Book a Service'}
                        </h5>

                        <button
                            type="button"
                            className="btn-close"
                            onClick={resetAndClose}
                            aria-label="Close"
                        />
                    </div>

                    <div className="modal-body p-4">
                        {!bookingSubmitted ? (
                            <>
                                <form onSubmit={handleSubmit}>
                                {missingProfileFields.length > 0 && (
                                    <div className="alert alert-warning" role="alert">
                                        <strong>Complete your profile before booking.</strong>
                                        <p className="mb-2">
                                            Missing: {missingProfileFields.map((field) => profileFieldLabels[field] || field).join(', ')}.
                                        </p>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-dark"
                                            onClick={() => {
                                                resetAndClose();
                                                navigate('/profile');
                                            }}
                                        >
                                            Complete profile
                                        </button>
                                    </div>
                                )}
                                {profileCheckError && <div className="alert alert-danger" role="alert">{profileCheckError}</div>}
                                <div className="row g-3">

                                    {/* Service Category */}
                                    <div className="col-12">
                                        <label className="form-label fw-semibold small">
                                            Specific Service
                                        </label>

                                        <select
                                            name="serviceIndex"
                                            value={selectedServiceIndex}
                                            onChange={handleServiceChange}
                                            required
                                            disabled={serviceOptions.length === 0}
                                            aria-invalid={Boolean(fieldErrors.category)}
                                            className={`form-select bg-light border-0 rounded-3 ${fieldErrors.category ? 'is-invalid' : ''}`}
                                        >
                                            {serviceOptions.length === 0 && (
                                                <option value="">
                                                    Loading services...
                                                </option>
                                            )}

                                            {serviceOptions.map((service, index) => (
                                                <option
                                                    key={`${service.category || service.name}-${service.name}-${index}`}
                                                    value={index}
                                                >
                                                    {service.name}
                                                    {service.price != null
                                                        ? ` — ₱${Number(service.price).toLocaleString()}`
                                                        : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <small className="form-text text-muted">
                                            Choose the exact service you need from this provider.
                                        </small>
                                        {fieldErrors.category && <div className="invalid-feedback">{fieldErrors.category}</div>}
                                    </div>

                                    {/* Preferred Date */}
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold small">
                                            Preferred Date
                                        </label>

                                        <select
                                            name="preferredDate"
                                            value={formData.preferredDate}
                                            onChange={handleChange}
                                            required
                                            aria-invalid={Boolean(fieldErrors.preferredDate)}
                                            className={`form-select rounded-3 ${fieldErrors.preferredDate ? 'is-invalid' : ''}`}
                                            disabled={!availableDates.length}
                                        >
                                            <option value="">{availableDates.length ? 'Select an available date' : 'No dates available'}</option>
                                            {availableDates.map((date) => <option key={date} value={date}>{new Date(`${date}T00:00:00`).toLocaleDateString()}</option>)}
                                        </select>
                                        {fieldErrors.preferredDate && <div className="invalid-feedback">{fieldErrors.preferredDate}</div>}
                                    </div>

                                    {/* Preferred Time */}
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold small">
                                            Preferred Time
                                        </label>

                                        <select
                                            name="preferredTime"
                                            value={formData.preferredTime}
                                            onChange={handleChange}
                                            required
                                            aria-invalid={Boolean(fieldErrors.preferredTime)}
                                            className={`form-select rounded-3 ${fieldErrors.preferredTime ? 'is-invalid' : ''}`}
                                            disabled={!availableTimes.length}
                                        >
                                            <option value="">{availableTimes.length ? 'Select an available time' : 'Select a date first'}</option>
                                            {availableTimes.map((time) => <option key={time} value={time}>{formatTime12Hour(time)}</option>)}
                                        </select>
                                        {fieldErrors.preferredTime && <div className="invalid-feedback">{fieldErrors.preferredTime}</div>}
                                    </div>

                                    {/* Complete Address from homeowner profile */}
                                    <div className="col-12">
                                        <label className="form-label fw-semibold small">
                                            Complete Address
                                        </label>

                                        <div className="position-relative">
                                            <textarea
                                                className={`form-control rounded-3 ${fieldErrors.address ? 'is-invalid' : ''}`}
                                                rows="2"
                                                name="address"
                                                placeholder="House No., Street, Barangay, City"
                                                value={formData.address}
                                                readOnly
                                                aria-readonly="true"
                                                maxLength="2000"
                                            />

                                            {showAddressSuggestions &&
                                                formData.address.trim().length >= 3 && (
                                                    <div
                                                        className="list-group position-absolute w-100 shadow-sm"
                                                        style={{
                                                            top: '100%',
                                                            left: 0,
                                                            zIndex: 1060,
                                                            maxHeight: '220px',
                                                            overflowY: 'auto',
                                                            borderRadius: '10px',
                                                        }}
                                                    >
                                                        {isSearchingAddress && (
                                                            <div className="list-group-item small text-muted">
                                                                Searching addresses...
                                                            </div>
                                                        )}

                                                        {!isSearchingAddress &&
                                                            addressSuggestions.map(
                                                                (suggestion, index) => (
                                                                    <button
                                                                        type="button"
                                                                        key={`${suggestion.label}-${index}`}
                                                                        className="list-group-item list-group-item-action text-start small"
                                                                        onMouseDown={(e) =>
                                                                            e.preventDefault()
                                                                        }
                                                                        onClick={() => {
                                                                            setFormData(
                                                                                (previous) => ({
                                                                                    ...previous,
                                                                                    address: suggestion.label,
                                                                                })
                                                                            );
                                                                            setSelectedAddressCoords({
                                                                                lat: suggestion.lat,
                                                                                lng: suggestion.lng,
                                                                            });
                                                                            setAddressSearchError('');

                                                                            setAddressSuggestions([]);
                                                                            setShowAddressSuggestions(false);
                                                                        }}
                                                                    >
                                                                        <i className="bi bi-geo-alt me-2 text-success" />
                                                                        {suggestion.label}
                                                                    </button>
                                                                )
                                                            )}

                                                        {!isSearchingAddress &&
                                                            addressSuggestions.length === 0 && (
                                                                <div className="list-group-item small text-muted">
                                                                    {addressSearchError || 'No matching addresses found within Echague.'}
                                                                </div>
                                                            )}
                                                    </div>
                                                )}
                                        </div>

                                        <small className="text-muted">
                                            This is your saved home address. Update it from your profile if it needs correction.
                                        </small>
                                        {addressSearchError && !showAddressSuggestions && (
                                            <div className="form-text text-danger" role="status">{addressSearchError}</div>
                                        )}
                                        {fieldErrors.address && <div className="invalid-feedback d-block">{fieldErrors.address}</div>}
                                    </div>

                                    {/* Problem Description */}
                                    <div className="col-12">
                                        <label className="form-label fw-semibold small">
                                            Problem Description
                                        </label>

                                        <textarea
                                            className={`form-control rounded-3 ${fieldErrors.description ? 'is-invalid' : ''}`}
                                            rows="3"
                                            name="description"
                                            placeholder="Describe the issue or service needed in detail..."
                                            value={formData.description}
                                            onChange={handleChange}
                                            minLength="10"
                                            maxLength="2000"
                                            required
                                        />
                                        {fieldErrors.description && <div className="invalid-feedback">{fieldErrors.description}</div>}
                                    </div>

                                    {formError && (
                                        <div className="col-12 text-danger small">
                                            {formError}
                                        </div>
                                    )}
                                </div>

                                {/* Confirm Button */}
                                <div className="mt-4 text-end">
                                    <button
                                        type="button"
                                        className="btn btn-light rounded-pill px-4 me-2"
                                        onClick={resetAndClose}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="btn btn-warning text-white rounded-pill px-4 fw-bold"
                                        disabled={checkingProfile || Boolean(profileCheckError) || missingProfileFields.length > 0}
                                    >
                                        Confirm Booking
                                    </button>
                                </div>
                                </form>
                            </>
                        ) : (
                            /* Success Confirmation */
                            <div className="text-center py-4">
                                <div className="mb-3 text-success">
                                    <i className="bi bi-check-circle-fill display-1" />
                                </div>

                                <h4 className="fw-bold mb-2">
                                    Thanks for Booking!
                                </h4>

                                <p className="text-muted small mb-4">
                                    Your request has been successfully submitted.
                                    You will receive real-time updates and provider
                                    acceptance in your notifications.
                                </p>

                                <div className="d-flex justify-content-center gap-3">
                                    <button
                                        className="btn btn-outline-secondary rounded-pill px-4"
                                        onClick={resetAndClose}
                                    >
                                        Close
                                    </button>

                                    <button
                                        className="btn btn-warning text-white rounded-pill px-4 fw-bold"
                                        onClick={handleTrackBooking}
                                    >
                                        View / Track Booking
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <ConfirmDialog
                open={showSubmitConfirm}
                title="Are you sure you want to submit?"
                message={`Submit a ${selectedService?.name || formData.category} booking for ${formData.preferredDate} at ${formatTime12Hour(formData.preferredTime)}?`}
                confirmLabel="Yes, Submit"
                busy={submittingBooking}
                onConfirm={submitBooking}
                onCancel={() => setShowSubmitConfirm(false)}
            />
        </div>
    );
};

export default BookingModal;
