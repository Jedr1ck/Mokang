import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import "../../HomeownerDashboard.css";

// Sample Data ng mga Service Providers na may Availability
const MOCK_PROVIDERS = [
    {
        id: 1,
        name: "Juan Dela Cruz",
        category: "Electrician",
        location: "Libertad",
        rating: 4.9,
        reviews: 28,
        rate: "₱350/hr",
        experience: "5 years exp",
        availability: "Available Today",
        availabilityType: "today",
        image: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80"
    },
    {
        id: 2,
        name: "Mario Bros Repairs",
        category: "Plumber",
        location: "Libertad",
        rating: 4.7,
        reviews: 15,
        rate: "₱400/hr",
        experience: "3 years exp",
        availability: "Available Tomorrow",
        availabilityType: "tomorrow",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
    },
    {
        id: 3,
        name: "Elena Cool Services",
        category: "Aircon Technician",
        location: "Libertad",
        rating: 5.0,
        reviews: 19,
        rate: "₱500/unit",
        experience: "4 years exp",
        availability: "Available Today",
        availabilityType: "today",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
    }
];

const CATEGORIES = [
    "All",
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
    "Private Tutor / Personal Fitness Trainer"
];

const FindService = () => {
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchLocation, setSearchLocation] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredProviders = MOCK_PROVIDERS.filter((provider) => {
        const matchesCategory = selectedCategory === 'All' || provider.category === selectedCategory;
        const matchesLocation = provider.location.toLowerCase().includes(searchLocation.toLowerCase().trim());
        const matchesQuery = provider.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
            provider.category.toLowerCase().includes(searchQuery.toLowerCase().trim());

        return matchesCategory && matchesLocation && matchesQuery;
    });

    return (
        <div className="container-fluid py-4 px-lg-5">
            {/* Isang Back Button na Pupunta sa Home/Dashboard */}
            {/* PAGSASA-AYOS (Tama - didirekta agad sa Dashboard) */}
            <button
                onClick={() => navigate('/homeowner-dashboard')}
                className="btn btn-outline-secondary btn-sm rounded-pill px-3 fw-semibold d-flex align-items-center gap-1"
            >
                <i className="bi bi-arrow-left"></i> Back
            </button>

            {/* Title & Header Section */}
            <div className="mb-4">
                <h2 className="fw-bold theme-text m-0">Find a Service Provider</h2>
                <p className="text-muted small">Maghanap ng mga kwalipikadong eksperto sa iyong lugar.</p>
            </div>

            {/* Filter Options */}
            <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white">
                <div className="row g-3 align-items-center">

                    <div className="col-md-4">
                        <label className="form-label extra-small text-muted fw-bold mb-1">ANONG PAPAYOS MO?</label>
                        <div className="input-group">
                            <span className="input-group-text bg-light border-0"><i className="bi bi-tools"></i></span>
                            <input
                                type="text"
                                className="form-control bg-light border-0 shadow-none"
                                placeholder="Search provider or service..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="col-md-4">
                        <label className="form-label extra-small text-muted fw-bold mb-1">LOKASYON</label>
                        <div className="input-group">
                            <span className="input-group-text bg-light border-0"><i className="bi bi-geo-alt-fill text-danger"></i></span>
                            <input
                                type="text"
                                className="form-control bg-light border-0 shadow-none"
                                placeholder="hal. Libertad"
                                value={searchLocation}
                                onChange={(e) => setSearchLocation(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="col-md-4">
                        <label className="form-label extra-small text-muted fw-bold mb-1">KATEGORYA</label>
                        <div className="input-group">
                            <span className="input-group-text bg-light border-0 rounded-start-3 text-success">
                                <i className="bi bi-grid-fill"></i>
                            </span>
                            <select
                                className="form-select bg-light border-0 shadow-none rounded-end-3 custom-select-dropdown"
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                {CATEGORIES.map((cat, idx) => (
                                    <option key={idx} value={cat}>
                                        {cat === "All" ? "Lahat ng Kategorya" : cat}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                </div>
            </div>

            {/* Quick Filter Badges */}
            <div className="d-flex gap-2 overflow-auto mb-4 pb-2">
                {CATEGORIES.slice(0, 8).map((cat, idx) => (
                    <button
                        key={idx}
                        onClick={() => setSelectedCategory(cat)}
                        className={`btn btn-sm rounded-pill px-3 py-2 text-nowrap fw-semibold ${selectedCategory === cat ? 'btn-theme text-white' : 'btn-light text-muted'
                            }`}
                    >
                        {cat === "All" ? "Lahat" : cat}
                    </button>
                ))}
            </div>

            {/* Results Grid */}
            <div className="row g-4">
                {filteredProviders.length > 0 ? (
                    filteredProviders.map((provider) => (
                        <div key={provider.id} className="col-md-6 col-lg-4">
                            <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden provider-card">
                                <div className="card-body p-4 d-flex flex-column">

                                    {/* Availability Badge */}
                                    <div className="mb-2">
                                        <span className={`badge rounded-pill extra-small px-2 py-1 ${provider.availabilityType === 'today'
                                            ? 'bg-success-subtle text-success border border-success-subtle'
                                            : 'bg-warning-subtle text-dark border border-warning-subtle'
                                            }`}>
                                            <i className={`bi ${provider.availabilityType === 'today' ? 'bi-circle-fill' : 'bi-clock-history'} me-1 extra-small`}></i>
                                            {provider.availability}
                                        </span>
                                    </div>

                                    {/* Provider Header Info */}
                                    <div className="d-flex align-items-center gap-3 mb-3">
                                        <a href={`/provider/${provider.id}`}>
                                            <img
                                                src={provider.image}
                                                alt={provider.name}
                                                className="rounded-circle object-fit-cover shadow-sm provider-avatar"
                                                width="60"
                                                height="60"
                                            />
                                        </a>
                                        <div>
                                            <a href={`/provider/${provider.id}`} className="text-decoration-none text-dark provider-link">
                                                <h6 className="fw-bold mb-1 provider-name-text">{provider.name}</h6>
                                            </a>
                                            <span className="badge bg-primary-subtle theme-text rounded-pill me-1">
                                                {provider.category}
                                            </span>
                                            <small className="text-muted extra-small d-block mt-1">
                                                <i className="bi bi-geo-alt-fill text-danger"></i> {provider.location}
                                            </small>
                                        </div>
                                    </div>

                                    {/* Rating and Experience */}
                                    <div className="d-flex justify-content-between align-items-center bg-light p-2 rounded-3 mb-3 extra-small">
                                        <div>
                                            <i className="bi bi-star-fill text-warning me-1"></i>
                                            <span className="fw-bold">{provider.rating}</span> ({provider.reviews} reviews)
                                        </div>
                                        <div className="text-muted fw-semibold">{provider.experience}</div>
                                    </div>

                                    {/* Footer Rate and Book Action */}
                                    <div className="mt-auto d-flex justify-content-between align-items-center pt-2">
                                        <div>
                                            <small className="text-muted d-block extra-small">Starting Rate</small>
                                            <span className="fw-bold theme-text fs-6">{provider.rate}</span>
                                        </div>
                                        <a href={`/provider/${provider.id}`} className="btn btn-theme text-white rounded-pill btn-sm px-3 fw-bold">
                                            Book Now
                                        </a>
                                    </div>

                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-12 text-center py-5">
                        <i className="bi bi-search fs-1 text-muted d-block mb-3"></i>
                        <h5 className="fw-bold">Walang Nahanap na Service Provider</h5>
                        <p className="text-muted small">Subukang palitan ang tinitipang lokasyon o kategorya.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FindService;