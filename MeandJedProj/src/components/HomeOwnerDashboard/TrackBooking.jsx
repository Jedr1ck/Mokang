import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const TrackBooking = () => {
    const location = useLocation();

    // Kunin ang booking data mula sa state kung mayroon, kung wala gagamit ng fallback
    const bookingData = location.state?.booking || {
        id: "REQ-2026-0831",
        category: "Electrician",
        providerName: "Juan Dela Cruz",
        preferredDate: "2026-08-31",
        preferredTime: "14:30",
        status: "Pending" // Default status
    };

    // Listahan ng lahat ng steps
    const steps = [
        { label: 'Pending', icon: 'bi-clock-history' },
        { label: 'Matched', icon: 'bi-person-check-fill' },
        { label: 'Accepted', icon: 'bi-person-badge-fill' },
        { label: 'On the Way', icon: 'bi-truck' },
        { label: 'In Progress', icon: 'bi-tools' },
        { label: 'Completed', icon: 'bi-check-circle-fill' }
    ];

    // Hanapin ang index base sa status ng booking (Halimbawa: "Pending" = Index 0)
    const currentStep = steps.findIndex(
        (step) => step.label.toLowerCase() === (bookingData.status || 'pending').toLowerCase()
    );

    // Siguraduhing valid ang step index (0 kung di mahanap)
    const activeIndex = currentStep !== -1 ? currentStep : 0;
    const isCompleted = activeIndex === 5;

    const getStatusText = (stepIndex) => {
        switch (stepIndex) {
            case 0:
                return { title: "Waiting for Provider", desc: "Your booking request is currently pending review." };
            case 1:
                return { title: "Provider Matched", desc: "A service provider has been assigned to your request." };
            case 2:
                return { title: "Request Accepted", desc: "Provider has accepted your booking request." };
            case 3:
                return { title: "Provider On the Way", desc: "The provider is traveling to your location." };
            case 4:
                return { title: "Service In Progress", desc: "The provider is currently working on your request." };
            case 5:
                return { title: "Service Completed", desc: "Job has been completed successfully." };
            default:
                return { title: "", desc: "" };
        }
    };

    return (
        <div className="container py-4 px-lg-5" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>

            <style>{`
                .tracker-step-icon { transition: all 0.25s ease-in-out; }
                .text-orange { color: #fd7e14 !important; }
            `}</style>

            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-4">
                <Link to="/homeowner-dashboard" className="text-decoration-none text-dark fw-bold d-flex align-items-center gap-2">
                    <i className="bi bi-arrow-left fs-5"></i> Back to Dashboard
                </Link>
                <h3 className="fw-bold m-0" style={{ color: '#0f3a2e' }}>Track Booking Status</h3>
            </div>

            {/* Main Card */}
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">

                <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4">
                    <div>
                        <small className="text-muted d-block fw-semibold text-uppercase">REQUEST NUMBER</small>
                        <span className="fw-bold fs-4 text-primary">{bookingData.id}</span>
                    </div>
                    {/* Badge Color base sa Status */}
                    <span className={`badge ${isCompleted ? 'bg-warning text-white' : 'bg-secondary-subtle text-dark'} px-3 py-2 rounded-pill fw-bold fs-6`}>
                        {steps[activeIndex].label}
                    </span>
                </div>

                {/* Stepper Bar */}
                <div className="d-flex align-items-start justify-content-between my-4 px-2">
                    {steps.map((step, index) => {
                        const isPassed = index < activeIndex;
                        const isCurrent = index === activeIndex;
                        const hasLine = index < steps.length - 1;

                        // Dynamic Colors Base sa Status
                        let bgColor = '#e9ecef';
                        let textColor = '#adb5bd';

                        if (isCurrent && index === 5) {
                            bgColor = '#fd7e14'; // Orange kapag totoong Completed
                            textColor = '#ffffff';
                        } else if (isCurrent || isPassed) {
                            bgColor = '#198754'; // Green kapag Active o Tapos na ang nakaraang step
                            textColor = '#ffffff';
                        }

                        return (
                            <React.Fragment key={index}>
                                <div className="text-center position-relative" style={{ minWidth: '60px' }}>
                                    <div
                                        className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2 tracker-step-icon"
                                        style={{
                                            width: isCurrent ? '48px' : '40px',
                                            height: isCurrent ? '48px' : '40px',
                                            backgroundColor: bgColor,
                                            color: textColor,
                                            fontSize: isCurrent ? '1.2rem' : '1rem'
                                        }}
                                    >
                                        <i className={`bi ${isPassed ? 'bi-check-lg' : step.icon}`}></i>
                                    </div>
                                    <small className={`fw-bold extra-small d-block ${isCurrent ? (index === 5 ? 'text-orange' : 'text-success') : isPassed ? 'text-dark' : 'text-muted'
                                        }`}>
                                        {step.label}
                                    </small>
                                </div>

                                {hasLine && (
                                    <div
                                        className="flex-grow-1 align-self-center mx-1"
                                        style={{
                                            height: '4px',
                                            backgroundColor: (index < activeIndex) ? '#198754' : '#e9ecef',
                                            marginTop: '-18px'
                                        }}
                                    ></div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Status Message */}
                <div className="bg-light rounded-4 p-4 mt-4 text-center">
                    <h6 className="fw-bold mb-1 text-dark fs-5">{getStatusText(activeIndex).title}</h6>
                    <p className="text-muted small m-0">{getStatusText(activeIndex).desc}</p>
                </div>
            </div>

        </div>
    );
};

export default TrackBooking;