import React, { useState, useEffect } from 'react';
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

        // Reset OTP when changing form
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


        setFormData((prev) => ({

            ...prev,

            [name]:
                type === 'checkbox'
                    ? checked
                    : value

        }));

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


        const file = files && files.length > 0 ? files[0] : null;
        if (file && (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024)) {
            alert('Please upload an image file no larger than 5 MB.');
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

        if (!/^\+?\d{10,15}$/.test(formData.mobileNumber.replace(/[\s-]/g, ''))) {

            alert(
                "Mangyaring ilagay muna ang iyong Mobile Number."
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
                "Mangyaring ilagay ang 6-digit OTP."
            );

            return;

        }


        if (formData.otpCode === generatedOtp) {

            setIsOtpVerified(true);

            setOtpError('');

        } else {

            setIsOtpVerified(false);

            setOtpError(
                "Maling OTP code! Pakisubukan ulit."
            );

        }

    };


    // =========================================
    // PROVIDER LOGIN
    // =========================================

    const handleLoginSubmit = async (e) => {

        e.preventDefault();


        // Basic validation
        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginData.email) ||
            !loginData.password
        ) {

            alert(
                "Mangyaring ilagay ang iyong email at password."
            );

            return;

        }


        try {
            const response = await login(loginData.email.trim(), loginData.password);
            localStorage.setItem('user', JSON.stringify(response.user));
            localStorage.setItem('loggedInProvider', JSON.stringify(response.user));
            navigate('/provider-dashboard');
        } catch (error) {
            alert(error.message);
        }

    };


    // =========================================
    // PROVIDER REGISTRATION
    // =========================================

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();

        const mobileNumber = formData.mobileNumber.replace(/[\s-]/g, '');
        if (!/^[A-Za-z][A-Za-z .'-]{1,149}$/.test(formData.fullName.trim()) ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) ||
            !/^\+?\d{10,15}$/.test(mobileNumber) ||
            !Number.isInteger(Number(formData.experienceYears)) || Number(formData.experienceYears) < 0 || Number(formData.experienceYears) > 80) {
            alert('Please enter valid name, email, mobile number, and experience (0–80 years).');
            return;
        }
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/.test(formData.password)) {
            alert('Password must be 8+ characters and include uppercase, lowercase, and a number.');
            return;
        }
        if (!formData.idFront || !formData.idBack) {
            alert('Please upload both sides of a valid ID.');
            return;
        }
        if (!isOtpVerified) {
            alert('Kailangan muna i-verify ang iyong OTP code bago magpatuloy.');
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            alert('Hindi magkatugma ang Password at Confirm Password!');
            return;
        }
        if (!formData.agreeTerms) {
            alert('Kailangan mong tanggapin ang Terms and Conditions.');
            return;
        }

        try {
            const response = await register({
                full_name: formData.fullName.trim(),
                email: formData.email.trim(),
                mobile_number: mobileNumber,
                password: formData.password,
                role: 'provider',
                business_name: formData.fullName.trim(),
            });
            localStorage.setItem('user', JSON.stringify(response.user));
            localStorage.setItem('loggedInProvider', JSON.stringify(response.user));
            alert(`Welcome, ${formData.fullName.trim()}! Your provider account has been created successfully.`);
            navigate('/provider-dashboard');
        } catch (error) {
            alert(error.message);
        }
    };


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
                                    : "Send OTP"}
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
                                            ? "Verified ✓"
                                            : "Verify"}
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


                        {/* SERVICE CATEGORY */}

                        <div className="input-group mb-2">

                            <span className="input-group-text bg-light border-0">
                                <i className="bi bi-tools"></i>
                            </span>

                            <select
                                name="serviceCategory"
                                className="form-select bg-light border-0"
                                value={formData.serviceCategory}
                                onChange={handleInputChange}
                                required
                            >

                                <option value="" disabled>
                                    Select Service Category
                                </option>

                                <option value="plumbing">
                                    Plumbing Services
                                </option>

                                <option value="electrical">
                                    Electrical Repair
                                </option>

                                <option value="cleaning">
                                    Home Cleaning
                                </option>

                                <option value="appliance">
                                    Appliance Repair
                                </option>

                                <option value="carpentry">
                                    Carpentry & Woodwork
                                </option>

                                <option value="painting">
                                    Painting Services
                                </option>

                            </select>

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
                                minLength="8"
                                maxLength="128"
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
                                type="password"
                                name="password"
                                className="form-control bg-light border-0"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleInputChange}
                                minLength="8"
                                maxLength="128"
                                required
                            />

                        </div>


                        {/* CONFIRM PASSWORD */}

                        <div className="input-group mb-2">

                            <span className="input-group-text bg-light border-0">
                                <i className="bi bi-lock-fill"></i>
                            </span>

                            <input
                                type="password"
                                name="confirmPassword"
                                className="form-control bg-light border-0"
                                placeholder="Confirm Password"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                required
                            />

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
                                onClick={(e) => e.preventDefault()}
                            >
                                <i className="bi bi-facebook"></i>
                            </a>

                            <a
                                href="#google"
                                className="social"
                                onClick={(e) => e.preventDefault()}
                            >
                                <i className="bi bi-google"></i>
                            </a>

                            <a
                                href="#linkedin"
                                className="social"
                                onClick={(e) => e.preventDefault()}
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


                        {/* PASSWORD */}

                        <div className="input-group mb-4">

                            <span className="input-group-text bg-light border-0">
                                <i className="bi bi-lock"></i>
                            </span>

                            <input
                                type="password"
                                name="password"
                                className="form-control bg-light border-0 shadow-none"
                                placeholder="Password"
                                value={loginData.password}
                                onChange={handleLoginChange}
                                maxLength="128"
                                required
                            />

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
                                    className="btn btn-outline-light rounded-pill px-5 py-2 fw-bold"
                                    onClick={toggleForm}
                                >
                                    SIGN UP
                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>

    );

};


export default ProviderAuth;
