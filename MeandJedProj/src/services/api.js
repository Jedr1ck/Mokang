const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const token = () => localStorage.getItem('access_token');
export async function api(path, options = {}) { const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }; if (token()) headers.Authorization = `Bearer ${token()}`; const r = await fetch(`${API_URL}${path}`, { ...options, headers }); const data = await r.json().catch(() => ({})); if (!r.ok) { const detail = Array.isArray(data.detail) ? data.detail.map((item) => `${Array.isArray(item.loc) ? item.loc.at(-1) : 'Field'}: ${item.msg}`).join('\n') : data.detail; throw new Error(detail || 'Request failed'); } return data; }
export async function login(email, password) { const d = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); localStorage.setItem('access_token', d.access_token); localStorage.setItem('user', JSON.stringify(d.user)); return d }
export async function register(data) { return api('/auth/register', { method: 'POST', body: JSON.stringify(data) }) }
export async function adminExists() { return api('/auth/admin/exists'); }
export async function registerAdmin(username, password) { return api('/auth/admin/register', { method: 'POST', body: JSON.stringify({ username, password }) }); }
export async function loginAdmin(username, password) { const d = await api('/auth/admin/login', { method: 'POST', body: JSON.stringify({ username, password }) }); localStorage.setItem('access_token', d.access_token); localStorage.setItem('user', JSON.stringify(d.user)); return d; }
export async function getProviders(params = {}) { const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value && value !== 'All')); return api(`/providers${query.toString() ? `?${query}` : ''}`); }
export async function getPublicStats() { return api('/public/stats'); }
export async function getMyBookings() { return api('/bookings/my'); }
export async function updateBookingStatus(id, status) { return api(`/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); }
export async function sendMessage(recipientId, body, bookingId) { return api('/messages', { method: 'POST', body: JSON.stringify({ recipient_id: recipientId, body, booking_id: bookingId }) }); }
export async function getMessages() { return api('/messages'); }
export const logout = () => { localStorage.removeItem('access_token'); localStorage.removeItem('user'); };
