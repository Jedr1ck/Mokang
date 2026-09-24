import { useEffect, useState } from "react";

import electricianImage from "../../assets/services/electrician.jpg";
import plumberImage from "../../assets/services/plumber.jpg";
import airconImage from "../../assets/services/aircon.jpg";
import carpenterImage from "../../assets/services/carpenter.jpg";
import pestControlImage from "../../assets/services/pest-control.jpg";
import painterImage from "../../assets/services/painter.jpg";
import applianceRepairImage from "../../assets/services/appliance-repair.jpg";
import locksmithImage from "../../assets/services/locksmith.jpg";
import deepCleanerImage from "../../assets/services/deep-cleaner.jpg";
import massageImage from "../../assets/services/massage.jpg";
import barberImage from "../../assets/services/barber.jpg";
import nailTechnicianImage from "../../assets/services/nail-technician.jpg";
import makeupArtistImage from "../../assets/services/makeup-artist.jpg";
import caregiverImage from "../../assets/services/caregiver.jpg";
import physicalTherapistImage from "../../assets/services/physical-therapist.jpg";
import computerCctvImage from "../../assets/services/computer-cctv.jpg";
import tutorFitnessImage from "../../assets/services/tutor-fitness.jpg";

function Services() {

    const services = [
        {
            name: "Electrician",
            image: electricianImage,
        },
        {
            name: "Plumber",
            image: plumberImage,
        },
        {
            name: "Aircon Technician",
            image: airconImage,
        },
        {
            name: "Carpenter",
            image: carpenterImage,
        },
        {
            name: "Pest Control Technician",
            image: pestControlImage,
        },
        {
            name: "Painter",
            image: painterImage,
        },
        {
            name: "Appliance Repair Technician",
            image: applianceRepairImage,
        },
        {
            name: "Locksmith",
            image: locksmithImage,
        },
        {
            name: "Deep Cleaner",
            image: deepCleanerImage,
        },
        {
            name: "Massage Therapist",
            image: massageImage,
        },
        {
            name: "Hair Stylist / Barber",
            image: barberImage,
        },
        {
            name: "Nail Technician (Manicurist/Pedicurist)",
            image: nailTechnicianImage,
        },
        {
            name: "Makeup Artist",
            image: makeupArtistImage,
        },
        {
            name: "Private Nurse / Caregiver",
            image: caregiverImage,
        },
        {
            name: "Physical Therapist",
            image: physicalTherapistImage,
        },
        {
            name: "Computer / CCTV Technician",
            image: computerCctvImage,
        },
        {
            name: "Private Tutor / Personal Fitness Trainer",
            image: tutorFitnessImage,
        },
    ];

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedService, setSelectedService] = useState("");
    const [currentSlide, setCurrentSlide] = useState(0);

    const visibleServices = services.filter((service) => {

        const matchesSearch = service.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase());

        const matchesSelection =
            !selectedService ||
            service.name === selectedService;

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

    for (
        let i = 0;
        i < visibleServices.length;
        i += servicesPerSlide
    ) {
        slides.push(
            visibleServices.slice(
                i,
                i + servicesPerSlide
            )
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

        <section
            id="services"
            className="services-section"
        >

            <h2>
                What Service Do You Need
            </h2>

            {/* =========================================
                SEARCH + CATEGORY FILTER
            ========================================= */}

            <div className="service-search">

                <label className="search-box">

                    <span aria-hidden="true">
                        ⌕
                    </span>

                    <input
                        type="search"
                        placeholder="Search for a service..."
                        value={searchTerm}
                        onChange={(event) =>
                            setSearchTerm(
                                event.target.value
                            )
                        }
                        aria-label="Search for a service"
                    />

                </label>

                <label className="service-select">

                    <select
                        value={selectedService}
                        onChange={(event) =>
                            setSelectedService(
                                event.target.value
                            )
                        }
                        aria-label="Select a service"
                    >

                        <option value="">
                            All services
                        </option>

                        {services.map((service) => (

                            <option
                                value={service.name}
                                key={service.name}
                            >
                                {service.name}
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

                            {slides.map(
                                (slide, slideIndex) => (

                                    <div
                                        className="service-slide"
                                        key={slideIndex}
                                    >

                                        <div className="service-grid">

                                            {slide.map(
                                                (service) => (

                                                    <div
                                                        className="service-card"
                                                        key={service.name}
                                                    >

                                                        {/* SERVICE IMAGE */}

                                                        <div className="service-image">

                                                            <img
                                                                src={service.image}
                                                                alt={service.name}
                                                            />

                                                        </div>

                                                        {/* SERVICE NAME */}

                                                        <p>
                                                            {service.name}
                                                        </p>

                                                    </div>

                                                )
                                            )}

                                        </div>

                                    </div>

                                )
                            )}

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

                    No services found.
                    Try another search.

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