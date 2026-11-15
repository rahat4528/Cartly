# Movie Ticket Booking System (Phase 06)

A high-performance, real-time cinema ticket booking platform with an interactive 2D auditorium seat matrix, deterministic 8-minute seat holds with automatic expiration sweepers, dynamic pricing tiers (Standard, Premium, VIP Recliner), contactless QR pass generation, and an usher gate admission scanner with duplicate entry security detection.

---

## Architecture Overview

```
                      ┌───────────────────────────────────────────────┐
                      │              Cartly Cinema UI                 │
                      │   (Next.js 14 App Router, Tailwind CSS)       │
                      └──────────────────────┬────────────────────────┘
                                             │ REST / JSON
                                             ▼
                      ┌───────────────────────────────────────────────┐
                      │               Express Backend                 │
                      │  - Seat Matrix & 2D Layout Engine             │
                      │  - Mutex Hold Lock & Expiration Sweeper       │
                      │  - State Machine (HELD -> CONFIRMED ->        │
                      │    ADMITTED / CANCELLED / EXPIRED)            │
                      │  - Usher Single-Admission Gate                │
                      └──────────────────────┬────────────────────────┘
                                             │
                      ┌──────────────────────┴────────────────────────┐
                      │ PostgreSQL (cartly_movie_booking_db) & Redis   │
                      └───────────────────────────────────────────────┘
```

---

## Key Features

1. **Interactive 2D Auditorium Layout**:
   - 70-seat matrix (Rows A through G, Columns 1 through 10) mapped to curved screen projections.
   - Three distinct pricing tiers: Standard ($14.50), Premium ($18.50), and VIP Recliner ($24.00), plus fixed $1.50 per-seat convenience fee.
2. **Deterministic 8-Minute Hold Lock**:
   - Atomic reservation locks prevent concurrent double-booking of any seat.
   - Background hold sweeper automatically releases held seats upon expiration.
3. **Usher Admission Gate & Duplicate Scan Alarm**:
   - Scans digital ticket codes at the theatre entrance.
   - Transitions state to `ADMITTED`. Rescanning the same code immediately triggers a `409 Conflict: DUPLICATE ENTRY ALERT` preventing fraudulent re-entry.
4. **Patron Ticket Wallet**:
   - Verifiable ticket passes with dynamic QR code visualization.

---

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: Express.js, TypeScript, Helmet, CORS, Bcryptjs, JSON Web Tokens (JWT)
- **Database**: PostgreSQL (`cartly_movie_booking_db`), Prisma ORM
- **Cache & Locks**: Redis (`port 6384`)
- **Testing**: Vitest, Supertest

---

## Port Allocation

| Component | Port |
| :--- | :--- |
| Frontend | `3006` |
| Backend API | `5006` |
| PostgreSQL | `5437` (`cartly_movie_booking_db`) |
| Redis | `6384` |

---

## Seed Accounts (Local Development)

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `Pass123!` |
| **Usher** | `usher@example.com` | `Pass123!` |
| **Patron** | `patron@example.com` | `Pass123!` |

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
