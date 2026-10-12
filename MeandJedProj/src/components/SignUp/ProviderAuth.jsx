import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../index.css';
import { login, register } from '../../services/api';

const ProviderAuth = () => {
    const navigate = useNavigate();

    const [isSignUp, setIsSignUp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [loginData, setLoginData] = useState({
        email: '',
        password: ''
    });

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData((previous) => ({ ...previous, [name]: value }));

        if (name === 'password' || name === 'confirmPassword') {
            setPasswordError('');
        }
    };

    const handleLoginChange = (event) => {
        const { name, value } = event.target;
        setLoginData((previous) => ({ ...previous, [name]: value }));
    };

    const toggleForm = () => {
        setIsSignUp((previous) => !previous);
        setPasswordError('');
    };

    const handleRegisterSubmit = async (event) => {
        event.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setPasswordError('Password and Confirm Password do not match.');
            return;
        }

        try {
            const response = await register({
                full_name: formData.fullName.trim(),
                email: formData.email.trim(),
                password: formData.password,
                role: 'provider'
            });
            const account = {
                ...response.user,
                role: response.user.role || 'provider'
            };
            const savedAccounts = JSON.parse(
                localStorage.getItem('savedAccounts') || '[]'
            );
            const existingIndex = savedAccounts.findIndex(
                (savedAccount) =>
                    savedAccount.email?.toLowerCase() ===
                    account.email?.toLowerCase()
            );

            if (existingIndex >= 0) {
                savedAccounts[existingIndex] = account;
            } else {
                savedAccounts.push(account);
            }
            localStorage.setItem('savedAccounts', JSON.stringify(savedAccounts));

            setLoginData({ email: formData.email.trim(), password: '' });
            setIsSignUp(false);
            setShowSuccessModal(true);
        } catch (error) {
            alert(
                error.message ||
                'Registration failed. Please try again.'
            );
        }
    };

    const handleLoginSubmit = async (event) => {
        event.preventDefault();

        try {
            const response = await login(
                loginData.email.trim(),
                loginData.password
            );
            const account = {
                ...response.user,
                role: response.user.role || 'provider'
            };

            localStorage.setItem('user', JSON.stringify(account));
            localStorage.setItem('access_token', response.access_token);
            localStorage.setItem('loggedInProvider', JSON.stringify(account));
            navigate('/provider-dashboard');
        } catch (error) {
            alert(
                error.message ||
                'Incorrect email or password. Please try again.'
            );
        }
    };

    const handleSuccessModalOk = () => {
        setShowSuccessModal(false);
        setIsSignUp(false);
        setLoginData((previous) => ({ ...previous, password: '' }));
    };

    return (
        <div className="auth-body d-flex justify-content-center align-items-center">
            <div className={`auth-container ${isSignUp ? 'right-panel-active' : ''}`}>
                <div className="form-container sign-up-container">
                    <form
                        onSubmit={handleRegisterSubmit}
                        className="d-flex flex-column align-items-center justify-content-center h-100 px-4 text-center"
                    >
                        <h2 className="fw-bold mb-2 theme-text">
                            Become a Provider
                        </h2>
                        <span className="small text-muted mb-3">
                            Create your provider account
                        </span>

                        <input
                            type="text"
                            name="fullName"
                            className="form-control bg-light border-0 mb-2"
                            placeholder="Full Name"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            minLength="2"
                            maxLength="150"
                            pattern="[A-Za-z][A-Za-z .'-]{1,149}"
                            required
                        />

                        <input
                            type="email"
                            name="email"
                            className="form-control bg-light border-0 mb-2"
                            placeholder="Email Address"
                            value={formData.email}
                            onChange={handleInputChange}
                            maxLength="254"
                            required
                        />

                        <div className="password-input-wrapper mb-2">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                className="form-control bg-light border-0 password-input"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleInputChange}
                                minLength="8"
                                maxLength="128"
                                pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,128}"
                                title="Use at least 8 characters, including uppercase, lowercase, and a number."
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword((previous) => !previous)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                            </button>
                        </div>

                        <div className="password-input-wrapper mb-2">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                name="confirmPassword"
                                className="form-control bg-light border-0 password-input"
                                placeholder="Confirm Password"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                minLength="8"
                                maxLength="128"
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowConfirmPassword((previous) => !previous)}
                                aria-label={
                                    showConfirmPassword
                                        ? 'Hide confirm password'
                                        : 'Show confirm password'
                                }
                            >
                                <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                            </button>
                        </div>

                        {passwordError && (
                            <div className="text-danger small mb-2" role="alert">
                                {passwordError}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-brand-orange rounded-pill px-5 py-2 fw-bold text-white mt-2"
                        >
                            SIGN UP
                        </button>
                    </form>
                </div>

                <div className="form-container sign-in-container">
                    <form
                        onSubmit={handleLoginSubmit}
                        className="d-flex flex-column align-items-center justify-content-center h-100 px-5 text-center"
                    >
                        <h1 className="fw-bold mb-3 theme-text">Provider Log in</h1>
                        <div className="social-container mb-3">
                            <a href="#facebook" className="social" onClick={(event) => event.preventDefault()}>
                                <i className="bi bi-facebook"></i>
                            </a>
                            <a href="#google" className="social" onClick={(event) => event.preventDefault()}>
                                <i className="bi bi-google"></i>
                            </a>
                            <a href="#linkedin" className="social" onClick={(event) => event.preventDefault()}>
                                <i className="bi bi-linkedin"></i>
                            </a>
                        </div>
                        <span className="small text-muted mb-3">
                            or use your provider account:
                        </span>

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

                        <div className="input-group mb-4">
                            <span className="input-group-text bg-light border-0">
                                <i className="bi bi-lock"></i>
                            </span>
                            <input
                                type={showLoginPassword ? 'text' : 'password'}
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
                                onClick={() => setShowLoginPassword((previous) => !previous)}
                                aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                            >
                                <i className={`bi ${showLoginPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                            </button>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-brand-orange rounded-pill px-5 py-2 fw-bold text-white"
                        >
                            LOG IN
                        </button>
                    </form>
                </div>

                <div className="overlay-container">
                    <div className="overlay">
                        <div className="overlay-panel overlay-left d-flex flex-column align-items-center justify-content-center text-center p-5">
                            <div className="brand-logo mb-auto align-self-start d-flex align-items-center gap-2">
                                <i className="bi bi-house-door-fill fs-4"></i>
                                <span className="fw-bold fs-5">SmartHome</span>
                            </div>
                            <div className="my-auto">
                                <h1 className="fw-bold text-white mb-3">Welcome Back!</h1>
                                <p className="text-white opacity-75 mb-4">
                                    Already a registered provider? Log in with your account info.
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

                        <div className="overlay-panel overlay-right d-flex flex-column align-items-center justify-content-center text-center p-5">
                            <div className="brand-logo mb-auto align-self-start d-flex align-items-center gap-2">
                                <i className="bi bi-house-door-fill fs-4"></i>
                                <span className="fw-bold fs-5">SmartHome</span>
                            </div>
                            <div className="my-auto">
                                <h1 className="fw-bold text-white mb-3">Join as Partner!</h1>
                                <p className="text-white opacity-75 mb-4">
                                    Register as a service provider and expand your business with us.
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
                                Your provider account has been successfully created.
                                <br />
                                Please log in using your registered email and password.
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
