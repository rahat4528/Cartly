# Car Rental System (Phase 08)

A high-performance vehicle fleet rental marketplace with multi-tier duration discounts (weekly 15%, monthly 30%), strict date-range overlap locking, driver license verification gates, refundable security deposit escrow ($250 hold), and return inspection damage deduction management.

---

## Architecture Overview

```
                      ┌───────────────────────────────────────────────┐
                      │              CartlyDrive UI                   │
                      │   (Next.js 14 App Router, Slate/Teal Theme)   │
                      └──────────────────────┬────────────────────────┘
                                             │ REST / JSON
                                             ▼
                      ┌───────────────────────────────────────────────┐
                      │               Express Backend                 │
                      │  - Date-Range Overlap Mutex Guard             │
                      │  - Tiered Duration Pricing Engine             │
                      │  - Driver License Verification Guard          │
                      │  - State Machine (RESERVED -> ACTIVE ->       │
                      │    RETURNED -> COMPLETED / CANCELLED)         │
                      │  - Inspection & Damage Escrow Settlement      │
                      └──────────────────────┬────────────────────────┘
                                             │
                      ┌──────────────────────┴────────────────────────┐
                      │ PostgreSQL (cartly_car_rental_db) & Redis      │
                      └───────────────────────────────────────────────┘
```

---

## Key Features

1. **Date-Range Overlap Locking**:
   - Checks requested pickup and return dates against existing vehicle reservations (`reqStart < rEnd && reqEnd > rStart`).
   - Atomic reservation locks prevent concurrent double-booking of any vehicle. Overlapping requests strictly return `409 Conflict: Vehicle unavailable for the requested dates`.
2. **Tiered Duration Pricing**:
   - Base daily rate.
   - Rentals of 7 days or more receive an automatic 15% weekly duration discount.
   - Rentals of 30 days or more receive an automatic 30% monthly duration discount.
3. **Escrow Security Deposit & Return Inspection**:
   - Holds a refundable $250.00 security deposit upon reservation.
   - Fleet agents record vehicle pickup odometer & fuel.
   - Return inspections log damages, deduct repair fees, and refund the net escrow deposit directly to the renter upon completion.
4. **Driver License Verification Gate**:
   - Renter driver licenses are validated prior to contract execution.

---

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: Express.js, TypeScript, Helmet, CORS, Bcryptjs, JSON Web Tokens (JWT)
- **Database**: PostgreSQL (`cartly_car_rental_db`), Prisma ORM
- **Cache**: Redis (`port 6386`)
- **Testing**: Vitest, Supertest

---

## Port Allocation

| Component | Port |
| :--- | :--- |
| Frontend | `3008` |
| Backend API | `5008` |
| PostgreSQL | `5439` (`cartly_car_rental_db`) |
| Redis | `6386` |

---

## Seed Accounts (Local Development)

| Role | Email | Password |
| :--- | :--- | :--- |
| **Renter** | `renter@example.com` | `Pass123!` |
| **Fleet Agent** | `agent@example.com` | `Pass123!` |
| **Fleet Manager** | `admin@example.com` | `AdminPass123!` |

---

## Setup & Running

### 1. Database & Cache
```bash
docker-compose up -d
```

### 2. Backend Setup
```bash
cd backend
npm install
npm test
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run build
npm run dev
```

### 4. Running Integration Tests
```bash
npm test
```
