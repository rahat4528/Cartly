# House Rental Platform (Phase 10)

A dedicated residential tenancy platform for landlords and tenants, featuring monthly-rent filtering, an interactive application review stepper, anti-collision viewing tour appointments, and transactional lease generation with strict date-range overlap exclusion constraints.

---

## Architecture Overview

```
                      ┌───────────────────────────────────────────────┐
                      │              CartlyRentals UI                 │
                      │   (Next.js 14 App Router, Emerald Theme)      │
                      └──────────────────────┬────────────────────────┘
                                             │ REST / JSON
                                             ▼
                      ┌───────────────────────────────────────────────┐
                      │               Express Backend                 │
                      │  - Tenant Application Review State Machine    │
                      │  - Viewing Scheduler Anti-Double-Booking Guard│
                      │  - Date-Range Overlap Lease Exclusion Mutex   │
                      │  - Applicant Document Privacy & RBAC          │
                      │  - Tenant Maintenance Ticketing               │
                      └──────────────────────┬────────────────────────┘
                                             │
                      ┌──────────────────────┴────────────────────────┐
                      │ PostgreSQL (cartly_house_rental_db) & Redis   │
                      └───────────────────────────────────────────────┘
```

---

## Key Features

1. **Date-Range Exclusion Lease Mutex**:
   - Every active or draft-approved lease enforces strict date-range exclusion: two leases for the same unit cannot overlap (`reqStart < leaseEnd && reqEnd > leaseStart`).
   - Concurrent or sequential attempts to lease an occupied unit for overlapping time spans are rejected with `409 Conflict`.
2. **Tenant Application Vetting Workflow**:
   - Prospective tenants submit income, credit score, employer verification, and pet details.
   - Landlords advance applications through a formal state machine: `SUBMITTED` -> `UNDER_REVIEW` -> `APPROVED` / `REJECTED` / `WITHDRAWN`.
3. **Sensitive Applicant Privacy**:
   - Financial and personal applicant records are protected: only the applicant and the verified landlord of that unit can access the application. Unauthorized users are blocked with `403 Forbidden`.
4. **Anti-Collision Viewing Tour Scheduler**:
   - Prospective renters schedule property viewings with exclusive time slot reservation (`unitId, date, timeSlot`). Conflicting appointments return `409 Conflict`.
5. **Tenant Maintenance Ticketing**:
   - Active tenants report repair tickets with urgency levels (`LOW`, `MEDIUM`, `URGENT`) and track resolution status (`REPORTED`, `IN_PROGRESS`, `RESOLVED`).

---

## Technical Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Express.js, TypeScript, Helmet, CORS, JWT, Bcrypt.
- **Database**: PostgreSQL (`cartly_house_rental_db`), Redis cache.
- **Testing**: Vitest, Supertest.

---

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Authenticate tenant or landlord.
- `GET /api/v1/auth/me` - Retrieve current session and role.

### Properties & Units
- `GET /api/v1/properties` - List residential properties with `maxRent`, `minBedrooms`, and `city` filters.
- `GET /api/v1/properties/:id` - Detailed property view with all constituent rental units.

### Viewing Appointments
- `POST /api/v1/units/:id/viewings` - Schedule viewing tour (enforces anti-double-booking mutex).
- `GET /api/v1/units/:id/viewings` - View booked slots for unit.

### Rental Applications
- `POST /api/v1/applications` - Tenant submits lease application.
- `GET /api/v1/applications/my` - Tenant application tracker.
- `GET /api/v1/landlord/applications` - Landlord applicant queue.
- `GET /api/v1/applications/:id` - Applicant document inspection (privacy protected).
- `PATCH /api/v1/applications/:id/status` - Landlord review state transition.

### Leases
- `POST /api/v1/leases` - Landlord generates lease (date-range overlap mutex check).
- `PATCH /api/v1/leases/:id/sign` - Tenant signs lease to activate tenancy.
- `GET /api/v1/leases/my` - Retrieve user's active/past leases.

### Maintenance Requests
- `POST /api/v1/maintenance` - Tenant logs maintenance ticket.
- `GET /api/v1/maintenance` - Retrieve maintenance tickets.

---

## Verification & Testing

```bash
cd backend
npm test
```
Runs 7 tests across 2 test suites verifying monthly rent filtering, viewing slot mutex collision rejection, applicant state machine, document privacy isolation, and date-range lease exclusion locks.
