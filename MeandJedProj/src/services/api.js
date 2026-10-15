const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const token = () => localStorage.getItem('access_token');
export async function api(path, options = {}) { const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }; if (token()) headers.Authorization = `Bearer ${token()}`; const r = await fetch(`${API_URL}${path}`, { ...options, headers }); const data = await r.json().catch(() => ({})); if (!r.ok) { const detail = Array.isArray(data.detail) ? data.detail.map((item) => `${Array.isArray(item.loc) ? item.loc.at(-1) : 'Field'}: ${item.msg}`).join('\n') : data.detail; throw new Error(detail || 'Request failed'); } return data; }
export async function login(email, password) { const d = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); localStorage.setItem('access_token', d.access_token); localStorage.setItem('user', JSON.stringify(d.user)); return d }
export async function register(data) { return api('/auth/register', { method: 'POST', body: JSON.stringify(data) }) }
export async function loginAdmin(username, password) { const d = await api('/auth/admin/login', { method: 'POST', body: JSON.stringify({ username, password }) }); localStorage.setItem('access_token', d.access_token); localStorage.setItem('user', JSON.stringify(d.user)); return d; }
export async function getProviders(params = {}) { const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value && value !== 'All')); return api(`/providers${query.toString() ? `?${query}` : ''}`); }
export async function getPublicStats() { return api('/public/stats'); }
export async function getMyBookings() { return api('/bookings/my'); }
export async function updateBookingStatus(id, status) { return api(`/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); }
export async function sendMessage(recipientId, body, bookingId) { return api('/messages', { method: 'POST', body: JSON.stringify({ recipient_id: recipientId, body, booking_id: bookingId }) }); }
export async function getMessages() { return api('/messages'); }
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