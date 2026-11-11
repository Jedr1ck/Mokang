import { useNavigate } from 'react-router-dom';
import logo from "../../assets/images/handyman-mark.svg";

function Navbar() {
    const navigate = useNavigate();

    // Scroll function patungo sa CTA o Hero section sa Home
    const handleGoToHomeAndRegister = () => {
        navigate('/');
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    return (
        <nav className="navbar">
            <button
                type="button"
                className="navbar-logo"
                onClick={handleGoToHomeAndRegister}
                aria-label="Go to HandyMan home page"
            >
                <img src={logo} alt="HandyMan Logo" />
                <div className="navbar-brand-copy">
                    <strong>HANDYMAN</strong>
                    <span>Home Services</span>
                </div>
            </button>

            <ul className="navbar-links">
                <li><a href="#home">Home</a></li>
                <li><a href="#services">Services</a></li>
                <li><a href="#how">How It Works</a></li>
                <li><a href="#about">About Us</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>

        </nav>
    );
}

export default Navbar;
