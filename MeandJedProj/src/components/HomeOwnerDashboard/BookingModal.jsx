import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { api, getCategories, getMyProfile } from '../../services/api';

const EMPTY_PROVIDER_SERVICES = [];
const profileFieldLabels = {
    fullName: 'full name',
    mobileNumber: 'mobile number',
    gender: 'gender',
    address: 'address',
    birthday: 'birthday',
};

const BookingModal = ({
    show,
    handleClose,
    initialCategory = 'Electrical',
    providerId = null,
    providerServices = EMPTY_PROVIDER_SERVICES,
}) => {
    const navigate = useNavigate();

    const [bookingSubmitted, setBookingSubmitted] = useState(false);
    const [createdBooking, setCreatedBooking] = useState(null);
    const [formError, setFormError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [missingProfileFields, setMissingProfileFields] = useState([]);
    const [checkingProfile, setCheckingProfile] = useState(false);
    const [profileCheckError, setProfileCheckError] = useState('');
    const [serviceOptions, setServiceOptions] = useState([]);
    const [selectedServiceIndex, setSelectedServiceIndex] = useState('');

    // Address autocomplete states
    const [addressSuggestions, setAddressSuggestions] = useState([]);
    const [isSearchingAddress, setIsSearchingAddress] = useState(false);
    const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);

    const [formData, setFormData] = useState({
        category: '',
        preferredDate: '',
        preferredTime: '',
        address: '',
        description: '',
        photo: null,
    });

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
        if (!show) return undefined;

        let active = true;
        const checkProfile = async () => {
            setCheckingProfile(true);
            setProfileCheckError('');
            try {
                const profile = await getMyProfile();
                if (active) {
                    setMissingProfileFields(profile.missingProfileFields || []);
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
                    q: query,
                    limit: '5',
                    lang: 'en',
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

                        return {
                            label: parts
                                .filter(
                                    (part, index) => parts.indexOf(part) === index
                                )
                                .join(', '),
                        };
                    })
                    .filter((item) => item.label)
                    .filter(
                        (item, index, items) =>
                            items.findIndex(
                                (candidate) => candidate.label === item.label
                            ) === index
                    );

                setAddressSuggestions(suggestions);
            } catch (error) {
                if (error.name !== 'AbortError') {
                    setAddressSuggestions([]);
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
        if (name === 'address' && value.trim().length < 3) {
            setAddressSuggestions([]);
            setIsSearchingAddress(false);
        }
        setFormData((previous) => ({
            ...previous,
            [name]: value,
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

    const handleFileChange = (e) => {
        const file = e.target.files[0];

        if (!file) return;

        if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
            setFormError('Upload a valid image no larger than 5 MB.');
            e.target.value = '';
            return;
        }

        setFormError('');
        setFormData((previous) => ({
            ...previous,
            photo: file,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const today = new Date().toISOString().split('T')[0];
        const errors = {};
        if (!formData.category.trim()) errors.category = 'Choose a service category.';
        if (!formData.preferredDate) errors.preferredDate = 'Choose a service date.';
        else if (formData.preferredDate < today) errors.preferredDate = 'Date cannot be in the past.';
        if (!formData.preferredTime) errors.preferredTime = 'Choose a service time.';
        if (formData.address.trim().length < 10) errors.address = 'Enter a complete address (at least 10 characters).';
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
                }),
            });
            setCreatedBooking(booking);
            setBookingSubmitted(true);
        } catch (error) {
            const message = error?.message || 'Request failed';

            setFormError(
                message.includes('Homeowners only')
                    ? 'Only homeowners can create bookings. Please log in with a homeowner account.'
                    : message
            );
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
                                            Service Category
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
                                                </option>
                                            ))}
                                        </select>
                                        {fieldErrors.category && <div className="invalid-feedback">{fieldErrors.category}</div>}
                                    </div>

                                    {/* Preferred Date */}
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold small">
                                            Preferred Date
                                        </label>

                                        <input
                                            type="date"
                                            name="preferredDate"
                                            value={formData.preferredDate}
                                            onChange={handleChange}
                                            min={new Date().toISOString().split('T')[0]}
                                            required
                                            aria-invalid={Boolean(fieldErrors.preferredDate)}
                                            className={`form-control rounded-3 ${fieldErrors.preferredDate ? 'is-invalid' : ''}`}
                                        />
                                        {fieldErrors.preferredDate && <div className="invalid-feedback">{fieldErrors.preferredDate}</div>}
                                    </div>

                                    {/* Preferred Time */}
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold small">
                                            Preferred Time
                                        </label>

                                        <input
                                            type="time"
                                            name="preferredTime"
                                            value={formData.preferredTime}
                                            onChange={handleChange}
                                            required
                                            aria-invalid={Boolean(fieldErrors.preferredTime)}
                                            className={`form-control rounded-3 ${fieldErrors.preferredTime ? 'is-invalid' : ''}`}
                                        />
                                        {fieldErrors.preferredTime && <div className="invalid-feedback">{fieldErrors.preferredTime}</div>}
                                    </div>

                                    {/* Complete Address with autocomplete */}
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
                                                onChange={(e) => {
                                                    handleChange(e);
                                                    setShowAddressSuggestions(true);
                                                }}
                                                onFocus={() =>
                                                    setShowAddressSuggestions(true)
                                                }
                                                onBlur={() => {
                                                    setTimeout(() => {
                                                        setShowAddressSuggestions(false);
                                                    }, 150);
                                                }}
                                                minLength="10"
                                                maxLength="2000"
                                                autoComplete="street-address"
                                                required
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
                                                                    No matching addresses found.
                                                                    You can still enter your
                                                                    complete address manually.
                                                                </div>
                                                            )}
                                                    </div>
                                                )}
                                        </div>

                                        <small className="text-muted">
                                            Type at least 3 characters and choose a
                                            suggested address, or enter the complete
                                            address manually.
                                        </small>
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

                                    {/* Upload Photo (Optional) */}
                                    <div className="col-12">
                                        <label className="form-label fw-semibold small">
                                            Upload Photo{' '}
                                            <span className="text-muted fw-normal">
                                                (Optional)
                                            </span>
                                        </label>

                                        <input
                                            type="file"
                                            className="form-control rounded-3"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                        />

                                        <small className="text-muted extra-small">
                                            Upload a photo to help service providers
                                            understand the problem better.
                                        </small>
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
        </div>
    );
};

export default BookingModal;