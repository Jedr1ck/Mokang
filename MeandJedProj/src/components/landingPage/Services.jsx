
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
            tasks: [
                "Wiring Installation",
                "Outlet and Switch Repair",
                "Lighting Installation",
                "Circuit Breaker Repair",
                "Electrical Troubleshooting",
            ],
        },
        {
            name: "Plumber",
            image: plumberImage,
            tasks: [
                "Leak Repair",
                "Clogged Drain Clearing",
                "Faucet Installation",
                "Pipe Replacement",
                "Toilet Repair",
            ],
        },
        {
            name: "Aircon Technician",
            image: airconImage,
            tasks: [
                "Aircon Cleaning",
                "Preventive Maintenance",
                "Aircon Installation",
                "Cooling Problem Diagnosis",
                "Aircon Repair",
            ],
        },
        {
            name: "Carpenter",
            image: carpenterImage,
            tasks: [
                "Furniture Assembly",
                "Door and Cabinet Repair",
                "Shelf Installation",
                "Woodwork",
                "Custom Furniture Repair",
            ],
        },
        {
            name: "Pest Control Technician",
            image: pestControlImage,
            tasks: [
                "Cockroach Control",
                "Ant Control",
                "Termite Treatment",
                "Rodent Control",
                "General Pest Inspection",
            ],
        },
        {
            name: "Painter",
            image: painterImage,
            tasks: [
                "Interior Painting",
                "Exterior Painting",
                "Wall Repainting",
                "Surface Preparation",
                "Minor Wall Touch-ups",
            ],
        },
        {
            name: "Appliance Repair Technician",
            image: applianceRepairImage,
            tasks: [
                "Washing Machine Repair",
                "Refrigerator Repair",
                "Electric Fan Repair",
                "Microwave Repair",
                "Appliance Troubleshooting",
            ],
        },
        {
            name: "Locksmith",
            image: locksmithImage,
            tasks: [
                "Door Lock Repair",
                "Lock Replacement",
                "Key Duplication",
                "Door Lock Installation",
                "Lockout Assistance",
            ],
        },
        {
            name: "Deep Cleaner",
            image: deepCleanerImage,
            tasks: [
                "Deep House Cleaning",
                "Kitchen Cleaning",
                "Bathroom Cleaning",
                "Move-in / Move-out Cleaning",
                "Upholstery Cleaning",
            ],
        },
        {
            name: "Massage Therapist",
            image: massageImage,
            tasks: [
                "Relaxation Massage",
                "Swedish Massage",
                "Traditional Massage",
                "Full-body Massage",
                "Targeted Muscle Relaxation",
            ],
        },
        {
            name: "Hair Stylist / Barber",
            image: barberImage,
            tasks: [
                "Haircut",
                "Hair Styling",
                "Hair Coloring",
                "Blow-dry",
                "Beard Trimming",
            ],
        },
        {
            name: "Nail Technician (Manicurist/Pedicurist)",
            image: nailTechnicianImage,
            tasks: [
                "Manicure",
                "Pedicure",
                "Nail Cleaning",
                "Nail Polish Application",
                "Basic Nail Art",
            ],
        },
        {
            name: "Makeup Artist",
            image: makeupArtistImage,
            tasks: [
                "Everyday Makeup",
                "Event Makeup",
                "Debut Makeup",
                "Bridal Makeup",
                "Photoshoot Makeup",
            ],
        },
        {
            name: "Private Nurse / Caregiver",
            image: caregiverImage,
            tasks: [
                "Elderly Assistance",
                "Personal Care Assistance",
                "Companionship",
                "Daily Living Support",
                "Basic Patient Assistance",
            ],
        },
        {
            name: "Physical Therapist",
            image: physicalTherapistImage,
            tasks: [
                "Mobility Exercises",
                "Rehabilitation Sessions",
                "Movement Assessment",
                "Therapeutic Exercise",
                "Recovery Support",
            ],
        },
        {
            name: "Computer / CCTV Technician",
            image: computerCctvImage,
            tasks: [
                "Computer Troubleshooting",
                "Software Installation",
                "Computer Setup",
                "CCTV Installation",
                "CCTV Troubleshooting",
            ],
        },
        {
            name: "Private Tutor / Personal Fitness Trainer",
            image: tutorFitnessImage,
            tasks: [
                "Academic Tutoring",
                "Subject Review",
                "Homework Assistance",
                "Personal Fitness Training",
                "Workout Guidance",
            ],
        },
    ];

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedService, setSelectedService] = useState("");
    const [currentSlide, setCurrentSlide] = useState(0);
    const [activeService, setActiveService] = useState(null);

    const visibleServices = services.filter((service) => {
        const query = searchTerm.trim().toLowerCase();

        const matchesSearch =
            !query ||
            service.name.toLowerCase().includes(query) ||
            service.tasks.some((task) =>
                task.toLowerCase().includes(query)
            );

        const matchesSelection =
            !selectedService || service.name === selectedService;

        return matchesSearch && matchesSelection;
    });

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
            visibleServices.slice(i, i + servicesPerSlide)
        );
    }

    useEffect(() => {
        setCurrentSlide(0);
    }, [searchTerm, selectedService]);

    useEffect(() => {
        if (!activeService) return;

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                setActiveService(null);
            }
        };

        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("keydown", handleEscape);
        };
    }, [activeService]);

    const handleNextSlide = () => {
        if (currentSlide < totalSlides - 1) {
            setCurrentSlide((prev) => prev + 1);
        }
    };

    const handlePreviousSlide = () => {
        if (currentSlide > 0) {
            setCurrentSlide((prev) => prev - 1);
        }
    };

    return (
        <section id="services" className="services-section">
            <h2>What Service Do You Need</h2>

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
                        <option value="">All services</option>

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

            {visibleServices.length > 0 ? (
                <div className="services-slider-wrapper">
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

                    <div className="services-slider">
                        <div
                            className="services-slider-track"
                            style={{
                                transform: `translateX(-${currentSlide * 100}%)`,
                            }}
                        >
                            {slides.map((slide, slideIndex) => (
                                <div
                                    className="service-slide"
                                    key={slideIndex}
                                >
                                    <div className="service-grid">
                                        {slide.map((service) => (
                                            <button
                                                type="button"
                                                className="service-card service-card-clickable"
                                                key={service.name}
                                                onClick={() =>
                                                    setActiveService(service)
                                                }
                                                aria-label={`View specific services for ${service.name}`}
                                            >
                                                <div className="service-image">
                                                    <img
                                                        src={service.image}
                                                        alt={service.name}
                                                    />
                                                </div>

                                                <p>{service.name}</p>

                                                <span className="service-card-hint">
                                                    View services
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

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

            {visibleServices.length > 8 && (
                <div className="more-service">
                    <span>More Services</span>

                    <div className="service-slide-indicator">
                        {slides.map((_, index) => (
                            <span
                                key={index}
                                className={
                                    index === currentSlide ? "active" : ""
                                }
                            />
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

            {/* Specific service details modal */}
            {activeService && (
                <div
                    className="service-modal-overlay"
                    onClick={() => setActiveService(null)}
                >
                    <div
                        className="service-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="service-modal-title"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="service-modal-close"
                            onClick={() => setActiveService(null)}
                            aria-label="Close service details"
                        >
                            &times;
                        </button>

                        <img
                            className="service-modal-image"
                            src={activeService.image}
                            alt={activeService.name}
                        />

                        <h3 id="service-modal-title">
                            {activeService.name}
                        </h3>

                        <p className="service-modal-description">
                            Types of work under this service
                        </p>

                        <ul className="service-modal-task-list">
                            {activeService.tasks.map((task) => (
                                <li key={task}>
                                    <i className="bi bi-check-circle-fill"></i>
                                    <span>{task}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            type="button"
                            className="service-modal-close-button"
                            onClick={() => setActiveService(null)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}

export default Services;
