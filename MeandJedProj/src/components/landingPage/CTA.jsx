
import { useNavigate } from "react-router-dom";
import background from "../../assets/images/hero-background.png";

function CTA() {
    const navigate = useNavigate();

    const handleFindService = () => {
        navigate("/auth/homeowner");
    };

    const handleBecomeProvider = () => {
        navigate("/auth/provider");
    };

    return (
        <section
            id="contact"
            className="cta-section"
            style={{ backgroundImage: `url(${background})` }}
        >
            <div className="cta-overlay"></div>

            <div className="cta-content">
                <h2>
                    Ready to Find the
                    <br />
                    Right Home Service?
                </h2>

                <p>
                    Join thousands of happy homeowners
                    <br />
                    and verified professionals today
                </p>

                <div className="cta-buttons">
                    <button
                        type="button"
                        className="btn btn-brand"
                        onClick={handleFindService}
                    >
                        Find a Service
                    </button>

                    <button
                        type="button"
                        className="btn btn-brand-outline"
                        onClick={handleBecomeProvider}
                    >
                        Become a Provider
                    </button>
                </div>
            </div>
        </section>
    );
}

export default CTA;
