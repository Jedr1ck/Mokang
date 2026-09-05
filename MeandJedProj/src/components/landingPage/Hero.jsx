import { useState } from "react";
import { useNavigate } from "react-router-dom";
import background from "../../assets/images/hero-background.png";

function Hero() {
    const [showPanel, setShowPanel] = useState(false);
    const navigate = useNavigate();

    return (
        <section
            id="home"
            className={`hero-section ${showPanel ? "panel-open" : ""}`}
            style={{ backgroundImage: `url(${background})` }}
        >
            {/* Dark overlay */}
            <div className="hero-overlay"></div>

            {/* LEFT HERO CONTENT */}
            <div className="hero-content">
                <p className="hero-small-title">
                    Smart Home Service Matching
                </p>

                <h1>
                    Find the Right Home
                    <br />{" "}
                    Service, <span>Right When</span>
                    <br />{" "}
                    <span>You Need It.</span>
                </h1>

                <p className="hero-description">
                    Connect with verified service providers for
                    <br />
                    reliable home services all in one
                    <br />
                    convenient platform
                </p>

                <div className="hero-buttons">
                    {/* Find a Service -> Lilipat sa Homeowner Auth */}
                    <button
                        className="btn btn-brand"
                        onClick={() => navigate('/auth/homeowner')}
                    >
                        Find a Service
                    </button>

                    {/* Become a Provider -> Lilipat sa Provider Auth */}
                    <button
                        className="btn btn-brand-outline"
                        onClick={() => navigate('/auth/provider')}
                    >
                        Become a Provider
                    </button>
                </div>
            </div>

            {/* SIDE PANEL */}
            <div className={`hero-side-panel ${showPanel ? "show" : ""}`}>
                <div className="feature-item">
                    <div className="feature-icon">▦</div>
                    <h3>Easily Booking</h3>
                </div>

                <div className="feature-item">
                    <div className="feature-icon">🔒</div>
                    <h3>Secure And Reliable</h3>
                </div>

                <div className="feature-item">
                    <div className="feature-icon">♢</div>
                    <h3>Verified Providers</h3>
                </div>

                <div className="trusted-users">
                    <div className="user-circles">
                        <span>👩</span>
                        <span>👨</span>
                        <span>👩</span>
                        <span>👩</span>
                    </div>

                    <p>
                        Trusted by 2000+ HomeOwners and ServiceProvider
                    </p>
                </div>
            </div>

            {/* ARROW */}
            <button
                className="hero-panel-toggle"
                onClick={() => setShowPanel((isOpen) => !isOpen)}
                aria-label={showPanel ? "Close features panel" : "Open features panel"}
                aria-expanded={showPanel}
                title={showPanel ? "Back to hero" : "Show features"}
            >
                {showPanel ? "→" : "←"}
            </button>

            {/* DOWN ARROW */}
            <div className="hero-scroll">
                ↓
            </div>
        </section>
    );
}

export default Hero;