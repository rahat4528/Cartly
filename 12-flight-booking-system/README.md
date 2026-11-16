# Flight Booking System (Phase 12)

> [!IMPORTANT]
> **DEMONSTRATION FLIGHT INVENTORY DISCLAIMER**: This application operates exclusively with simulated demonstration airline inventory for architectural validation and testing. It does not interface with commercial Global Distribution Systems (GDS) or airline reservation networks, and DOES NOT issue real commercial airline boarding passes or tickets. All generated confirmation documents are explicitly marked as "DEMONSTRATION ONLY - NOT A REAL BOARDING PASS".

A flight comparison and itinerary reservation engine featuring one-way, round-trip, and connecting flight searches with minimum 45-minute connection time validation, cabin fare class selection, transactional last-seat inventory decrement, segment seat-assignment exclusivity, server price snapshotting, and demonstration electronic ticket issuance.

---

## Architecture Overview

```
                      ┌───────────────────────────────────────────────┐
                      │              CartlyFlights UI                 │
                      │   (Next.js 14 App Router, Sky Theme)          │
                      └──────────────────────┬────────────────────────┘
                                             │ REST / JSON
                                             ▼
                      ┌───────────────────────────────────────────────┐
                      │               Express Backend                 │
                      │  - Direct & Connecting Itinerary Search Graph │
                      │  - 45-Minute Minimum Connection Time Validator│
                      │  - Per-Cabin Last-Seat Capacity Mutex         │
                      │  - Unique Seat Assignment Collision Engine    │
                      │  - Authoritative Fare Snapshot Engine         │
                      │  - Demonstration PNR & E-Ticket Generator     │
                      └──────────────────────┬────────────────────────┘
                                             │
                      ┌──────────────────────┴────────────────────────┐
                      │ PostgreSQL (cartly_flight_booking_db) & Redis │
                      └───────────────────────────────────────────────┘
```

---

## Key Features

1. **Demonstration Status & Transparency**:
   - Distinctive demonstration badges and disclaimers displayed prominently across the navigation header, search results, booking checkout drawer, and generated e-tickets.
2. **Connecting Flight Graph with 45-Min Minimum Buffer**:
   - Intelligently constructs multi-segment connecting flights (e.g. SFO -> ORD -> JFK).
   - Validates that the layover between leg 1 arrival and leg 2 departure is at least 45 minutes and under 8 hours.
3. **Per-Cabin Last-Seat Capacity Mutex**:
   - Enforces transactional inventory protection. Overbooking attempts that exceed cabin availability return `409 Conflict: Flight segment capacity exhausted`.
4. **Unique Seat Assignment Collision Engine**:
   - Passengers reserve designated seats (e.g. "14C"). Duplicate seat selection attempts on the same flight segment are rejected with `409 Conflict: Seat collision`.
5. **Authoritative Fare Snapshot & PNR Generator**:
   - Records base itinerary price, 15% carrier fuel surcharge, and $60 aviation facility and security taxes.
   - Generates simulated PNR locators (e.g. `DEMO-7A8B9C`) with demonstration e-ticket barcodes.
6. **Booking Cancellation**:
   - Restores seat capacity to the flight schedule and frees reserved seat assignments.

---

## Technical Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Express.js, TypeScript, CORS, JWT, Bcrypt.
- **Database**: PostgreSQL (`cartly_flight_booking_db`), Redis cache.
- **Testing**: Vitest, Supertest.

---

## API Endpoints

### System & Airports
- `GET /api/v1/health` - Health check and demonstration disclosure.
- `GET /api/v1/airports` - List supported IATA airports.

### Flight Search
- `GET /api/v1/flights/search` - Search direct and connecting flight schedules with `origin`, `destination`, `date`, `cabinClass`, `passengers`.
- `GET /api/v1/flights/:id` - Detailed flight schedule and remaining seat count.

### Bookings & E-Tickets
- `POST /api/v1/bookings` - Create reservation hold, validate seat uniqueness, decrement inventory.
- `POST /api/v1/bookings/:id/pay` - Transition reservation to `TICKETED` and issue demo e-ticket.
- `GET /api/v1/bookings/my` - Passenger booking history.
- `GET /api/v1/bookings/:id` - Retrieve demonstration itinerary details.
- `POST /api/v1/bookings/:id/cancel` - Cancel booking and restore seat inventory.

---

## Verification & Testing

```bash
cd backend
npm test
```
Runs 7 tests across 2 test suites verifying direct/connecting search, 45-minute connection buffers, capacity overbooking locks, duplicate seat collision prevention, and e-ticket lifecycle management.
