# Accommodation Marketplace (Airbnb Clone - Phase 11)

A short-stay vacation accommodation marketplace connecting hosts and travelers, featuring category filtering, wishlist toggles, server-authoritative price breakdown snapshots (nightly rate, cleaning fee, 12% marketplace fee, 10% local taxes), 10-minute temporary reservation holds, strict date-range overlap exclusion locking, and post-stay verified guest reviews.

---

## Architecture Overview

```
                      ┌───────────────────────────────────────────────┐
                      │              CartlyStays UI                   │
                      │   (Next.js 14 App Router, Rose Theme)         │
                      └──────────────────────┬────────────────────────┘
                                             │ REST / JSON
                                             ▼
                      ┌───────────────────────────────────────────────┐
                      │               Express Backend                 │
                      │  - Date-Range Overlap Mutex Engine            │
                      │  - Authoritative Pricing & Tax Calculator     │
                      │  - 10-Minute Hold Expiration Sweeper          │
                      │  - Verified Post-Checkout Review Gate         │
                      │  - Host Listing & Revenue Management          │
                      └──────────────────────┬────────────────────────┘
                                             │
                      ┌──────────────────────┴────────────────────────┐
                      │ PostgreSQL (cartly_airbnb_db) & Redis Cache   │
                      └───────────────────────────────────────────────┘
```

---

## Key Features

1. **Date-Range Overlap Exclusion Mutex**:
   - Confirmed stays and active reservation holds enforce exclusive occupancy for specified calendar spans (`reqCheckIn < bCheckOut && reqCheckOut > bCheckIn`).
   - Conflicting concurrent requests are rejected with `409 Conflict: Booking conflict: the selected dates are unavailable for this listing`.
2. **Authoritative Backend Pricing Authority**:
   - Client requests cannot alter or specify rates.
   - Computes base accommodation costs, cleaning fee, 12% platform service fee, and 10% local occupancy taxes, permanently recording an immutable price snapshot on the booking.
3. **10-Minute Reservation Hold & Timeout**:
   - Creates a temporary reservation lock for 10 minutes allowing the traveler to review checkout details.
   - Holds not confirmed within 10 minutes transition to `EXPIRED` (preventing stale slot locking).
4. **Verified Post-Stay Review Gate**:
   - Reviews are strictly gated to travelers who completed a verified stay (`status: COMPLETED`). Unverified submissions return `403 Forbidden`.
5. **Host Operations Center**:
   - Hosts publish listings, configure amenities, review incoming reservations, and monitor gross booking volume.

---

## Technical Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Express.js, TypeScript, CORS, JWT, Bcrypt.
- **Database**: PostgreSQL (`cartly_airbnb_db`), Redis cache.
- **Testing**: Vitest, Supertest.

---

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Authenticate guest or host.
- `GET /api/v1/auth/me` - Current session and persona.

### Listings
- `GET /api/v1/listings` - Search vacation rentals by category, city, guest count, and dates.
- `GET /api/v1/listings/:id` - Detailed property information and verified reviews.
- `POST /api/v1/listings` - Host publishes new accommodation listing.
- `PUT /api/v1/listings/:id` - Host updates property parameters.

### Quotes & Bookings
- `POST /api/v1/listings/:id/quote` - Calculate server-authoritative price breakdown.
- `POST /api/v1/bookings` - Create 10-minute reservation hold (date-overlap mutex check).
- `POST /api/v1/bookings/:id/confirm` - Pay and confirm reservation hold.
- `POST /api/v1/bookings/:id/cancel` - Cancel stay with policy refund calculation.
- `GET /api/v1/bookings/my` - Guest reservations tracker.
- `GET /api/v1/host/bookings` - Host incoming reservation queue.

### Reviews
- `POST /api/v1/listings/:id/reviews` - Submit post-stay review (verified stay gate).

---

## Verification & Testing

```bash
cd backend
npm test
```
Runs 7 tests across 2 test suites validating category search, server pricing accuracy, date collision locks, hold timeout mechanisms, and post-stay review eligibility gates.
