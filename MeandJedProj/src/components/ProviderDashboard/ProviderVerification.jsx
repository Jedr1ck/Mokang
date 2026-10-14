
import { useEffect, useState } from 'react';
import {
    getProviderVerification,
    updateProviderVerification,
    uploadProviderId,
    submitProviderVerification,
} from '../../services/api';

const initialForm = {
    business_name: '',
    phone: '',
    region: '',
    province: '',
    city: '',
    barangay: '',
    street: '',
    postal_code: '',
    id_type: '',
    qualifications: '',
    service_area: '',
};

export default function ProviderVerification() {
    const [form, setForm] = useState(initialForm);
    const [frontFile, setFrontFile] = useState(null);
    const [backFile, setBackFile] = useState(null);
    const [frontPreview, setFrontPreview] = useState('');
    const [backPreview, setBackPreview] = useState('');
    const [status, setStatus] = useState('incomplete');
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;

        async function loadVerification() {
            try {
                const data = await getProviderVerification();

                if (!active) return;

                setForm((previous) => ({
                    ...previous,
                    ...Object.fromEntries(
                        Object.keys(initialForm).map((key) => [
                            key,
                            data[key] ?? previous[key],
                        ])
                    ),
                }));

                setStatus(data.verification_status || 'incomplete');
            } catch (err) {
                if (active) setError(err.message);
            } finally {
                if (active) setLoading(false);
            }
        }

        loadVerification();

        return () => {
            active = false;
        };
    }, []);

    function handleChange(event) {
        const { name, value } = event.target;
        setForm((previous) => ({ ...previous, [name]: value }));
    }

    function handleFileChange(event, side) {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            setError('Please select a JPG, PNG, or WEBP image.');
            event.target.value = '';
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('Maximum image size is 5 MB.');
            event.target.value = '';
            return;
        }

        setError('');
        const preview = URL.createObjectURL(file);

        if (side === 'front') {
            if (frontPreview) URL.revokeObjectURL(frontPreview);
            setFrontFile(file);
            setFrontPreview(preview);
        } else {
            if (backPreview) URL.revokeObjectURL(backPreview);
            setBackFile(file);
            setBackPreview(preview);
        }
    }

    async function handleUpload(side) {
        const file = side === 'front' ? frontFile : backFile;

        if (!file) {
            setError(`Please select the ${side} image first.`);
            return;
        }

        setBusy(true);
        setError('');
        setMessage('');

        try {
            const result = await uploadProviderId(side, file);
            setMessage(result.message || `${side} ID uploaded successfully.`);
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    async function handleSave() {
        setBusy(true);
        setError('');
        setMessage('');

        try {
            await updateProviderVerification(form);
            setMessage('Verification details saved successfully.');
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    async function handleSubmit() {
        setBusy(true);
        setError('');
        setMessage('');

        try {
            // Save details before submitting for review.
            await updateProviderVerification(form);
            const result = await submitProviderVerification();

            setStatus(result.verification_status || 'pending');
            setMessage(result.message || 'Verification submitted successfully.');
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    if (loading) return <p className="p-4">Loading verification details...</p>;

    return (
        <div className="container py-4" style={{ maxWidth: 900 }}>
            <h2>Provider Verification</h2>
            <p className="text-muted">
                Complete your provider details and upload both sides of your ID.
            </p>

            <div className="alert alert-info">
                Verification status: <strong>{status}</strong>
            </div>

            {message && <div className="alert alert-success">{message}</div>}
            {error && <div className="alert alert-danger" role="alert">{error}</div>}

            <form onSubmit={(event) => event.preventDefault()}>
                <h5 className="mt-4">Business and Contact Details</h5>

                {[
                    ['business_name', 'Business name'],
                    ['phone', 'Phone number'],
                    ['region', 'Region'],
                    ['province', 'Province'],
                    ['city', 'City / Municipality'],
                    ['barangay', 'Barangay'],
                    ['street', 'Street / House number'],
                    ['postal_code', 'Postal code'],
                    ['service_area', 'Service area'],
                    ['qualifications', 'Qualifications'],
                ].map(([name, label]) => (
                    <div className="mb-3" key={name}>
                        <label className="form-label" htmlFor={name}>{label}</label>
                        <input
                            id={name}
                            name={name}
                            className="form-control"
                            value={form[name]}
                            onChange={handleChange}
                        />
                    </div>
                ))}

                <div className="mb-3">
                    <label className="form-label" htmlFor="id_type">Type of ID</label>
                    <select
                        id="id_type"
                        name="id_type"
                        className="form-select"
                        value={form.id_type}
                        onChange={handleChange}
                    >
                        <option value="">Select ID type</option>
                        <option value="National ID">National ID</option>
                        <option value="Driver's License">Driver's License</option>
                        <option value="Passport">Passport</option>
                        <option value="UMID">UMID</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <h5 className="mt-4">Valid ID Images</h5>

                <div className="row g-4">
                    {[
                        { side: 'front', file: frontFile, preview: frontPreview, set: setFrontFile },
                        { side: 'back', file: backFile, preview: backPreview, set: setBackFile },
                    ].map(({ side, file, preview }) => (
                        <div className="col-md-6" key={side}>
                            <label className="form-label">
                                {side === 'front' ? 'Front of ID' : 'Back of ID'}
                            </label>
                            <input
                                type="file"
                                className="form-control"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(event) => handleFileChange(event, side)}
                            />

                            {preview && (
                                <img
                                    src={preview}
                                    alt={`${side} ID preview`}
                                    className="img-thumbnail mt-3"
                                    style={{ maxHeight: 220, objectFit: 'contain' }}
                                />
                            )}

                            <button
                                type="button"
                                className="btn btn-outline-primary mt-3"
                                disabled={busy || !file}
                                onClick={() => handleUpload(side)}
                            >
                                Upload {side} ID
                            </button>
                        </div>
                    ))}
                </div>

                <div className="d-flex flex-wrap gap-2 mt-4">
                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        disabled={busy}
                        onClick={handleSave}
                    >
                        Save Details
                    </button>

                    <button
                        type="button"
                        className="btn btn-primary"
                        disabled={busy || status === 'verified'}
                        onClick={handleSubmit}
                    >
                        {busy ? 'Please wait...' : 'Submit for Verification'}
                    </button>
                </div>
            </form>
        </div>
    );
}
