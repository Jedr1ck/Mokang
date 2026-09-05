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
uvicorn app.main:app --reload --port 8000
```
Edit `backend/.env` with your MariaDB credentials. The default template points to the `meandjed` database created by `database/schema.sql`.

API docs: http://localhost:8000/docs

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
- GET /auth/me
- GET /categories
- GET /providers
- POST /bookings
- GET /bookings/my
- PATCH /bookings/{id}/status

The frontend API helper is in `src/services/api.js`. Booking creation and My Bookings are already connected to the backend. Authentication and the remaining dashboard pages are structured for the next integration pass.
