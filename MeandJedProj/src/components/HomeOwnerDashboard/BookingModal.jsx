import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { api } from '../../services/api';

const BookingModal = ({ show, handleClose, initialCategory = 'Electrical' }) => {
    const navigate = useNavigate();
    const [bookingSubmitted, setBookingSubmitted] = useState(false);
    const [formError, setFormError] = useState('');
    const [formData, setFormData] = useState({
        category: initialCategory,
        preferredDate: '',
        preferredTime: '',
        address: '',
        description: '',
        photo: null
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
            setFormError('Upload a valid image no larger than 5 MB.');
            e.target.value = '';
            return;
        }
        setFormError('');
        setFormData({ ...formData, photo: file });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const today = new Date().toISOString().split('T')[0];
        if (formData.preferredDate < today || formData.address.trim().length < 10 || formData.description.trim().length < 10) {
            setFormError('Choose today or a future date; address and description must each be at least 10 characters.');
            return;
        }
        setFormError('');
        try {
            await api('/bookings', { method: 'POST', body: JSON.stringify({
                category: formData.category,
                preferred_date: formData.preferredDate,
                preferred_time: formData.preferredTime,
                address: formData.address,
                description: formData.description
            }) });
            setBookingSubmitted(true);
        } catch (error) { alert(error.message); }
    };

    const resetAndClose = () => {
        setBookingSubmitted(false);
        handleClose();
    };

    // Handler para sa View / Track Booking button
    const handleTrackBooking = () => {
        resetAndClose();
        navigate('/track-booking');
    };

    if (!show) return null;

    return (
        <div className="modal show d-block tab-index-1 bg-dark bg-opacity-50" style={{ zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content rounded-4 border-0 shadow">

                    {/* Header */}
                    <div className="modal-header border-0 pb-0">
                        <h5 className="modal-title fw-bold">
                            {bookingSubmitted ? 'Booking Status' : 'Book a Service'}
                        </h5>
                        <button type="button" className="btn-close" onClick={resetAndClose}></button>
                    </div>

                    <div className="modal-body p-4">
                        {!bookingSubmitted ? (
                            /* FORM SECTION */
                            <form onSubmit={handleSubmit}>
                                <div className="row g-3">

                                    {/* Service Category */}
                                    <div className="col-12">
                                        <label className="form-label fw-semibold small">Service Category</label>
                                        <input
                                            type="text"
                                            className="form-control bg-light border-0 rounded-3"
                                            name="category"
                                            value={formData.category}
                                            readOnly
                                        />
                                    </div>

                                    {/* Preferred Date */}
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold small">Preferred Date</label>
                                        <input
                                            type="date"
                                            className="form-control rounded-3"
                                            name="preferredDate"
                                            value={formData.preferredDate}
                                            onChange={handleChange}
                                            min={new Date().toISOString().split('T')[0]}
                                            required
                                        />
                                    </div>

                                    {/* Preferred Time */}
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold small">Preferred Time</label>
                                        <input
                                            type="time"
                                            className="form-control rounded-3"
                                            name="preferredTime"
                                            value={formData.preferredTime}
                                            onChange={handleChange}
                                            minLength="10"
                                            maxLength="500"
                                            required
                                        />
                                    </div>

                                    {/* Service Address */}
                                    <div className="col-12">
                                        <label className="form-label fw-semibold small">Complete Address</label>
                                        <textarea
                                            className="form-control rounded-3"
                                            rows="2"
                                            name="address"
                                            placeholder="House No., Street, Barangay, City"
                                            value={formData.address}
                                            onChange={handleChange}
                                            minLength="10"
                                            maxLength="2000"
                                            required
                                        ></textarea>
                                    </div>

                                    {/* Problem Description */}
                                    <div className="col-12">
                                        <label className="form-label fw-semibold small">Problem Description</label>
                                        <textarea
                                            className="form-control rounded-3"
                                            rows="3"
                                            name="description"
                                            placeholder="Describe the issue or service needed in detail..."
                                            value={formData.description}
                                            onChange={handleChange}
                                            required
                                        ></textarea>
                                    </div>

                                    {/* Upload Photo (Optional) */}
                                    <div className="col-12">
                                        <label className="form-label fw-semibold small">Upload Photo <span className="text-muted fw-normal">(Optional)</span></label>
                                        <input
                                            type="file"
                                            className="form-control rounded-3"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                        />
                                        <small className="text-muted extra-small">Upload a photo to help service providers understand the problem better.</small>
                                    </div>

                                    {formError && <div className="col-12 text-danger small">{formError}</div>}

                                </div>

                                {/* Confirm Button */}
                                <div className="mt-4 text-end">
                                    <button type="button" className="btn btn-light rounded-pill px-4 me-2" onClick={resetAndClose}>Cancel</button>
                                    <button type="submit" className="btn btn-warning text-white rounded-pill px-4 fw-bold">Confirm Booking</button>
                                </div>
                            </form>
                        ) : (
                            /* SUCCESS CONFIRMATION SECTION */
                            <div className="text-center py-4">
                                <div className="mb-3 text-success">
                                    <i className="bi bi-check-circle-fill display-1"></i>
                                </div>
                                <h4 className="fw-bold mb-2">Thanks for Booking!</h4>
                                <p className="text-muted small mb-4">
                                    Your request has been successfully submitted. You will receive real-time updates and provider acceptance in your notifications.
                                </p>
                                <div className="d-flex justify-content-center gap-3">
                                    <button className="btn btn-outline-secondary rounded-pill px-4" onClick={resetAndClose}>
                                        Close
                                    </button>
                                    <button className="btn btn-warning text-white rounded-pill px-4 fw-bold" onClick={handleTrackBooking}>
                                        View / Track Booking
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default BookingModal;
