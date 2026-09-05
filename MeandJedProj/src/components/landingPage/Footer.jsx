import logo from "../../assets/images/logo.png";

function Footer() {
    return (
        <footer className="footer">
            <div className="footer-brand">
                <div className="footer-logo-lockup">
                    <img src={logo} alt="SmartHome" />
                    <div className="footer-brand-copy">
                        <strong>SmartHome</strong>
                        <span>Service Matching</span>
                    </div>
                </div>

                <p>
                    Simple. Convenient.
                    <br />
                    Reliable. Efficient.
                </p>

                <div className="socials">
                    <a href="https://www.facebook.com" aria-label="Facebook" target="_blank" rel="noreferrer">
                        <i className="bi bi-facebook" aria-hidden="true"></i>
                    </a>
                    <a href="https://www.instagram.com" aria-label="Instagram" target="_blank" rel="noreferrer">
                        <i className="bi bi-instagram" aria-hidden="true"></i>
                    </a>
                    <a href="https://t.me" aria-label="Telegram" target="_blank" rel="noreferrer">
                        <i className="bi bi-telegram" aria-hidden="true"></i>
                    </a>
                </div>
            </div>

            <div className="footer-column">
                <h3>Quick Links</h3>
                <a href="#home">Home</a>
                <a href="#services">Services</a>
                <a href="#how-it-works">How It Works</a>
                <a href="#about">About Us</a>
                <a href="#contact">Contact</a>
            </div>

            <div className="footer-column">
                <h3>For Users</h3>
                <a href="#services">Our Services</a>
                <a href="#how-it-works">How It Works</a>
                <a href="#about">Why Choose Us</a>
                <a href="#contact">Support</a>
                <a href="#home">Terms & Conditions</a>
            </div>
        </footer>
    );
}

export default Footer;