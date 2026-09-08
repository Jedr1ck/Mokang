import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import "../../index.css";
import { login, register } from '../../services/api';

const HomeownerAuth = () => {
    const navigate = useNavigate();
    const [isSignUp, setIsSignUp] = useState(false); // Naka-set sa Log In view default

    // Sign In Form Data State
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Sign Up Form Data State
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        mobileNumber: '',
        gender: '',
        address: '',
        otp: '',
        password: '',
        confirmPassword: '',
        agreeTerms: false,
    });

    // OTP Management State
    const [generatedOtp, setGeneratedOtp] = useState(null);
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isOtpVerified, setIsOtpVerified] = useState(false);
    const [otpError, setOtpError] = useState('');
    const [timer, setTimer] = useState(0);
    const [passwordError, setPasswordError] = useState('');

    const toggleForm = () => {
        setIsSignUp(!isSignUp);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    // Timer Countdown para sa OTP Resend
    useEffect(() => {
        let interval = null;
        if (timer > 0) {
            interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [timer]);

    // Send OTP Action
    const handleSendOtp = () => {
        const phone = formData.mobileNumber.replaceAll(' ', '').replaceAll('-', '');
        if (phone.length < 10 || phone.length > 15 || ![...phone.replace('+', '')].every((char) => char >= '0' && char <= '9')) {
            alert('Mangyaring maglagay ng tamang mobile number.');
            return;
        }
        const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(mockOtp);
        setIsOtpSent(true);
        setTimer(60);
        setOtpError('');
        alert(`[DEMO OTP CODE]: Ang iyong OTP ay ${mockOtp}`);
    };

    // Verify OTP Action
    const handleVerifyOtp = () => {
        if (/^\d{6}$/.test(formData.otp) && formData.otp === generatedOtp) {
            setIsOtpVerified(true);
            setOtpError('');
        } else {
            setIsOtpVerified(false);
            setOtpError('Maling OTP code! Pakisubukan ulit.');
        }
    };

    // Sign Up Submit Handler
    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        if (!/^[A-Za-z][A-Za-z .'-]{1,149}$/.test(formData.fullName.trim())) {
            alert('Enter a valid full name (2–150 letters).');
            return;
        }
        const phone = formData.mobileNumber.replaceAll(' ', '').replaceAll('-', '');
        if (phone.length < 10 || phone.length > 15 || ![...phone.replace('+', '')].every((char) => char >= '0' && char <= '9')) {
            alert('Enter a valid mobile number.');
            return;
        }
        if (!formData.gender || formData.address.trim().length < 10) {
            alert('Please select your gender and enter an address of at least 10 characters.');
            return;
        }
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/.test(formData.password)) {
            setPasswordError('Password must be 8+ characters and include uppercase, lowercase, and a number.');
            return;
        }
        if (!isOtpVerified) {
            alert('Kailangan mo muna i-verify ang iyong OTP.');
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setPasswordError('Hindi nagtutugma ang Password at Confirm Password.');
            return;
        }
        if (!formData.agreeTerms) {
            alert('Paki-sang-ayunan ang Terms and Conditions.');
            return;
        }

        try {
            const response = await register({
                full_name: formData.fullName.trim(),
                email: formData.email.trim(),
                mobile_number: phone,
                gender: formData.gender,
                address: formData.address.trim(),
                password: formData.password,
                role: 'homeowner',
            });
            localStorage.setItem('access_token', response.access_token);
            localStorage.setItem('user', JSON.stringify({ ...response.user, role: response.user.role || 'homeowner' }));
            alert('Matagumpay ang iyong Registration bilang Homeowner!');
            navigate('/homeowner-dashboard');
        } catch (error) {
            alert(error.message);
        }
    };

    // Log In Submit Handler
    const handleLoginSubmit = async (e) => {
        e.preventDefault();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail) || !loginPassword) {
            alert('Enter a valid email address and password.');
            return;
        }

        try {
            const response = await login(loginEmail.trim(), loginPassword);
            localStorage.setItem('user', JSON.stringify({ ...response.user, role: response.user.role || 'homeowner' }));
            navigate('/homeowner-dashboard');
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <div className="auth-body d-flex justify-content-center align-items-center">
            <div className={`auth-container ${isSignUp ? 'right-panel-active' : ''}`}>

                {/* ================= SIGN UP FORM (Homeowner Registration) ================= */}
                <div className="form-container sign-up-container">
                    <form onSubmit={handleRegisterSubmit} className="d-flex flex-column align-items-center justify-content-center h-100 px-4 text-center">
                        <h2 className="fw-bold mb-2 theme-text">Create Account</h2>

                        <div className="social-container mb-2">
                            <a href="#facebook" className="social"><i className="bi bi-facebook"></i></a>
                            <a href="#google" className="social"><i className="bi bi-google"></i></a>
                            <a href="#linkedin" className="social"><i className="bi bi-linkedin"></i></a>
                        </div>

                        <span className="small text-muted mb-2">or use your details for homeowner registration:</span>

                        {/* Full Name */}
                        <div className="input-group mb-2">
                            <span className="input-group-text bg-light border-0"><i className="bi bi-person"></i></span>
                            <input
                                type="text"
                                name="fullName"
                                className="form-control bg-light border-0 shadow-none"
                                placeholder="Full Name"
                                value={formData.fullName}
                                onChange={handleChange}
                                minLength="2"
                                maxLength="150"
                                pattern="[A-Za-z][A-Za-z .'-]{1,149}"
                                required
                            />
                        </div>

                        {/* Email Address */}
                        <div className="input-group mb-2">
                            <span className="input-group-text bg-light border-0"><i className="bi bi-envelope"></i></span>
                            <input
                                type="email"
                                name="email"
                                className="form-control bg-light border-0 shadow-none"
                                placeholder="Email Address"
                                value={formData.email}
                                onChange={handleChange}
                                maxLength="254"
                                required
                            />
                        </div>

                        {/* Gender and Address */}
                        <div className="input-group mb-2">
                            <span className="input-group-text bg-light border-0"><i className="bi bi-gender-ambiguous"></i></span>
                            <select
                                name="gender"
                                className="form-select bg-light border-0 shadow-none"
                                value={formData.gender}
                                onChange={handleChange}
                                required
                            >
                                <option value="" disabled>Select Gender</option>
                                <option value="female">Female</option>
                                <option value="male">Male</option>
                                <option value="non-binary">Non-binary</option>
                                <option value="prefer-not-to-say">Prefer not to say</option>
                            </select>
                        </div>

                        <div className="input-group mb-2">
                            <span className="input-group-text bg-light border-0"><i className="bi bi-geo-alt"></i></span>
                            <input
                                type="text"
                                name="address"
                                className="form-control bg-light border-0 shadow-none"
                                placeholder="Address"
                                value={formData.address}
                                onChange={handleChange}
                                minLength="10"
                                maxLength="500"
                                required
                            />
                        </div>

                        {/* Mobile Number & Send OTP */}
                        <div className="input-group mb-2">
                            <span className="input-group-text bg-light border-0"><i className="bi bi-phone"></i></span>
                            <input
                                type="tel"
                                name="mobileNumber"
                                className="form-control bg-light border-0 shadow-none"
                                placeholder="Mobile Number"
                                value={formData.mobileNumber}
                                onChange={handleChange}
                                inputMode="tel"
                                pattern="\\+?[0-9 -]{10,20}"
                                maxLength="20"
                                disabled={isOtpVerified}
                                required
                            />
                            <button
                                type="button"
                                className="btn btn-theme text-white btn-sm px-3"
                                onClick={handleSendOtp}
                                disabled={timer > 0 || isOtpVerified}
                            >
                                {timer > 0 ? `${timer}s` : isOtpSent ? 'Resend' : 'Send OTP'}
                            </button>
                        </div>

                        {/* OTP Verification Field */}
                        {isOtpSent && !isOtpVerified && (
                            <div className="input-group mb-2">
                                <input
                                    type="text"
                                    name="otp"
                                    className="form-control bg-light border-0 shadow-none"
                                    placeholder="Enter 6-digit OTP"
                                    value={formData.otp}
                                    onChange={handleChange}
                                    maxLength="6"
                                    pattern="[0-9]{6}"
                                    inputMode="numeric"
                                />
                                <button type="button" className="btn btn-dark btn-sm" onClick={handleVerifyOtp}>
                                    Verify
                                </button>
                            </div>
                        )}
                        {otpError && <div className="text-danger extra-small mb-2">{otpError}</div>}
                        {isOtpVerified && <div className="text-success extra-small mb-2"><i className="bi bi-check-circle-fill"></i> Mobile Number Verified!</div>}

                        {/* Password */}
                        <div className="input-group mb-2">
                            <span className="input-group-text bg-light border-0"><i className="bi bi-lock"></i></span>
                            <input
                                type="password"
                                name="password"
                                className="form-control bg-light border-0 shadow-none"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                                minLength="8"
                                maxLength="128"
                                required
                            />
                        </div>

                        {/* Confirm Password */}
                        <div className="input-group mb-2">
                            <span className="input-group-text bg-light border-0"><i className="bi bi-lock-fill"></i></span>
                            <input
                                type="password"
                                name="confirmPassword"
                                className="form-control bg-light border-0 shadow-none"
                                placeholder="Confirm Password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                minLength="8"
                                maxLength="128"
                                required
                            />
                        </div>
                        {passwordError && <div className="text-danger extra-small mb-1">{passwordError}</div>}

                        {/* Terms & Conditions Checkbox */}
                        <div className="form-check mb-3 text-start w-100">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                id="agreeTerms"
                                name="agreeTerms"
                                checked={formData.agreeTerms}
                                onChange={handleChange}
                                required
                            />
                            <label className="form-check-label extra-small text-muted" htmlFor="agreeTerms">
                                I agree to the <a href="#terms" className="theme-text text-decoration-none fw-bold">Terms and Conditions</a>
                            </label>
                        </div>

                        <button type="submit" className="btn btn-theme rounded-pill px-5 py-2 fw-bold text-white">
                            Sign up
                        </button>
                    </form>
                </div>

                {/* ================= SIGN IN FORM (Homeowner Login) ================= */}
                <div className="form-container sign-in-container">
                    <form onSubmit={handleLoginSubmit} className="d-flex flex-column align-items-center justify-content-center h-100 px-5 text-center">
                        <h1 className="fw-bold mb-3 theme-text">Log in</h1>

                        <div className="social-container mb-3">
                            <a href="#facebook" className="social"><i className="bi bi-facebook"></i></a>
                            <a href="#google" className="social"><i className="bi bi-google"></i></a>
                            <a href="#linkedin" className="social"><i className="bi bi-linkedin"></i></a>
                        </div>

                        <span className="small text-muted mb-3">or use your account:</span>

                        <div className="input-group mb-3">
                            <span className="input-group-text bg-light border-0"><i className="bi bi-envelope"></i></span>
                            <input
                                type="email"
                                className="form-control bg-light border-0 shadow-none"
                                placeholder="Email"
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                                maxLength="254"
                                required
                            />
                        </div>

                        <div className="input-group mb-4">
                            <span className="input-group-text bg-light border-0"><i className="bi bi-lock"></i></span>
                            <input
                                type="password"
                                className="form-control bg-light border-0 shadow-none"
                                placeholder="Password"
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                maxLength="128"
                                required
                            />
                        </div>

                        <button type="submit" className="btn btn-theme rounded-pill px-5 py-2 fw-bold text-white">
                            Log in
                        </button>
                    </form>
                </div>

                {/* ================= OVERLAY CONTAINER (Sliding Side Screen) ================= */}
                <div className="overlay-container">
                    <div className="overlay">

                        {/* Left Overlay */}
                        <div className="overlay-panel overlay-left d-flex flex-column align-items-center justify-content-center text-center p-5">
                            <div className="brand-logo mb-auto align-self-start d-flex align-items-center gap-2 text-white">
                                <i className="bi bi-house-door-fill fs-4"></i>
                                <span className="fw-bold fs-5">SmartHome</span>
                            </div>
                            <div className="my-auto">
                                <h1 className="fw-bold text-white mb-3">Welcome Back!</h1>
                                <p className="text-white opacity-75 mb-4">To keep connected with us please login with your personal info</p>
                                <button className="btn btn-outline-light rounded-pill px-5 py-2 fw-bold" onClick={toggleForm}>
                                    Log in
                                </button>
                            </div>
                        </div>

                        {/* Right Overlay */}
                        <div className="overlay-panel overlay-right d-flex flex-column align-items-center justify-content-center text-center p-5">
                            <div className="brand-logo mb-auto align-self-start d-flex align-items-center gap-2 text-white">
                                <i className="bi bi-house-door-fill fs-4"></i>
                                <span className="fw-bold fs-5">SmartHome</span>
                            </div>
                            <div className="my-auto">
                                <h1 className="fw-bold text-white mb-3">Hello, Friend!</h1>
                                <p className="text-white opacity-75 mb-4">Enter your personal details and start journey with us</p>
                                <button className="btn btn-outline-light rounded-pill px-5 py-2 fw-bold" onClick={toggleForm}>
                                    SIGN UP
                                </button>z
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};

export default HomeownerAuth;
