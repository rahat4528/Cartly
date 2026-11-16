# Flight Booking System - Architecture

## Architecture Diagram

```
[ Next.js 14 Flight Discovery & Itinerary UI ]
      │
      ├── Search Engine (Origin, Destination, One-way / Round-trip, Cabin Class, Dates)
      ├── Results Matrix (Direct & Multi-segment connections with timeline view)
      ├── Seat Selector & Passenger Manifest Form
      └── Demo E-Ticket Viewer & PNR Lookup
      │
      ▼ (REST / JSON API on port 5012)
[ Express / NestJS Backend ]
      │
      ├── Flights & Schedules Module (Direct & connecting graph search)
      ├── Temporal Connection Validator (Enforces 45-min minimum connection time)
      ├── Capacity Mutex Engine (Transactional seat count decrement)
      ├── Seat Matrix Mutex (Unique seat reservation per flight segment)
      ├── Fare Snapshot Calculator (Base fare + carrier fees + aviation taxes)
      ├── Demo E-Ticket Generator (Demonstration PNR + simulated ticket issuance)
      │
      ▼
[ PostgreSQL (cartly_flight_booking_db) & Redis Cache ]
```

## State Machine: Booking & Ticket Lifecycle
```
[SEARCHED] ──> [PRICED] ──> [HELD] ──> [PAID] ──> [TICKETED (Demo E-Ticket)]
                               │          │
                               ▼          ▼
                           [EXPIRED]  [CANCELLED (Refund Policy)]
```
Concurrency guards guarantee:
1. `remainingSeats >= requestedPassengers` decrements atomically.
2. `seatNumber` is strictly unique within `flightId`.
3. Connection time between `leg1.arrivalTime` and `leg2.departureTime` is >= 45 minutes.
