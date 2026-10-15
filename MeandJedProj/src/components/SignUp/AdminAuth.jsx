import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginAdmin } from "../../services/api";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import "../../index.css";
import background from "../../assets/images/hero-background.png";

const AdminAuth = () => {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [formError, setFormError] = useState("");
    const [loading, setLoading] = useState(false);

    // =========================================
    // ADMIN LOGIN
    // =========================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        setFormError("");

        if (!username.trim()) {
            setFormError("Please enter an admin username.");
            return;
        }

        if (!password) {
            setFormError("Please enter your password.");
            return;
        }

        setLoading(true);

        try {
            await loginAdmin(username.trim(), password);

            navigate("/admin-dashboard");
        } catch (error) {
            setFormError(
                error?.message ||
                "Invalid admin username or password."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="admin-auth-page"
            style={{
                backgroundImage: `url(${background})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
            }}
        >

            <div className="admin-auth-container">

                {/* =====================================================
                    WHITE SIDE - ADMIN LOGIN
                ====================================================== */}

                <div className="admin-form-container admin-login-container">

                    <form
                        onSubmit={handleSubmit}
                        className="admin-auth-form"
                    >

                        {/* ADMIN ICON */}

                        <div className="admin-icon-circle">

                            <i className="bi bi-shield-lock-fill"></i>

                        </div>


                        {/* TITLE */}

                        <h1>
                            Admin Login
                        </h1>

                        <p>
                            Sign in to access the administrator dashboard.
                        </p>


                        {/* =================================================
                            USERNAME
                        ================================================== */}

                        <div className="admin-input-group">

                            <i className="bi bi-person"></i>

                            <input
                                type="text"
                                placeholder="Admin Username"
                                value={username}
                                onChange={(e) => {
                                    setUsername(e.target.value);
                                    setFormError("");
                                }}
                                autoComplete="username"
                                required
                            />

                        </div>


                        {/* =================================================
                            PASSWORD
                        ================================================== */}

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
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setFormError("");
                                }}
                                autoComplete="current-password"
                                required
                            />

                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() =>
                                    setShowPassword(!showPassword)
                                }
                                aria-label={
                                    showPassword
                                        ? "Hide password"
                                        : "Show password"
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

                        {/* =================================================
                            ERROR MESSAGE
                        ================================================== */}

                        {formError && (

                            <div className="admin-error">

                                <i className="bi bi-exclamation-triangle-fill"></i>

                                <span>
                                    {formError}
                                </span>

                            </div>

                        )}


                        {/* =================================================
                            LOGIN BUTTON
                        ================================================== */}

                        <button
                            type="submit"
                            className="admin-main-button"
                            disabled={loading}
                        >

                            {loading
                                ? "LOGGING IN..."
                                : "LOG IN"}

                        </button>

                        {/* =================================================
                            SECURITY NOTE
                        ================================================== */}

                        <small className="admin-security-note">

                            <i className="bi bi-shield-check"></i>

                            Authorized administrators only

                        </small>

                    </form>

                </div>


                {/* =====================================================
                    GREEN SIDE - ADMIN INFORMATION
                ====================================================== */}

                <div className="admin-overlay-container">

                    <div className="admin-overlay">

                        <div className="admin-overlay-panel admin-overlay-left">

                            {/* =================================================
                                SMART HOME BRAND
                            ================================================== */}

                            <div className="admin-brand">

                                <i className="bi bi-house-door-fill"></i>

                                <span>
                                    SmartHome
                                </span>

                            </div>


                            {/* =================================================
                                ADMIN INFORMATION
                            ================================================== */}

                            <div className="admin-overlay-content">

                                {/* ADMIN ICON */}

                                <div className="admin-overlay-icon">

                                    <i className="bi bi-shield-check"></i>

                                </div>


                                {/* TITLE */}

                                <h2>
                                    Administrator
                                </h2>


                                {/* DESCRIPTION */}

                                <p>
                                    Manage and oversee the SmartHome
                                    platform, users, service providers,
                                    bookings, and system activities.
                                </p>


                                {/* =================================================
                                    ADMIN INFORMATION LIST
                                ================================================== */}

                                <div className="admin-info-list">

                                    {/* USER MANAGEMENT */}

                                    <div className="admin-info-item">

                                        <i className="bi bi-people-fill"></i>

                                        <div>

                                            <strong>
                                                User Management
                                            </strong>

                                            <span>
                                                Manage Homeowner and
                                                Provider accounts.
                                            </span>

                                        </div>

                                    </div>


                                    {/* BOOKING MANAGEMENT */}

                                    <div className="admin-info-item">

                                        <i className="bi bi-calendar-check-fill"></i>

                                        <div>

                                            <strong>
                                                Booking Management
                                            </strong>

                                            <span>
                                                Monitor and manage
                                                service bookings.
                                            </span>

                                        </div>

                                    </div>


                                    {/* SERVICE MANAGEMENT */}

                                    <div className="admin-info-item">

                                        <i className="bi bi-tools"></i>

                                        <div>

                                            <strong>
                                                Service Management
                                            </strong>

                                            <span>
                                                Manage services and
                                                service providers.
                                            </span>

                                        </div>

                                    </div>


                                    {/* REPORTS */}

                                    <div className="admin-info-item">

                                        <i className="bi bi-bar-chart-fill"></i>

                                        <div>

                                            <strong>
                                                Reports & Monitoring
                                            </strong>

                                            <span>
                                                Review system activities
                                                and reports.
                                            </span>

                                        </div>

                                    </div>


                                    {/* SECURITY */}

                                    <div className="admin-info-item">

                                        <i className="bi bi-shield-lock-fill"></i>

                                        <div>

                                            <strong>
                                                Secure Access
                                            </strong>

                                            <span>
                                                Administrator access is
                                                restricted to authorized
                                                personnel only.
                                            </span>

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
};

export default AdminAuth;