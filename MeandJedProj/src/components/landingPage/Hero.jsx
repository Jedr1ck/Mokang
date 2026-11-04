import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import background from "../../assets/images/hero-background.png";
import { getProviders, getPublicStats } from "../../services/api";

function Hero() {
    const [showPanel, setShowPanel] = useState(false);
    const [userCount, setUserCount] = useState(null);
    const [trustedProviders, setTrustedProviders] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        getPublicStats()
            .then(({ userCount: count }) => setUserCount(count))
            .catch((error) => {
                console.error("Unable to load public user count:", error);
                setUserCount(0);
            });
        getProviders()
            .then((providers) => setTrustedProviders(providers.slice(0, 4)))
            .catch((error) => {
                console.error("Unable to load public provider profiles:", error);
                setTrustedProviders([]);
            });
    }, []);

    const getProviderInitials = (name = "Provider") => (
        name.split(/\s+/).filter(Boolean).slice(0, 2)
            .map((part) => part[0].toUpperCase()).join("")
    );

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
                        {trustedProviders.map((provider) => (
                            <span
                                className="trusted-user-avatar"
                                key={provider.id}
                                title={provider.name}
                            >
                                {provider.image ? (
                                    <img src={provider.image} alt={provider.name} />
                                ) : (
                                    getProviderInitials(provider.name)
                                )}
                            </span>
                        ))}
                    </div>

                    <p>
                        Trusted by {userCount ?? "..."} homeowners and service providers
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