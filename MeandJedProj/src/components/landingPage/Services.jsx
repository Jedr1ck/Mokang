import { useEffect, useState } from "react";

function Services() {
    const services = [
        "Electrician",
        "Plumber",
        "Aircon Technician",
        "Carpenter",
        "Pest Control Technician",
        "Painter",
        "Appliance Repair Technician",
        "Locksmith",
        "Deep Cleaner",
        "Massage Therapist",
        "Hair Stylist / Barber",
        "Nail Technician (Manicurist/Pedicurist)",
        "Makeup Artist",
        "Private Nurse / Caregiver",
        "Physical Therapist",
        "Computer / CCTV Technician",
        "Private Tutor / Personal Fitness Trainer",
    ];

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedService, setSelectedService] = useState("");
    const [currentSlide, setCurrentSlide] = useState(0);

    const visibleServices = services.filter((service) => {
        const matchesSearch = service
            .toLowerCase()
            .includes(searchTerm.toLowerCase());

        const matchesSelection =
            !selectedService || service === selectedService;

        return matchesSearch && matchesSelection;
    });

    // =========================================
    // 8 SERVICES PER SLIDE
    // =========================================
    const servicesPerSlide = 8;

    const totalSlides = Math.ceil(
        visibleServices.length / servicesPerSlide
    );

    const slides = [];

    for (let i = 0; i < visibleServices.length; i += servicesPerSlide) {
        slides.push(
            visibleServices.slice(i, i + servicesPerSlide)
        );
    }

    // =========================================
    // RESET SLIDE WHEN SEARCH/FILTER CHANGES
    // =========================================
    useEffect(() => {
        setCurrentSlide(0);
    }, [searchTerm, selectedService]);

    // =========================================
    // NEXT SLIDE
    // =========================================
    const handleNextSlide = () => {
        if (currentSlide < totalSlides - 1) {
            setCurrentSlide((prev) => prev + 1);
        }
    };

    // =========================================
    // PREVIOUS SLIDE
    // =========================================
    const handlePreviousSlide = () => {
        if (currentSlide > 0) {
            setCurrentSlide((prev) => prev - 1);
        }
    };

    return (
        <section id="services" className="services-section">

            <h2>What Service Do You Need</h2>

            {/* =========================================
                SEARCH + CATEGORY FILTER
            ========================================= */}
            <div className="service-search">

                <label className="search-box">
                    <span aria-hidden="true">⌕</span>

                    <input
                        type="search"
                        placeholder="Search for a service..."
                        value={searchTerm}
                        onChange={(event) =>
                            setSearchTerm(event.target.value)
                        }
                        aria-label="Search for a service"
                    />
                </label>

                <label className="service-select">

                    <select
                        value={selectedService}
                        onChange={(event) =>
                            setSelectedService(event.target.value)
                        }
                        aria-label="Select a service"
                    >

                        <option value="">
                            All services
                        </option>

                        {services.map((service) => (
                            <option
                                value={service}
                                key={service}
                            >
                                {service}
                            </option>
                        ))}

                    </select>

                </label>

            </div>

            {/* =========================================
                SERVICES SLIDER
            ========================================= */}
            {visibleServices.length > 0 ? (

                <div className="services-slider-wrapper">

                    {/* LEFT ARROW */}
                    {currentSlide > 0 && (
                        <button
                            type="button"
                            className="service-slide-arrow service-slide-arrow-left"
                            onClick={handlePreviousSlide}
                            aria-label="Previous services"
                        >
                            <i className="bi bi-chevron-left"></i>
                        </button>
                    )}

                    {/* VIEWPORT */}
                    <div className="services-slider">

                        {/* TRACK */}
                        <div
                            className="services-slider-track"
                            style={{
                                transform: `translateX(-${currentSlide * 100
                                    }%)`,
                            }}
                        >

                            {slides.map((slide, slideIndex) => (

                                <div
                                    className="service-slide"
                                    key={slideIndex}
                                >

                                    <div className="service-grid">

                                        {slide.map((service) => (

                                            <div
                                                className="service-card"
                                                key={service}
                                            >

                                                <div className="service-image">
                                                </div>

                                                <p>{service}</p>

                                            </div>

                                        ))}

                                    </div>

                                </div>

                            ))}

                        </div>

                    </div>

                    {/* RIGHT ARROW */}
                    {currentSlide < totalSlides - 1 && (
                        <button
                            type="button"
                            className="service-slide-arrow service-slide-arrow-right"
                            onClick={handleNextSlide}
                            aria-label="Next services"
                        >
                            <i className="bi bi-chevron-right"></i>
                        </button>
                    )}

                </div>

            ) : (

                <div className="service-empty">
                    No services found. Try another search.
                </div>

            )}

            {/* =========================================
                MORE SERVICES
            ========================================= */}
            {visibleServices.length > 8 && (
                <div className="more-service">

                    <span>
                        More Services
                    </span>

                    <div className="service-slide-indicator">

                        {slides.map((_, index) => (
                            <span
                                key={index}
                                className={
                                    index === currentSlide
                                        ? "active"
                                        : ""
                                }
                            ></span>
                        ))}

                    </div>

                    {currentSlide < totalSlides - 1 && (
                        <button
                            type="button"
                            className="more-service-button"
                            onClick={handleNextSlide}
                        >
                            View More
                            <i className="bi bi-arrow-right"></i>
                        </button>
                    )}

                </div>
            )}

            {/* =========================================
                CLEAR FILTER
            ========================================= */}
            {(searchTerm || selectedService) && (
                <button
                    className="clear-service-filter"
                    type="button"
                    onClick={() => {
                        setSearchTerm("");
                        setSelectedService("");
                        setCurrentSlide(0);
                    }}
                >
                    Clear filters
                </button>
            )}

        </section>
    );
}

export default Services;