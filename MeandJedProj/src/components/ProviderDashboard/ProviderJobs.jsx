import React, { useState } from "react";
import ProviderSideBar from "../ProviderSideBar/ProviderSideBar";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./ProviderJobs.css";

const ProviderJobs = () => {
    const [selectedJob, setSelectedJob] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [showMessage, setShowMessage] = useState(false);
    const [message, setMessage] = useState("");

    // DEMO JOB DATA
    const [jobs, setJobs] = useState([
        {
            id: 1,
            requestNo: "REQ-2026-001",
            customerName: "Juan Dela Cruz",
            service: "Electrical Repair",
            location: "Brgy. Rizal, Silay City",
            contact: "0912-345-6789",
            date: "September 3, 2026",
            time: "9:00 AM - 11:00 AM",
            status: "Accepted",
            amount: "₱1,500",
            description:
                "May problema po sa electrical wiring ng living room. Biglang namamatay ang ilaw at may amoy sunog kapag ginagamit ang outlet.",
            photo:
                "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80"
        },
        {
            id: 2,
            requestNo: "REQ-2026-002",
            customerName: "Maria Santos",
            service: "Aircon Cleaning",
            location: "Brgy. E. Lopez, Silay City",
            contact: "0920-456-7890",
            date: "September 3, 2026",
            time: "1:00 PM - 3:00 PM",
            status: "On the Way",
            amount: "₱1,200",
            description:
                "Hindi na po malamig ang aircon. Gusto ko rin pong ipa-general cleaning.",
            photo:
                "https://images.unsplash.com/photo-1631545806609-1b6e85b1e0f6?auto=format&fit=crop&w=800&q=80"
        },
        {
            id: 3,
            requestNo: "REQ-2026-003",
            customerName: "Ana Reyes",
            service: "Plumbing Repair",
            location: "Brgy. Guinhalaran, Silay City",
            contact: "0931-567-8901",
            date: "September 4, 2026",
            time: "10:00 AM - 12:00 PM",
            status: "In Progress",
            amount: "₱950",
            description:
                "May tumutulong tubig sa ilalim ng kitchen sink at kailangan pong ipaayos agad.",
            photo:
                "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=800&q=80"
        },
        {
            id: 4,
            requestNo: "REQ-2026-004",
            customerName: "Robert Garcia",
            service: "House Cleaning",
            location: "Brgy. II, Silay City",
            contact: "0945-678-9012",
            date: "September 5, 2026",
            time: "8:00 AM - 11:00 AM",
            status: "Completed",
            amount: "₱1,800",
            description:
                "Full house cleaning po including living room, bedrooms, kitchen, and bathroom.",
            photo:
                "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80"
        }
    ]);

    const openDetails = (job) => {
        setSelectedJob(job);
        setShowDetails(true);
    };

    const closeDetails = () => {
        setSelectedJob(null);
        setShowDetails(false);
    };

    const updateStatus = (newStatus) => {
        if (!selectedJob) return;

        const updatedJob = {
            ...selectedJob,
            status: newStatus
        };

        setJobs((previousJobs) =>
            previousJobs.map((job) =>
                job.id === selectedJob.id ? updatedJob : job
            )
        );

        setSelectedJob(updatedJob);
    };

    const openMessage = (job) => {
        setSelectedJob(job);
        setShowMessage(true);
    };

    const sendMessage = () => {
        if (!message.trim() || message.trim().length > 1000) {
            alert("Enter a message between 1 and 1,000 characters.");
            return;
        }

        alert(`Message sent to ${selectedJob.customerName}!`);

        setMessage("");
        setShowMessage(false);
    };

    const getStatusClass = (status) => {
        if (status === "Accepted") {
            return "status-accepted";
        }

        if (status === "On the Way") {
            return "status-onway";
        }

        if (status === "In Progress") {
            return "status-progress";
        }

        if (status === "Completed") {
            return "status-completed";
        }

        return "";
    };

    const getNextStatus = (status) => {
        if (status === "Accepted") {
            return "On the Way";
        }

        if (status === "On the Way") {
            return "In Progress";
        }

        if (status === "In Progress") {
            return "Completed";
        }

        return null;
    };

    const getNextButtonText = (status) => {
        if (status === "Accepted") {
            return "Mark as On the Way";
        }

        if (status === "On the Way") {
            return "Start Job";
        }

        if (status === "In Progress") {
            return "Mark as Completed";
        }

        return "Job Completed";
    };

    return (
        <div className="provider-jobs-page">

            {/* SIDEBAR */}
            <ProviderSideBar />

            {/* MAIN CONTENT */}
            <main className="provider-jobs-main">

                {/* HEADER */}
                <div className="jobs-page-header">

                    <div>
                        <span className="jobs-overline">
                            PROVIDER PORTAL
                        </span>

                        <h1>
                            My Jobs
                        </h1>

                        <p>
                            Manage your accepted bookings and monitor your
                            service jobs.
                        </p>
                    </div>

                    <div className="provider-profile-mini">

                        <div className="provider-mini-avatar">
                            P
                        </div>

                        <div>
                            <small>Logged in as</small>
                            <strong>Service Provider</strong>
                        </div>

                    </div>

                </div>

                {/* SUMMARY CARDS */}
                <div className="row g-3 mb-4">

                    <div className="col-lg-3 col-md-6">

                        <div className="job-summary-card">

                            <div className="summary-icon">
                                <i className="bi bi-briefcase"></i>
                            </div>

                            <div>
                                <span>Total Jobs</span>
                                <h3>{jobs.length}</h3>
                            </div>

                        </div>

                    </div>

                    <div className="col-lg-3 col-md-6">

                        <div className="job-summary-card">

                            <div className="summary-icon accepted-icon">
                                <i className="bi bi-check-circle"></i>
                            </div>

                            <div>
                                <span>Accepted</span>

                                <h3>
                                    {
                                        jobs.filter(
                                            (job) =>
                                                job.status === "Accepted"
                                        ).length
                                    }
                                </h3>
                            </div>

                        </div>

                    </div>

                    <div className="col-lg-3 col-md-6">

                        <div className="job-summary-card">

                            <div className="summary-icon onway-icon">
                                <i className="bi bi-truck"></i>
                            </div>

                            <div>
                                <span>On the Way</span>

                                <h3>
                                    {
                                        jobs.filter(
                                            (job) =>
                                                job.status === "On the Way"
                                        ).length
                                    }
                                </h3>
                            </div>

                        </div>

                    </div>

                    <div className="col-lg-3 col-md-6">

                        <div className="job-summary-card">

                            <div className="summary-icon completed-icon">
                                <i className="bi bi-check2-all"></i>
                            </div>

                            <div>
                                <span>Completed</span>

                                <h3>
                                    {
                                        jobs.filter(
                                            (job) =>
                                                job.status === "Completed"
                                        ).length
                                    }
                                </h3>
                            </div>

                        </div>

                    </div>

                </div>

                {/* JOB LIST */}
                <div className="jobs-card">

                    <div className="jobs-card-header">

                        <div>
                            <h4>My Service Jobs</h4>
                            <p>
                                View and manage your accepted customer
                                bookings.
                            </p>
                        </div>

                        <button className="btn btn-outline-success rounded-pill px-4">
                            <i className="bi bi-funnel me-2"></i>
                            Filter
                        </button>

                    </div>

                    {/* JOB LIST */}
                    <div className="job-list">

                        {jobs.map((job) => (

                            <div
                                className="job-item"
                                key={job.id}
                            >

                                {/* CUSTOMER */}
                                <div className="job-customer">

                                    <div className="customer-avatar">
                                        {job.customerName
                                            .charAt(0)
                                            .toUpperCase()}
                                    </div>

                                    <div>
                                        <h6>
                                            {job.customerName}
                                        </h6>

                                        <small>
                                            {job.requestNo}
                                        </small>
                                    </div>

                                </div>

                                {/* SERVICE */}
                                <div className="job-service">

                                    <span>
                                        SERVICE
                                    </span>

                                    <strong>
                                        {job.service}
                                    </strong>

                                </div>

                                {/* LOCATION */}
                                <div className="job-location">

                                    <span>
                                        LOCATION
                                    </span>

                                    <strong>
                                        <i className="bi bi-geo-alt me-1"></i>
                                        {job.location}
                                    </strong>

                                </div>

                                {/* DATE */}
                                <div className="job-date">

                                    <span>
                                        SCHEDULE
                                    </span>

                                    <strong>
                                        {job.date}
                                    </strong>

                                    <small>
                                        {job.time}
                                    </small>

                                </div>

                                {/* STATUS */}
                                <div>

                                    <span
                                        className={`job-status ${getStatusClass(
                                            job.status
                                        )}`}
                                    >
                                        {job.status}
                                    </span>

                                </div>

                                {/* ACTIONS */}
                                <div className="job-actions">

                                    <button
                                        className="btn btn-success btn-sm rounded-pill"
                                        onClick={() =>
                                            openDetails(job)
                                        }
                                    >
                                        <i className="bi bi-eye me-1"></i>
                                        View
                                    </button>

                                    <button
                                        className="btn btn-outline-primary btn-sm rounded-pill"
                                        onClick={() =>
                                            openMessage(job)
                                        }
                                    >
                                        <i className="bi bi-chat-dots me-1"></i>
                                        Message
                                    </button>

                                </div>

                            </div>

                        ))}

                    </div>

                </div>

            </main>

            {/* ======================================
                JOB DETAILS MODAL
            ====================================== */}

            {showDetails && selectedJob && (

                <div className="job-modal-overlay">

                    <div className="job-details-modal">

                        {/* MODAL HEADER */}
                        <div className="job-modal-header">

                            <div>

                                <span>
                                    REQUEST NUMBER
                                </span>

                                <h3>
                                    {selectedJob.requestNo}
                                </h3>

                            </div>

                            <button
                                className="modal-close"
                                onClick={closeDetails}
                            >
                                ×
                            </button>

                        </div>

                        {/* MODAL BODY */}
                        <div className="job-modal-body">

                            {/* STATUS */}
                            <div className="details-top">

                                <div>

                                    <small>
                                        CURRENT STATUS
                                    </small>

                                    <div>
                                        <span
                                            className={`job-status ${getStatusClass(
                                                selectedJob.status
                                            )}`}
                                        >
                                            {selectedJob.status}
                                        </span>
                                    </div>

                                </div>

                                <div className="details-price">

                                    <small>
                                        SERVICE AMOUNT
                                    </small>

                                    <strong>
                                        {selectedJob.amount}
                                    </strong>

                                </div>

                            </div>

                            {/* CUSTOMER INFO */}
                            <div className="details-section">

                                <h5>
                                    <i className="bi bi-person-circle"></i>
                                    Customer Information
                                </h5>

                                <div className="details-grid">

                                    <div>
                                        <small>
                                            Customer Name
                                        </small>

                                        <strong>
                                            {selectedJob.customerName}
                                        </strong>
                                    </div>

                                    <div>
                                        <small>
                                            Contact Number
                                        </small>

                                        <strong>
                                            {selectedJob.contact}
                                        </strong>
                                    </div>

                                    <div className="full-detail">

                                        <small>
                                            Location
                                        </small>

                                        <strong>
                                            <i className="bi bi-geo-alt me-1"></i>
                                            {selectedJob.location}
                                        </strong>

                                    </div>

                                </div>

                            </div>

                            {/* SERVICE INFO */}
                            <div className="details-section">

                                <h5>
                                    <i className="bi bi-tools"></i>
                                    Service Information
                                </h5>

                                <div className="details-grid">

                                    <div>
                                        <small>
                                            Service
                                        </small>

                                        <strong>
                                            {selectedJob.service}
                                        </strong>
                                    </div>

                                    <div>
                                        <small>
                                            Request No.
                                        </small>

                                        <strong>
                                            {selectedJob.requestNo}
                                        </strong>
                                    </div>

                                    <div>
                                        <small>
                                            Date
                                        </small>

                                        <strong>
                                            {selectedJob.date}
                                        </strong>
                                    </div>

                                    <div>
                                        <small>
                                            Time
                                        </small>

                                        <strong>
                                            {selectedJob.time}
                                        </strong>
                                    </div>

                                </div>

                            </div>

                            {/* JOB INFORMATION */}
                            <div className="details-section">

                                <h5>
                                    <i className="bi bi-file-text"></i>
                                    Job Information
                                </h5>

                                <div className="job-description">

                                    {selectedJob.description}

                                </div>

                            </div>

                            {/* PHOTO */}
                            <div className="details-section">

                                <h5>
                                    <i className="bi bi-image"></i>
                                    Homeowner Uploaded Photo
                                </h5>

                                <div className="uploaded-photo-wrapper">

                                    <img
                                        src={selectedJob.photo}
                                        alt="Homeowner uploaded"
                                        className="uploaded-job-photo"
                                    />

                                </div>

                            </div>

                            {/* STATUS TIMELINE */}
                            <div className="details-section">

                                <h5>
                                    <i className="bi bi-activity"></i>
                                    Job Progress
                                </h5>

                                <div className="job-progress">

                                    <div
                                        className={
                                            selectedJob.status ===
                                                "Accepted" ||
                                                selectedJob.status ===
                                                "On the Way" ||
                                                selectedJob.status ===
                                                "In Progress" ||
                                                selectedJob.status ===
                                                "Completed"
                                                ? "progress-step active"
                                                : "progress-step"
                                        }
                                    >
                                        <div className="progress-circle">
                                            <i className="bi bi-check"></i>
                                        </div>

                                        <span>
                                            Accepted
                                        </span>
                                    </div>

                                    <div
                                        className={
                                            selectedJob.status ===
                                                "On the Way" ||
                                                selectedJob.status ===
                                                "In Progress" ||
                                                selectedJob.status ===
                                                "Completed"
                                                ? "progress-step active"
                                                : "progress-step"
                                        }
                                    >
                                        <div className="progress-circle">
                                            <i className="bi bi-truck"></i>
                                        </div>

                                        <span>
                                            On the Way
                                        </span>
                                    </div>

                                    <div
                                        className={
                                            selectedJob.status ===
                                                "In Progress" ||
                                                selectedJob.status ===
                                                "Completed"
                                                ? "progress-step active"
                                                : "progress-step"
                                        }
                                    >
                                        <div className="progress-circle">
                                            <i className="bi bi-tools"></i>
                                        </div>

                                        <span>
                                            In Progress
                                        </span>
                                    </div>

                                    <div
                                        className={
                                            selectedJob.status ===
                                                "Completed"
                                                ? "progress-step active"
                                                : "progress-step"
                                        }
                                    >
                                        <div className="progress-circle">
                                            <i className="bi bi-check2-all"></i>
                                        </div>

                                        <span>
                                            Completed
                                        </span>
                                    </div>

                                </div>

                            </div>

                        </div>

                        {/* MODAL FOOTER */}
                        <div className="job-modal-footer">

                            <button
                                className="btn btn-outline-primary rounded-pill px-4"
                                onClick={() =>
                                    openMessage(selectedJob)
                                }
                            >
                                <i className="bi bi-chat-dots me-2"></i>
                                Message Customer
                            </button>

                            {getNextStatus(
                                selectedJob.status
                            ) && (

                                    <button
                                        className="btn btn-success rounded-pill px-4"
                                        onClick={() =>
                                            updateStatus(
                                                getNextStatus(
                                                    selectedJob.status
                                                )
                                            )
                                        }
                                    >
                                        <i className="bi bi-arrow-right-circle me-2"></i>

                                        {getNextButtonText(
                                            selectedJob.status
                                        )}

                                    </button>

                                )}

                            {selectedJob.status ===
                                "Completed" && (

                                    <button
                                        className="btn btn-secondary rounded-pill px-4"
                                        disabled
                                    >
                                        <i className="bi bi-check-circle me-2"></i>
                                        Completed
                                    </button>

                                )}

                        </div>

                    </div>

                </div>

            )}

            {/* ======================================
                MESSAGE MODAL
            ====================================== */}

            {showMessage && selectedJob && (

                <div className="job-modal-overlay">

                    <div className="message-modal">

                        <div className="message-modal-header">

                            <div>

                                <small>
                                    MESSAGE CUSTOMER
                                </small>

                                <h4>
                                    {selectedJob.customerName}
                                </h4>

                            </div>

                            <button
                                className="modal-close"
                                onClick={() =>
                                    setShowMessage(false)
                                }
                            >
                                ×
                            </button>

                        </div>

                        <div className="message-modal-body">

                            <div className="message-person">

                                <div className="customer-avatar large">
                                    {selectedJob.customerName
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>

                                <div>

                                    <strong>
                                        {selectedJob.customerName}
                                    </strong>

                                    <small>
                                        {selectedJob.service}
                                    </small>

                                </div>

                            </div>

                            <textarea
                                className="form-control"
                                rows="6"
                                placeholder="Type your message..."
                                value={message}
                                onChange={(e) =>
                                    setMessage(e.target.value)
                                }
                                minLength="1"
                                maxLength="1000"
                                required
                            ></textarea>

                        </div>

                        <div className="message-modal-footer">

                            <button
                                className="btn btn-light rounded-pill px-4"
                                onClick={() =>
                                    setShowMessage(false)
                                }
                            >
                                Cancel
                            </button>

                            <button
                                className="btn btn-success rounded-pill px-4"
                                onClick={sendMessage}
                            >
                                <i className="bi bi-send me-2"></i>
                                Send Message
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
};

export default ProviderJobs;
