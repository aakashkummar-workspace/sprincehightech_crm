# S Prince Hightech — Management CRM (Phase 1)

Centralized system for Tenders, Projects, Subcontractors, Employees/Payroll,
GST/Finance, and Daily Work Updates. See the full vision and architecture plan at
`C:\Users\Welcome-Pc\.claude\plans\now-you-are-the-quiet-lighthouse.md`.

## Stack
- **Client**: React + Vite + Tailwind CSS + React Router
- **Server**: Node.js + Express + PostgreSQL (`pg`)
- **Auth**: JWT, role- and region-based access control

## Setup

### 1. Database
Create a PostgreSQL database and set `DATABASE_URL` in `server/.env` (copy from `.env.example`):
```
createdb sprince_crm
```

### 2. Server
```
cd server
npm install
cp .env.example .env   # edit DATABASE_URL / JWT_SECRET
npm run migrate        # applies server/src/db/migrations/*.sql
npm run seed            # creates a minimal director login only
npm run dev              # starts API on http://localhost:4000
```
`npm run seed` creates just one account: `admin@sprincehightech.com` / `ChangeMe123!`
(change immediately). For a fully populated demo dataset across every module —
tenders in every stage, 3 projects across all 3 regions, 5 subcontractors with
multi-project assignments, 11 employees, 6 invoices, daily work updates — load
the richer seed instead:
```
psql "$DATABASE_URL" -f src/db/seed.sql
```
That file creates 8 demo logins, one per role, all with password `demo123`
(see the Roles & Demo Logins section below).

### 2b. Mock server (no PostgreSQL needed)
For UI work or a quick demo without installing Postgres, run the in-memory
mock API instead of the real one — same route shapes, same seed story:
```
cd server
node src/mock-server.js   # starts on http://localhost:4000, no DB required
```
Data resets whenever the process restarts.

### 3. Client
```
cd client
npm install
npm run dev               # starts on http://localhost:5173, proxies /api to :4000
```

## Roles & Demo Logins
director, regional_head, project_manager, site_supervisor, accounts_officer,
tender_officer, hr_officer — see the plan's Part 2 for permissions per role.
Use the director login to create further staff accounts via `POST /api/users`
(no UI screen for this yet in Phase 1 — use curl/Postman, or ask to add one).

Both `seed.sql` and the mock server create the same 8 demo accounts
(password `demo123` for all):

| Role | Name | Email | Region |
|---|---|---|---|
| Director | Dr. A. Joseph Stalin | director@sprincehightech.com | All |
| Regional Head | Antony Bala Prince | regionalhead.maharashtra@sprincehightech.com | Maharashtra |
| Project Manager | Ramesh Iyer | pm.korba@sprincehightech.com | Korba |
| Project Manager | Karthik Subramaniam | pm.delhi@sprincehightech.com | Delhi |
| Site Supervisor | Murugan Palanisamy | supervisor.korba@sprincehightech.com | Korba |
| Accounts Officer | Lakshmi Meenakshisundaram | accounts@sprincehightech.com | All |
| Tender Officer | Meena Krishnan | tenders@sprincehightech.com | All |
| HR Officer | Kavitha Ramasamy | hr@sprincehightech.com | All |

## Modules implemented (Phase 1)
- Tender Register + status workflow + Tender → Project conversion
- Project tracking + subcontractor assignment (many-to-many)
- Subcontractor master + per-project billing/payment ledger
- Employee master + attendance (bulk grid entry) + payroll run (PF/ESI auto-calculated)
- GST/Finance invoice tracking with CGST/SGST/IGST auto-split
- Daily Work Updates with Project Manager approval feeding project progress %
- Role-scoped Dashboard with the 12 KPIs from the original requirements spec
