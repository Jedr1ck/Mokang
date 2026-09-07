import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import "../../index.css";
import background from "../../assets/images/hero-background.png";


const AdminAuth = () => {

    const navigate = useNavigate();

    const [isCreateMode, setIsCreateMode] = useState(
        () => !localStorage.getItem("adminAccount")
    );

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [passwordError, setPasswordError] = useState("");
    const [confirmError, setConfirmError] = useState("");

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

    const handleLogin = (e) => {

        e.preventDefault();

        if (!username.trim()) {
            alert("Please enter your username.");
            return;
        }

        if (!password) {
            alert("Please enter your password.");
            return;
        }

        const savedAdmin = JSON.parse(
            localStorage.getItem("adminAccount") || "null"
        );

        if (!savedAdmin) {
            alert("No admin account exists yet. Create the first admin account.");
            setIsCreateMode(true);
            return;
        }

        if (
            savedAdmin.username !== username.trim() ||
            savedAdmin.password !== password
        ) {
            alert("Invalid admin username or password.");
            return;
        }

        localStorage.setItem(
            "user",
            JSON.stringify({
                username: savedAdmin.username,
                role: "admin"
            })
        );

        navigate("/admin-dashboard");
    };


    // =========================================
    // CREATE ADMIN ACCOUNT
    // =========================================

    const handleCreateAdmin = (e) => {

        e.preventDefault();

        setPasswordError("");
        setConfirmError("");

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

            setConfirmError(
                "Passwords do not match."
            );

            return;
        }

        if (localStorage.getItem("adminAccount")) {
            alert("Only one admin account can be created.");
            setIsCreateMode(false);
            return;
        }

        localStorage.setItem(
            "adminAccount",
            JSON.stringify({
                username: username.trim(),
                password
            })
        );

        alert(
            "Admin account created successfully. You can now log in."
        );

        setIsCreateMode(false);

        setPassword("");
        setConfirmPassword("");
        setPasswordError("");
        setConfirmError("");
    };


    // =========================================
    // RESET FORM
    // =========================================

    const switchMode = () => {

        setIsCreateMode((prev) => !prev);

        setUsername("");
        setPassword("");
        setConfirmPassword("");

        setPasswordError("");
        setConfirmError("");
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
                        >
                            CREATE ADMIN
                        </button>


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

                                <button
                                    type="button"
                                    className="admin-outline-button"
                                    onClick={switchMode}
                                >
                                    CREATE ADMIN
                                </button>

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

            </div>

        </div>
    );
};

export default AdminAuth;