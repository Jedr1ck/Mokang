import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../HomeownerDashboard.css';
import BookingModal from './BookingModal';

// Sample Data para sa Provider Profile
const PROVIDER_DATA = {
    id: 1,
    name: "Juan Dela Cruz",
    category: "Electrician",
    location: "Libertad, Echague",
    isVerified: true,
    isProfessional: true,
    rating: 4.9,
    reviewsCount: 28,
    rate: "₱350/hr",
    experienceYears: "5 Years",
    completedJobs: 142,
    responseTime: "< 15 mins",
    about: "Sertipikadong elektrisyan na may higit 5 taong karanasan sa house wiring, circuit breaker repair, at appliance installation. Mabilis at siguradong ligtas ang serbisyo.",
    servicesOffered: [
        { name: "Full House Wiring Inspection", price: "₱500" },
        { name: "Circuit Breaker Repair & Outlet Installation", price: "₱350" },
        { name: "Lighting & Ceiling Fan Setup", price: "₱300" }
    ],
    customerReviews: [
        {
            id: 1,
            user: "Maria Santos",
            rating: 5,
            date: "Aug 20, 2026",
            comment: "Napakahusay at napakabilis dumating! Maayos niyang naayos ang short circuit sa bahay namin."
        },
        {
            id: 2,
            user: "Mark Reyes",
            rating: 4.8,
            date: "Aug 15, 2026",
            comment: "Mabait at propesyonal makipag-usap. Reasonable din ang singil sa labor."
        }
    ],
    image: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=300&auto=format&fit=crop&q=80"
};

const ProviderProfile = () => {
    const { id } = useParams(); // Para sa dynamic ID route
    const [isSaved, setIsSaved] = useState(false);

    // 1. STATE PARA SA BOOKING MODAL
    const [showBookingModal, setShowBookingModal] = useState(false);

    const toggleSave = () => {
        setIsSaved(!isSaved);
    };

    return (
        <div className="container py-4 px-lg-5">
            {/* Back Button */}
            <div className="mb-3">
                <Link to="/services" className="text-decoration-none theme-text fw-bold">
                    <i className="bi bi-arrow-left me-2"></i>Bumalik sa Services
                </Link>
            </div>

            {/* Profile Header Card */}
            <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
                <div className="row align-items-center g-4">
                    <div className="col-md-3 text-center">
                        <img
                            src={PROVIDER_DATA.image}
                            alt={PROVIDER_DATA.name}
                            className="rounded-circle object-fit-cover shadow-sm mb-2"
                            width="130"
                            height="130"
                        />
                    </div>
                    <div className="col-md-6">
                        <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                            <h3 className="fw-bold m-0">{PROVIDER_DATA.name}</h3>
                            {PROVIDER_DATA.isVerified && (
                                <span className="badge bg-success-subtle text-success rounded-pill px-2 py-1 extra-small">
                                    <i className="bi bi-patch-check-fill me-1"></i>Verified
                                </span>
                            )}
                            {PROVIDER_DATA.isProfessional && (
                                <span className="badge bg-primary-subtle theme-text rounded-pill px-2 py-1 extra-small">
                                    <i className="bi bi-award-fill me-1"></i>Professional
                                </span>
                            )}
                        </div>
                        <p className="text-muted mb-2">
                            <span className="fw-semibold text-dark">{PROVIDER_DATA.category}</span> • <i className="bi bi-geo-alt-fill text-danger"></i> {PROVIDER_DATA.location}
                        </p>

                        {/* Rating & Reviews */}
                        <div className="d-flex align-items-center gap-2 mb-2">
                            <span className="badge bg-warning text-dark fw-bold">
                                <i className="bi bi-star-fill me-1"></i>{PROVIDER_DATA.rating}
                            </span>
                            <span className="text-muted small">({PROVIDER_DATA.reviewsCount} Customer Reviews)</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="col-md-3 d-flex flex-column gap-2">
                        {/* 2. INI-CONNECT ANG onClick TRIGGER HERE */}
                        <button
                            className="btn btn-theme text-white rounded-pill fw-bold py-2"
                            onClick={() => setShowBookingModal(true)}
                        >
                            <i className="bi bi-calendar-check me-2"></i>Book Now
                        </button>

                        <button
                            onClick={toggleSave}
                            className={`btn rounded-pill fw-semibold py-2 ${isSaved ? 'btn-danger text-white' : 'btn-outline-secondary'}`}
                        >
                            <i className={`bi ${isSaved ? 'bi-heart-fill' : 'bi-heart'} me-2`}></i>
                            {isSaved ? 'Saved Profile' : 'Save Profile'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Overview Stats Bar */}
            <div className="row g-3 mb-4">
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white text-center">
                        <i className="bi bi-briefcase fs-3 theme-text mb-1"></i>
                        <h6 className="fw-bold mb-0">{PROVIDER_DATA.experienceYears}</h6>
                        <small className="text-muted extra-small">Karanasan (Experience)</small>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white text-center">
                        <i className="bi bi-check-circle-fill fs-3 text-success mb-1"></i>
                        <h6 className="fw-bold mb-0">{PROVIDER_DATA.completedJobs}+ Jobs</h6>
                        <small className="text-muted extra-small">Completed Jobs</small>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white text-center">
                        <i className="bi bi-lightning-charge-fill fs-3 text-warning mb-1"></i>
                        <h6 className="fw-bold mb-0">{PROVIDER_DATA.responseTime}</h6>
                        <small className="text-muted extra-small">Response Time</small>
                    </div>
                </div>
            </div>

            <div className="row g-4">
                {/* Left Column: About & Services Offered */}
                <div className="col-lg-7">
                    {/* About Section */}
                    <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
                        <h5 className="fw-bold mb-3">Tungkol kay Provider</h5>
                        <p className="text-muted small m-0">{PROVIDER_DATA.about}</p>
                    </div>

                    {/* Services Offered */}
                    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                        <h5 className="fw-bold mb-3">Mga Iniaalok na Serbisyo</h5>
                        <div className="d-flex flex-column gap-3">
                            {PROVIDER_DATA.servicesOffered.map((service, index) => (
                                <div key={index} className="d-flex justify-content-between align-items-center p-3 bg-light rounded-3">
                                    <span className="fw-semibold small">{service.name}</span>
                                    <span className="fw-bold theme-text">{service.price}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Customer Reviews */}
                <div className="col-lg-5">
                    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                        <h5 className="fw-bold mb-3">Customer Reviews</h5>
                        <div className="d-flex flex-column gap-3">
                            {PROVIDER_DATA.customerReviews.map((rev) => (
                                <div key={rev.id} className="border-bottom pb-3">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <h6 className="fw-bold small m-0">{rev.user}</h6>
                                        <small className="text-muted extra-small">{rev.date}</small>
                                    </div>
                                    <div className="mb-2">
                                        {[...Array(5)].map((_, i) => (
                                            <i
                                                key={i}
                                                className={`bi bi-star-fill extra-small ${i < Math.floor(rev.rating) ? 'text-warning' : 'text-secondary opacity-25'}`}
                                            ></i>
                                        ))}
                                    </div>
                                    <p className="text-muted extra-small m-0">{rev.comment}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. BOOKING MODAL COMPONENT */}
            <BookingModal
                show={showBookingModal}
                handleClose={() => setShowBookingModal(false)}
                initialCategory={`${PROVIDER_DATA.category} - ${PROVIDER_DATA.name}`}
            />
        </div>
    );
};

export default ProviderProfile;