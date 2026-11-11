import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginAdmin } from "../../services/api";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import "../../index.css";
import background from "../../assets/images/hero-background.png";

const adminFeatures = [
    {
        id: "accounts",
        icon: "bi-people-fill",
        title: "Account Management",
        summary: "Homeowner and provider accounts",
        details: "Review account information and provider verification status, and manage platform users.",
    },
    {
        id: "bookings",
        icon: "bi-calendar-check-fill",
        title: "Booking Management",
        summary: "Service bookings and their status",
        details: "View booking details and follow each service request through its current status.",
    },
    {
        id: "services",
        icon: "bi-tools",
        title: "Services",
        summary: "Categories and provider services",
        details: "Review service categories and the services offered by providers on the platform.",
    },
    {
        id: "reports",
        icon: "bi-bar-chart-fill",
        title: "Feedback & Analytics",
        summary: "Reviews, complaints, and reports",
        details: "Review customer feedback and complaints, and view platform activity through analytics.",
    },
];

const AdminAuth = () => {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [formError, setFormError] = useState("");
    const [loading, setLoading] = useState(false);
    const [selectedFeatureId, setSelectedFeatureId] = useState(null);
    const selectedFeature = adminFeatures.find(
        (feature) => feature.id === selectedFeatureId
    );

    // =========================================
    // ADMIN LOGIN
    // =========================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        setFormError("");

        if (!username.trim()) {
            setFormError("Please enter your admin username or email.");
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
                                placeholder="Admin Username or Email"
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
                                    HANDYMAN BRAND
                            ================================================== */}

                            <div className="admin-brand">

                                <i className="bi bi-house-door-fill"></i>

                                <span>
                                    HandyMan
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


                                <p>
                                    A quick overview of the main tools available to administrators.
                                </p>

                                <span className="admin-info-hint">
                                    Select a topic to learn more. Information only.
                                </span>

                                <div className="admin-info-list" aria-label="Administrator tools">
                                    {adminFeatures.map((feature) => {
                                        const isSelected = selectedFeatureId === feature.id;

                                        return (
                                            <button
                                                type="button"
                                                className={`admin-info-item${isSelected ? " is-selected" : ""}`}
                                                key={feature.id}
                                                onClick={() => setSelectedFeatureId(
                                                    isSelected ? null : feature.id
                                                )}
                                                aria-expanded={isSelected}
                                                aria-controls="admin-feature-details"
                                            >
                                                <i className={`bi ${feature.icon}`} aria-hidden="true"></i>
                                                <span className="admin-info-copy">
                                                    <strong>{feature.title}</strong>
                                                    <span>{feature.summary}</span>
                                                </span>
                                                <i
                                                    className={`bi ${isSelected ? "bi-chevron-up" : "bi-chevron-down"} admin-info-chevron`}
                                                    aria-hidden="true"
                                                ></i>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div
                                    className="admin-info-details"
                                    id="admin-feature-details"
                                    aria-live="polite"
                                    hidden={!selectedFeature}
                                >
                                    {selectedFeature && (
                                        <>
                                        <strong>{selectedFeature.title}</strong>
                                        <p>{selectedFeature.details}</p>
                                        </>
                                    )}
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
