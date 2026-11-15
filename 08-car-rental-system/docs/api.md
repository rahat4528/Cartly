# Phase 08: Car Rental System — REST API Specification

Base URL: `/api/v1`

## Endpoints

### 1. Health & Discovery
- `GET /health` — Service health status

### 2. Authentication
- `POST /auth/register` — Register renter account
- `POST /auth/login` — Sign in and receive JWT token
- `GET /auth/me` — Authenticated renter/agent profile

### 3. Fleet & Vehicle Search
- `GET /vehicles?category=&transmission=&pickupDate=&returnDate=` — Query fleet availability for specific date ranges
- `GET /vehicles/:id` — Get vehicle specifications and rate cards

### 4. Rentals & Bookings
- `POST /rentals` — Reserve vehicle with date range, insurance options, and deposit authorization
- `GET /rentals/my-rentals` — List renter's reservations
- `GET /rentals/:id` — Rental contract details, deposit status, and inspection sheet
- `POST /rentals/:id/pickup` (Agent) — Check out vehicle, record pickup odometer & fuel, transition to `ACTIVE_RENTAL`
- `POST /rentals/:id/return` (Agent) — Inspect vehicle, record return odometer & fuel, log any damage charges, transition to `RETURNED`
- `POST /rentals/:id/settle` (Agent) — Release security deposit minus damage/fuel deductions, transition to `COMPLETED`
- `POST /rentals/:id/cancel` — Cancel reservation before pickup and refund deposit and fees

### 5. Driver Verification
- `POST /license/verify` — Submit driver license details for immediate sandbox verification
