import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminExists, loginAdmin, registerAdmin } from "../../services/api";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import "../../index.css";
import background from "../../assets/images/hero-background.png";


const AdminAuth = () => {

    const navigate = useNavigate();

    const [isCreateMode, setIsCreateMode] = useState(true);

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [passwordError, setPasswordError] = useState("");
    const [confirmError, setConfirmError] = useState("");
    const [formError, setFormError] = useState("");
    const [adminAlreadyExists, setAdminAlreadyExists] = useState(false);

    // Registration success popup
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Do not check admin existence when the page loads.
    // The user should be able to fill out the Create Admin form.
    // The existing-admin check happens only when CREATE ADMIN is clicked.

    // =========================================
    // PASSWORD STRENGTH
    // =========================================

    const checkPasswordStrength = (value) => {

        let score = 0;

        if (value.length >= 8) {
            score++;
        }

        if (/[A-Z]/.test(value)) {
            score++;
        }

        if (/[a-z]/.test(value)) {
            score++;
        }

        if (/[0-9]/.test(value)) {
            score++;
        }

        if (/[^A-Za-z0-9]/.test(value)) {
            score++;
        }

        return score;
    };

    const passwordScore = checkPasswordStrength(password);

    const isStrongPassword = passwordScore === 5;


    // =========================================
    // PASSWORD MESSAGE
    // =========================================

    const getPasswordMessage = () => {

        if (!password) {
            return "";
        }

        if (password.length < 8) {
            return "At least 8 characters";
        }

        if (!/[A-Z]/.test(password)) {
            return "Add at least one uppercase letter";
        }

        if (!/[a-z]/.test(password)) {
            return "Add at least one lowercase letter";
        }

        if (!/[0-9]/.test(password)) {
            return "Add at least one number";
        }

        if (!/[^A-Za-z0-9]/.test(password)) {
            return "Add at least one special character";
        }

        return "Strong password";
    };


    // =========================================
    // PASSWORD CHANGE
    // =========================================

    const handlePasswordChange = (e) => {

        const value = e.target.value;

        setPassword(value);

        setPasswordError("");

        if (confirmPassword && value !== confirmPassword) {
            setConfirmError("Passwords do not match.");
        } else {
            setConfirmError("");
        }
    };


    // =========================================
    // CONFIRM PASSWORD
    // =========================================

    const handleConfirmPasswordChange = (e) => {

        const value = e.target.value;

        setConfirmPassword(value);

        if (password !== value) {
            setConfirmError("Passwords do not match.");
        } else {
            setConfirmError("");
        }
    };


    // =========================================
    // LOGIN
    // =========================================

    const handleLogin = async (e) => {

        e.preventDefault();

        if (!username.trim()) {
            alert("Please enter your username.");
            return;
        }

        if (!password) {
            alert("Please enter your password.");
            return;
        }

        setFormError("");
        try {
            await loginAdmin(username.trim(), password);
            navigate("/admin-dashboard");
        } catch (error) {
            setFormError(error.message);
        }
    };


    // =========================================
    // CREATE ADMIN ACCOUNT
    // =========================================

    const handleCreateAdmin = async (e) => {
        e.preventDefault();

        setPasswordError("");
        setConfirmError("");
        setFormError("");

        if (!username.trim()) {
            alert("Please enter an admin username.");
            return;
        }

        if (!isStrongPassword) {
            setPasswordError(
                "Password must contain at least 8 characters, uppercase, lowercase, number, and special character."
            );
            return;
        }

        if (password !== confirmPassword) {
            setConfirmError("Passwords do not match.");
            return;
        }

        try {
            // Check if an admin already exists ONLY after
            // the user clicks CREATE ADMIN.
            const { exists } = await adminExists();

            if (exists) {
                setFormError(
                    "An admin account already exists. This account cannot be registered."
                );

                return;
            }

            // Only create the account if there is no existing admin.
            await registerAdmin(username.trim(), password);

            setAdminAlreadyExists(true);
            setIsCreateMode(false);

            setPassword("");
            setConfirmPassword("");
            setPasswordError("");
            setConfirmError("");
            setFormError("");

            setShowSuccessModal(true);

        } catch (error) {
            setFormError(
                error.message || "Unable to create admin account."
            );
        }
    };


    // =========================================
    // RESET FORM
    // =========================================

    const switchMode = () => {

        setShowSuccessModal(false);

        // Only one administrator account is allowed.
        // Do not allow the user to return to Create Admin
        // once an administrator already exists.
        if (adminAlreadyExists) {
            setIsCreateMode(false);
            setPassword("");
            setConfirmPassword("");
            setPasswordError("");
            setConfirmError("");
            setFormError("An admin account already exists. Please log in.");
            return;
        }

        setIsCreateMode((prev) => !prev);

        setUsername("");
        setPassword("");
        setConfirmPassword("");

        setPasswordError("");
        setConfirmError("");
        setFormError("");
    };


    return (

        <div
            className="admin-auth-page"
            style={{
                backgroundImage: `url(${background})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat"
            }}
        >

            <div
                className={`admin-auth-container ${isCreateMode
                    ? "admin-create-active"
                    : ""
                    }`}
            >

                {/* =================================
                    ADMIN LOGIN
                ================================== */}

                <div className="admin-form-container admin-login-container">

                    <form
                        onSubmit={handleLogin}
                        className="admin-auth-form"
                    >

                        <div className="admin-icon-circle">

                            <i className="bi bi-shield-lock-fill"></i>

                        </div>

                        <h1>
                            Admin Login
                        </h1>

                        <p>
                            Sign in to access the administrator dashboard.
                        </p>


                        {/* USERNAME */}

                        <div className="admin-input-group">

                            <i className="bi bi-person"></i>

                            <input
                                type="text"
                                placeholder="Admin Username"
                                value={username}
                                onChange={(e) =>
                                    setUsername(e.target.value)
                                }
                                required
                            />

                        </div>


                        {/* PASSWORD */}

                        <div className="admin-input-group">

                            <i className="bi bi-lock"></i>

                            <input
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                placeholder="Password"
                                value={password}
                                onChange={handlePasswordChange}
                                required
                            />

                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() =>
                                    setShowPassword(
                                        !showPassword
                                    )
                                }
                            >

                                <i
                                    className={
                                        showPassword
                                            ? "bi bi-eye-slash"
                                            : "bi bi-eye"
                                    }
                                ></i>

                            </button>

                        </div>


                        <button
                            type="submit"
                            className="admin-main-button"
                        >
                            LOG IN
                        </button>

                        {formError && (
                            <div className="admin-error">
                                <i className="bi bi-exclamation-triangle-fill"></i>
                                {formError}
                            </div>
                        )}


                        <small className="admin-security-note">

                            <i className="bi bi-shield-check"></i>

                            Authorized administrators only

                        </small>

                    </form>

                </div>


                {/* =================================
                    CREATE ADMIN
                ================================== */}

                <div className="admin-form-container admin-create-container">

                    <form
                        onSubmit={handleCreateAdmin}
                        className="admin-auth-form"
                    >

                        <div className="admin-icon-circle">

                            <i className="bi bi-person-plus-fill"></i>

                        </div>

                        <h1>
                            Create Admin
                        </h1>

                        <p>
                            Create an administrator account.
                        </p>


                        {/* USERNAME */}

                        <div className="admin-input-group">

                            <i className="bi bi-person"></i>

                            <input
                                type="text"
                                placeholder="Admin Username"
                                value={username}
                                onChange={(e) =>
                                    setUsername(e.target.value)
                                }
                                required
                            />

                        </div>


                        {/* PASSWORD */}

                        <div className="admin-input-group">

                            <i className="bi bi-lock"></i>

                            <input
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                placeholder="Create Strong Password"
                                value={password}
                                onChange={handlePasswordChange}
                                required
                            />

                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() =>
                                    setShowPassword(
                                        !showPassword
                                    )
                                }
                            >

                                <i
                                    className={
                                        showPassword
                                            ? "bi bi-eye-slash"
                                            : "bi bi-eye"
                                    }
                                ></i>

                            </button>

                        </div>


                        {/* PASSWORD STRENGTH */}

                        {password && (

                            <div className="password-strength-box">

                                <div className="password-bars">

                                    {[1, 2, 3, 4, 5].map(
                                        (bar) => (

                                            <span
                                                key={bar}
                                                className={
                                                    bar <= passwordScore
                                                        ? "strength-active"
                                                        : ""
                                                }
                                            ></span>

                                        )
                                    )}

                                </div>

                                <small
                                    className={
                                        isStrongPassword
                                            ? "strong-text"
                                            : ""
                                    }
                                >
                                    {getPasswordMessage()}
                                </small>

                            </div>

                        )}


                        {passwordError && (

                            <div className="admin-error">

                                <i className="bi bi-exclamation-circle"></i>

                                {passwordError}

                            </div>

                        )}


                        {/* CONFIRM PASSWORD */}

                        <div className="admin-input-group">

                            <i className="bi bi-lock-fill"></i>

                            <input
                                type={
                                    showConfirmPassword
                                        ? "text"
                                        : "password"
                                }
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                onChange={
                                    handleConfirmPasswordChange
                                }
                                required
                            />

                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() =>
                                    setShowConfirmPassword(
                                        !showConfirmPassword
                                    )
                                }
                            >

                                <i
                                    className={
                                        showConfirmPassword
                                            ? "bi bi-eye-slash"
                                            : "bi bi-eye"
                                    }
                                ></i>

                            </button>

                        </div>


                        {confirmError && (

                            <div className="admin-error">

                                <i className="bi bi-exclamation-circle"></i>

                                {confirmError}

                            </div>

                        )}


                        <button
                            type="submit"
                            className="admin-main-button"
                            disabled={adminAlreadyExists}
                        >
                            CREATE ADMIN
                        </button>

                        {formError && (
                            <div className="admin-error">
                                <i className="bi bi-exclamation-triangle-fill"></i>
                                {formError}
                            </div>
                        )}


                        <small className="admin-security-note">

                            <i className="bi bi-shield-lock"></i>

                            Strong password required

                        </small>

                    </form>

                </div>


                {/* =================================
                    OVERLAY
                ================================== */}

                <div className="admin-overlay-container">

                    <div className="admin-overlay">


                        {/* LOGIN SIDE */}

                        <div className="admin-overlay-panel admin-overlay-left">

                            <div className="admin-brand">

                                <i className="bi bi-house-door-fill"></i>

                                <span>
                                    SmartHome
                                </span>

                            </div>


                            <div className="admin-overlay-content">

                                <div className="admin-overlay-icon">

                                    <i className="bi bi-shield-check"></i>

                                </div>

                                <h2>
                                    Administrator
                                </h2>

                                <p>
                                    Manage the SmartHome platform,
                                    users, providers, bookings,
                                    and system activities.
                                </p>

                                {!adminAlreadyExists && (
                                    <button
                                        type="button"
                                        className="admin-outline-button"
                                        onClick={switchMode}
                                    >
                                        CREATE ADMIN
                                    </button>
                                )}

                            </div>

                        </div>


                        {/* CREATE SIDE */}

                        <div className="admin-overlay-panel admin-overlay-right">

                            <div className="admin-brand">

                                <i className="bi bi-house-door-fill"></i>

                                <span>
                                    SmartHome
                                </span>

                            </div>


                            <div className="admin-overlay-content">

                                <div className="admin-overlay-icon">

                                    <i className="bi bi-person-plus"></i>

                                </div>

                                <h2>
                                    Welcome, Developer!
                                </h2>

                                <p>
                                    Create the administrator
                                    credentials that will be used
                                    to access the admin dashboard.
                                </p>

                                <button
                                    type="button"
                                    className="admin-outline-button"
                                    onClick={switchMode}
                                >
                                    ADMIN LOGIN
                                </button>

                            </div>

                        </div>

                    </div>

                </div>

                {/* =================================
                    REGISTRATION SUCCESS POPUP
                ================================== */}

                {showSuccessModal && (
                    <div
                        className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                        style={{
                            backgroundColor: "rgba(21, 59, 41, 0.45)",
                            backdropFilter: "blur(4px)",
                            WebkitBackdropFilter: "blur(4px)",
                            zIndex: 9999,
                            padding: "20px"
                        }}
                    >
                        <div
                            className="bg-white text-center rounded-4 shadow-lg"
                            style={{
                                width: "420px",
                                maxWidth: "100%",
                                padding: "36px 30px"
                            }}
                        >
                            <div
                                className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-3"
                                style={{
                                    width: "70px",
                                    height: "70px",
                                    backgroundColor: "#e5f7ef",
                                    color: "#168b5a",
                                    fontSize: "34px"
                                }}
                            >
                                <i className="bi bi-check-lg"></i>
                            </div>

                            <h2
                                className="fw-bold mb-2"
                                style={{ color: "#153b29" }}
                            >
                                Registration Successful!
                            </h2>

                            <p
                                className="mb-1"
                                style={{
                                    color: "#68766d",
                                    fontSize: "14px",
                                    lineHeight: "1.6"
                                }}
                            >
                                Your administrator account has been created
                                successfully.
                            </p>

                            <p
                                className="mb-0"
                                style={{
                                    color: "#8a948e",
                                    fontSize: "13px"
                                }}
                            >
                                You can now log in using your admin credentials.
                            </p>

                            <button
                                type="button"
                                className="btn w-100 mt-4 fw-bold text-white"
                                style={{
                                    backgroundColor: "#168b5a",
                                    borderRadius: "8px",
                                    padding: "12px 20px"
                                }}
                                onClick={() => {
                                    setShowSuccessModal(false);
                                    setAdminAlreadyExists(true);
                                    setIsCreateMode(false);
                                    setPassword("");
                                    setConfirmPassword("");
                                    setFormError("");
                                    setPasswordError("");
                                    setConfirmError("");
                                }}
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

export default AdminAuth;