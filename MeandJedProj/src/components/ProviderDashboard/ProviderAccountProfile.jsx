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

const PSGC_API = 'https://psgc.cloud/api/v2';

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
    {
        name: "Electrician",
        tasks: [
            "Wiring Installation",
            "Outlet and Switch Repair",
            "Lighting Installation",
            "Circuit Breaker Repair",
            "Electrical Troubleshooting",
        ],
    },
    {
        name: "Plumber",
        tasks: [
            "Leak Repair",
            "Clogged Drain Clearing",
            "Faucet Installation",
            "Pipe Replacement",
            "Toilet Repair",
        ],
    },
    {
        name: "Aircon Technician",
        tasks: [
            "Aircon Cleaning",
            "Preventive Maintenance",
            "Aircon Installation",
            "Cooling Problem Diagnosis",
            "Aircon Repair",
        ],
    },
    {
        name: "Carpenter",
        tasks: [
            "Furniture Assembly",
            "Door and Cabinet Repair",
            "Shelf Installation",
            "Woodwork",
            "Custom Furniture Repair",
        ],
    },
    {
        name: "Pest Control Technician",
        tasks: [
            "Cockroach Control",
            "Ant Control",
            "Termite Treatment",
            "Rodent Control",
            "General Pest Inspection",
        ],
    },
    {
        name: "Painter",
        tasks: [
            "Interior Painting",
            "Exterior Painting",
            "Wall Repainting",
            "Surface Preparation",
            "Minor Wall Touch-ups",
        ],
    },
    {
        name: "Appliance Repair Technician",
        tasks: [
            "Washing Machine Repair",
            "Refrigerator Repair",
            "Electric Fan Repair",
            "Microwave Repair",
            "Appliance Troubleshooting",
        ],
    },
    {
        name: "Locksmith",
        tasks: [
            "Door Lock Repair",
            "Lock Replacement",
            "Key Duplication",
            "Door Lock Installation",
            "Lockout Assistance",
        ],
    },
    {
        name: "Deep Cleaner",
        tasks: [
            "Deep House Cleaning",
            "Kitchen Cleaning",
            "Bathroom Cleaning",
            "Move-in / Move-out Cleaning",
            "Upholstery Cleaning",
        ],
    },
    {
        name: "Massage Therapist",
        tasks: [
            "Relaxation Massage",
            "Swedish Massage",
            "Traditional Massage",
            "Full-body Massage",
            "Targeted Muscle Relaxation",
        ],
    },
    {
        name: "Hair Stylist / Barber",
        tasks: [
            "Haircut",
            "Hair Styling",
            "Hair Coloring",
            "Blow-dry",
            "Beard Trimming",
        ],
    },
    {
        name: "Nail Technician (Manicurist/Pedicurist)",
        tasks: [
            "Manicure",
            "Pedicure",
            "Nail Cleaning",
            "Nail Polish Application",
            "Basic Nail Art",
        ],
    },
    {
        name: "Makeup Artist",
        tasks: [
            "Everyday Makeup",
            "Event Makeup",
            "Debut Makeup",
            "Bridal Makeup",
            "Photoshoot Makeup",
        ],
    },
    {
        name: "Private Nurse / Caregiver",
        tasks: [
            "Elderly Assistance",
            "Personal Care Assistance",
            "Companionship",
            "Daily Living Support",
            "Basic Patient Assistance",
        ],
    },
    {
        name: "Physical Therapist",
        tasks: [
            "Mobility Exercises",
            "Rehabilitation Sessions",
            "Movement Assessment",
            "Therapeutic Exercise",
            "Recovery Support",
        ],
    },
    {
        name: "Computer / CCTV Technician",
        tasks: [
            "Computer Troubleshooting",
            "Software Installation",
            "Computer Setup",
            "CCTV Installation",
            "CCTV Troubleshooting",
        ],
    },
    {
        name: "Private Tutor / Personal Fitness Trainer",
        tasks: [
            "Academic Tutoring",
            "Subject Review",
            "Homework Assistance",
            "Personal Fitness Training",
            "Workout Guidance",
        ],
    },
];


async function fetchLocations(path, signal) {
    const response = await fetch(`${PSGC_API}/${path}`, { signal });

    if (!response.ok) {
        throw new Error(
            'Unable to load Philippine locations. Please try again.'
        );
    }

    const result = await response.json();
    const items = Array.isArray(result) ? result : result.data;

    return Array.isArray(items) ? items : [];
}

function findLocationByName(items, name) {
    return items.find(
        (item) =>
            item.name?.trim().toLowerCase() ===
            name?.trim().toLowerCase()
    );
}

function getLocationCode(item) {
    return item?.code ?? item?.psgcCode ?? item?.psgc_code ?? '';
}

export default function ProviderAccountProfile() {
    const [step, setStep] = useState(0);
    const [profile, setProfile] = useState(initialProfile);
    const [verification, setVerification] = useState(initialVerification);

    const [selectedCategory, setSelectedCategory] = useState("");
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

    // Philippine location states
    const [regions, setRegions] = useState([]);
    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);
    const [barangays, setBarangays] = useState([]);
    const [locationLoading, setLocationLoading] = useState(false);
    const [locationError, setLocationError] = useState('');

    // Load the user's existing profile and provider verification data.
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
                if (active) {
                    setError(
                        err.message || 'Unable to load your application.'
                    );
                }
            } finally {
                if (active) setLoading(false);
            }
        }

        loadData();

        return () => {
            active = false;
        };
    }, []);

    // Load all Philippine regions.
    useEffect(() => {
        const controller = new AbortController();

        async function loadRegions() {
            try {
                setLocationLoading(true);
                setLocationError('');

                const data = await fetchLocations(
                    'regions',
                    controller.signal
                );

                setRegions(data);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    setLocationError(err.message);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLocationLoading(false);
                }
            }
        }

        loadRegions();

        return () => controller.abort();
    }, []);

    // Load provinces when a region is selected.
    useEffect(() => {
        const region = findLocationByName(regions, verification.region);

        setProvinces([]);
        setCities([]);
        setBarangays([]);

        if (!region) return undefined;

        const controller = new AbortController();

        async function loadProvinces() {
            try {
                setLocationLoading(true);
                setLocationError('');

                const regionCode = getLocationCode(region);

                let data = await fetchLocations(
                    `regions/${encodeURIComponent(regionCode)}/provinces`,
                    controller.signal
                );

                // NCR has no regular provinces.
                // Use Metro Manila as a grouping in the Province field.
                if (
                    data.length === 0 &&
                    /national capital region|\bncr\b/i.test(region.name)
                ) {
                    data = [
                        {
                            name: 'Metro Manila',
                            code: 'NCR',
                            isNcrGroup: true,
                        },
                    ];
                }

                setProvinces(data);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    setLocationError(err.message);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLocationLoading(false);
                }
            }
        }

        loadProvinces();

        return () => controller.abort();
    }, [regions, verification.region]);

    // Load cities and municipalities for the selected province.
    useEffect(() => {
        const region = findLocationByName(regions, verification.region);
        const province = findLocationByName(
            provinces,
            verification.province
        );

        setCities([]);
        setBarangays([]);

        if (!region || !province) return undefined;

        const controller = new AbortController();

        async function loadCities() {
            try {
                setLocationLoading(true);
                setLocationError('');

                const path = province.isNcrGroup
                    ? `regions/${encodeURIComponent(
                        getLocationCode(region)
                    )}/cities-municipalities`
                    : `provinces/${encodeURIComponent(
                        getLocationCode(province)
                    )}/cities-municipalities`;

                const data = await fetchLocations(
                    path,
                    controller.signal
                );

                setCities(data);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    setLocationError(err.message);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLocationLoading(false);
                }
            }
        }

        loadCities();

        return () => controller.abort();
    }, [
        regions,
        provinces,
        verification.region,
        verification.province,
    ]);

    // Load barangays for the selected city or municipality.
    useEffect(() => {
        const city = findLocationByName(cities, verification.city);

        setBarangays([]);

        if (!city) return undefined;

        const controller = new AbortController();

        async function loadBarangays() {
            try {
                setLocationLoading(true);
                setLocationError('');

                const data = await fetchLocations(
                    `cities-municipalities/${encodeURIComponent(
                        getLocationCode(city)
                    )}/barangays`,
                    controller.signal
                );

                setBarangays(data);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    setLocationError(err.message);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLocationLoading(false);
                }
            }
        }

        loadBarangays();

        return () => controller.abort();
    }, [cities, verification.city]);

    // Clean up temporary ID image previews.
    useEffect(() => {
        return () => {
            if (frontPreview) URL.revokeObjectURL(frontPreview);
            if (backPreview) URL.revokeObjectURL(backPreview);
        };
    }, [frontPreview, backPreview]);

    const changeProfile = (event) => {
        const { name, value } = event.target;

        setProfile((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const changeVerification = (event) => {
        const { name, value } = event.target;

        setVerification((previous) => ({
            ...previous,
            [name]: value,
        }));
    };
    const toggleService = (service) => {
        setSelectedServices((previous) =>
            previous.includes(service)
                ? previous.filter((item) => item !== service)
                : [...previous, service]
        );
    };

    const selectedCategoryData = serviceCategories.find(
        (category) => category.name === selectedCategory
    );

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

            if (side === 'front') {
                setFrontUploaded(true);
            } else {
                setBackUploaded(true);
            }

            setMessage(
                `${side === 'front' ? 'Front' : 'Back'} ID uploaded.`
            );
        } catch (err) {
            setError(err.message || 'ID upload failed.');
        } finally {
            setBusy(false);
        }
    };

    // Build the complete address before saving the personal profile.
    const savePersonalInformation = async () => {
        const fullAddress = [
            verification.street,
            verification.barangay,
            verification.city,
            verification.province,
            verification.region,
            verification.postal_code,
        ]
            .filter(Boolean)
            .join(', ');

        await updateMyProfile({
            fullName: profile.fullName,
            mobileNumber: profile.mobileNumber,
            gender: profile.gender,
            birthday: profile.birthday,
            address: fullAddress,
            profilePicture: profile.profilePicture || null,
        });
    };

    const saveVerificationDetails = async () => {
        const experienceYears = Number(experience);
        const hourlyRate = Number(rate);

        if (
            experience.trim() === '' ||
            !Number.isInteger(experienceYears) ||
            experienceYears < 0
        ) {
            throw new Error(
                'Enter your experience as a whole number, such as 3.'
            );
        }

        if (
            rate.trim() === '' ||
            !Number.isFinite(hourlyRate) ||
            hourlyRate < 0
        ) {
            throw new Error(
                'Enter your service rate as a number, such as 350.'
            );
        }

        await updateProviderVerification({
            business_name: profile.fullName,
            bio: verification.qualifications || '',
            experience_years: experienceYears,
            hourly_rate: hourlyRate,
            region_name: verification.region,
            province_name: verification.province,
            city_municipality_name: verification.city,
            barangay_name: verification.barangay,
            street_address: verification.street,
            postal_code: verification.postal_code || null,
            id_type: verification.id_type || 'Not selected',
            service_area: verification.service_area || 'Not specified',
        });
    };

    const nextStep = async () => {
        setError('');
        setMessage('');

        try {
            if (step === 0) {
                if (
                    !profile.fullName?.trim() ||
                    !profile.email?.trim() ||
                    !profile.mobileNumber?.trim() ||
                    !profile.gender ||
                    !profile.birthday
                ) {
                    setError(
                        'Complete all required personal information.'
                    );
                    return;
                }

                // Do not call the complete-profile endpoint yet.
                // The full address will be saved after Step 2.
            }

            if (step === 1) {
                const required = [
                    'region',
                    'province',
                    'city',
                    'barangay',
                    'street',
                ];

                if (
                    required.some(
                        (key) => !verification[key]?.trim()
                    )
                ) {
                    setError('Complete all required address fields.');
                    return;
                }

                const validRegion = findLocationByName(
                    regions,
                    verification.region
                );
                const validProvince = findLocationByName(
                    provinces,
                    verification.province
                );
                const validCity = findLocationByName(
                    cities,
                    verification.city
                );
                const validBarangay = findLocationByName(
                    barangays,
                    verification.barangay
                );

                if (
                    !validRegion ||
                    !validProvince ||
                    !validCity ||
                    !validBarangay
                ) {
                    setError(
                        'Select a valid Region, Province, City/Municipality, and Barangay from the suggestions.'
                    );
                    return;
                }

                setBusy(true);
            }

            if (step === 2) {
                if (
                    selectedServices.length === 0 ||
                    !verification.qualifications.trim() ||
                    !experience.trim() ||
                    !rate.trim() ||
                    !verification.service_area.trim()
                ) {
                    setError(
                        'Select a service and complete qualifications, experience, rate, and service area.'
                    );
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
                    setError(
                        'Upload both the front and back of your ID before continuing.'
                    );
                    return;
                }
            }

            setStep((current) =>
                Math.min(current + 1, steps.length - 1)
            );

            window.scrollTo({
                top: 0,
                behavior: 'smooth',
            });
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
            setError(
                'Please confirm that your information is accurate.'
            );
            return;
        }

        if (status === 'pending') {
            setError(
                'Your application is already pending admin review.'
            );
            return;
        }

        if (status === 'verified') {
            setError('Your provider account is already verified.');
            return;
        }

        setBusy(true);
        setError('');
        setMessage('');

        try {
            // Save complete personal information and address.
            await savePersonalInformation();

            // Save verification details.
            await saveVerificationDetails();

            // Submit to the backend for admin review.
            const result = await submitProviderVerification();

            setStatus(result.verification_status || 'pending');

            setMessage(
                result.message ||
                'Application submitted. Please wait for admin review.'
            );
        } catch (err) {
            setError(
                err.message || 'Unable to submit your application.'
            );
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return (
            <section className="provider-profile-page">
                Loading application...
            </section>
        );
    }

    const field = (label, name, options = {}) => (
        <div className="mb-3" key={name}>
            <label className="form-label" htmlFor={name}>
                {label}
                {options.required ? ' *' : ''}
            </label>

            <input
                id={name}
                name={name}
                className="form-control"
                type={options.type || 'text'}
                value={
                    options.profile
                        ? profile[name] || ''
                        : verification[name] || ''
                }
                onChange={
                    options.profile
                        ? changeProfile
                        : changeVerification
                }
                required={Boolean(options.required)}
                readOnly={Boolean(options.readOnly)}
            />
        </div>
    );

    return (
        <section className="provider-profile-page">
            <div className="provider-application-heading">
                <span className="text-success fw-semibold">
                    PROVIDER APPLICATION
                </span>

                <h2>My Provider Profile & Verification</h2>

                <p>
                    Complete your details to apply for provider verification.
                </p>
            </div>

            <div className="alert alert-info">
                Verification status: <strong>{status}</strong>
            </div>

            {message && (
                <div className="alert alert-success" role="status">
                    {message}
                </div>
            )}

            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            <div className="provider-step-progress">
                {steps.map((label, index) => (
                    <div
                        className={`provider-step ${index === step ? 'active' : ''
                            } ${index < step ? 'completed' : ''}`}
                        key={label}
                    >
                        <span>{index + 1}</span>
                        <small>{label}</small>
                    </div>
                ))}
            </div>

            <div className="provider-application-card">
                <h3>{steps[step]}</h3>

                {/* STEP 1: PERSONAL INFORMATION */}
                {step === 0 && (
                    <div className="row">
                        <div className="col-md-6">
                            {field('Full Name', 'fullName', {
                                profile: true,
                                required: true,
                                readOnly: true,
                            })}
                        </div>

                        <div className="col-md-6">
                            {field('Email', 'email', {
                                profile: true,
                                required: true,
                                readOnly: true,
                            })}
                        </div>

                        <div className="col-md-6">
                            {field('Mobile Number', 'mobileNumber', {
                                profile: true,
                                required: true,
                                type: 'tel',
                            })}
                        </div>

                        <div className="col-md-6 mb-3">
                            <label
                                className="form-label"
                                htmlFor="gender"
                            >
                                Gender *
                            </label>

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
                                profile: true,
                                required: true,
                                type: 'date',
                            })}
                        </div>

                        <div className="col-md-6 mb-3">
                            <label
                                className="form-label"
                                htmlFor="profilePicture"
                            >
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

                {/* STEP 2: COMPLETE ADDRESS */}
                {step === 1 && (
                    <div className="row">
                        <p className="text-muted">
                            Search and select your actual Philippine
                            location. Each list depends on your previous
                            selection.
                        </p>

                        {locationLoading && (
                            <p className="text-muted" role="status">
                                Loading Philippine locations...
                            </p>
                        )}

                        {locationError && (
                            <div
                                className="alert alert-warning"
                                role="alert"
                            >
                                {locationError}
                            </div>
                        )}

                        <div className="col-md-6 mb-3">
                            <label
                                className="form-label"
                                htmlFor="region"
                            >
                                Region *
                            </label>

                            <input
                                id="region"
                                name="region"
                                className="form-control"
                                list="provider-regions"
                                autoComplete="off"
                                placeholder="Type to search region"
                                value={verification.region}
                                onChange={(event) =>
                                    setVerification((previous) => ({
                                        ...previous,
                                        region: event.target.value,
                                        province: '',
                                        city: '',
                                        barangay: '',
                                    }))
                                }
                                required
                            />

                            <datalist id="provider-regions">
                                {regions.map((item) => (
                                    <option
                                        key={getLocationCode(item)}
                                        value={item.name}
                                    />
                                ))}
                            </datalist>
                        </div>

                        <div className="col-md-6 mb-3">
                            <label
                                className="form-label"
                                htmlFor="province"
                            >
                                Province *
                            </label>

                            <input
                                id="province"
                                name="province"
                                className="form-control"
                                list="provider-provinces"
                                autoComplete="off"
                                placeholder="Select a region first"
                                value={verification.province}
                                disabled={
                                    !findLocationByName(
                                        regions,
                                        verification.region
                                    )
                                }
                                onChange={(event) =>
                                    setVerification((previous) => ({
                                        ...previous,
                                        province: event.target.value,
                                        city: '',
                                        barangay: '',
                                    }))
                                }
                                required
                            />

                            <datalist id="provider-provinces">
                                {provinces.map((item) => (
                                    <option
                                        key={getLocationCode(item)}
                                        value={item.name}
                                    />
                                ))}
                            </datalist>
                        </div>

                        <div className="col-md-6 mb-3">
                            <label
                                className="form-label"
                                htmlFor="city"
                            >
                                City / Municipality *
                            </label>

                            <input
                                id="city"
                                name="city"
                                className="form-control"
                                list="provider-cities"
                                autoComplete="off"
                                placeholder="Select a province first"
                                value={verification.city}
                                disabled={
                                    !findLocationByName(
                                        provinces,
                                        verification.province
                                    )
                                }
                                onChange={(event) =>
                                    setVerification((previous) => ({
                                        ...previous,
                                        city: event.target.value,
                                        barangay: '',
                                    }))
                                }
                                required
                            />

                            <datalist id="provider-cities">
                                {cities.map((item) => (
                                    <option
                                        key={getLocationCode(item)}
                                        value={item.name}
                                    />
                                ))}
                            </datalist>
                        </div>

                        <div className="col-md-6 mb-3">
                            <label
                                className="form-label"
                                htmlFor="barangay"
                            >
                                Barangay *
                            </label>

                            <input
                                id="barangay"
                                name="barangay"
                                className="form-control"
                                list="provider-barangays"
                                autoComplete="off"
                                placeholder="Select a city/municipality first"
                                value={verification.barangay}
                                disabled={
                                    !findLocationByName(
                                        cities,
                                        verification.city
                                    )
                                }
                                onChange={(event) =>
                                    setVerification((previous) => ({
                                        ...previous,
                                        barangay: event.target.value,
                                    }))
                                }
                                required
                            />

                            <datalist id="provider-barangays">
                                {barangays.map((item) => (
                                    <option
                                        key={getLocationCode(item)}
                                        value={item.name}
                                    />
                                ))}
                            </datalist>
                        </div>

                        <div className="col-md-8">
                            {field(
                                'House No. / Street / Subdivision',
                                'street',
                                { required: true }
                            )}
                        </div>

                        <div className="col-md-4">
                            {field('Postal Code', 'postal_code')}
                        </div>
                    </div>
                )}

                {/* STEP 3: SERVICES AND EXPERIENCE */}
                {step === 2 && (
                    <>
                        <p className="text-muted">
                            Select the services you offer and provide your
                            experience and rates.
                        </p>


                        <label className="form-label">
                            Service Categories *
                        </label>

                        <div className="mb-3">
                            <select
                                className="form-select"
                                value={selectedCategory}
                                onChange={(event) =>
                                    setSelectedCategory(event.target.value)
                                }
                            >
                                <option value="">Choose a service category</option>

                                {serviceCategories.map((category) => (
                                    <option key={category.name} value={category.name}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedCategoryData && (
                            <div className="row mb-3">
                                <h6>Specific Services</h6>

                                {selectedCategoryData.tasks.map((service) => (
                                    <div
                                        className="col-md-6 mb-2"
                                        key={service}
                                    >
                                        <label className="form-check border rounded p-3">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={selectedServices.includes(service)}
                                                onChange={() => toggleService(service)}
                                            />

                                            <span className="form-check-label">
                                                {service}
                                            </span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        )}


                        <div className="mb-3">
                            <label
                                className="form-label"
                                htmlFor="qualifications"
                            >
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
                            <label
                                className="form-label"
                                htmlFor="experience"
                            >
                                Years of Experience *
                            </label>

                            <input
                                id="experience"
                                className="form-control"
                                value={experience}
                                onChange={(event) =>
                                    setExperience(event.target.value)
                                }
                                placeholder="e.g. 3 years"
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label
                                className="form-label"
                                htmlFor="rate"
                            >
                                Service Rate *
                            </label>

                            <input
                                id="rate"
                                className="form-control"
                                value={rate}
                                onChange={(event) =>
                                    setRate(event.target.value)
                                }
                                placeholder="e.g. ₱350 per hour"
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label
                                className="form-label"
                                htmlFor="service_area"
                            >
                                Service Area *
                            </label>

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
                            <label
                                className="form-label"
                                htmlFor="workSamples"
                            >
                                Work Samples
                            </label>

                            <input
                                id="workSamples"
                                type="file"
                                className="form-control"
                                accept="image/jpeg,image/png,image/webp"
                                multiple
                                onChange={(event) =>
                                    setWorkSamples(
                                        Array.from(
                                            event.target.files || []
                                        )
                                    )
                                }
                            />

                            <small className="text-muted">
                                Selected: {workSamples.length} file(s).
                                Work-sample upload is not yet connected to
                                the backend.
                            </small>
                        </div>
                    </>
                )}

                {/* STEP 4: IDENTITY VERIFICATION */}
                {step === 3 && (
                    <>
                        <div className="mb-3">
                            <label
                                className="form-label"
                                htmlFor="id_type"
                            >
                                Valid ID Type *
                            </label>

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
                                    <option value={idType} key={idType}>
                                        {idType}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <p className="text-muted">
                            Use clear images of your own ID. JPG, PNG, or
                            WEBP; maximum 5 MB per image.
                        </p>

                        <div className="row">
                            {[
                                {
                                    side: 'front',
                                    title: 'Front of ID',
                                    file: frontFile,
                                    preview: frontPreview,
                                    uploaded: frontUploaded,
                                },
                                {
                                    side: 'back',
                                    title: 'Back of ID',
                                    file: backFile,
                                    preview: backPreview,
                                    uploaded: backUploaded,
                                },
                            ].map((item) => (
                                <div
                                    className="col-md-6 mb-4"
                                    key={item.side}
                                >
                                    <h5>{item.title}</h5>

                                    <input
                                        className="form-control"
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={(event) =>
                                            chooseIdFile(
                                                event,
                                                item.side
                                            )
                                        }
                                    />

                                    {item.preview && (
                                        <img
                                            className="img-thumbnail mt-3"
                                            src={item.preview}
                                            alt={`${item.side} ID preview`}
                                            style={{
                                                maxHeight: 220,
                                                width: '100%',
                                                objectFit: 'contain',
                                            }}
                                        />
                                    )}

                                    <button
                                        type="button"
                                        className="btn btn-outline-success mt-3"
                                        disabled={
                                            busy ||
                                            !item.file ||
                                            item.uploaded
                                        }
                                        onClick={() =>
                                            uploadId(item.side)
                                        }
                                    >
                                        {item.uploaded
                                            ? 'Uploaded ✓'
                                            : `Upload ${item.side} ID`}
                                    </button>

                                    {item.uploaded && (
                                        <p className="text-success mt-2">
                                            Upload complete
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* STEP 5: REVIEW AND SUBMIT */}
                {step === 4 && (
                    <>
                        <h5>Personal Information</h5>

                        <p>
                            <strong>Name:</strong> {profile.fullName}
                        </p>
                        <p>
                            <strong>Email:</strong> {profile.email}
                        </p>
                        <p>
                            <strong>Mobile:</strong> {profile.mobileNumber}
                        </p>
                        <p>
                            <strong>Gender:</strong> {profile.gender}
                        </p>
                        <p>
                            <strong>Birthday:</strong> {profile.birthday}
                        </p>

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
                            ]
                                .filter(Boolean)
                                .join(', ')}
                        </p>

                        <hr />

                        <h5>Services & Experience</h5>

                        <p>
                            <strong>Services:</strong>{' '}
                            {selectedServices.join(', ') || 'None selected'}
                        </p>

                        <p>
                            <strong>Qualifications:</strong>{' '}
                            {verification.qualifications || 'Not provided'}
                        </p>

                        <p>
                            <strong>Experience:</strong>{' '}
                            {experience || 'Not provided'}
                        </p>

                        <p>
                            <strong>Rate:</strong> {rate || 'Not provided'}
                        </p>

                        <p>
                            <strong>Service Area:</strong>{' '}
                            {verification.service_area || 'Not provided'}
                        </p>

                        <hr />

                        <h5>Identity Verification</h5>

                        <p>
                            <strong>ID type:</strong>{' '}
                            {verification.id_type || 'Not selected'}
                        </p>

                        <p>
                            <strong>Front image:</strong>{' '}
                            {frontUploaded ? 'Uploaded' : 'Not uploaded'}
                        </p>

                        <p>
                            <strong>Back image:</strong>{' '}
                            {backUploaded ? 'Uploaded' : 'Not uploaded'}
                        </p>


                        <div className="provider-declaration">
                            <input
                                id="providerDeclaration"
                                className="form-check-input"
                                type="checkbox"
                                checked={declaration}
                                onChange={(event) =>
                                    setDeclaration(event.target.checked)
                                }
                            />

                            <label htmlFor="providerDeclaration">
                                <strong>Confirmation of Information</strong>
                                <span>
                                    I confirm that the information I provided is accurate
                                    and that I am authorized to submit these details
                                    for verification.
                                </span>
                            </label>
                        </div>


                        <div className="alert alert-warning mt-3">
                            Submitting your application does not
                            automatically verify your account. An admin
                            must review and approve it.
                        </div>
                    </>
                )}

                {/* NAVIGATION BUTTONS */}
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
                            {busy ? 'Saving...' : 'Next'}
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="btn btn-success"
                            onClick={handleSubmit}
                            disabled={
                                busy ||
                                status === 'verified' ||
                                status === 'pending'
                            }
                        >
                            {busy
                                ? 'Submitting...'
                                : status === 'pending'
                                    ? 'Awaiting Admin Review'
                                    : 'Submit for Admin Review'}
                        </button>
                    )}
                </div>
            </div>
        </section>
    );
}