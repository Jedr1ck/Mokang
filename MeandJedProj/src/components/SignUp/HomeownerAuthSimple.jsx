import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../index.css';
import background from '../../assets/images/hero-background.png';
import { login, register } from '../../services/api';

const HomeownerAuthSimple = () => {
    const navigate = useNavigate();

    const [isSignUp, setIsSignUp] = useState(false);

    // Login states
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [showLoginPassword, setShowLoginPassword] = useState(false);

    // Registration states
    const [passwordError, setPasswordError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Registration success modal
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    // HANDLE REGISTRATION INPUT
    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;

        const sanitizedValue =
            name === 'fullName'
                ? value.replace(/[^A-Za-z. ]/g, '')
                : value;

        setFormData((previous) => ({
            ...previous,
            [name]: type === 'checkbox' ? checked : sanitizedValue
        }));

        if (name === 'password' || name === 'confirmPassword') {
            setPasswordError('');
        }
    };

    // HOMEOWNER REGISTRATION
    const handleRegisterSubmit = async (event) => {
        event.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setPasswordError(
                'Hindi nagtutugma ang Password at Confirm Password.'
            );
            return;
        }

        try {
            setPasswordError('');

            const response = await register({
                full_name: formData.fullName.trim(),
                email: formData.email.trim(),
                password: formData.password,
                role: 'homeowner'
            });

            const account = {
                ...response.user,
                role: response.user.role || 'homeowner'
            };

            // Save account information locally.
            // The user must log in before entering the dashboard.
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

                localStorage.setItem(
                    'savedAccounts',
                    JSON.stringify(savedAccounts)
                );
            } else {
                localStorage.setItem(
                    'savedAccounts',
                    JSON.stringify([...savedAccounts, account])
                );
            }

            // Place registered email in the login form.
            setLoginEmail(formData.email.trim());
            setLoginPassword('');
            setLoginError('');

            // Switch to login and show success modal.
            setIsSignUp(false);
            setShowSuccessModal(true);
        } catch (error) {
            alert(
                error.message ||
                'Hindi matagumpay ang registration. Pakisubukan ulit.'
            );
        }
    };

    // HOMEOWNER LOGIN
    const handleLoginSubmit = async (event) => {
        event.preventDefault();
        setLoginError('');

        try {
            const response = await login(
                loginEmail.trim(),
                loginPassword
            );

            const account = {
                ...response.user,
                role: response.user.role || 'homeowner'
            };

            // Save authenticated user only after successful login.
            localStorage.setItem(
                'user',
                JSON.stringify(account)
            );

            localStorage.setItem(
                'access_token',
                response.access_token
            );

            // Update saved accounts.
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

                localStorage.setItem(
                    'savedAccounts',
                    JSON.stringify(savedAccounts)
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

            // Navigate only after successful login.
            navigate('/homeowner-dashboard');
        } catch (error) {
            // Same message regardless of which credential is incorrect.
            setLoginError('Invalid email or password.');
        }
    };

    // SWITCH LOGIN / SIGN UP
    const toggleForm = () => {
        setIsSignUp((previous) => !previous);
        setPasswordError('');
        setLoginError('');
    };

    // SUCCESS MODAL OK BUTTON
    const handleSuccessModalOk = () => {
        setShowSuccessModal(false);
        setIsSignUp(false);
        setLoginPassword('');
        setLoginError('');
    };

    return (
        <div
            className="auth-body d-flex justify-content-center align-items-center"
            style={{
                backgroundImage: `url(${background})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}
        >
            <div
                className={`auth-container ${isSignUp ? 'right-panel-active' : ''
                    }`}
            >
                {/* SIGN UP FORM */}
                <div className="form-container sign-up-container">
                    <form
                        onSubmit={handleRegisterSubmit}
                        className="d-flex flex-column align-items-center justify-content-center h-100 px-4 text-center"
                    >
                        <h2 className="fw-bold mb-2 theme-text">
                            Create Account
                        </h2>

                        <span className="small text-muted mb-2">
                            or use your details for homeowner registration:
                        </span>

                        {/* FULL NAME */}
                        <input
                            className="form-control bg-light border-0 mb-2"
                            type="text"
                            name="fullName"
                            placeholder="Full Name"
                            value={formData.fullName}
                            onChange={handleChange}
                            pattern="[A-Za-z. ]+"
                            title="Full Name must contain letters, spaces, and periods only."
                            minLength={2}
                            maxLength={150}
                            required
                        />

                        {/* EMAIL */}
                        <input
                            className="form-control bg-light border-0 mb-2"
                            type="email"
                            name="email"
                            placeholder="Email Address"
                            value={formData.email}
                            onChange={handleChange}
                            pattern="[^@\s]+@[^@\s]+\.[^@\s]+"
                            title="Enter a valid email address, such as name@example.com."
                            required
                        />

                        {/* PASSWORD */}
                        <div className="password-input-wrapper mb-2">
                            <input
                                className="form-control bg-light border-0 password-input"
                                type={
                                    showPassword ? 'text' : 'password'
                                }
                                name="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                                minLength={8}
                                maxLength={128}
                                pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,128}"
                                title="Password must contain uppercase and lowercase letters, a number, and a special character. Minimum 8 characters."
                                required
                            />

                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() =>
                                    setShowPassword(
                                        (previous) => !previous
                                    )
                                }
                                aria-label={
                                    showPassword
                                        ? 'Hide password'
                                        : 'Show password'
                                }
                                title={
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
                        <div className="password-input-wrapper mb-2">
                            <input
                                className="form-control bg-light border-0 password-input"
                                type={
                                    showConfirmPassword
                                        ? 'text'
                                        : 'password'
                                }
                                name="confirmPassword"
                                placeholder="Confirm Password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                minLength={8}
                                maxLength={128}
                                required
                            />

                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() =>
                                    setShowConfirmPassword(
                                        (previous) => !previous
                                    )
                                }
                                aria-label={
                                    showConfirmPassword
                                        ? 'Hide confirm password'
                                        : 'Show confirm password'
                                }
                                title={
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

                        {/* REGISTRATION PASSWORD ERROR */}
                        {passwordError && (
                            <div
                                className="text-danger small mb-1"
                                role="alert"
                            >
                                {passwordError}
                            </div>
                        )}

                        {/* SIGN UP BUTTON */}
                        <button
                            type="submit"
                            className="btn btn-theme rounded-pill px-5 py-2 fw-bold text-white"
                        >
                            Sign up
                        </button>
                    </form>
                </div>

                {/* LOGIN FORM */}
                <div className="form-container sign-in-container">
                    <form
                        onSubmit={handleLoginSubmit}
                        className="d-flex flex-column align-items-center justify-content-center h-100 px-5 text-center"
                    >
                        <h1 className="fw-bold mb-3 theme-text">
                            Log in
                        </h1>

                        <span className="small text-muted mb-3">
                            or use your homeowner account:
                        </span>

                        {/* LOGIN EMAIL */}
                        <input
                            className="form-control bg-light border-0 mb-3"
                            type="email"
                            placeholder="Email"
                            value={loginEmail}
                            onChange={(event) => {
                                setLoginEmail(event.target.value);
                                setLoginError('');
                            }}
                            required
                        />

                        {/* LOGIN PASSWORD */}
                        <div className="password-input-wrapper mb-2">
                            <input
                                className="form-control bg-light border-0 password-input"
                                type={
                                    showLoginPassword
                                        ? 'text'
                                        : 'password'
                                }
                                placeholder="Password"
                                value={loginPassword}
                                onChange={(event) => {
                                    setLoginPassword(event.target.value);
                                    setLoginError('');
                                }}
                                required
                            />

                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() =>
                                    setShowLoginPassword(
                                        (previous) => !previous
                                    )
                                }
                                aria-label={
                                    showLoginPassword
                                        ? 'Hide password'
                                        : 'Show password'
                                }
                                title={
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

                        {/* GENERIC LOGIN ERROR */}
                        {loginError && (
                            <div
                                className="text-danger small mb-3"
                                role="alert"
                            >
                                {loginError}
                            </div>
                        )}

                        {/* LOGIN BUTTON */}
                        <button
                            type="submit"
                            className="btn btn-theme rounded-pill px-5 py-2 fw-bold text-white"
                        >
                            Log in
                        </button>
                    </form>
                </div>

                {/* SIDE OVERLAY */}
                <div className="overlay-container">
                    <div className="overlay">
                        {/* LEFT PANEL */}
                        <div className="overlay-panel overlay-left d-flex flex-column align-items-center justify-content-center text-center p-5">
                            <h1 className="fw-bold text-white mb-3">
                                Welcome Back!
                            </h1>

                            <p className="text-white opacity-75 mb-4">
                                To keep connected with us please login
                                with your personal info.
                            </p>

                            <button
                                type="button"
                                className="btn btn-outline-light rounded-pill px-5 py-2 fw-bold"
                                onClick={toggleForm}
                            >
                                Log in
                            </button>
                        </div>

                        {/* RIGHT PANEL */}
                        <div className="overlay-panel overlay-right d-flex flex-column align-items-center justify-content-center text-center p-5">
                            <h1 className="fw-bold text-white mb-3">
                                Hello, Friend!
                            </h1>

                            <p className="text-white opacity-75 mb-4">
                                Enter your personal details and start
                                your journey with us.
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

                {/* REGISTRATION SUCCESS MODAL */}
                {showSuccessModal && (
                    <div
                        className="registration-success-overlay"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="registration-success-title"
                    >
                        <div className="registration-success-modal">
                            {/* SUCCESS ICON */}
                            <div className="registration-success-icon">
                                <i className="bi bi-check-lg"></i>
                            </div>

                            {/* TITLE */}
                            <h3 id="registration-success-title">
                                Registration Successful!
                            </h3>

                            {/* MESSAGE */}
                            <p>
                                Your homeowner account has been
                                successfully created.
                                <br />
                                Please log in using your registered
                                email and password.
                            </p>

                            {/* OK BUTTON */}
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

export default HomeownerAuthSimple;