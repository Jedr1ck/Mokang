import Navbar from "../components/landingPage/Navbar";
import Hero from "../components/landingPage/Hero";
import Services from "../components/landingPage/Services";
import HowItWorks from "../components/landingPage/HowItWorks";
import About from "../components/landingPage/About";
import Reviews from "../components/landingPage/Reviews";
import Security from "../components/landingPage/Security";
import CTA from "../components/landingPage/CTA";
import Footer from "../components/landingPage/Footer";

function LandingPage() {
    return (
        <>
            <Navbar />
            <Hero />
            <Services />
            <HowItWorks />
            <About />
            <Reviews />
            <Security />
            <CTA />
            <Footer />
        </>
    );
}

export default LandingPage;