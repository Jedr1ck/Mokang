import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import "../../index.css";
import { login, register } from '../../services/api';

const ProviderAuth = () => {

    const navigate = useNavigate();

    // =========================================
    // FORM TOGGLE
    // =========================================

    const [isSignUp, setIsSignUp] = useState(false);


    // =========================================
    // PASSWORD VISIBILITY
    // =========================================

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showLoginPassword, setShowLoginPassword] = useState(false);


    // =========================================
    // REGISTRATION SUCCESS MODAL
    // =========================================

    const [showSuccessModal, setShowSuccessModal] = useState(false);


    // =========================================
    // SERVICE CATEGORY DROPDOWN
    // =========================================

    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

    const categoryDropdownRef = useRef(null);


    // =========================================
    // SERVICE CATEGORIES
    // =========================================

    const serviceCategories = [
        {
            value: 'electrician',
            label: 'Electrician'
        },
        {
            value: 'plumber',
            label: 'Plumber'
        },
        {
            value: 'aircon-technician',
            label: 'Aircon Technician'
        },
        {
            value: 'carpenter',
            label: 'Carpenter'
        },
        {
            value: 'pest-control-technician',
            label: 'Pest Control Technician'
        },
        {
            value: 'painter',
            label: 'Painter'
        },
        {
            value: 'appliance-repair-technician',
            label: 'Appliance Repair Technician'
        },
        {
            value: 'locksmith',
            label: 'Locksmith'
        },
        {
            value: 'deep-cleaner',
            label: 'Deep Cleaner'
        },
        {
            value: 'massage-therapist',
            label: 'Massage Therapist'
        },
        {
            value: 'hair-stylist-barber',
            label: 'Hair Stylist / Barber'
        },
        {
            value: 'nail-technician',
            label: 'Nail Technician (Manicurist/Pedicurist)'
        },
        {
            value: 'makeup-artist',
            label: 'Makeup Artist'
        },
        {
            value: 'private-nurse-caregiver',
            label: 'Private Nurse / Caregiver'
        },
        {
            value: 'physical-therapist',
            label: 'Physical Therapist'
        },
        {
            value: 'computer-cctv-technician',
            label: 'Computer / CCTV Technician'
        },
        {
            value: 'private-tutor-personal-fitness-trainer',
            label: 'Private Tutor / Personal Fitness Trainer'
        }
    ];


    // =========================================
    // OTP STATES
    // =========================================

    const [otpSent, setOtpSent] = useState(false);

    const [timer, setTimer] = useState(0);

    const [generatedOtp, setGeneratedOtp] = useState('');

    const [isOtpVerified, setIsOtpVerified] = useState(false);

    const [otpError, setOtpError] = useState('');


    // =========================================
    // PROVIDER SIGN UP FORM
    // =========================================

    const [formData, setFormData] = useState({

        fullName: '',

        email: '',

        mobileNumber: '',

        gender: '',

        address: '',

        otpCode: '',

        serviceCategory: '',

        experienceYears: '',

        idFront: null,

        idBack: null,

        password: '',

        confirmPassword: '',

        agreeTerms: false

    });


    // =========================================
    // PROVIDER LOGIN FORM
    // =========================================

    const [loginData, setLoginData] = useState({

        email: '',

        password: ''

    });


    // =========================================
    // CLOSE CATEGORY DROPDOWN WHEN CLICKING OUTSIDE
    // =========================================

    useEffect(() => {

        const handleClickOutside = (event) => {

            if (
                categoryDropdownRef.current &&
                !categoryDropdownRef.current.contains(event.target)
            ) {

                setShowCategoryDropdown(false);

            }

        };

        document.addEventListener(
            'mousedown',
            handleClickOutside
        );

        return () => {

            document.removeEventListener(
                'mousedown',
                handleClickOutside
            );

        };

    }, []);


    // =========================================
    // OTP TIMER
    // =========================================

    useEffect(() => {

        let interval = null;

        if (timer > 0) {

            interval = setInterval(() => {

                setTimer((prev) => prev - 1);

            }, 1000);

        }

        return () => {

            if (interval) {
                clearInterval(interval);
            }

        };

    }, [timer]);


    // =========================================
    // TOGGLE LOGIN / SIGN UP
    // =========================================

    const toggleForm = () => {

        setIsSignUp((prev) => !prev);

        setShowCategoryDropdown(false);

        setOtpSent(false);

        setTimer(0);

        setGeneratedOtp('');

        setIsOtpVerified(false);

        setOtpError('');

    };


    // =========================================
    // SIGN UP INPUT
    // =========================================

    const handleInputChange = (e) => {

        const {
            name,
            value,
            type,
            checked
        } = e.target;


        if (name === 'otpCode') {

            setOtpError('');

        }


        if (
            name === 'password' ||
            name === 'confirmPassword'
        ) {

            setOtpError('');

        }


        setFormData((prev) => ({

            ...prev,

            [name]:
                type === 'checkbox'
                    ? checked
                    : value

        }));

    };


    // =========================================
    // SELECT SERVICE CATEGORY
    // =========================================

    const handleCategorySelect = (category) => {

        setFormData((prev) => ({

            ...prev,

            serviceCategory: category.value

        }));

        setShowCategoryDropdown(false);

    };


    // =========================================
    // LOGIN INPUT
    // =========================================

    const handleLoginChange = (e) => {

        const {
            name,
            value
        } = e.target;


        setLoginData((prev) => ({

            ...prev,

            [name]: value

        }));

    };


    // =========================================
    // FILE UPLOAD
    // =========================================

    const handleFileChange = (e) => {

        const {
            name,
            files
        } = e.target;


        const file =
            files && files.length > 0
                ? files[0]
                : null;


        if (
            file &&
            (
                !file.type.startsWith('image/') ||
                file.size > 5 * 1024 * 1024
            )
        ) {

            alert(
                'Please upload an image file no larger than 5 MB.'
            );

            e.target.value = '';

            return;

        }


        setFormData((prev) => ({

            ...prev,

            [name]: file

        }));

    };


    // =========================================
    // SEND OTP
    // =========================================

    const handleSendOtp = () => {

        if (
            !/^\+?\d{10,15}$/.test(
                formData.mobileNumber.replace(/[\s-]/g, '')
            )
        ) {

            alert(
                'Mangyaring ilagay muna ang iyong Mobile Number.'
            );

            return;

        }


        const newOtp =
            Math.floor(
                100000 +
                Math.random() * 900000
            ).toString();


        setGeneratedOtp(newOtp);

        setOtpSent(true);

        setIsOtpVerified(false);

        setOtpError('');

        setTimer(60);


        alert(
            `[DEMO OTP CODE]: Ang iyong OTP ay ${newOtp}`
        );

    };


    // =========================================
    // VERIFY OTP
    // =========================================

    const handleVerifyOtp = () => {

        if (!/^\d{6}$/.test(formData.otpCode)) {

            setOtpError(
                'Mangyaring ilagay ang 6-digit OTP.'
            );

            return;

        }


        if (formData.otpCode === generatedOtp) {

            setIsOtpVerified(true);

            setOtpError('');

        } else {

            setIsOtpVerified(false);

            setOtpError(
                'Maling OTP code! Pakisubukan ulit.'
            );

        }

    };


    // =========================================
    // PROVIDER LOGIN
    // =========================================

    const handleLoginSubmit = async (e) => {

        e.preventDefault();


        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                loginData.email
            ) ||
            !loginData.password
        ) {

            alert(
                'Mangyaring ilagay ang iyong email at password.'
            );

            return;

        }


        try {

            const response = await login(
                loginData.email.trim(),
                loginData.password
            );


            const account = {

                ...response.user,

                role:
                    response.user.role ||
                    'provider'

            };


            // Save authentication ONLY after successful login

            localStorage.setItem(
                'user',
                JSON.stringify(account)
            );


            localStorage.setItem(
                'access_token',
                response.access_token
            );


            localStorage.setItem(
                'loggedInProvider',
                JSON.stringify(account)
            );


            // Go to dashboard only after login

            navigate('/provider-dashboard');


        } catch (error) {

            alert(
                error.message ||
                'Maling email o password. Pakisubukan ulit.'
            );

        }

    };


    // =========================================
    // PROVIDER REGISTRATION
    // =========================================

    const handleRegisterSubmit = async (e) => {

        e.preventDefault();


        const mobileNumber =
            formData.mobileNumber.replace(
                /[\s-]/g,
                ''
            );


        // =====================================
        // BASIC VALIDATION
        // =====================================

        if (
            !/^[A-Za-z][A-Za-z .'-]{1,149}$/.test(
                formData.fullName.trim()
            ) ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                formData.email
            ) ||
            !/^\+?\d{10,15}$/.test(
                mobileNumber
            ) ||
            !formData.gender ||
            formData.address.trim().length < 10 ||
            !formData.serviceCategory ||
            !Number.isInteger(
                Number(formData.experienceYears)
            ) ||
            Number(formData.experienceYears) < 0 ||
            Number(formData.experienceYears) > 80
        ) {

            alert(
                'Please enter valid name, gender, address, email, mobile number, service category, and experience (0–80 years).'
            );

            return;

        }


        // =====================================
        // PASSWORD VALIDATION
        // =====================================

        if (
            !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/.test(
                formData.password
            )
        ) {

            alert(
                'Password must be 8+ characters and include uppercase, lowercase, and a number.'
            );

            return;

        }


        // =====================================
        // VALID ID
        // =====================================

        if (
            !formData.idFront ||
            !formData.idBack
        ) {

            alert(
                'Please upload both sides of a valid ID.'
            );

            return;

        }


        // =====================================
        // OTP
        // =====================================

        if (!isOtpVerified) {

            alert(
                'Kailangan muna i-verify ang iyong OTP code bago magpatuloy.'
            );

            return;

        }


        // =====================================
        // PASSWORD MATCH
        // =====================================

        if (
            formData.password !==
            formData.confirmPassword
        ) {

            alert(
                'Hindi magkatugma ang Password at Confirm Password!'
            );

            return;

        }


        // =====================================
        // TERMS
        // =====================================

        if (!formData.agreeTerms) {

            alert(
                'Kailangan mong tanggapin ang Terms and Conditions.'
            );

            return;

        }


        try {

            const response = await register({

                full_name:
                    formData.fullName.trim(),

                email:
                    formData.email.trim(),

                mobile_number:
                    mobileNumber,

                gender:
                    formData.gender,

                address:
                    formData.address.trim(),

                password:
                    formData.password,

                role:
                    'provider',

                business_name:
                    formData.fullName.trim(),

                service_category:
                    formData.serviceCategory,

                experience_years:
                    Number(
                        formData.experienceYears
                    )

            });


            const account = {

                ...response.user,

                role:
                    response.user.role ||
                    'provider'

            };


            // =====================================
            // IMPORTANT
            // =====================================
            // DO NOT save access_token here.
            // Provider must login first.
            // =====================================


            // Save registered account

            const savedAccounts =
                JSON.parse(
                    localStorage.getItem(
                        'savedAccounts'
                    ) || '[]'
                );


            const existingIndex =
                savedAccounts.findIndex(
                    (savedAccount) =>
                        savedAccount.email
                            ?.toLowerCase() ===
                        account.email
                            ?.toLowerCase()
                );


            if (existingIndex >= 0) {

                savedAccounts[existingIndex] =
                    account;

                localStorage.setItem(
                    'savedAccounts',
                    JSON.stringify(
                        savedAccounts
                    )
                );

            } else {

                localStorage.setItem(
                    'savedAccounts',
                    JSON.stringify([
                        ...savedAccounts,
                        account
                    ])
                );

            }


            // Put registered email into login

            setLoginData({

                email:
                    formData.email.trim(),

                password: ''

            });


            // Go to login state

            setIsSignUp(false);

            setShowCategoryDropdown(false);


            // Show success modal

            setShowSuccessModal(true);


        } catch (error) {

            alert(
                error.message ||
                'Hindi matagumpay ang registration. Pakisubukan ulit.'
            );

        }

    };


    // =========================================
    // SUCCESS MODAL OK
    // =========================================

    const handleSuccessModalOk = () => {

        setShowSuccessModal(false);

        setIsSignUp(false);

        setLoginData((prev) => ({

            ...prev,

            password: ''

        }));

    };


    // =========================================
    // GET SELECTED CATEGORY LABEL
    // =========================================

    const selectedCategory =
        serviceCategories.find(
            (category) =>
                category.value ===
                formData.serviceCategory
        );


    // =========================================
    // UI
    // =========================================

    return (

        <div className="auth-body d-flex justify-content-center align-items-center">

            <div
                className={`auth-container ${isSignUp
                        ? 'right-panel-active'
                        : ''
                    }`}
                style={{
                    minHeight: '700px'
                }}
            >


                {/* =====================================
                    SIGN UP FORM
                ====================================== */}

                <div className="form-container sign-up-container overflow-auto py-4">

                    <form
                        onSubmit={handleRegisterSubmit}
                        className="d-flex flex-column align-items-center justify-content-center px-4 text-center"
                    >

                        <h2 className="fw-bold mb-2 theme-text">
                            Become a Provider
                        </h2>

                        <p className="text-muted small mb-3">
                            Submit your details for provider verification
                        </p>


                        {/* FULL NAME */}

                        <div className="input-group mb-2">

                            <span className="input-group-text bg-light border-0">
                                <i className="bi bi-person"></i>
                            </span>

                            <input
                                type="text"
                                name="fullName"
                                className="form-control bg-light border-0"
                                placeholder="Full Name"
                                value={formData.fullName}
                                onChange={handleInputChange}
                                minLength="2"
                                maxLength="150"
                                pattern="[A-Za-z][A-Za-z .'-]{1,149}"
                                required
                            />

                        </div>


                        {/* EMAIL */}

                        <div className="input-group mb-2">

                            <span className="input-group-text bg-light border-0">
                                <i className="bi bi-envelope"></i>
                            </span>

                            <input
                                type="email"
                                name="email"
                                className="form-control bg-light border-0"
                                placeholder="Email Address"
                                value={formData.email}
                                onChange={handleInputChange}
                                maxLength="254"
                                required
                            />

                        </div>


                        {/* GENDER */}

                        <div className="input-group mb-2">

                            <span className="input-group-text bg-light border-0">
                                <i className="bi bi-gender-ambiguous"></i>
                            </span>

                            <select
                                name="gender"
                                className="form-select bg-light border-0"
                                value={formData.gender}
                                onChange={handleInputChange}
                                required
                            >

                                <option value="" disabled>
                                    Select Gender
                                </option>

                                <option value="female">
                                    Female
                                </option>

                                <option value="male">
                                    Male
                                </option>

                                <option value="non-binary">
                                    Non-binary
                                </option>

                                <option value="prefer-not-to-say">
                                    Prefer not to say
                                </option>

                            </select>

                        </div>


                        {/* ADDRESS */}

                        <div className="input-group mb-2">

                            <span className="input-group-text bg-light border-0">
                                <i className="bi bi-geo-alt"></i>
                            </span>

                            <input
                                type="text"
                                name="address"
                                className="form-control bg-light border-0"
                                placeholder="Address"
                                value={formData.address}
                                onChange={handleInputChange}
                                minLength="10"
                                maxLength="500"
                                required
                            />

                        </div>


                        {/* MOBILE + OTP */}

                        <div className="input-group mb-2">

                            <span className="input-group-text bg-light border-0">
                                <i className="bi bi-phone"></i>
                            </span>

                            <input
                                type="tel"
                                name="mobileNumber"
                                className="form-control bg-light border-0"
                                placeholder="Mobile Number"
                                value={formData.mobileNumber}
                                onChange={handleInputChange}
                                inputMode="tel"
                                pattern="\\+?[0-9 -]{10,20}"
                                maxLength="20"
                                required
                            />

                            <button
                                type="button"
                                className="btn btn-brand-orange text-white text-nowrap btn-sm fw-bold"
                                onClick={handleSendOtp}
                                disabled={timer > 0}
                            >
                                {timer > 0
                                    ? `${timer}s`
                                    : 'Send OTP'}
                            </button>

                        </div>


                        {/* OTP */}

                        {otpSent && (

                            <div className="w-100 mb-2">

                                <div className="input-group">

                                    <span className="input-group-text bg-light border-0">
                                        <i className="bi bi-shield-check"></i>
                                    </span>

                                    <input
                                        type="text"
                                        name="otpCode"
                                        className="form-control bg-light border-0"
                                        placeholder="Enter 6-digit OTP"
                                        value={formData.otpCode}
                                        onChange={handleInputChange}
                                        maxLength="6"
                                        pattern="[0-9]{6}"
                                        inputMode="numeric"
                                        disabled={isOtpVerified}
                                        required
                                    />

                                    <button
                                        type="button"
                                        className={`btn ${isOtpVerified
                                                ? 'btn-success'
                                                : 'btn-dark'
                                            } text-white text-nowrap btn-sm fw-bold`}
                                        onClick={handleVerifyOtp}
                                        disabled={isOtpVerified}
                                    >
                                        {isOtpVerified
                                            ? 'Verified ✓'
                                            : 'Verify'}
                                    </button>

                                </div>


                                {otpError && (

                                    <small className="text-danger d-block mt-1 fw-bold">
                                        {otpError}
                                    </small>

                                )}


                                {isOtpVerified && (

                                    <small className="text-success d-block mt-1 fw-bold">
                                        Matagumpay na na-verify ang OTP!
                                    </small>

                                )}

                            </div>

                        )}


                        {/* =====================================
                            SERVICE CATEGORY CUSTOM DROPDOWN
                        ====================================== */}

                        <div
                            className="input-group mb-2"
                            ref={categoryDropdownRef}
                        >

                            <span className="input-group-text bg-light border-0">
                                <i className="bi bi-tools"></i>
                            </span>


                            <div
                                className="provider-category-dropdown"
                                style={{
                                    position: 'relative',
                                    flex: '1 1 auto',
                                    width: '1%'
                                }}
                            >

                                {/* SELECTED CATEGORY */}

                                <button
                                    type="button"
                                    className="form-select bg-light border-0 text-start"
                                    style={{
                                        height: '100%',
                                        minHeight: '45px',
                                        paddingRight: '40px'
                                    }}
                                    onClick={() =>
                                        setShowCategoryDropdown(
                                            (prev) => !prev
                                        )
                                    }
                                >

                                    <span
                                        className={
                                            selectedCategory
                                                ? 'text-dark'
                                                : 'text-muted'
                                        }
                                    >
                                        {selectedCategory
                                            ? selectedCategory.label
                                            : 'Select Service Category'}
                                    </span>

                                </button>


                                {/* CUSTOM OPTIONS */}

                                {showCategoryDropdown && (

                                    <div
                                        className="provider-category-options"
                                        style={{
                                            position: 'absolute',
                                            top: 'calc(100% + 2px)',
                                            left: 0,
                                            right: 0,
                                            zIndex: 3000,
                                            maxHeight: '230px',
                                            overflowY: 'auto',
                                            background: '#ffffff',
                                            border: '1px solid #dee2e6',
                                            borderRadius: '8px',
                                            boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
                                        }}
                                    >

                                        {serviceCategories.map(
                                            (category) => (

                                                <button
                                                    key={
                                                        category.value
                                                    }
                                                    type="button"
                                                    className={`provider-category-option ${formData.serviceCategory ===
                                                            category.value
                                                            ? 'selected'
                                                            : ''
                                                        }`}
                                                    onClick={() =>
                                                        handleCategorySelect(
                                                            category
                                                        )
                                                    }
                                                    style={{
                                                        display: 'block',
                                                        width: '100%',
                                                        border: 'none',
                                                        background:
                                                            formData.serviceCategory ===
                                                                category.value
                                                                ? '#e9f7f0'
                                                                : '#ffffff',
                                                        padding:
                                                            '10px 14px',
                                                        textAlign:
                                                            'left',
                                                        fontSize:
                                                            '15px',
                                                        color:
                                                            '#212529',
                                                        cursor:
                                                            'pointer'
                                                    }}
                                                >
                                                    {category.label}
                                                </button>

                                            )
                                        )}

                                    </div>

                                )}

                            </div>

                        </div>


                        {/* EXPERIENCE */}

                        <div className="input-group mb-2">

                            <span className="input-group-text bg-light border-0">
                                <i className="bi bi-briefcase"></i>
                            </span>

                            <input
                                type="number"
                                name="experienceYears"
                                className="form-control bg-light border-0"
                                placeholder="Years of Experience (e.g. 3)"
                                min="0"
                                max="80"
                                step="1"
                                value={formData.experienceYears}
                                onChange={handleInputChange}
                                required
                            />

                        </div>


                        {/* VALID ID */}

                        <div className="w-100 text-start my-2">

                            <label className="form-label small text-muted mb-1 fw-bold">
                                Upload Valid ID (Proof of Identity)
                            </label>

                            <div className="row g-2">

                                <div className="col-6">

                                    <span className="small text-secondary">
                                        Front Side
                                    </span>

                                    <input
                                        type="file"
                                        name="idFront"
                                        accept="image/*"
                                        className="form-control form-control-sm bg-light border-0"
                                        onChange={handleFileChange}
                                        required
                                    />

                                </div>


                                <div className="col-6">

                                    <span className="small text-secondary">
                                        Back Side
                                    </span>

                                    <input
                                        type="file"
                                        name="idBack"
                                        accept="image/*"
                                        className="form-control form-control-sm bg-light border-0"
                                        onChange={handleFileChange}
                                        required
                                    />

                                </div>

                            </div>

                        </div>


                        {/* PASSWORD */}

                        <div className="input-group mb-2">

                            <span className="input-group-text bg-light border-0">
                                <i className="bi bi-lock"></i>
                            </span>

                            <input
                                type={
                                    showPassword
                                        ? 'text'
                                        : 'password'
                                }
                                name="password"
                                className="form-control bg-light border-0 password-input"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleInputChange}
                                minLength="8"
                                maxLength="128"
                                required
                            />

                            <button
                                type="button"
                                className="btn password-toggle"
                                onClick={() =>
                                    setShowPassword(
                                        (prev) => !prev
                                    )
                                }
                                aria-label={
                                    showPassword
                                        ? 'Hide password'
                                        : 'Show password'
                                }
                            >

                                <i
                                    className={`bi ${showPassword
                                            ? 'bi-eye-slash'
                                            : 'bi-eye'
                                        }`}
                                ></i>

                            </button>

                        </div>


                        {/* CONFIRM PASSWORD */}

                        <div className="input-group mb-2">

                            <span className="input-group-text bg-light border-0">
                                <i className="bi bi-lock-fill"></i>
                            </span>

                            <input
                                type={
                                    showConfirmPassword
                                        ? 'text'
                                        : 'password'
                                }
                                name="confirmPassword"
                                className="form-control bg-light border-0 password-input"
                                placeholder="Confirm Password"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                required
                            />

                            <button
                                type="button"
                                className="btn password-toggle"
                                onClick={() =>
                                    setShowConfirmPassword(
                                        (prev) => !prev
                                    )
                                }
                                aria-label={
                                    showConfirmPassword
                                        ? 'Hide confirm password'
                                        : 'Show confirm password'
                                }
                            >

                                <i
                                    className={`bi ${showConfirmPassword
                                            ? 'bi-eye-slash'
                                            : 'bi-eye'
                                        }`}
                                ></i>

                            </button>

                        </div>


                        {/* TERMS */}

                        <div className="form-check my-2 text-start w-100">

                            <input
                                className="form-check-input"
                                type="checkbox"
                                id="termsProvider"
                                name="agreeTerms"
                                checked={formData.agreeTerms}
                                onChange={handleInputChange}
                                required
                            />

                            <label
                                className="form-check-label small"
                                htmlFor="termsProvider"
                            >
                                I agree to the{' '}

                                <span className="theme-text fw-bold">
                                    Terms and Conditions
                                </span>

                            </label>

                        </div>


                        {/* SIGN UP */}

                        <button
                            type="submit"
                            className="btn btn-brand-orange rounded-pill px-5 py-2 fw-bold text-white mt-2"
                        >
                            SIGN UP
                        </button>

                    </form>

                </div>


                {/* =====================================
                    LOGIN FORM
                ====================================== */}

                <div className="form-container sign-in-container">

                    <form
                        onSubmit={handleLoginSubmit}
                        className="d-flex flex-column align-items-center justify-content-center h-100 px-5 text-center"
                    >

                        <h1 className="fw-bold mb-3 theme-text">
                            Provider Log in
                        </h1>


                        {/* SOCIAL */}

                        <div className="social-container mb-3">

                            <a
                                href="#facebook"
                                className="social"
                                onClick={(e) =>
                                    e.preventDefault()
                                }
                            >
                                <i className="bi bi-facebook"></i>
                            </a>

                            <a
                                href="#google"
                                className="social"
                                onClick={(e) =>
                                    e.preventDefault()
                                }
                            >
                                <i className="bi bi-google"></i>
                            </a>

                            <a
                                href="#linkedin"
                                className="social"
                                onClick={(e) =>
                                    e.preventDefault()
                                }
                            >
                                <i className="bi bi-linkedin"></i>
                            </a>

                        </div>


                        <span className="small text-muted mb-3">
                            or use your provider account:
                        </span>


                        {/* EMAIL */}

                        <div className="input-group mb-3">

                            <span className="input-group-text bg-light border-0">
                                <i className="bi bi-envelope"></i>
                            </span>

                            <input
                                type="email"
                                name="email"
                                className="form-control bg-light border-0 shadow-none"
                                placeholder="Email"
                                value={loginData.email}
                                onChange={handleLoginChange}
                                maxLength="254"
                                required
                            />

                        </div>


                        {/* LOGIN PASSWORD */}

                        <div className="input-group mb-4">

                            <span className="input-group-text bg-light border-0">
                                <i className="bi bi-lock"></i>
                            </span>

                            <input
                                type={
                                    showLoginPassword
                                        ? 'text'
                                        : 'password'
                                }
                                name="password"
                                className="form-control bg-light border-0 shadow-none password-input"
                                placeholder="Password"
                                value={loginData.password}
                                onChange={handleLoginChange}
                                maxLength="128"
                                required
                            />

                            <button
                                type="button"
                                className="btn password-toggle"
                                onClick={() =>
                                    setShowLoginPassword(
                                        (prev) => !prev
                                    )
                                }
                                aria-label={
                                    showLoginPassword
                                        ? 'Hide password'
                                        : 'Show password'
                                }
                            >

                                <i
                                    className={`bi ${showLoginPassword
                                            ? 'bi-eye-slash'
                                            : 'bi-eye'
                                        }`}
                                ></i>

                            </button>

                        </div>


                        {/* LOGIN */}

                        <button
                            type="submit"
                            className="btn btn-brand-orange rounded-pill px-5 py-2 fw-bold text-white"
                        >
                            LOG IN
                        </button>

                    </form>

                </div>


                {/* =====================================
                    OVERLAY
                ====================================== */}

                <div className="overlay-container">

                    <div className="overlay">


                        {/* LEFT PANEL */}

                        <div className="overlay-panel overlay-left d-flex flex-column align-items-center justify-content-center text-center p-5">

                            <div className="brand-logo mb-auto align-self-start d-flex align-items-center gap-2">

                                <i className="bi bi-house-door-fill fs-4"></i>

                                <span className="fw-bold fs-5">
                                    SmartHome
                                </span>

                            </div>


                            <div className="my-auto">

                                <h1 className="fw-bold text-white mb-3">
                                    Welcome Back!
                                </h1>

                                <p className="text-white opacity-75 mb-4">
                                    Already a registered provider?
                                    Log in with your account info.
                                </p>

                                <button
                                    type="button"
                                    className="btn btn-outline-light rounded-pill px-5 py-2 fw-bold"
                                    onClick={toggleForm}
                                >
                                    LOG IN
                                </button>

                            </div>

                        </div>


                        {/* RIGHT PANEL */}

                        <div className="overlay-panel overlay-right d-flex flex-column align-items-center justify-content-center text-center p-5">

                            <div className="brand-logo mb-auto align-self-start d-flex align-items-center gap-2">

                                <i className="bi bi-house-door-fill fs-4"></i>

                                <span className="fw-bold fs-5">
                                    SmartHome
                                </span>

                            </div>


                            <div className="my-auto">

                                <h1 className="fw-bold text-white mb-3">
                                    Join as Partner!
                                </h1>

                                <p className="text-white opacity-75 mb-4">
                                    Register as a service provider
                                    and expand your business with us.
                                </p>

                                <button
                                    type="button"
                                    className="btn btn-outline-light rounded-pill px-5 py-2 fw-bold"
                                    onClick={toggleForm}
                                >
                                    SIGN UP
                                </button>

                            </div>

                        </div>

                    </div>

                </div>


                {/* =====================================
                    REGISTRATION SUCCESS MODAL
                ====================================== */}

                {showSuccessModal && (

                    <div
                        className="registration-success-overlay"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="provider-registration-success-title"
                    >

                        <div className="registration-success-modal">

                            <div className="registration-success-icon">

                                <i className="bi bi-check-lg"></i>

                            </div>


                            <h3 id="provider-registration-success-title">
                                Registration Successful!
                            </h3>


                            <p>
                                Your provider account has been
                                successfully created.
                                <br />
                                Please log in using your registered
                                email and password.
                            </p>


                            <button
                                type="button"
                                className="registration-success-button"
                                onClick={handleSuccessModalOk}
                            >
                                OK, Go to Log in
                            </button>

                        </div>

                    </div>

                )}

            </div>

        </div>

    );

};

export default ProviderAuth;