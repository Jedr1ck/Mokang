# MeandJed Full Stack Setup

## 1. MariaDB
Create the database and tables from the project root:
```bash
mysql -u root -p < database/schema.sql
```
In PowerShell, use:
```powershell
Get-Content database/schema.sql | mysql -u root -p
```
For an existing database, apply the complaints table migration separately:
```powershell
Get-Content database/migrations/20260603_create_complaints.sql | mysql -u root -p Smarthomes
```
To allow providers to offer multiple priced services in one category, apply:
```powershell
Get-Content database/migrations/20261027_allow_multiple_provider_services_per_category.sql | mysql -u root -p Smarthomes
```
To enable online/offline presence for messaging on an existing database, apply:
```powershell
Get-Content database/migrations/20261028_add_user_presence.sql | mysql -u root -p Smarthomes
```
To store the selected provider service on bookings in an existing database, apply:
```powershell
Get-Content database/migrations/20261028_add_booking_service_name.sql | mysql -u root -p Smarthomes
```

## 2. Backend
```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env   # Windows
# cp .env.example .env   # macOS/Linux
python app.py
```
Edit `backend/.env` with your MariaDB credentials. The default template
connects to the `Smarthomes` database used by the current backend, and it now
accepts Vite requests from both `localhost` and `127.0.0.1` on the default
frontend ports.

The Flask backend is organized into feature blueprints under `backend/app/routes`,
with shared SQLAlchemy models, request schemas, and database/authentication
helpers in separate modules. The API is available at http://localhost:8000.

## 3. Frontend
```bash
npm install
npm run dev
```
Optional `.env` in project root:
`VITE_API_URL=http://localhost:8000`

## Current backend endpoints
- POST /auth/register
- POST /auth/login
- POST /auth/admin/login
- GET /auth/me
- GET/PUT /profile/me
- GET /public/stats
- GET/POST /messages
- GET/POST /messages/presence (authenticated online status)
- GET /categories
- GET /providers
- POST /provider-verification/upload-id
- GET/PUT /provider-verification/me
- PUT /provider-verification/services (verified providers can manage their service list)
- POST /provider-verification/submit
- GET /admin/providers (administrator-only provider profiles and verification status)
- GET /admin/users/homeowners and POST /admin/users (administrator-only account management)
- GET /admin/provider-verifications
- GET /admin/provider-verifications/{provider_id}/documents/{side}
- POST /admin/provider-verifications/{provider_id}/approve
- GET /admin/analytics (administrator-only booking seasonality, service preferences, and ARIMA(1,1,1) forecast)
- POST /bookings
- GET /bookings/my
- PATCH /bookings/{id}/cancel (homeowner cancellation before provider acceptance)
- PATCH /bookings/{id}/status
- POST /bookings/{id}/reviews (completed bookings only)
- POST /bookings/{id}/complaints
- GET /admin/bookings and PATCH /admin/bookings/{id}/status (administrator-only)
- GET /admin/feedback and PATCH /admin/feedback/complaints/{id}/status (administrator-only)
- DELETE /admin/feedback/{reviews|complaints}/{id} (administrator-only)

The frontend API helper is in `src/services/api.js`.
