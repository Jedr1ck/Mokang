
import React, { useEffect, useState } from 'react';
import {
    getMyProfile,
    updateMyProfile,
    getProviderVerification,
    updateProviderVerification,
    uploadProviderId,
    submitProviderVerification,
} from '../../services/api';
import './ProviderAccountProfile.css';

const steps = [
    'Personal Information',
    'Complete Address',
    'Services & Experience',
    'Identity Verification',
    'Review & Submit',
];

const initialProfile = {
    fullName: '',
    email: '',
    mobileNumber: '',
    gender: '',
    birthday: '',
    address: '',
    profilePicture: '',
};

const initialVerification = {
    region: '',
    province: '',
    city: '',
    barangay: '',
    street: '',
    postal_code: '',
    id_type: '',
    qualifications: '',
    service_area: '',
};

const idTypes = [
    'Philippine National ID',
    'Passport',
    "Driver's License",
    'UMID',
    'SSS ID',
    'PRC ID',
    'Other',
];

const serviceCategories = [
    'Cleaning',
    'Electrical Services',
    'Plumbing',
    'Carpentry',
    'Painting',
    'Air Conditioning',
    'Appliance Repair',
    'Gardening',
    'Other',
];

export default function ProviderAccountProfile() {
    const [step, setStep] = useState(0);
    const [profile, setProfile] = useState(initialProfile);
    const [verification, setVerification] = useState(initialVerification);
    const [selectedServices, setSelectedServices] = useState([]);
    const [experience, setExperience] = useState('');
    const [rate, setRate] = useState('');
    const [workSamples, setWorkSamples] = useState([]);
    const [frontFile, setFrontFile] = useState(null);
    const [backFile, setBackFile] = useState(null);
    const [frontPreview, setFrontPreview] = useState('');
    const [backPreview, setBackPreview] = useState('');
    const [frontUploaded, setFrontUploaded] = useState(false);
    const [backUploaded, setBackUploaded] = useState(false);
    const [status, setStatus] = useState('incomplete');
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [declaration, setDeclaration] = useState(false);

    useEffect(() => {
        let active = true;

        async function loadData() {
            try {
                const [profileData, verificationData] = await Promise.all([
                    getMyProfile(),
                    getProviderVerification(),
                ]);

                if (!active) return;

                setProfile((previous) => ({
                    ...previous,
                    ...profileData,
                    birthday: profileData.birthday
                        ? String(profileData.birthday).slice(0, 10)
                        : '',
                }));

                setVerification((previous) => ({
                    ...previous,
                    ...Object.fromEntries(
                        Object.keys(initialVerification).map((key) => [
                            key,
                            verificationData?.[key] ?? previous[key],
                        ])
                    ),
                }));

                setStatus(
                    verificationData?.verification_status || 'incomplete'
                );
            } catch (err) {
                if (active) setError(err.message || 'Unable to load your application.');
            } finally {
                if (active) setLoading(false);
            }
        }

        loadData();

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        return () => {
            if (frontPreview) URL.revokeObjectURL(frontPreview);
            if (backPreview) URL.revokeObjectURL(backPreview);
        };
    }, [frontPreview, backPreview]);

    const changeProfile = (event) => {
        const { name, value } = event.target;
        setProfile((previous) => ({ ...previous, [name]: value }));
    };

    const changeVerification = (event) => {
        const { name, value } = event.target;
        setVerification((previous) => ({ ...previous, [name]: value }));
    };

    const toggleService = (service) => {
        setSelectedServices((previous) =>
            previous.includes(service)
                ? previous.filter((item) => item !== service)
                : [...previous, service]
        );
    };

    const chooseIdFile = (event, side) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            setError('Choose a JPG, PNG, or WEBP image.');
            event.target.value = '';
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('Each ID image must be 5 MB or smaller.');
            event.target.value = '';
            return;
        }

        setError('');

        const preview = URL.createObjectURL(file);

        if (side === 'front') {
            setFrontFile(file);
            setFrontPreview(preview);
            setFrontUploaded(false);
        } else {
            setBackFile(file);
            setBackPreview(preview);
            setBackUploaded(false);
        }
    };

    const uploadId = async (side) => {
        const file = side === 'front' ? frontFile : backFile;

        if (!file) {
            setError(`Choose the ${side} ID image first.`);
            return;
        }

        setBusy(true);
        setError('');
        setMessage('');

        try {
            await uploadProviderId(side, file);

            if (side === 'front') setFrontUploaded(true);
            else setBackUploaded(true);

            setMessage(`${side === 'front' ? 'Front' : 'Back'} ID uploaded.`);
        } catch (err) {
            setError(err.message || 'ID upload failed.');
        } finally {
            setBusy(false);
        }
    };

    const savePersonalInformation = async () => {
        await updateMyProfile({
            fullName: profile.fullName,
            email: profile.email,
            mobileNumber: profile.mobileNumber,
            gender: profile.gender,
            birthday: profile.birthday,
            address: profile.address || 'To be completed',
        });
    };

    const saveVerificationDetails = async () => {
        await updateProviderVerification(verification);
    };

    const nextStep = async () => {
        setError('');
        setMessage('');

        try {
            if (step === 0) {
                if (!profile.fullName || !profile.email || !profile.mobileNumber ||
                    !profile.gender || !profile.birthday) {
                    setError('Complete all required personal information.');
                    return;
                }

                setBusy(true);
                await savePersonalInformation();
            }

            if (step === 1) {
                const required = [
                    'region', 'province', 'city', 'barangay', 'street',
                ];

                if (required.some((key) => !verification[key]?.trim())) {
                    setError('Complete all required address fields.');
                    return;
                }

                setBusy(true);
                await saveVerificationDetails();
            }

            if (step === 2) {
                if (!selectedServices.length || !experience.trim() ||
                    !rate.trim() || !verification.service_area.trim()) {
                    setError('Select a service and complete experience, rate, and service area.');
                    return;
                }

                setBusy(true);
                await saveVerificationDetails();
            }

            if (step === 3) {
                if (!verification.id_type) {
                    setError('Select your valid ID type.');
                    return;
                }

                if (!frontUploaded || !backUploaded) {
                    setError('Upload both the front and back of your ID before continuing.');
                    return;
                }
            }

            setStep((current) => Math.min(current + 1, steps.length - 1));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            setError(err.message || 'Unable to save your information.');
        } finally {
            setBusy(false);
        }
    };

    const previousStep = () => {
        setError('');
        setMessage('');
        setStep((current) => Math.max(current - 1, 0));
    };

    const handleSubmit = async () => {
        if (!declaration) {
            setError('Please confirm that your information is accurate.');
            return;
        }

        setBusy(true);
        setError('');
        setMessage('');

        try {
            await savePersonalInformation();
            await saveVerificationDetails();

            const result = await submitProviderVerification();

            setStatus(result.verification_status || 'pending');
            setMessage(
                result.message ||
                'Application submitted. Please wait for admin review.'
            );
        } catch (err) {
            setError(err.message || 'Unable to submit your application.');
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return <section className="provider-profile-page">Loading application...</section>;
    }

    const field = (label, name, options = {}) => (
        <div className="mb-3" key={name}>
            <label className="form-label" htmlFor={name}>
                {label}{options.required ? ' *' : ''}
            </label>
            <input
                id={name}
                name={name}
                className="form-control"
                type={options.type || 'text'}
                value={options.profile
                    ? profile[name] || ''
                    : verification[name] || ''}
                onChange={options.profile ? changeProfile : changeVerification}
                required={Boolean(options.required)}
                readOnly={Boolean(options.readOnly)}
            />
        </div>
    );

    return (
        <section className="provider-profile-page">
            <div className="provider-application-heading">
                <span className="text-success fw-semibold">PROVIDER APPLICATION</span>
                <h2>My Provider Profile & Verification</h2>
                <p>Complete your details to apply for provider verification.</p>
            </div>

            <div className="alert alert-info">
                Verification status: <strong>{status}</strong>
            </div>

            {message && <div className="alert alert-success" role="status">{message}</div>}
            {error && <div className="alert alert-danger" role="alert">{error}</div>}

            <div className="provider-step-progress">
                {steps.map((label, index) => (
                    <div
                        className={`provider-step ${index === step ? 'active' : ''} ${index < step ? 'completed' : ''}`}
                        key={label}
                    >
                        <span>{index + 1}</span>
                        <small>{label}</small>
                    </div>
                ))}
            </div>

            <div className="provider-application-card">
                <h3>{steps[step]}</h3>

                {step === 0 && (
                    <div className="row">
                        <div className="col-md-6">
                            {field('Full Name', 'fullName', {
                                profile: true, required: true, readOnly: true,
                            })}
                        </div>
                        <div className="col-md-6">
                            {field('Email', 'email', {
                                profile: true, required: true, readOnly: true,
                            })}
                        </div>
                        <div className="col-md-6">
                            {field('Mobile Number', 'mobileNumber', {
                                profile: true, required: true, type: 'tel',
                            })}
                        </div>
                        <div className="col-md-6 mb-3">
                            <label className="form-label" htmlFor="gender">Gender *</label>
                            <select
                                id="gender"
                                name="gender"
                                className="form-select"
                                value={profile.gender || ''}
                                onChange={changeProfile}
                                required
                            >
                                <option value="">Select gender</option>
                                <option value="Female">Female</option>
                                <option value="Male">Male</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="col-md-6">
                            {field('Birthday', 'birthday', {
                                profile: true, required: true, type: 'date',
                            })}
                        </div>
                        <div className="col-md-6 mb-3">
                            <label className="form-label" htmlFor="profilePicture">
                                Profile Picture URL
                            </label>
                            <input
                                id="profilePicture"
                                className="form-control"
                                value={profile.profilePicture || ''}
                                readOnly
                                placeholder="Profile picture upload will be connected separately"
                            />
                        </div>
                    </div>
                )}

                {step === 1 && (
                    <div className="row">
                        <p className="text-muted">
                            Enter your Philippine address. Cascading location API dropdowns
                            still need to be connected.
                        </p>
                        <div className="col-md-6">
                            {field('Region', 'region', { required: true })}
                        </div>
                        <div className="col-md-6">
                            {field('Province', 'province', { required: true })}
                        </div>
                        <div className="col-md-6">
                            {field('City / Municipality', 'city', { required: true })}
                        </div>
                        <div className="col-md-6">
                            {field('Barangay', 'barangay', { required: true })}
                        </div>
                        <div className="col-md-8">
                            {field('House No. / Street / Subdivision', 'street', { required: true })}
                        </div>
                        <div className="col-md-4">
                            {field('Postal Code', 'postal_code')}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <>
                        <p className="text-muted">
                            Select the services you offer and provide your experience and rates.
                        </p>

                        <label className="form-label">Service Categories *</label>
                        <div className="row mb-3">
                            {serviceCategories.map((service) => (
                                <div className="col-md-6 mb-2" key={service}>
                                    <label className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={selectedServices.includes(service)}
                                            onChange={() => toggleService(service)}
                                        />
                                        <span className="form-check-label">{service}</span>
                                    </label>
                                </div>
                            ))}
                        </div>

                        <div className="mb-3">
                            <label className="form-label" htmlFor="qualifications">
                                Skills, Qualifications & Experience *
                            </label>
                            <textarea
                                id="qualifications"
                                name="qualifications"
                                className="form-control"
                                rows="3"
                                value={verification.qualifications}
                                onChange={changeVerification}
                                placeholder="Describe your skills, certificates, and experience"
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label" htmlFor="experience">Years of Experience *</label>
                            <input
                                id="experience"
                                className="form-control"
                                value={experience}
                                onChange={(event) => setExperience(event.target.value)}
                                placeholder="e.g. 3 years"
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label" htmlFor="rate">Service Rate *</label>
                            <input
                                id="rate"
                                className="form-control"
                                value={rate}
                                onChange={(event) => setRate(event.target.value)}
                                placeholder="e.g. ₱350 per hour"
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label" htmlFor="service_area">Service Area *</label>
                            <input
                                id="service_area"
                                name="service_area"
                                className="form-control"
                                value={verification.service_area}
                                onChange={changeVerification}
                                placeholder="Cities or barangays you serve"
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label" htmlFor="workSamples">Work Samples</label>
                            <input
                                id="workSamples"
                                type="file"
                                className="form-control"
                                accept="image/jpeg,image/png,image/webp"
                                multiple
                                onChange={(event) => setWorkSamples(Array.from(event.target.files || []))}
                            />
                            <small className="text-muted">
                                Selected: {workSamples.length} file(s). Work-sample upload is not yet connected to the backend.
                            </small>
                        </div>
                    </>
                )}

                {step === 3 && (
                    <>
                        <div className="mb-3">
                            <label className="form-label" htmlFor="id_type">Valid ID Type *</label>
                            <select
                                id="id_type"
                                name="id_type"
                                className="form-select"
                                value={verification.id_type}
                                onChange={(event) => {
                                    changeVerification(event);
                                    setFrontUploaded(false);
                                    setBackUploaded(false);
                                }}
                                required
                            >
                                <option value="">Select ID type</option>
                                {idTypes.map((idType) => (
                                    <option value={idType} key={idType}>{idType}</option>
                                ))}
                            </select>
                        </div>

                        <p className="text-muted">
                            Use clear images of your own ID. JPG, PNG, or WEBP; maximum 5 MB per image.
                        </p>

                        <div className="row">
                            {[
                                { side: 'front', title: 'Front of ID', file: frontFile, preview: frontPreview, uploaded: frontUploaded },
                                { side: 'back', title: 'Back of ID', file: backFile, preview: backPreview, uploaded: backUploaded },
                            ].map((item) => (
                                <div className="col-md-6 mb-4" key={item.side}>
                                    <h5>{item.title}</h5>
                                    <input
                                        className="form-control"
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={(event) => chooseIdFile(event, item.side)}
                                    />
                                    {item.preview && (
                                        <img
                                            className="img-thumbnail mt-3"
                                            src={item.preview}
                                            alt={`${item.side} ID preview`}
                                            style={{ maxHeight: 220, width: '100%', objectFit: 'contain' }}
                                        />
                                    )}
                                    <button
                                        type="button"
                                        className="btn btn-outline-success mt-3"
                                        disabled={busy || !item.file || item.uploaded}
                                        onClick={() => uploadId(item.side)}
                                    >
                                        {item.uploaded ? 'Uploaded ✓' : `Upload ${item.side} ID`}
                                    </button>
                                    {item.uploaded && (
                                        <p className="text-success mt-2">Upload complete</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {step === 4 && (
                    <>
                        <h5>Personal Information</h5>
                        <p><strong>Name:</strong> {profile.fullName}</p>
                        <p><strong>Email:</strong> {profile.email}</p>
                        <p><strong>Mobile:</strong> {profile.mobileNumber}</p>
                        <p><strong>Gender:</strong> {profile.gender}</p>
                        <p><strong>Birthday:</strong> {profile.birthday}</p>

                        <hr />
                        <h5>Address</h5>
                        <p>
                            {[
                                verification.street,
                                verification.barangay,
                                verification.city,
                                verification.province,
                                verification.region,
                                verification.postal_code,
                            ].filter(Boolean).join(', ')}
                        </p>

                        <hr />
                        <h5>Services & Experience</h5>
                        <p><strong>Services:</strong> {selectedServices.join(', ') || 'None selected'}</p>
                        <p><strong>Qualifications:</strong> {verification.qualifications || 'Not provided'}</p>
                        <p><strong>Experience:</strong> {experience || 'Not provided'}</p>
                        <p><strong>Rate:</strong> {rate || 'Not provided'}</p>
                        <p><strong>Service Area:</strong> {verification.service_area || 'Not provided'}</p>

                        <hr />
                        <h5>Identity Verification</h5>
                        <p><strong>ID type:</strong> {verification.id_type || 'Not selected'}</p>
                        <p><strong>Front image:</strong> {frontUploaded ? 'Uploaded' : 'Not uploaded'}</p>
                        <p><strong>Back image:</strong> {backUploaded ? 'Uploaded' : 'Not uploaded'}</p>

                        <label className="form-check mt-4">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                checked={declaration}
                                onChange={(event) => setDeclaration(event.target.checked)}
                            />
                            <span className="form-check-label">
                                I confirm that the information I provided is accurate and that
                                I am authorized to submit these details for verification.
                            </span>
                        </label>

                        <div className="alert alert-warning mt-3">
                            Submitting your application does not automatically verify your account.
                            An admin must review and approve it.
                        </div>
                    </>
                )}

                <div className="d-flex flex-wrap justify-content-between gap-2 mt-4">
                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={previousStep}
                        disabled={step === 0 || busy}
                    >
                        Back
                    </button>

                    {step < steps.length - 1 ? (
                        <button
                            type="button"
                            className="btn btn-success"
                            onClick={nextStep}
                            disabled={busy}
                        >
                            {busy ? 'Saving...' : 'Save & Continue'}
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="btn btn-success"
                            onClick={handleSubmit}
                            disabled={busy || status === 'verified'}
                        >
                            {busy ? 'Submitting...' : 'Submit for Admin Review'}
                        </button>
                    )}
                </div>
            </div>
        </section>
    );
}
