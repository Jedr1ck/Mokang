# MeandJed Full Stack Setup

## 1. MariaDB
Create the database and tables from the project root:
```bash
mysql -u root -p < database/schema.sql
```

The schema keeps account and provider data in separate profile tables, uses
InnoDB foreign keys and unique keys, and includes indexes for booking searches,
message inboxes, notifications, and status history. It also installs a booking
status audit trigger. Login attempts (successful and failed) are written by the
API to `login_history`; authentication events are also written to `audit_logs`.
Do not put passwords, access tokens, or document contents in audit details.

For an existing database, apply the security/audit migration after the existing
schema migrations:
```powershell
Get-Content database/migrations/20261117_add_security_audit_controls.sql | mysql -u root -p Smarthomes
```
The trigger captures booking status changes made by any database client. The
audit row's actor is null for these trigger-generated events because MariaDB
does not have a trusted application actor context; API login events identify
their actor. Keep `booking_status_history` for the user-facing status timeline.

### Database operations and security

- **Transactions:** all multi-row API operations use SQLAlchemy sessions and
  commit once their related changes are ready. InnoDB makes each commit atomic;
  exceptions must roll back the session before reuse.
- **Domain rules:** role and booking status use database enums in the supplied
  schema; required fields, unique email/booking codes, ratings and relationships
  are constrained by column definitions and keys. Continue validating business
  transitions in the API as well.
- **Encryption:** use TLS for database connections in production (`DATABASE_URL`
  with the provider's TLS options), enable MariaDB disk/table encryption or
  encrypted storage and encrypted backups, and keep encryption keys separate
  from the database. Passwords are stored as bcrypt hashes. Uploaded identity
  documents need encrypted private storage and restricted access too.
- **Least privilege:** create a dedicated runtime account with SELECT, INSERT,
  UPDATE, and DELETE only on `Smarthomes` tables. Use a separate deployment
  account to create/alter tables and triggers, then remove schema privileges
  from the runtime account. Keep credentials in the environment, not source.
- **Backup and recovery:** take a daily encrypted logical backup and retain
  binary logs for point-in-time recovery; keep a second copy off the database
  host. Example logical backup: `mysqldump --single-transaction --routines
  --triggers Smarthomes > Smarthomes.sql`. Encrypt the output before moving it
  to backup storage. Restore into a clean staging database regularly and check
  row counts plus login, booking, and foreign-key behavior before production
  recovery. Record the backup location, retention, key owner, and recovery
  contact for the deployment.
- **Partitioning:** no table is partitioned at current scale. MariaDB partitioning
  complicates foreign keys and uniqueness, so first monitor table growth and
  query plans; partition high-volume append-only history only after a measured
  need and a migration/restore rehearsal. Aggregate analytics can be added if
  live queries become slow; avoid duplicating normalized data without a refresh
  strategy.
In PowerShell, use:
```powershell
Get-Content database/schema.sql | mysql -u root -p
```
The backend creates the complaints table on startup when it is missing. For manual
provisioning, apply the migration to an existing database:
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
To let providers request homeowner confirmation before a booking is completed, apply:
```powershell
Get-Content database/migrations/20261110_add_awaiting_confirmation_booking_status.sql | mysql -u root -p Smarthomes
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
frontend ports. On startup, the backend adds the platform's built-in service
categories to an existing `service_categories` table once, preserving any
categories already configured.

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
- POST /auth/admin/login (admin username or email)
- GET /auth/me
- GET/PUT /profile/me
- GET /public/stats
- GET /admin/dashboard (administrator-only database counts and recent activity)
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

For a clearly labeled monthly forecasting demo, call
`GET /admin/analytics?frequency=monthly&sampleData=true`. This uses fixed,
five-year synthetic booking data to demonstrate the ARIMA forecast and backtest.
It affects the report only and does not create or change database records.
Normal analytics requests continue to use recorded bookings.
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
