import background from "../../assets/images/hero-background.png";

function CTA() {
    // Handler para mag-scroll paitaas sa tuktok ng pahina
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth" // Swabe ang pag-scroll paitaas
        });
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
                    Join thousands of happy homeowner
                    <br />
                    and verified professionals today
                </p>

                <div className="cta-buttons">
                    <button className="btn btn-brand" onClick={scrollToTop}>
                        Find a Service
                    </button>

                    <button className="btn btn-brand-outline" onClick={scrollToTop}>
                        Become a Provider
                    </button>
                </div>
            </div>
        </section>
    );
}

export default CTA;