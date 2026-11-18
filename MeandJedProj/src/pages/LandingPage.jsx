import Navbar from "../components/landingPage/Navbar";
import Hero from "../components/landingPage/Hero";
import Services from "../components/landingPage/Services";
import HowItWorks from "../components/landingPage/HowItWorks";
import About from "../components/landingPage/About";
import Reviews from "../components/landingPage/Reviews";
import Security from "../components/landingPage/Security";
import CTA from "../components/landingPage/CTA";
import Footer from "../components/landingPage/Footer";

const AMBIENT_ORB_PARALLAX = [
    { name: "peach", x: 0.72, y: 0.55 },
    { name: "orange", x: -0.58, y: 0.42 },
    { name: "gold", x: 0.38, y: -0.68 },
    { name: "sunshine", x: -0.46, y: -0.52 },
];

function LandingPage() {
    const handleAmbientPointerMove = (event) => {
        if (event.pointerType === "touch") return;

        const pointerX = (event.clientX / window.innerWidth - 0.5) * window.innerWidth * 0.7;
        const pointerY = (event.clientY / window.innerHeight - 0.5) * window.innerHeight * 0.7;

        AMBIENT_ORB_PARALLAX.forEach(({ name, x, y }) => {
            event.currentTarget.style.setProperty(`--ambient-${name}-x`, `${pointerX * x}px`);
            event.currentTarget.style.setProperty(`--ambient-${name}-y`, `${pointerY * y}px`);
        });
    };

    const resetAmbientPointer = (event) => {
        AMBIENT_ORB_PARALLAX.forEach(({ name }) => {
            event.currentTarget.style.removeProperty(`--ambient-${name}-x`);
            event.currentTarget.style.removeProperty(`--ambient-${name}-y`);
        });
    };

    return (
        <>
            <Navbar />
            <Hero />
            <div
                className="landing-ambient-sections"
                onPointerMove={handleAmbientPointerMove}
                onPointerLeave={resetAmbientPointer}
            >
                <span className="ambient-gradient-orb ambient-gradient-orb--peach" aria-hidden="true" />
                <span className="ambient-gradient-orb ambient-gradient-orb--orange" aria-hidden="true" />
                <span className="ambient-gradient-orb ambient-gradient-orb--gold" aria-hidden="true" />
                <span className="ambient-gradient-orb ambient-gradient-orb--sunshine" aria-hidden="true" />
                <Services />
                <HowItWorks />
                <About />
                <Reviews />
                <Security />
            </div>
            <CTA />
            <Footer />
        </>
    );
}

export default LandingPage;
