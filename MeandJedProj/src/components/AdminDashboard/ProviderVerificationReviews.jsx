import { useCallback, useEffect, useState } from "react";
import {
    approveProviderVerification,
    getPendingProviderVerifications,
    getProviderVerificationDocument,
    rejectProviderVerification,
} from "../../services/api";
import ConfirmDialog from "../ConfirmDialog";
import "./AdminVerificationReviews.css";

function ProviderVerificationReviews({ onBack }) {
    const [requests, setRequests] = useState([]);
    const [documentUrls, setDocumentUrls] = useState({});
    const [pdfDocuments, setPdfDocuments] = useState({});
    const [documentErrors, setDocumentErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [approvingId, setApprovingId] = useState(null);
    const [requestToApprove, setRequestToApprove] = useState(null);
    const [requestToReject, setRequestToReject] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");

    const loadRequests = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            setRequests(await getPendingProviderVerifications());
        } catch (requestError) {
            setError(
                requestError?.message ||
                "Could not load provider verification requests."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            loadRequests();
        }, 0);
        return () => window.clearTimeout(timer);
    }, [loadRequests]);

    useEffect(() => {
        let active = true;
        const urls = [];

        const loadDocuments = async () => {
            const loaded = {};
            const pdfs = {};
            const failures = {};
            await Promise.all(
                requests.flatMap((request) =>
                    ["front", "back", "clearance"].map(async (side) => {
                        if (!request.documents?.[side]) {
                            return;
                        }
                        const key = `${request.providerId}-${side}`;
                        try {
                            const blob = await getProviderVerificationDocument(
                                request.providerId,
                                side
                            );
                            const url = URL.createObjectURL(blob);
                            urls.push(url);
                            loaded[key] = url;
                            pdfs[key] = blob.type === "application/pdf";
                        } catch (documentError) {
                            failures[key] =
                                documentError?.message ||
                                "Unable to display this document.";
                        }
                    })
                )
            );
            if (active) {
                setDocumentUrls(loaded);
                setPdfDocuments(pdfs);
                setDocumentErrors(failures);
            } else {
                urls.forEach((url) => URL.revokeObjectURL(url));
            }
        };

        if (requests.length) {
            loadDocuments();
        }

        return () => {
            active = false;
            urls.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [requests]);

    const handleApprove = (request) => setRequestToApprove(request);

    const confirmApprove = async () => {
        if (!requestToApprove) return;
        setApprovingId(requestToApprove.providerId);
        setError("");
        setSuccess("");
        try {
            await approveProviderVerification(requestToApprove.providerId);
            setRequests((current) =>
                current.filter(
                    (item) => item.providerId !== requestToApprove.providerId
                )
            );
            setSuccess(
                `${requestToApprove.fullName}'s provider verification was approved.`
            );
            setRequestToApprove(null);
        } catch (approvalError) {
            setError(
                approvalError?.message ||
                "Could not approve this provider verification."
            );
        } finally {
            setApprovingId(null);
        }
    };

    const confirmReject = async (event) => {
        event.preventDefault();
        if (!requestToReject || !rejectionReason.trim()) return;
        setApprovingId(requestToReject.providerId);
        setError("");
        setSuccess("");
        try {
            await rejectProviderVerification(
                requestToReject.providerId,
                rejectionReason.trim()
            );
            setRequests((current) => current.filter(
                (item) => item.providerId !== requestToReject.providerId
            ));
            setSuccess(`${requestToReject.fullName}'s verification was rejected. The provider can now correct and resubmit.`);
            setRequestToReject(null);
            setRejectionReason("");
        } catch (rejectError) {
            setError(rejectError?.message || "Could not reject this provider verification.");
        } finally {
            setApprovingId(null);
        }
    };

    return (
        <section className="verification-reviews">
            <header className="verification-reviews-header">
                <div>
                    <span className="providers-section-label">
                        PROVIDER MANAGEMENT
                    </span>
                    <h2>Verification Reviews</h2>
                    <p>
                        Check the submitted profile and both ID images before
                        approving a provider.
                    </p>
                </div>
                <button
                    type="button"
                    className="verification-back-button"
                    onClick={onBack}
                >
                    <i className="bi bi-arrow-left" aria-hidden="true"></i>
                    Provider accounts
                </button>
            </header>

            {error && (
                <div className="verification-alert error" role="alert">
                    {error}
                </div>
            )}
            {success && (
                <div className="verification-alert success" role="status">
                    {success}
                </div>
            )}
            <ConfirmDialog
                open={Boolean(requestToApprove)}
                title="Are you sure you want to submit?"
                message={`Approve identity verification for ${requestToApprove?.fullName}?`}
                confirmLabel="Yes, Submit"
                icon="bi-shield-check"
                busy={Boolean(approvingId)}
                onConfirm={confirmApprove}
                onCancel={() => setRequestToApprove(null)}
            />
            {requestToReject && (
                <div className="verification-reject-backdrop" role="presentation">
                    <form className="verification-reject-dialog" onSubmit={confirmReject} role="dialog" aria-modal="true" aria-labelledby="verification-reject-title">
                        <h3 id="verification-reject-title">Reject verification</h3>
                        <p>Tell {requestToReject.fullName} what needs to be corrected. They will see this note and can submit again.</p>
                        <label htmlFor="verification-reject-reason">Reason for rejection</label>
                        <textarea id="verification-reject-reason" value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} maxLength={1000} required rows={4} placeholder="Example: The ID image is blurry. Please upload a clear photo of both sides." />
                        <div className="verification-reject-dialog-actions">
                            <button type="button" onClick={() => { setRequestToReject(null); setRejectionReason(""); }} disabled={Boolean(approvingId)}>Cancel</button>
                            <button type="submit" disabled={Boolean(approvingId) || !rejectionReason.trim()}>{approvingId ? "Rejecting..." : "Reject verification"}</button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="verification-empty">Loading review requests...</div>
            ) : requests.length === 0 ? (
                <div className="verification-empty">
                    <i className="bi bi-shield-check" aria-hidden="true"></i>
                    <strong>No pending verification requests</strong>
                    <span>Submitted provider applications will appear here.</span>
                    <button type="button" onClick={loadRequests}>
                        Refresh
                    </button>
                </div>
            ) : (
                <div className="verification-request-list">
                    {requests.map((request) => {
                        const documentsReady =
                            request.documents?.front &&
                            request.documents?.back &&
                            request.documents?.clearance &&
                            documentUrls[`${request.providerId}-front`] &&
                            documentUrls[`${request.providerId}-back`] &&
                            documentUrls[`${request.providerId}-clearance`];

                        return (
                            <article
                                className="verification-request-card"
                                key={request.providerId}
                            >
                                <div className="verification-request-title">
                                    <div>
                                        <h3>
                                            {request.businessName ||
                                                request.fullName}
                                        </h3>
                                        <p>
                                            Submitted by {request.fullName}
                                            {request.verificationSubmittedAt &&
                                                ` · ${new Date(
                                                    request.verificationSubmittedAt
                                                ).toLocaleString()}`}
                                        </p>
                                    </div>
                                    <span className="verification-pending-badge">
                                        Pending review
                                    </span>
                                </div>

                                <div className="verification-detail-grid">
                                    <section>
                                        <h4>Account information</h4>
                                        <p><b>Name</b>{request.fullName}</p>
                                        <p><b>Email</b>{request.email}</p>
                                        <p><b>Phone</b>{request.mobileNumber || "Not provided"}</p>
                                        <p><b>Gender</b>{request.gender || "Not provided"}</p>
                                        <p><b>Birthday</b>{request.birthday || "Not provided"}</p>
                                        <p><b>Address</b>{request.address || "Not provided"}</p>
                                    </section>
                                    <section>
                                        <h4>Provider details</h4>
                                        <p><b>Business</b>{request.businessName || "Not provided"}</p>
                                        <p><b>Services</b>{request.services?.filter(Boolean).join(", ") || "Not provided"}</p>
                                        <p><b>Qualifications</b>{request.qualifications || "Not provided"}</p>
                                        <p><b>Experience</b>{request.experienceYears} years</p>
                                        <div className="verification-service-prices">
                                            <b>Specific service prices</b>
                                            {request.servicePrices?.length
                                                ? request.servicePrices.map((service) => (
                                                    <span key={service.name}>
                                                        {service.name}: ₱{Number(service.price).toLocaleString()}
                                                    </span>
                                                ))
                                                : <span>Not provided</span>}
                                        </div>
                                        <p><b>Service area</b>{request.serviceArea || "Not provided"}</p>
                                        <p><b>Location</b>{[
                                            request.streetAddress,
                                            request.barangay,
                                            request.cityMunicipality,
                                            request.province,
                                            request.region,
                                            request.postalCode,
                                        ].filter(Boolean).join(", ") || "Not provided"}</p>
                                        <p><b>Bio</b>{request.bio || "Not provided"}</p>
                                    </section>
                                </div>

                                <div className="verification-documents">
                                    <div className="verification-documents-heading">
                                        <div>
                                            <h4>Identity verification</h4>
                                            <p>ID type: {request.idType || "Not provided"}</p>
                                        </div>
                                        <span>
                                            {documentsReady
                                                ? "Both images loaded"
                                                : "Review both ID sides"}
                                        </span>
                                    </div>
                                    <div className="verification-document-grid">
                                        {[["front", "Front image"], ["back", "Back image"], ["clearance", `${request.clearanceType === "nbi" ? "NBI" : "Police"} clearance`]].map(([side, label]) => {
                                            const key = `${request.providerId}-${side}`;
                                            return (
                                                <div
                                                    className="verification-document"
                                                    key={side}
                                                >
                                                    <strong>{label}</strong>
                                                    {documentUrls[key] ? (
                                                        <a
                                                            href={documentUrls[key]}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            aria-label={`Open ID ${side} image in new tab`}
                                                        >
                                                            {pdfDocuments[key] ? (
                                                                <iframe title={`${label} document`} src={documentUrls[key]} style={{ width: "100%", height: 300 }} />
                                                            ) : (
                                                                <img src={documentUrls[key]} alt={`Provider ${label}`} />
                                                            )}
                                                        </a>
                                                    ) : (
                                                        <span className="verification-document-placeholder">
                                                            {documentErrors[key] ||
                                                                (request.documents?.[side]
                                                                    ? "Loading image..."
                                                                    : "Not uploaded")}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="verification-review-actions">
                                    <span>
                                        Review the submitted identity documents and clearance.
                                    </span>
                                    <button
                                        type="button"
                                        disabled={
                                            !documentsReady ||
                                            approvingId === request.providerId
                                        }
                                        onClick={() => handleApprove(request)}
                                    >
                                        <i className="bi bi-check-circle-fill" aria-hidden="true"></i>
                                        {approvingId === request.providerId
                                            ? "Approving..."
                                            : "Approve provider"}
                                    </button>
                                    <button
                                        type="button"
                                        className="verification-reject-button"
                                        disabled={approvingId === request.providerId}
                                        onClick={() => { setRequestToReject(request); setRejectionReason(""); }}
                                    >
                                        <i className="bi bi-x-circle" aria-hidden="true"></i>
                                        Reject
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

export default ProviderVerificationReviews;
