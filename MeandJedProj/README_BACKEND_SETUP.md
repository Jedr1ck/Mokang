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

## 2. Backend
```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env   # Windows
# cp .env.example .env   # macOS/Linux
flask --app app.main:app run --debug --port 8000
```
Edit `backend/.env` with your MariaDB credentials. The default template
connects to the `Smarthomes` database used by the current backend.

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
- GET /categories
- GET /providers
- POST /provider-verification/upload-id
- GET/PUT /provider-verification/me
- POST /provider-verification/submit
- GET /admin/providers (administrator-only provider profiles and verification status)
- GET /admin/provider-verifications
- GET /admin/provider-verifications/{provider_id}/documents/{side}
- POST /admin/provider-verifications/{provider_id}/approve
- POST /bookings
- GET /bookings/my
- PATCH /bookings/{id}/status

The frontend API helper is in `src/services/api.js`.
