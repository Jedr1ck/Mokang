import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const HomeownerSignUp = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        mobileNumber: '',
        otp: '',
        password: '',
        confirmPassword: '',
        agreeTerms: false,
    });

    // OTP State Management
    const [generatedOtp, setGeneratedOtp] = useState(null);
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isOtpVerified, setIsOtpVerified] = useState(false);
    const [otpError, setOtpError] = useState('');
    const [timer, setTimer] = useState(0);

    // Password Error State
    const [passwordError, setPasswordError] = useState('');

    // Handle Input Changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    // Timer Effect para sa Send OTP Resend Countdown
    useEffect(() => {
        let interval = null;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [timer]);

    // 1. Send OTP Function (Simulation)
    const handleSendOtp = () => {
        if (!formData.mobileNumber || formData.mobileNumber.length < 10) {
            alert('Mangyaring maglagay ng tamang mobile number.');
            return;
        }

        // Gumawa ng random 6-digit OTP demo code (halimbawa: 123456)
        const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(mockOtp);
        setIsOtpSent(true);
        setTimer(60); // 60-second cooldown
        setOtpError('');

        alert(`[DEMO OTP CODE]: Ang iyong OTP ay ${mockOtp}`);
    };

    // 2. Verify OTP Function
    const handleVerifyOtp = () => {
        if (formData.otp === generatedOtp) {
            setIsOtpVerified(true);
            setOtpError('');
        } else {
            setIsOtpVerified(false);
            setOtpError('Maling OTP code! Pakisubukan ulit.');
        }
    };

    // 3. Form Submit Handler
    const handleSubmit = (e) => {
        e.preventDefault();

        // Validations
        if (!isOtpVerified) {
            alert('Kailangan mo muna i-verify ang iyong OTP.');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setPasswordError('Hindi nagtutugma ang Password at Confirm Password.');
            return;
        } else {
            setPasswordError('');
        }

        if (!formData.agreeTerms) {
            alert('Paki-sang-ayunan ang Terms and Conditions.');
            return;
        }

        // 1. I-save ang user details sa localStorage (kukunin nito ang pumasok na fullName)
        localStorage.setItem('user', JSON.stringify({
            fullName: formData.fullName,
            email: formData.email,
            mobileNumber: formData.mobileNumber,
            role: 'homeowner'
        }));

        // 2. Alert at Redirect papunta sa Dashboard
        alert('Matagumpay ang iyong Registration bilang Homeowner!');

        // Gamitin ang window.location.href o useNavigate mula sa react-router-dom
        window.location.href = '/homeowner-dashboard';
    };

    return (
        <div className="container py-4">
            <div className="row justify-content-center">
                <div className="col-md-6 col-lg-5">
                    <div className="card shadow-sm border-0 rounded-4 p-4">
                        <h3 className="fw-bold text-center mb-1 text-success">Find a Service</h3>
                        <p className="text-muted text-center small mb-4">Register as Homeowner</p>

                        <form onSubmit={handleSubmit}>
                            {/* Full Name */}
                            <div className="mb-3">
                                <label className="form-label small fw-semibold">Full Name</label>
                                <div className="input-group">
                                    <span className="input-group-text bg-light border-0"><i className="bi bi-person"></i></span>
                                    <input
                                        type="text"
                                        name="fullName"
                                        className="form-control bg-light border-0"
                                        placeholder="Juan Dela Cruz"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Email Address */}
                            <div className="mb-3">
                                <label className="form-label small fw-semibold">Email Address</label>
                                <div className="input-group">
                                    <span className="input-group-text bg-light border-0"><i className="bi bi-envelope"></i></span>
                                    <input
                                        type="email"
                                        name="email"
                                        className="form-control bg-light border-0"
                                        placeholder="juan@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Mobile Number & Send OTP */}
                            <div className="mb-3">
                                <label className="form-label small fw-semibold">Mobile Number</label>
                                <div className="input-group">
                                    <span className="input-group-text bg-light border-0"><i className="bi bi-phone"></i></span>
                                    <input
                                        type="tel"
                                        name="mobileNumber"
                                        className="form-control bg-light border-0"
                                        placeholder="09123456789"
                                        value={formData.mobileNumber}
                                        onChange={handleChange}
                                        disabled={isOtpVerified}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-outline-success btn-sm"
                                        onClick={handleSendOtp}
                                        disabled={timer > 0 || isOtpVerified}
                                    >
                                        {timer > 0 ? `${timer}s` : isOtpSent ? 'Resend' : 'Send OTP'}
                                    </button>
                                </div>
                            </div>

                            {/* OTP Field & Verification */}
                            {isOtpSent && !isOtpVerified && (
                                <div className="mb-3">
                                    <label className="form-label small fw-semibold">Enter OTP Code</label>
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            name="otp"
                                            className="form-control bg-light border-0"
                                            placeholder="6-digit code"
                                            value={formData.otp}
                                            onChange={handleChange}
                                            maxLength="6"
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-success btn-sm"
                                            onClick={handleVerifyOtp}
                                        >
                                            Verify
                                        </button>
                                    </div>
                                    {otpError && <div className="text-danger small mt-1">{otpError}</div>}
                                </div>
                            )}

                            {/* OTP Verified Success Badge */}
                            {isOtpVerified && (
                                <div className="alert alert-success py-2 small d-flex align-items-center gap-2 mb-3">
                                    <i className="bi bi-check-circle-fill fs-6"></i>
                                    <span>Mobile number verified!</span>
                                </div>
                            )}

                            {/* Password */}
                            <div className="mb-3">
                                <label className="form-label small fw-semibold">Password</label>
                                <div className="input-group">
                                    <span className="input-group-text bg-light border-0"><i className="bi bi-lock"></i></span>
                                    <input
                                        type="password"
                                        name="password"
                                        className="form-control bg-light border-0"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="mb-3">
                                <label className="form-label small fw-semibold">Confirm Password</label>
                                <div className="input-group">
                                    <span className="input-group-text bg-light border-0"><i className="bi bi-lock-fill"></i></span>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        className="form-control bg-light border-0"
                                        placeholder="••••••••"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                {passwordError && <div className="text-danger small mt-1">{passwordError}</div>}
                            </div>

                            {/* Terms and Conditions Checkbox */}
                            <div className="form-check mb-4">
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    id="agreeTerms"
                                    name="agreeTerms"
                                    checked={formData.agreeTerms}
                                    onChange={handleChange}
                                    required
                                />
                                <label className="form-check-label small text-muted" htmlFor="agreeTerms">
                                    I agree to the <a href="#terms" className="text-success text-decoration-none fw-semibold">Terms and Conditions</a>
                                </label>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="btn btn-success w-100 py-2 fw-bold rounded-3"
                                disabled={!isOtpVerified}
                            >
                                REGISTER HOMEOWNER
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomeownerSignUp;