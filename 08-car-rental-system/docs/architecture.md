# Phase 08: Car Rental System — Architecture

## System Diagram

```
                 ┌────────────────────────────────────────────────────────┐
                 │                Cartly Drive Fleet UI                   │
                 │         (Next.js 14 App Router, Slate/Cyan Theme)      │
                 └───────────────────────────┬────────────────────────────┘
                                             │ HTTP REST / JSON
                                             ▼
                 ┌────────────────────────────────────────────────────────┐
                 │                  Express / Node API                    │
                 │  - Vehicle Availability & Date-Overlap Engine          │
                 │  - Tiered Duration Pricing (Daily/Weekly/Monthly)      │
                 │  - Security Deposit Escrow & Damage Adjuster           │
                 │  - Driver License Verification Guard                   │
                 │  - Rental State Machine (RESERVED -> ACTIVE ->         │
                 │    RETURNED -> COMPLETED / CANCELLED)                  │
                 └───────────────────────────┬────────────────────────────┘
                                             │
                 ┌───────────────────────────┴────────────────────────────┐
                 │ PostgreSQL (cartly_car_rental_db) & Redis              │
                 └────────────────────────────────────────────────────────┘
```

## Data Schema & Port Blueprint
- Database: `cartly_car_rental_db` (Postgres Port `5439`)
- Cache & Locks: Redis Port `6386`
- Backend API Port: `5008`
- Frontend Port: `3008`

## Date-Range Overlap Logic
Two rental bookings for the same vehicle overlap if:
`requestedStart < existingEnd && requestedEnd > existingStart`
Where state is not `CANCELLED`.
A mutex lock wraps the reservation verification, ensuring atomic insertion and preventing race conditions during concurrent bookings.
