
import { useEffect, useState } from 'react';
import {
    getMyProfile,
    updateMyProfile,
    getProviderVerification,
    updateProviderVerification,
    uploadProviderId,
    submitProviderVerification,
    updateVerifiedProviderServices,
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

function calculateAge(birthday) {
    if (!birthday) return null;
    const birthDate = new Date(`${birthday}T00:00:00`);
    if (Number.isNaN(birthDate.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const birthdayHasPassed =
        today.getMonth() > birthDate.getMonth() ||
        (today.getMonth() === birthDate.getMonth() &&
            today.getDate() >= birthDate.getDate());
    if (!birthdayHasPassed) age -= 1;
    return age >= 0 ? age : null;
}

function todayDateInputValue() {
    const today = new Date();
    const localDate = new Date(
        today.getTime() - today.getTimezoneOffset() * 60_000
    );
    return localDate.toISOString().slice(0, 10);
}

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
    business_name: '',
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
        name: 'Electrician',
        tasks: [
            'Wiring Installation',
            'Outlet and Switch Repair',
            'Lighting Installation',
            'Circuit Breaker Repair',
            'Electrical Troubleshooting',
        ],
    },
    {
        name: 'Plumber',
        tasks: [
            'Leak Repair',
            'Clogged Drain Clearing',
            'Faucet Installation',
            'Pipe Replacement',
            'Toilet Repair',
        ],
    },
    {
        name: 'Aircon Technician',
        tasks: [
            'Aircon Cleaning',
            'Preventive Maintenance',
            'Aircon Installation',
            'Cooling Problem Diagnosis',
            'Aircon Repair',
        ],
    },
    {
        name: 'Carpenter',
        tasks: [
            'Furniture Assembly',
            'Door and Cabinet Repair',
            'Shelf Installation',
            'Woodwork',
            'Custom Furniture Repair',
        ],
    },
    {
        name: 'Pest Control Technician',
        tasks: [
            'Cockroach Control',
            'Ant Control',
            'Termite Treatment',
            'Rodent Control',
            'General Pest Inspection',
        ],
    },
    {
        name: 'Painter',
        tasks: [
            'Interior Painting',
            'Exterior Painting',
            'Wall Repainting',
            'Surface Preparation',
            'Minor Wall Touch-ups',
        ],
    },
    {
        name: 'Appliance Repair Technician',
        tasks: [
            'Washing Machine Repair',
            'Refrigerator Repair',
            'Electric Fan Repair',
            'Microwave Repair',
            'Appliance Troubleshooting',
        ],
    },
    {
        name: 'Locksmith',
        tasks: [
            'Door Lock Repair',
            'Lock Replacement',
            'Key Duplication',
            'Door Lock Installation',
            'Lockout Assistance',
        ],
    },
    {
        name: 'Deep Cleaner',
        tasks: [
            'Deep House Cleaning',
            'Kitchen Cleaning',
            'Bathroom Cleaning',
            'Move-in / Move-out Cleaning',
            'Upholstery Cleaning',
        ],
    },
    {
        name: 'Massage Therapist',
        tasks: [
            'Relaxation Massage',
            'Swedish Massage',
            'Traditional Massage',
            'Full-body Massage',
            'Targeted Muscle Relaxation',
        ],
    },
    {
        name: 'Hair Stylist / Barber',
        tasks: [
            'Haircut',
            'Hair Styling',
            'Hair Coloring',
            'Blow-dry',
            'Beard Trimming',
        ],
    },
    {
        name: 'Nail Technician (Manicurist/Pedicurist)',
        tasks: [
            'Manicure',
            'Pedicure',
            'Nail Cleaning',
            'Nail Polish Application',
            'Basic Nail Art',
        ],
    },
    {
        name: 'Makeup Artist',
        tasks: [
            'Everyday Makeup',
            'Event Makeup',
            'Debut Makeup',
            'Bridal Makeup',
            'Photoshoot Makeup',
        ],
    },
    {
        name: 'Private Nurse / Caregiver',
        tasks: [
            'Elderly Assistance',
            'Personal Care Assistance',
            'Companionship',
            'Daily Living Support',
            'Basic Patient Assistance',
        ],
    },
    {
        name: 'Physical Therapist',
        tasks: [
            'Mobility Exercises',
            'Rehabilitation Sessions',
            'Movement Assessment',
            'Therapeutic Exercise',
            'Recovery Support',
        ],
    },
    {
        name: 'Computer / CCTV Technician',
        tasks: [
            'Computer Troubleshooting',
            'Software Installation',
            'Computer Setup',
            'CCTV Installation',
            'CCTV Troubleshooting',
        ],
    },
    {
        name: 'Private Tutor / Personal Fitness Trainer',
        tasks: [
            'Academic Tutoring',
            'Subject Review',
            'Homework Assistance',
            'Personal Fitness Training',
            'Workout Guidance',
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

export default function ProviderAccountProfile({ onProfileUpdated }) {
    const [step, setStep] = useState(0);
    const [profile, setProfile] = useState(initialProfile);
    const [verification, setVerification] = useState(initialVerification);

    const [selectedServicesByCategory, setSelectedServicesByCategory] = useState({});
    const selectedCategories = Object.keys(selectedServicesByCategory);
    const [experience, setExperience] = useState('');
    const [serviceRatesByCategory, setServiceRatesByCategory] = useState({});
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
    const [addressError, setAddressError] = useState('');
    const [declaration, setDeclaration] = useState(false);

    // Approved provider profile UI.
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isEditingServices, setIsEditingServices] = useState(false);
    const [serviceEditSnapshot, setServiceEditSnapshot] = useState(null);
    const [customServiceInputs, setCustomServiceInputs] = useState({});
    const [savingServices, setSavingServices] = useState(false);
    const [serviceSaveError, setServiceSaveError] = useState('');
    const [serviceSaveMessage, setServiceSaveMessage] = useState('');
    const [photoPreview, setPhotoPreview] = useState('');
    const [photoFileName, setPhotoFileName] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);

    const [regions, setRegions] = useState([]);
    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);
    const [barangays, setBarangays] = useState([]);
    const [locationLoading, setLocationLoading] = useState(false);
    const [locationError, setLocationError] = useState('');

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
                            verificationData?.[key] ??
                            ({
                                region: verificationData?.region_name,
                                province: verificationData?.province_name,
                                city: verificationData?.city_municipality_name,
                                barangay: verificationData?.barangay_name,
                                street: verificationData?.street_address,
                            }[key]) ??
                            previous[key],
                        ])
                    ),
                }));

                setExperience(
                    verificationData?.experience_years == null
                        ? ''
                        : String(verificationData.experience_years)
                );

                const savedServices = verificationData?.services || [];
                if (savedServices.length) {
                    setSelectedServicesByCategory(
                        Object.fromEntries(
                            savedServices.map((service) => [
                                service.category,
                                service.capabilities || [],
                            ])
                        )
                    );
                    setServiceRatesByCategory(
                        Object.fromEntries(
                            savedServices.map((service) => [
                                service.category,
                                Object.fromEntries(
                                    (service.capabilities || []).map((title) => [
                                        title,
                                        service.service_rates?.[title] ??
                                            service.rate ??
                                            verificationData?.hourly_rate ??
                                            '',
                                    ])
                                ),
                            ])
                        )
                    );
                } else if (verificationData?.service_category) {
                    setSelectedServicesByCategory({
                        [verificationData.service_category]:
                            verificationData.service_titles || [],
                    });
                    setServiceRatesByCategory({
                        [verificationData.service_category]: Object.fromEntries(
                            (verificationData.service_titles || []).map((title) => [
                                title,
                                verificationData.hourly_rate ?? '',
                            ])
                        ),
                    });
                } else {
                    setSelectedServicesByCategory({});
                    setServiceRatesByCategory({});
                }

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

    useEffect(() => {
        return () => {
            if (frontPreview) URL.revokeObjectURL(frontPreview);
            if (backPreview) URL.revokeObjectURL(backPreview);
            if (photoPreview) URL.revokeObjectURL(photoPreview);
        };
    }, [frontPreview, backPreview, photoPreview]);


    const changeProfile = (event) => {
        const { name, value } = event.target;

        setProfile((previous) => ({
            ...previous,
            [name]: name === 'mobileNumber'
                ? value.replace(/\D/g, '').slice(0, 11)
                : value,
        }));
    };

    const changeVerification = (event) => {
        const { name, value } = event.target;

        setAddressError('');
        setVerification((previous) => ({
            ...previous,
            [name]: name === 'postal_code' ? value.replace(/\D/g, '').slice(0, 4) : value,
        }));
    };


    const handleProfilePhotoChange = (event) => {
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

        setError('');
        setMessage('');

        const reader = new FileReader();

        reader.onload = () => {
            const imageData = reader.result;

            setPhotoPreview(imageData);
            setPhotoFileName(file.name);
            setIsEditingProfile(true);

            setProfile((previous) => ({
                ...previous,
                profilePicture: imageData,
            }));
        };

        reader.onerror = () => {
            setError('Unable to read the selected profile photo.');
        };

        reader.readAsDataURL(file);
    };



    const handleSaveProfile = async () => {
        setSavingProfile(true);
        setError('');
        setMessage('');

        try {
            const updatedProfile = await updateMyProfile({
                fullName: profile.fullName,
                mobileNumber: profile.mobileNumber,
                gender: profile.gender,
                birthday: profile.birthday,
                address: profile.address,
                profilePicture: profile.profilePicture || null,
            });

            setProfile((previous) => ({
                ...previous,
                ...updatedProfile,
                birthday: updatedProfile.birthday
                    ? String(updatedProfile.birthday).slice(0, 10)
                    : '',
            }));
            onProfileUpdated?.(updatedProfile);

            setPhotoPreview('');
            setPhotoFileName('');
            setIsEditingProfile(false);
            setMessage('Your profile and profile picture have been updated.');
        } catch (err) {
            setError(err.message || 'Unable to update your profile.');
        } finally {
            setSavingProfile(false);
        }
    };


    const toggleCategory = (categoryName) => {
        if (Object.hasOwn(selectedServicesByCategory, categoryName)) {
            setSelectedServicesByCategory((previous) => {
                const next = { ...previous };
                delete next[categoryName];
                return next;
            });
            setServiceRatesByCategory((previous) => {
                const next = { ...previous };
                delete next[categoryName];
                return next;
            });
            return;
        }
        setSelectedServicesByCategory((previous) => ({
            ...previous,
            [categoryName]: [],
        }));
    };

    const toggleService = (categoryName, service) => {
        const selectedServices = selectedServicesByCategory[categoryName] || [];
        const isSelected = selectedServices.includes(service);
        setSelectedServicesByCategory((previous) => ({
            ...previous,
            [categoryName]: isSelected
                ? selectedServices.filter((item) => item !== service)
                : [...selectedServices, service],
        }));
        if (isSelected) {
            setServiceRatesByCategory((previous) => {
                const categoryRates = { ...(previous[categoryName] || {}) };
                delete categoryRates[service];
                return { ...previous, [categoryName]: categoryRates };
            });
        }
    };

    const changeServiceRate = (categoryName, service, value) => {
        setServiceRatesByCategory((previous) => ({
            ...previous,
            [categoryName]: {
                ...(previous[categoryName] || {}),
                [service]: value.replace(/[^\d.]/g, ''),
            },
        }));
    };

    const handleNextStep = () => {
        setError('');
        setMessage('');

        if (step === 0) {
            if (!/^09\d{9}$/.test(profile.mobileNumber || '')) {
                setError('Enter an 11-digit mobile number starting with 09.');
                return;
            }
            if (!profile.gender || !profile.birthday) {
                setError('Please select your gender and birthday before continuing.');
                return;
            }
        }

        if (step === 1) {
            const requiredAddressFields = [
                verification.region,
                verification.province,
                verification.city,
                verification.barangay,
            ];
            if (requiredAddressFields.some((value) => !value?.trim())) {
                setAddressError('Complete the region, province, city / municipality, and barangay fields.');
                return;
            }
            if (verification.postal_code && !/^\d{4}$/.test(verification.postal_code)) {
                setAddressError('Enter a valid 4-digit postal code.');
                return;
            }
            setAddressError('');
        }

        if (step === 2) {
            if (
                !verification.business_name.trim() ||
                experience === '' ||
                !verification.service_area.trim()
            ) {
                setError('Enter your business name, years of experience, and service area.');
                return;
            }

            const selectedTasks = selectedCategories.flatMap((category) =>
                selectedServicesByCategory[category] || []
            );
            if (!selectedTasks.length) {
                setError('Select at least one specific service you can provide.');
                return;
            }

            const missingPrice = selectedCategories.some((category) =>
                (selectedServicesByCategory[category] || []).some((service) => {
                    const value = serviceRatesByCategory[category]?.[service];
                    return value === undefined || value === '' || !Number.isFinite(Number(value));
                })
            );
            if (missingPrice) {
                setError('Enter a price for every specific service you selected.');
                return;
            }
        }

        if (step === 3 && !verification.id_type) {
            setError('Select the type of valid ID you will submit.');
            return;
        }

        setStep((current) => Math.min(steps.length - 1, current + 1));
    };

    const handleFileChange = (event, side) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Please choose an image file.');
            event.target.value = '';
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('Image files must be 5 MB or smaller.');
            event.target.value = '';
            return;
        }

        setError('');

        if (side === 'front') {
            setFrontFile(file);
            setFrontPreview((previous) => {
                if (previous) URL.revokeObjectURL(previous);
                return URL.createObjectURL(file);
            });
            setFrontUploaded(false);
        } else {
            setBackFile(file);
            setBackPreview((previous) => {
                if (previous) URL.revokeObjectURL(previous);
                return URL.createObjectURL(file);
            });
            setBackUploaded(false);
        }
    };

    const uploadIdSide = async (side) => {
        const file = side === 'front' ? frontFile : backFile;

        if (!file) {
            setError(`Please select the ${side} side of your ID first.`);
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

            setMessage(`${side === 'front' ? 'Front' : 'Back'} ID uploaded successfully.`);
        } catch (err) {
            setError(err.message || 'Unable to upload your ID.');
        } finally {
            setBusy(false);
        }
    };

    const startServiceEdit = () => {
        setServiceEditSnapshot({
            services: Object.fromEntries(
                Object.entries(selectedServicesByCategory).map(([category, titles]) => [
                    category,
                    [...titles],
                ])
            ),
            rates: Object.fromEntries(
                Object.entries(serviceRatesByCategory).map(([category, rates]) => [
                    category,
                    { ...rates },
                ])
            ),
        });
        setCustomServiceInputs({});
        setIsEditingServices(true);
        setServiceSaveError('');
        setServiceSaveMessage('');
        setError('');
        setMessage('');
    };

    const cancelServiceEdit = () => {
        if (serviceEditSnapshot) {
            setSelectedServicesByCategory(serviceEditSnapshot.services);
            setServiceRatesByCategory(serviceEditSnapshot.rates);
        }
        setCustomServiceInputs({});
        setServiceEditSnapshot(null);
        setIsEditingServices(false);
        setServiceSaveError('');
        setServiceSaveMessage('');
        setError('');
        setMessage('');
    };

    const saveServices = async () => {
        const services = selectedCategories
            .map((category) => ({
                category,
                service_titles: selectedServicesByCategory[category] || [],
                service_rates: Object.fromEntries(
                    (selectedServicesByCategory[category] || []).map((title) => [
                        title,
                        serviceRatesByCategory[category]?.[title],
                    ])
                ),
            }))
            .filter((selection) => selection.service_titles.length);

        if (!services.length) {
            setServiceSaveError('Keep at least one service on your profile.');
            return;
        }

        const missingPrice = services.some((selection) =>
            selection.service_titles.some((title) => {
                const price = selection.service_rates[title];
                return price === '' || price === undefined || !Number.isFinite(Number(price)) || Number(price) < 0;
            })
        );
        if (missingPrice) {
            setServiceSaveError('Enter a valid price for every service you offer.');
            return;
        }

        const savedServices = services.map((selection) => ({
            ...selection,
            service_rates: Object.fromEntries(
                Object.entries(selection.service_rates).map(([title, price]) => [
                    title,
                    Number(price),
                ])
            ),
        }));

        setSavingServices(true);
        setServiceSaveError('');
        setServiceSaveMessage('');
        setError('');
        setMessage('');
        try {
            const result = await updateVerifiedProviderServices(savedServices);
            const persistedServices = result.services || savedServices.map((selection) => ({
                category: selection.category,
                capabilities: selection.service_titles,
                service_rates: selection.service_rates,
            }));
            setSelectedServicesByCategory(Object.fromEntries(
                persistedServices.map((selection) => [
                    selection.category,
                    selection.capabilities || [],
                ])
            ));
            setServiceRatesByCategory(Object.fromEntries(
                persistedServices.map((selection) => [
                    selection.category,
                    selection.service_rates || {},
                ])
            ));
            setIsEditingServices(false);
            setServiceEditSnapshot(null);
            setServiceSaveMessage(result.message || 'Your services have been updated successfully.');
            onProfileUpdated?.({
                services: persistedServices.map((selection) => ({
                    category: selection.category,
                    capabilities: selection.capabilities || [],
                    service_rates: selection.service_rates,
                })),
            });
        } catch (err) {
            setServiceSaveError(err.message || 'Unable to update your services.');
        } finally {
            setSavingServices(false);
        }
    };

    const addCustomService = (category) => {
        const title = (customServiceInputs[category] || '').trim();
        if (!title) return;

        if ((selectedServicesByCategory[category] || []).some(
            (service) => service.toLowerCase() === title.toLowerCase()
        )) {
            setError('That service is already in your list.');
            return;
        }

        toggleService(category, title);
        setCustomServiceInputs((previous) => ({ ...previous, [category]: '' }));
        setError('');
    };

    const saveApplication = async () => {
        setBusy(true);
        setError('');
        setMessage('');

        try {
            const serviceSelections = selectedCategories
                .map((category) => ({
                    category,
                    service_titles: selectedServicesByCategory[category] || [],
                    service_rates: Object.fromEntries(
                        Object.entries(serviceRatesByCategory[category] || {})
                            .filter(([, value]) => value !== '')
                            .map(([title, value]) => [title, Number(value)])
                    ),
                }))
                .filter((selection) => selection.service_titles.length);

            const address = [
                verification.street,
                verification.barangay,
                verification.city,
                verification.province,
                verification.region,
                verification.postal_code,
            ].filter(Boolean).join(', ');

            await updateMyProfile({
                fullName: profile.fullName,
                mobileNumber: profile.mobileNumber,
                gender: profile.gender,
                birthday: profile.birthday,
                address: address || profile.address,
                profilePicture: profile.profilePicture || null,
            });

            await updateProviderVerification({
                ...verification,

                // Address fields expected by the backend
                region_name: verification.region,
                province_name: verification.province,
                city_municipality_name: verification.city,
                barangay_name: verification.barangay,
                street_address: verification.street,

                service_category: serviceSelections[0]?.category || null,
                service_categories: selectedCategories,
                service_titles: serviceSelections[0]?.service_titles || [],
                services: serviceSelections,
                experience_years: experience ? Number(experience) : null,
                work_samples: workSamples,
            });

            onProfileUpdated?.({
                fullName: profile.fullName,
                profilePicture: profile.profilePicture,
                services: serviceSelections.map((selection) => ({
                    category: selection.category,
                    capabilities: selection.service_titles,
                    service_rates: selection.service_rates,
                })),
            });

            await submitProviderVerification();
            setStatus('pending');
            setMessage(
                'Your provider application has been submitted for review.'
            );
        } catch (err) {
            setError(err.message || 'Unable to save your application.');
        } finally {
            setBusy(false);
        }
    };

    const detail = (label, value) => (
        <div className="profile-detail-item" key={label}>
            <span>{label}</span>
            <strong>{value || 'Not provided'}</strong>
        </div>
    );
    const editableServiceCategories = [
        ...serviceCategories,
        ...selectedCategories
            .filter((category) => !serviceCategories.some((item) => item.name === category))
            .map((name) => ({ name, tasks: [] })),
    ];

    if (loading) {
        return (
            <section className="provider-profile-page">
                <div className="provider-application-card">
                    <p>Loading your provider profile...</p>
                </div>
            </section>
        );
    }


    if (status === 'verified') {
        const serviceLocation = [
            verification.street,
            verification.barangay,
            verification.city,
            verification.province,
            verification.region,
            verification.postal_code,
        ].filter(Boolean).join(', ');

        const profilePhoto = photoPreview || profile.profilePicture || '';

        return (
            <section className="provider-profile-page verified-profile-page">
                {error && <div className="alert alert-danger" role="alert">{error}</div>}
                {message && <div className="alert alert-success" role="status">{message}</div>}

                <header className="provider-profile-title-row">
                    <div>
                        <h1>My Profile</h1>
                        <p>Manage your personal information, service details, and account settings.</p>
                    </div>
                    <div className="provider-profile-breadcrumb">
                        <span>Home</span><span>›</span><strong>Profile</strong>
                    </div>
                </header>

                <section className="provider-profile-hero">
                    <div className="provider-profile-hero-avatar">
                        {profilePhoto
                            ? <img src={profilePhoto} alt="Provider profile" />
                            : <span>{profile.fullName?.charAt(0)?.toUpperCase() || 'P'}</span>}

                        <label className="provider-avatar-camera" title="Change profile photo">
                            <i className="bi bi-camera-fill" />
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleProfilePhotoChange}
                                aria-label="Change profile photo"
                            />
                        </label>
                    </div>

                    <div className="provider-profile-hero-details">
                        <div className="provider-profile-name-row">
                            <h2>{profile.fullName || 'Service Provider'}</h2>
                            <span className="provider-role-pill">Provider</span>
                        </div>

                        <p className="provider-profile-tagline">
                            Reliable home service provider ready to help you.
                        </p>

                        <div className="provider-profile-contact-row">
                            {profile.mobileNumber && (
                                <span><i className="bi bi-telephone-fill" /> {profile.mobileNumber}</span>
                            )}
                            {profile.email && (
                                <span><i className="bi bi-envelope-fill" /> {profile.email}</span>
                            )}
                            {(profile.address || serviceLocation) && (
                                <span><i className="bi bi-geo-alt-fill" /> {profile.address || serviceLocation}</span>
                            )}
                        </div>
                    </div>

                    <div className="provider-profile-hero-status">
                        <span><i className="bi bi-patch-check-fill" /> Verified Provider</span>
                        <small>Your account has been verified.</small>
                    </div>
                </section>

                <nav className="provider-profile-tabs" aria-label="Profile sections">
                    <button
                        type="button"
                        className="active"
                        onClick={() => document.getElementById('provider-personal-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    >
                        <i className="bi bi-person-fill" /> Personal Information
                    </button>
                    <button
                        type="button"
                        onClick={() => document.getElementById('provider-service-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    >
                        <i className="bi bi-briefcase-fill" /> Service Information
                    </button>
                    <button
                        type="button"
                        onClick={() => document.getElementById('provider-security-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    >
                        <i className="bi bi-lock-fill" /> Account Security
                    </button>
                </nav>

                <div className="provider-profile-content-grid">
                    <div className="provider-profile-main-column">
                        <section id="provider-personal-panel" className="provider-profile-panel">
                            <div className="provider-panel-heading">
                                <i className="bi bi-person provider-heading-icon" />
                                <div>
                                    <h3>Personal Information</h3>
                                    <p>Update your personal details and contact information.</p>
                                </div>
                                <button
                                    type="button"
                                    className="provider-edit-details-button"
                                    onClick={() => {
                                        setIsEditingProfile(current => !current);
                                        setError('');
                                        setMessage('');
                                    }}
                                >
                                    <i className={`bi ${isEditingProfile ? 'bi-x-lg' : 'bi-pencil-fill'}`} />
                                    {isEditingProfile ? 'Cancel Edit' : 'Edit Details'}
                                </button>
                            </div>

                            {isEditingProfile ? (
                                <div className="provider-profile-form-grid">
                                    <div>
                                        <label className="form-label" htmlFor="approved-fullName">Full Name <b>*</b></label>
                                        <input id="approved-fullName" className="form-control" value={profile.fullName || ''} readOnly />
                                    </div>
                                    <div>
                                        <label className="form-label" htmlFor="approved-email">Email Address <b>*</b></label>
                                        <input id="approved-email" className="form-control" value={profile.email || ''} readOnly />
                                    </div>
                                    <div>
                                        <label className="form-label" htmlFor="approved-mobile">Phone Number <b>*</b></label>
                                        <input
                                            id="approved-mobile"
                                            className="form-control"
                                            type="tel"
                                            inputMode="numeric"
                                            maxLength={11}
                                            pattern="09[0-9]{9}"
                                            placeholder="09XXXXXXXXX"
                                            name="mobileNumber"
                                            value={profile.mobileNumber || ''}
                                            onChange={changeProfile}
                                        />
                                        <small className="provider-field-hint">Exactly 11 digits, starting with 09.</small>
                                    </div>
                                    <div>
                                        <label className="form-label" htmlFor="approved-birthday">Date of Birth</label>
                                        <input
                                            id="approved-birthday"
                                            type="date"
                                            className="form-control"
                                            name="birthday"
                                            max={todayDateInputValue()}
                                            value={profile.birthday || ''}
                                            onChange={changeProfile}
                                        />
                                        <small className="provider-field-hint">
                                            {calculateAge(profile.birthday) === null
                                                ? 'Age will appear after selecting your birthday.'
                                                : `Age: ${calculateAge(profile.birthday)} years old`}
                                        </small>
                                    </div>
                                    <div>
                                        <label className="form-label" htmlFor="approved-gender">Gender</label>
                                        <select
                                            id="approved-gender"
                                            className="form-select"
                                            name="gender"
                                            value={profile.gender || ''}
                                            onChange={changeProfile}
                                        >
                                            <option value="">Select gender</option>
                                            <option value="Female">Female</option>
                                            <option value="Male">Male</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="form-label" htmlFor="approved-address">Address <b>*</b></label>
                                        <input
                                            id="approved-address"
                                            className="form-control"
                                            name="address"
                                            value={profile.address || ''}
                                            onChange={changeProfile}
                                        />
                                    </div>
                                    <div className="provider-profile-form-actions">
                                        <button
                                            type="button"
                                            className="provider-profile-save-button"
                                            onClick={handleSaveProfile}
                                            disabled={savingProfile}
                                        >
                                            <i className="bi bi-floppy" />
                                            {savingProfile ? 'Saving...' : 'Save Changes'}
                                        </button>
                                        <button
                                            type="button"
                                            className="provider-profile-cancel-button"
                                            onClick={() => setIsEditingProfile(false)}
                                            disabled={savingProfile}
                                        >
                                            <i className="bi bi-x-lg" /> Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="provider-profile-read-grid">
                                    <div><span>Full Name <b>*</b></span><strong>{profile.fullName || 'Not provided'}</strong></div>
                                    <div><span>Email Address <b>*</b></span><strong>{profile.email || 'Not provided'}</strong></div>
                                    <div><span>Phone Number <b>*</b></span><strong>{profile.mobileNumber || 'Not provided'}</strong></div>
                                    <div><span>Date of Birth / Age</span><strong>{profile.birthday ? `${profile.birthday} · ${calculateAge(profile.birthday)} years old` : 'Not provided'}</strong></div>
                                    <div><span>Gender</span><strong>{profile.gender || 'Not provided'}</strong></div>
                                    <div><span>Address <b>*</b></span><strong>{profile.address || serviceLocation || 'Not provided'}</strong></div>
                                </div>
                            )}
                        </section>

                        <section id="provider-service-panel" className="provider-profile-panel">
                            <div className="provider-panel-heading">
                                <i className="bi bi-briefcase provider-heading-icon" />
                                <div>
                                    <h3>Service Information</h3>
                                    <p>Your business details, experience, and service area.</p>
                                </div>
                                <button
                                    type="button"
                                    className="provider-edit-details-button"
                                    onClick={isEditingServices ? cancelServiceEdit : startServiceEdit}
                                    disabled={savingServices}
                                >
                                    <i className={`bi ${isEditingServices ? 'bi-x-lg' : 'bi-pencil-fill'}`} />
                                    {isEditingServices ? 'Cancel Edit' : 'Edit Services'}
                                </button>
                            </div>
                            {serviceSaveError && (
                                <div className="alert alert-danger" role="alert">
                                    {serviceSaveError}
                                </div>
                            )}
                            {serviceSaveMessage && (
                                <div className="alert alert-success" role="status">
                                    {serviceSaveMessage}
                                </div>
                            )}
                            {isEditingServices ? (
                                <div className="provider-service-editor">
                                    <p className="provider-service-editor-hint">
                                        Select the services you offer, set each price, or add a custom service.
                                    </p>
                                    <div className="provider-service-category-options">
                                        {editableServiceCategories.map((category) => (
                                            <label className="provider-service-category-option" key={category.name}>
                                                <input
                                                    type="checkbox"
                                                    checked={Object.hasOwn(selectedServicesByCategory, category.name)}
                                                    onChange={() => toggleCategory(category.name)}
                                                    disabled={savingServices}
                                                />
                                                <span>{category.name}</span>
                                            </label>
                                        ))}
                                    </div>

                                    {selectedCategories.map((categoryName) => {
                                        const category = editableServiceCategories.find(
                                            (item) => item.name === categoryName
                                        );
                                        const services = [
                                            ...(category?.tasks || []),
                                            ...(selectedServicesByCategory[categoryName] || [])
                                                .filter((title) => !(category?.tasks || []).includes(title)),
                                        ];

                                        return (
                                            <div className="provider-service-task-selection" key={categoryName}>
                                                <strong className="provider-service-editor-category">
                                                    {categoryName} — services offered
                                                </strong>
                                                <div className="provider-service-task-grid">
                                                    {services.map((service, index) => {
                                                        const inputId = `profile-service-${categoryName}-${index}`.replace(/[^a-zA-Z0-9-]/g, '-');
                                                        const isSelected = selectedServicesByCategory[categoryName]?.includes(service) || false;
                                                        return (
                                                            <div className={`provider-service-task-option${isSelected ? ' selected' : ''}`} key={service}>
                                                                <label htmlFor={inputId}>
                                                                    <input
                                                                        id={inputId}
                                                                        type="checkbox"
                                                                        checked={isSelected}
                                                                        onChange={() => toggleService(categoryName, service)}
                                                                        disabled={savingServices}
                                                                    />
                                                                    <span>{service}</span>
                                                                </label>
                                                                {isSelected && (
                                                                    <div className="provider-service-price">
                                                                        <span>₱</span>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            step="1"
                                                                            inputMode="decimal"
                                                                            placeholder="Price"
                                                                            aria-label={`Price for ${service}`}
                                                                            value={serviceRatesByCategory[categoryName]?.[service] ?? ''}
                                                                            onChange={(event) => changeServiceRate(categoryName, service, event.target.value)}
                                                                            disabled={savingServices}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <div className="provider-add-service-row">
                                                    <input
                                                        className="form-control"
                                                        maxLength={150}
                                                        placeholder="Enter another service"
                                                        aria-label={`Add a service to ${categoryName}`}
                                                        value={customServiceInputs[categoryName] || ''}
                                                        disabled={savingServices}
                                                        onChange={(event) => setCustomServiceInputs((previous) => ({
                                                            ...previous,
                                                            [categoryName]: event.target.value,
                                                        }))}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="provider-add-service-button"
                                                        onClick={() => addCustomService(categoryName)}
                                                        disabled={savingServices}
                                                    >
                                                        Add Service
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    <div className="provider-service-edit-actions">
                                        <button
                                            type="button"
                                            className="provider-profile-cancel-button"
                                            onClick={cancelServiceEdit}
                                            disabled={savingServices}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            className="provider-profile-save-button"
                                            onClick={saveServices}
                                            disabled={savingServices}
                                        >
                                            {savingServices ? 'Saving...' : 'Save Services'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="provider-profile-read-grid">
                                    <div><span>Business Name</span><strong>{verification.business_name || profile.fullName || 'Not provided'}</strong></div>
                                    <div><span>Service Categories</span><strong>{selectedCategories.join(', ') || 'Not provided'}</strong></div>
                                    <div><span>Experience</span><strong>{experience ? `${experience} years` : 'Not provided'}</strong></div>
                                    <div className="provider-profile-wide-field">
                                        <span>Prices per Specific Service</span>
                                        <strong>
                                            {selectedCategories.flatMap((category) =>
                                                (selectedServicesByCategory[category] || []).map((service) => {
                                                    const price = serviceRatesByCategory[category]?.[service];
                                                    return `${service}: ${price === undefined || price === '' ? 'Not provided' : `₱${price}`}`;
                                                })
                                            ).join(' · ') || 'Not provided'}
                                        </strong>
                                    </div>
                                    <div><span>Service Location</span><strong>{serviceLocation || 'Not provided'}</strong></div>
                                    <div><span>Service Area</span><strong>{verification.service_area || 'Not provided'}</strong></div>
                                    <div className="provider-profile-wide-field">
                                        <span>Qualifications / Certifications</span>
                                        <strong>{verification.qualifications || 'Not provided'}</strong>
                                    </div>
                                </div>
                            )}
                        </section>

                        <section id="provider-security-panel" className="provider-profile-panel">
                            <div className="provider-panel-heading">
                                <i className="bi bi-shield-lock provider-heading-icon" />
                                <div>
                                    <h3>Account Security</h3>
                                    <p>Your provider account verification status.</p>
                                </div>
                            </div>
                            <div className="provider-security-status-box">
                                <i className="bi bi-check-circle-fill" />
                                <div>
                                    <strong>Verified Provider</strong>
                                    <span>Your account has been verified.</span>
                                </div>
                            </div>
                        </section>
                    </div>

                    <aside className="provider-profile-side-column">
                        <section className="provider-profile-side-card">
                            <h3><i className="bi bi-image" /> Profile Picture</h3>

                            <div className="provider-profile-photo-preview">
                                {profilePhoto
                                    ? <img src={profilePhoto} alt="Profile preview" />
                                    : <span>{profile.fullName?.charAt(0)?.toUpperCase() || 'P'}</span>}
                                <span className="provider-photo-camera-small"><i className="bi bi-camera-fill" /></span>
                            </div>

                            <p>Upload a clear profile picture<br />(Recommended: 1:1 ratio, max 5MB)</p>

                            <div className="provider-profile-photo-actions">
                                <label className="provider-upload-photo-button">
                                    <i className="bi bi-upload" /> Upload Photo
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleProfilePhotoChange}
                                    />
                                </label>
                                <button
                                    type="button"
                                    className="provider-remove-photo-button"
                                    onClick={() => {
                                        setPhotoPreview('');
                                        setPhotoFileName('');
                                        setProfile(previous => ({ ...previous, profilePicture: '' }));
                                    }}
                                    disabled={!photoPreview && !profile.profilePicture}
                                >
                                    <i className="bi bi-trash3" /> Remove
                                </button>
                            </div>
                            <small className="provider-photo-disclaimer">
                                Photo changes are preview-only unless the existing API supports profile photo uploads.
                            </small>
                        </section>

                        <section className="provider-profile-side-card">
                            <h3><i className="bi bi-shield-fill-check" /> Account Status</h3>
                            <div className="provider-account-status-content">
                                <i className="bi bi-check-circle-fill" />
                                <div>
                                    <strong>Verified Provider</strong>
                                    <span>Your account has been verified.</span>
                                </div>
                            </div>
                        </section>
                    </aside>
                </div>
            </section>
        );
    }



    return (
        <section className="provider-profile-page">
            <div className="provider-application-heading">
                <span>SMART HOME SERVICES</span>
                <h2>Provider Verification</h2>
                <p>Complete your information to become a verified service provider.</p>
            </div>

            {error && <div className="alert alert-danger" role="alert">{error}</div>}
            {message && <div className="alert alert-success" role="status">{message}</div>}

            {status === 'pending' ? (
                <div className="provider-application-card">
                    <h3>Application Under Review</h3>
                    <p>Your provider application has been submitted and is awaiting review.</p>
                    <p>You will be able to manage your provider profile after approval.</p>
                </div>
            ) : status === 'rejected' ? (
                <div className="provider-application-card">
                    <h3>Application Needs Attention</h3>
                    <p>Your application was not approved. Please review your information and resubmit if the system allows it.</p>
                </div>
            ) : (
                <>
                    <div className="provider-step-progress">
                        {steps.map((label, index) => (
                            <div
                                key={label}
                                className={`provider-step ${step === index
                                    ? 'active'
                                    : step > index
                                        ? 'completed'
                                        : ''
                                    }`}
                            >
                                <span>{step > index ? '✓' : index + 1}</span>
                                <small>{label}</small>
                            </div>
                        ))}
                    </div>

                    <div className="provider-application-card">
                        {step === 0 && (
                            <>
                                <h3>Personal Information</h3>

                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Full Name</label>
                                        <input className="form-control" value={profile.fullName || ''} readOnly />
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Email</label>
                                        <input className="form-control" value={profile.email || ''} readOnly />
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Mobile Number</label>
                                        <input
                                            className="form-control"
                                            type="tel"
                                            inputMode="numeric"
                                            maxLength={11}
                                            pattern="09[0-9]{9}"
                                            placeholder="09XXXXXXXXX"
                                            name="mobileNumber"
                                            value={profile.mobileNumber || ''}
                                            onChange={changeProfile}
                                        />
                                        <small className="provider-field-hint">Enter exactly 11 digits, starting with 09.</small>
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Gender</label>
                                        <select
                                            className="form-select"
                                            name="gender"
                                            value={profile.gender || ''}
                                            onChange={changeProfile}
                                        >
                                            <option value="">Select gender</option>
                                            <option value="Female">Female</option>
                                            <option value="Male">Male</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Birthday</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            name="birthday"
                                            max={todayDateInputValue()}
                                            value={profile.birthday || ''}
                                            onChange={changeProfile}
                                        />
                                        <small className="provider-field-hint">
                                            {calculateAge(profile.birthday) === null
                                                ? 'Your age will appear here after you select your birthday.'
                                                : `Age: ${calculateAge(profile.birthday)} years old`}
                                        </small>
                                    </div>
                                </div>
                            </>
                        )}

                        {step === 1 && (
                            <>
                                <h3>Complete Address</h3>

                                {locationError && (
                                    <div className="alert alert-warning">{locationError}</div>
                                )}

                                <div className="mb-3">
                                    <label className="form-label">Region</label>
                                    <select
                                        className="form-select"
                                        name="region"
                                        value={verification.region}
                                        onChange={(event) => {
                                            changeVerification(event);
                                            setAddressError('');
                                            setVerification((previous) => ({
                                                ...previous,
                                                region: event.target.value,
                                                province: '',
                                                city: '',
                                                barangay: '',
                                                postal_code: '',
                                            }));
                                        }}
                                    >
                                        <option value="">Select region</option>
                                        {regions.map((item) => (
                                            <option key={getLocationCode(item)} value={item.name}>
                                                {item.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Province</label>
                                    <select
                                        className="form-select"
                                        name="province"
                                        value={verification.province}
                                        onChange={(event) => {
                                            const value = event.target.value;
                                            setAddressError('');
                                            setVerification((previous) => ({
                                                ...previous,
                                                province: value,
                                                city: '',
                                                barangay: '',
                                                postal_code: '',
                                            }));
                                        }}
                                        disabled={!verification.region || locationLoading}
                                    >
                                        <option value="">Select province</option>
                                        {provinces.map((item) => (
                                            <option key={getLocationCode(item)} value={item.name}>
                                                {item.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">City / Municipality</label>
                                    <select
                                        className="form-select"
                                        name="city"
                                        value={verification.city}
                                        onChange={(event) => {
                                            const value = event.target.value;
                                            setAddressError('');
                                            setVerification((previous) => ({
                                                ...previous,
                                                city: value,
                                                barangay: '',
                                                postal_code: '',
                                            }));
                                        }}
                                        disabled={!verification.province || locationLoading}
                                    >
                                        <option value="">Select city / municipality</option>
                                        {cities.map((item) => (
                                            <option key={getLocationCode(item)} value={item.name}>
                                                {item.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Barangay</label>
                                    <select
                                        className="form-select"
                                        name="barangay"
                                        value={verification.barangay}
                                        onChange={changeVerification}
                                        disabled={!verification.city || locationLoading}
                                    >
                                        <option value="">Select barangay</option>
                                        {barangays.map((item) => (
                                            <option key={getLocationCode(item)} value={item.name}>
                                                {item.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Street / House Number (optional)</label>
                                    <input
                                        className="form-control"
                                        name="street"
                                        value={verification.street}
                                        onChange={changeVerification}
                                    />
                                    {addressError && (
                                        <div className="invalid-feedback d-block" role="alert">
                                            {addressError}
                                        </div>
                                    )}
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Postal Code</label>
                                    <input
                                        className="form-control"
                                        name="postal_code"
                                        inputMode="numeric"
                                        maxLength={4}
                                        value={verification.postal_code}
                                        onChange={changeVerification}
                                    />
                                    <small className="provider-field-hint">
                                        Enter the correct 4-digit postal code for your address.
                                    </small>
                                </div>
                            </>
                        )}

                        {step === 2 && (
                            <>
                                <h3>Services &amp; Experience</h3>

                                <div className="mb-3">
                                    <label className="form-label">Business Name</label>
                                    <input
                                        className="form-control"
                                        name="business_name"
                                        value={verification.business_name}
                                        onChange={changeVerification}
                                    />
                                </div>

                                <div className="mb-3 provider-service-selection">
                                    <label className="form-label">Service Categories</label>
                                    <p>Select every type of work you can provide.</p>
                                    <div className="provider-service-category-options">
                                        {serviceCategories.map((category) => (
                                            <label className="provider-service-category-option" key={category.name}>
                                                <input
                                                    type="checkbox"
                                                    checked={Object.hasOwn(selectedServicesByCategory, category.name)}
                                                    onChange={() => toggleCategory(category.name)}
                                                />
                                                <span>{category.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {selectedCategories.map((categoryName) => {
                                    const category = serviceCategories.find(
                                        (item) => item.name === categoryName
                                    );
                                    if (!category) return null;

                                    return (
                                        <div className="mb-3 provider-service-task-selection" key={categoryName}>
                                            <label className="form-label">{categoryName} — specific services</label>
                                            <div className="provider-service-task-grid">
                                                {category.tasks.map((service, index) => {
                                                    const inputId = `service-${categoryName}-${index}`.replace(/[^a-zA-Z0-9-]/g, '-');
                                                    const isSelected = selectedServicesByCategory[categoryName].includes(service);
                                                    return (
                                                        <div className={`provider-service-task-option${isSelected ? ' selected' : ''}`} key={service}>
                                                            <label htmlFor={inputId}>
                                                                <input
                                                                    id={inputId}
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={() => toggleService(categoryName, service)}
                                                                />
                                                                <span>{service}</span>
                                                            </label>
                                                            {isSelected && (
                                                                <div className="provider-service-price">
                                                                    <span>₱</span>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        step="1"
                                                                        inputMode="decimal"
                                                                        placeholder="Price"
                                                                        aria-label={`Price for ${service}`}
                                                                        value={serviceRatesByCategory[categoryName]?.[service] ?? ''}
                                                                        onChange={(event) => changeServiceRate(categoryName, service, event.target.value)}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}

                                <div className="mb-3">
                                    <label className="form-label">Years of Experience</label>
                                    <input
                                        className="form-control"
                                        type="number"
                                        min="0"
                                        value={experience}
                                        onChange={(event) => setExperience(event.target.value)}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Service Area</label>
                                    <textarea
                                        className="form-control"
                                        name="service_area"
                                        rows="3"
                                        value={verification.service_area}
                                        onChange={changeVerification}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Qualifications / Certifications</label>
                                    <textarea
                                        className="form-control"
                                        name="qualifications"
                                        rows="3"
                                        value={verification.qualifications}
                                        onChange={changeVerification}
                                    />
                                </div>
                            </>
                        )}

                        {step === 3 && (
                            <>
                                <h3>Identity Verification</h3>

                                <div className="mb-3">
                                    <label className="form-label">Valid ID Type</label>
                                    <select
                                        className="form-select"
                                        name="id_type"
                                        value={verification.id_type}
                                        onChange={changeVerification}
                                    >
                                        <option value="">Select ID type</option>
                                        {idTypes.map((idType) => (
                                            <option key={idType} value={idType}>{idType}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Front of ID</label>
                                        <input
                                            className="form-control"
                                            type="file"
                                            accept="image/*"
                                            onChange={(event) => handleFileChange(event, 'front')}
                                        />

                                        {frontPreview && (
                                            <div className="id-preview mt-3">
                                                <img src={frontPreview} alt="Front of ID preview" />
                                            </div>
                                        )}

                                        <button
                                            type="button"
                                            className="btn btn-outline-success mt-3"
                                            onClick={() => uploadIdSide('front')}
                                            disabled={busy || !frontFile || frontUploaded}
                                        >
                                            {frontUploaded ? 'Front ID Uploaded' : 'Upload Front ID'}
                                        </button>
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Back of ID</label>
                                        <input
                                            className="form-control"
                                            type="file"
                                            accept="image/*"
                                            onChange={(event) => handleFileChange(event, 'back')}
                                        />

                                        {backPreview && (
                                            <div className="id-preview mt-3">
                                                <img src={backPreview} alt="Back of ID preview" />
                                            </div>
                                        )}

                                        <button
                                            type="button"
                                            className="btn btn-outline-success mt-3"
                                            onClick={() => uploadIdSide('back')}
                                            disabled={busy || !backFile || backUploaded}
                                        >
                                            {backUploaded ? 'Back ID Uploaded' : 'Upload Back ID'}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {step === 4 && (
                            <>
                                <h3>Review &amp; Submit</h3>
                                <p>Review your information before submitting your provider application.</p>

                                <hr />

                                <h5>Personal Information</h5>
                                <p><strong>Name:</strong> {profile.fullName || 'Not provided'}</p>
                                <p><strong>Email:</strong> {profile.email || 'Not provided'}</p>
                                <p><strong>Mobile:</strong> {profile.mobileNumber || 'Not provided'}</p>

                                <hr />

                                <h5>Business Information</h5>
                                <p><strong>Business:</strong> {verification.business_name || 'Not provided'}</p>
                                <p><strong>Categories:</strong> {selectedCategories.join(', ') || 'Not selected'}</p>
                                <div className="provider-review-services">
                                    <strong>Specific services and prices:</strong>
                                    {selectedCategories.flatMap((category) =>
                                        (selectedServicesByCategory[category] || []).map((service) => (
                                            <span key={`${category}-${service}`}>
                                                {category} · {service} · ₱{serviceRatesByCategory[category]?.[service] ?? ''}
                                            </span>
                                        ))
                                    )}
                                    {!selectedCategories.some((category) =>
                                        (selectedServicesByCategory[category] || []).length
                                    ) && <span>Not selected</span>}
                                </div>
                                <p><strong>Experience:</strong> {experience ? `${experience} years` : 'Not provided'}</p>
                                <p><strong>Address:</strong> {[
                                    verification.street,
                                    verification.barangay,
                                    verification.city,
                                    verification.province,
                                    verification.region,
                                    verification.postal_code,
                                ].filter(Boolean).join(', ') || 'Not provided'}</p>

                                <div className="provider-declaration">
                                    <input
                                        id="provider-declaration"
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={declaration}
                                        onChange={(event) => setDeclaration(event.target.checked)}
                                    />
                                    <label htmlFor="provider-declaration">
                                        <strong>Declaration and Agreement</strong>
                                        <span>
                                            I confirm that the information and documents I provided
                                            are accurate and authentic.
                                        </span>
                                    </label>
                                </div>
                            </>
                        )}

                        <div className="d-flex justify-content-between flex-wrap gap-2">
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => setStep((current) => Math.max(0, current - 1))}
                                disabled={step === 0 || busy}
                            >
                                Previous
                            </button>

                            {step < steps.length - 1 ? (
                                <button
                                    type="button"
                                    className="btn btn-success"
                                    onClick={handleNextStep}
                                    disabled={busy}
                                >
                                    Next Step
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="btn btn-success"
                                    onClick={saveApplication}
                                    disabled={busy || !declaration}
                                >
                                    {busy ? 'Submitting...' : 'Submit Application'}
                                </button>
                            )}

                        </div>
                    </div>
                </>
            )}
        </section>
    );
}
