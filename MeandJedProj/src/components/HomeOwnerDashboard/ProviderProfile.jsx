import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../HomeownerDashboard.css';
import BookingModal from './BookingModal';
import { getProvider } from '../../services/api';

const formatPrice = (amount) => (
    amount == null
        ? 'Contact for rate'
        : `₱${Number(amount).toLocaleString()}`
);

const ProviderProfile = () => {
    const { id } = useParams();
    const [provider, setProvider] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [isSaved, setIsSaved] = useState(false);
    const [showBookingModal, setShowBookingModal] = useState(false);

    useEffect(() => {
        let active = true;

        setLoading(true);
        setLoadError('');
        getProvider(id)
            .then((data) => {
                if (active) setProvider(data);
            })
            .catch((error) => {
                if (active) setLoadError(error.message || 'Unable to load provider details.');
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [id]);

    const serviceCategories = useMemo(
        () => provider?.category
            ? provider.category.split(',').map((category) => category.trim()).filter(Boolean)
            : [],
        [provider?.category]
    );
    const bookingServices = useMemo(
        () => provider?.services?.length
            ? provider.services
            : serviceCategories.map((category) => ({ name: category, category })),
        [provider?.services, serviceCategories]
    );

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-success" role="status">
                    <span className="visually-hidden">Loading provider details...</span>
                </div>
            </div>
        );
    }

    if (loadError || !provider) {
        return (
            <div className="container py-5">
                <Link to="/services" className="text-decoration-none theme-text fw-bold">
                    <i className="bi bi-arrow-left me-2"></i>Bumalik sa Services
                </Link>
                <div className="alert alert-warning mt-4" role="alert">
                    {loadError || 'Provider not found.'}
                </div>
            </div>
        );
    }

    return (
        <div className="container py-4 px-lg-5">
            <div className="mb-3">
                <Link to="/services" className="text-decoration-none theme-text fw-bold">
                    <i className="bi bi-arrow-left me-2"></i>Bumalik sa Services
                </Link>
            </div>

            <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
                <div className="row align-items-center g-4">
                    <div className="col-md-3 text-center">
                        {provider.image ? (
                            <img
                                src={provider.image}
                                alt={provider.name}
                                className="rounded-circle object-fit-cover shadow-sm mb-2"
                                width="130"
                                height="130"
                            />
                        ) : (
                            <div
                                className="rounded-circle bg-success-subtle text-success d-inline-flex align-items-center justify-content-center shadow-sm mb-2"
                                style={{ width: 130, height: 130, fontSize: 48 }}
                                aria-label="No profile photo"
                            >
                                <i className="bi bi-person-fill"></i>
                            </div>
                        )}
                    </div>
                    <div className="col-md-6">
                        <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
                            <h3 className="fw-bold m-0">{provider.name}</h3>
                            {provider.isVerified && (
                                <span className="badge bg-success-subtle text-success rounded-pill px-2 py-1 extra-small">
                                    <i className="bi bi-patch-check-fill me-1"></i>Verified
                                </span>
                            )}
                        </div>
                        <div className="d-flex flex-wrap gap-2 mb-2">
                            {serviceCategories.map((category) => (
                                <span key={category} className="badge bg-primary-subtle theme-text rounded-pill">
                                    {category}
                                </span>
                            ))}
                        </div>
                        <p className="text-muted mb-2">
                            <i className="bi bi-geo-alt-fill text-danger me-1"></i>
                            {provider.location || provider.serviceArea || 'Location not provided'}
                        </p>
                        <p className="text-muted small mb-0">
                            <i className="bi bi-circle-fill text-success me-2" style={{ fontSize: 8 }}></i>
                            {provider.availability}
                        </p>
                    </div>
                    <div className="col-md-3 d-flex flex-column gap-2">
                        <button
                            className="btn btn-theme text-white rounded-pill fw-bold py-2"
                            onClick={() => setShowBookingModal(true)}
                        >
                            <i className="bi bi-calendar-check me-2"></i>Book Now
                        </button>
                        <button
                            onClick={() => setIsSaved((saved) => !saved)}
                            className={`btn rounded-pill fw-semibold py-2 ${isSaved ? 'btn-danger text-white' : 'btn-outline-secondary'}`}
                        >
                            <i className={`bi ${isSaved ? 'bi-heart-fill' : 'bi-heart'} me-2`}></i>
                            {isSaved ? 'Saved Profile' : 'Save Profile'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="row g-3 mb-4">
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white text-center h-100">
                        <i className="bi bi-briefcase fs-3 theme-text mb-1"></i>
                        <h6 className="fw-bold mb-0">{provider.experienceYears} years</h6>
                        <small className="text-muted extra-small">Experience</small>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white text-center h-100">
                        <i className="bi bi-check-circle-fill fs-3 text-success mb-1"></i>
                        <h6 className="fw-bold mb-0">{provider.completedJobs}</h6>
                        <small className="text-muted extra-small">Completed jobs</small>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white text-center h-100">
                        <i className="bi bi-cash-stack fs-3 text-warning mb-1"></i>
                        <h6 className="fw-bold mb-0">{formatPrice(provider.rate)}</h6>
                        <small className="text-muted extra-small">Starting service price</small>
                    </div>
                </div>
            </div>

            <div className="row g-4">
                <div className="col-lg-7">
                    <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
                        <h5 className="fw-bold mb-3">About the provider</h5>
                        <p className="text-muted small m-0">
                            {provider.bio || 'This provider has not added a description yet.'}
                        </p>
                    </div>

                    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                        <h5 className="fw-bold mb-3">Services offered</h5>
                        {provider.services.length > 0 ? (
                            <div className="d-flex flex-column gap-3">
                                {provider.services.map((service, index) => (
                                    <div
                                        key={`${service.name}-${index}`}
                                        className="d-flex justify-content-between align-items-center gap-3 p-3 bg-light rounded-3"
                                    >
                                        <span className="fw-semibold small">{service.name}</span>
                                        <span className="fw-bold theme-text text-nowrap">
                                            {formatPrice(service.price)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted small mb-0">
                                No individual services have been listed yet. Contact the provider when booking for details.
                            </p>
                        )}
                    </div>
                </div>

                <div className="col-lg-5">
                    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                        <h5 className="fw-bold mb-3">Service area & qualifications</h5>
                        <div className="mb-3">
                            <span className="text-muted small d-block mb-1">Service area</span>
                            <span className="fw-semibold">{provider.serviceArea || provider.location}</span>
                        </div>
                        <div>
                            <span className="text-muted small d-block mb-1">Qualifications</span>
                            <span className="text-muted small">
                                {provider.qualifications || 'No qualifications listed.'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <BookingModal
                show={showBookingModal}
                handleClose={() => setShowBookingModal(false)}
                providerId={provider.id}
                initialCategory={serviceCategories[0] || 'Service'}
                providerServices={bookingServices}
            />
        </div>
    );
};

export default ProviderProfile;
