# Flight Booking System (Demonstration Inventory) - Requirements & Blueprint

> [!IMPORTANT]
> **DEMONSTRATION STATUS DISCLAIMER**: This application operates exclusively using simulated demonstration flight inventory. It does not interface with commercial Global Distribution Systems (GDS) or airline reservation networks, and DOES NOT issue legally valid airline travel tickets or boarding passes. All generated e-tickets are explicitly marked as "DEMONSTRATION ONLY - NOT A BOARDING PASS".

## 1. Scope & Core Objectives
A full-stack flight comparison and booking engine featuring one-way, round-trip, and multi-city itineraries, connecting flight segment validation (minimum 45-minute connection time buffer), cabin fare classes (Economy, Premium, Business), transactional last-seat inventory decrement, segment seat-assignment exclusivity, server price snapshotting, and demonstration electronic ticket issuance.

## 2. Key Entities & Data Model
- **User**: Passengers and Airline Operations Administrators with RBAC.
- **Airport**: IATA code, name, city, country, timezone coordinates (e.g. SFO, JFK, LHR, HND, ORD).
- **Airline & Aircraft**: Carrier codes (e.g. CA - Cartly Airways), tail numbers, aircraft models, seat maps.
- **Flight & FlightSchedule**: Origin, destination, departure time, arrival time, aircraft, duration minutes.
- **FlightSegment**: Atomic flight hop connecting two airports.
- **FareClass**: Economy (standard), Business (priority check-in, free seat selection, refundable).
- **Booking**: Reservation record with state machine: `SEARCHED` -> `PRICED` -> `HELD` -> `PAID` -> `TICKETED` (plus `CANCELLED`, `EXPIRED`).
- **Passenger**: Legal name, passport number / ID, date of birth, seat selection per segment.
- **Ticket**: Digital demonstration e-ticket containing PNR locator, QR code token, passenger manifest, and clear demonstration banner.

## 3. Critical Security & Concurrency Requirements
1. **Last-Seat Capacity Mutex**: Flights enforce strict per-cabin capacity limits. Parallel bookings competing for the last available seat on a flight segment must allow exactly 1 booking; concurrent attempts return `409 Conflict: Flight segment capacity exhausted`.
2. **Connecting Flight Temporal Validation**: Connecting itineraries are validated segment by segment. Departure of leg 2 must occur at least 45 minutes after arrival of leg 1, and no backwards temporal overlaps are permitted.
3. **Unique Seat Assignment**: No two passengers on the same flight segment can be assigned the identical seat (e.g. "12A"). Collisions return `409 Conflict`.
4. **Immutable Fare Snapshot**: Once booked, fare breakdown (base fare, fuel surcharge, airport departure tax, total) is stored as an immutable snapshot.
5. **Demonstration Disclosure**: Prominently display DEMONSTRATION notices on all checkout screens, e-tickets, and documentation.
