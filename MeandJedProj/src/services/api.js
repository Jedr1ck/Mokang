const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const token = () => localStorage.getItem('access_token');
export async function api(path, options = {}) { const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }; if (token()) headers.Authorization = `Bearer ${token()}`; const r = await fetch(`${API_URL}${path}`, { ...options, headers }); const data = await r.json().catch(() => ({})); if (!r.ok) { const payload = data.detail; const message = Array.isArray(payload) ? payload.map((item) => `${Array.isArray(item.loc) ? item.loc.at(-1) : 'Field'}: ${item.msg}`).join('\n') : typeof payload === 'string' ? payload : payload?.message || 'Request failed'; const missingFields = Array.isArray(payload?.missing_fields) ? payload.missing_fields.map((field) => String(field).replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').toLowerCase()) : []; const missing = missingFields.length ? ` Missing: ${missingFields.join(', ')}.` : ''; const error = new Error(`${message}${missing}`); error.details = payload; error.status = r.status; throw error; } return data; }
export async function login(email, password) { const d = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); localStorage.setItem('access_token', d.access_token); localStorage.setItem('user', JSON.stringify(d.user)); return d }
export async function loginWithRole(email, password, role) { const d = await api(`/auth/login/${encodeURIComponent(role)}`, { method: 'POST', body: JSON.stringify({ email, password }) }); localStorage.setItem('access_token', d.access_token); localStorage.setItem('user', JSON.stringify(d.user)); return d }
export async function register(data) { return api('/auth/register', { method: 'POST', body: JSON.stringify(data) }) }
export async function loginAdmin(username, password) { const d = await api('/auth/admin/login', { method: 'POST', body: JSON.stringify({ username, password }) }); localStorage.setItem('access_token', d.access_token); localStorage.setItem('user', JSON.stringify(d.user)); return d; }
export async function getProviders(params = {}) { const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value && value !== 'All')); return api(`/providers${query.toString() ? `?${query}` : ''}`); }
export async function getProvider(id) { return api(`/providers/${encodeURIComponent(id)}`); }
export async function getCategories() { return api('/categories'); }
export async function getPublicStats() { return api('/public/stats'); }
export async function getMyBookings() { return api('/bookings/my'); }
export async function updateBookingStatus(id, status) { return api(`/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); }
export async function rescheduleBooking(id, preferredDate, preferredTime) {
    return api(`/bookings/${id}/reschedule`, {
        method: 'PATCH',
        body: JSON.stringify({
            preferred_date: preferredDate,
            preferred_time: preferredTime,
        }),
    });
}
export async function sendMessage(recipientId, body, bookingId) { return api('/messages', { method: 'POST', body: JSON.stringify({ recipient_id: recipientId, body, booking_id: bookingId }) }); }
export async function getMessages() { return api('/messages'); }
export async function updatePresence() { return api('/messages/presence', { method: 'POST' }); }
export async function getPresence() { return api('/messages/presence'); }
export async function getNotifications() { return api('/notifications'); }
export async function markNotificationRead(id) { return api(`/notifications/${id}/read`, { method: 'PATCH' }); }
export async function markAllNotificationsRead() { return api('/notifications/read', { method: 'PATCH' }); }
export const logout = () => { localStorage.removeItem('access_token'); localStorage.removeItem('user'); };
// PROFILE API
export async function getMyProfile() {
    return api('/profile/me');
}

export async function updateMyProfile(profileData) {
    const updatedUser = await api('/profile/me', {
        method: 'PUT',
        body: JSON.stringify(profileData),
    });

    localStorage.setItem('user', JSON.stringify(updatedUser));
    return updatedUser;
}

// PROVIDER VERIFICATION API

export async function uploadProviderId(idSide, file) {
    const formData = new FormData();
    formData.append('file', file);

    const headers = {};

    if (token()) {
        headers.Authorization = `Bearer ${token()}`;
    }

    const response = await fetch(
        `${API_URL}/provider-verification/upload-id?id_side=${idSide}`,
        {
            method: 'POST',
            headers,
            body: formData,
        }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.detail || 'Failed to upload ID.');
    }

    return data;
}

export async function getProviderVerification() {
    return api('/provider-verification/me');
}

export async function getMyProviderReviews() {
    return api('/provider/reviews/me');
}

export async function submitProviderVerification() {
    return api('/provider-verification/submit', {
        method: 'POST',
    });
}

export async function updateProviderVerification(formData) {
    return api('/provider-verification/me', {
        method: 'PUT',
        body: JSON.stringify(formData),
    });
}

export async function updateVerifiedProviderServices(services) {
    return api('/provider-verification/services', {
        method: 'PUT',
        body: JSON.stringify({ services }),
    });
}

export async function getPendingProviderVerifications() {
    return api('/admin/provider-verifications');
}

export async function getAdminProviders() {
    return api('/admin/providers');
}

export async function getAdminHomeowners() {
    return api('/admin/users/homeowners');
}

export async function getAdminBookingAnalytics() {
    return api('/admin/analytics');
}

export async function getAdminDashboard() {
    return api('/admin/dashboard');
}

export async function createAdminAccount(account) {
    return api('/admin/users', {
        method: 'POST',
        body: JSON.stringify({
            full_name: account.fullName,
            email: account.email,
            password: account.password,
            role: account.role,
        }),
    });
}

export async function getProviderVerificationDocument(providerId, side) {
    const response = await fetch(
        `${API_URL}/admin/provider-verifications/${providerId}/documents/${side}`,
        {
            headers: token()
                ? { Authorization: `Bearer ${token()}` }
                : {},
        }
    );

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'Failed to load verification document.');
    }

    return response.blob();
}

export async function approveProviderVerification(providerId) {
    return api(
        `/admin/provider-verifications/${providerId}/approve`,
        { method: 'POST' }
    );
}