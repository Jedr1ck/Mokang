import { useState } from "react";
import { createAdminAccount } from "../../services/api";

function CreateAccountModal({ role, onClose, onCreated }) {
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const accountType = role === "provider" ? "Service Provider" : "Homeowner";

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setSaving(true);
        try {
            await createAdminAccount({
                fullName: form.fullName,
                email: form.email,
                password: form.password,
                role,
            });
            await onCreated();
            onClose();
        } catch (requestError) {
            setError(requestError.message || `Unable to create ${accountType.toLowerCase()} account.`);
        } finally {
            setSaving(false);
        }
    };

    const updateField = (event) => {
        setForm((previous) => ({
            ...previous,
            [event.target.name]: event.target.value,
        }));
    };

    return (
        <div
            className="admin-modal-overlay"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !saving) onClose();
            }}
        >
            <form
                className="admin-modal admin-create-account-modal"
                onSubmit={handleSubmit}
                aria-labelledby="create-account-title"
            >
                <div className="admin-create-account-header">
                    <div className="admin-create-account-heading">
                        <div className="admin-create-account-icon" aria-hidden="true">
                            <i className={`bi ${role === "provider" ? "bi-person-badge-fill" : "bi-person-fill-add"}`}></i>
                        </div>
                        <div>
                            <span className="admin-create-account-eyebrow">USER MANAGEMENT</span>
                            <h3 id="create-account-title">Add {accountType}</h3>
                            <p>Create sign-in details for this new account.</p>
                        </div>
                    </div>
                    <button
                        className="admin-create-account-close"
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        disabled={saving}
                    >
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>

                <div className="admin-create-account-body">
                    <div className="admin-create-account-grid">
                        <label className="admin-create-account-field">
                            <span>Full name</span>
                            <input
                                name="fullName"
                                value={form.fullName}
                                onChange={updateField}
                                minLength={2}
                                maxLength={150}
                                autoComplete="name"
                                required
                            />
                        </label>
                        <label className="admin-create-account-field">
                            <span>Email address</span>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={updateField}
                                maxLength={255}
                                autoComplete="email"
                                required
                            />
                        </label>
                        <label className="admin-create-account-field">
                            <span>Initial password</span>
                            <input
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={updateField}
                                minLength={8}
                                maxLength={128}
                                autoComplete="new-password"
                                required
                            />
                        </label>
                        <label className="admin-create-account-field">
                            <span>Confirm password</span>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={form.confirmPassword}
                                onChange={updateField}
                                minLength={8}
                                maxLength={128}
                                autoComplete="new-password"
                                required
                            />
                        </label>
                    </div>

                    <div className="admin-create-account-hint">
                        <i className="bi bi-shield-lock-fill" aria-hidden="true"></i>
                        <p>
                            Use at least 8 characters, including uppercase and lowercase
                            letters and a number. Share the initial password securely
                            with the account holder.
                            {role === "provider" && " Provider details and verification can be completed after sign-in."}
                        </p>
                    </div>

                    {error && (
                        <div className="admin-create-account-error" role="alert">
                            <i className="bi bi-exclamation-circle-fill" aria-hidden="true"></i>
                            {error}
                        </div>
                    )}
                </div>

                <div className="admin-create-account-footer">
                    <button
                        type="button"
                        className="admin-create-account-cancel"
                        onClick={onClose}
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="admin-create-account-submit"
                        disabled={saving}
                    >
                        {saving ? (
                            <>
                                <span className="admin-create-account-spinner" aria-hidden="true"></span>
                                Creating account...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-check2-circle" aria-hidden="true"></i>
                                Create {accountType}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default CreateAccountModal;
