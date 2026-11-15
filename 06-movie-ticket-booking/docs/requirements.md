# Movie Ticket Booking — Product Requirements Document (PRD)

## 1. Executive Summary

The Movie Ticket Booking System (`06-movie-ticket-booking`) is an independent cinema multiplex ticketing platform. It provides showtime discovery across multiple auditoriums, interactive 2D seat map selection across distinct tiers (Standard, Premium, and VIP Recliner), atomic temporary seat holds with an 8-minute countdown timer, deterministic sandbox payments, single-use QR ticket generation, and a real-time usher scanning admission gate preventing duplicate entrance.

---

## 2. Target Personas

1. **Moviegoer / Patron**:
   - Explores currently playing and upcoming films with trailers, synopses, genre tags, MPAA ratings (PG-13, R), and runtime.
   - Selects theater auditorium, date, and showtime (e.g. IMAX, Dolby Atmos, 3D).
   - Interactively selects exact seats from a visual 2D auditorium grid with real-time seat status (Available, Selected, Held, Sold).
   - Secures a temporary 8-minute hold on selected seats while entering payment details.
   - Receives digital ticket with unique barcode / QR token and seat details.

2. **Cinema Usher / Box Office Staff**:
   - Accesses mobile/tablet scanning portal at the theater auditorium entrance.
   - Scans digital ticket token (`TKT-XXXXXX`).
   - Validates authenticity, auditorium, showtime, and seat assignment.
   - Admits patron (`CONFIRMED` &rarr; `ADMITTED`). Duplicate entry attempts are instantly flagged as `ALREADY_ADMITTED`.

3. **Multiplex Administrator**:
   - Manages movies, auditoriums, showtime scheduling, and seat pricing tiers.

---

## 3. Core System Requirements & Business Rules

### 3.1 Auditorium Seat Layout & Tiers
- Auditoriums feature a 2D matrix of seats (e.g., Rows A through G, Seats 1 to 10).
- Pricing Tiers:
  - `STANDARD` (Rows A-C): \$14.50
  - `PREMIUM` (Rows D-F, Center viewing angle): \$18.50
  - `VIP_RECLINER` (Row G, Luxury power recliners with food tray): \$24.00
- Convenience Booking Fee: \$1.50 per ticket.
- State per seat in a showtime: `AVAILABLE`, `HELD` (by another user), `BOOKED` (sold).

### 3.2 Real-Time Temporary Seat Hold (8-Minute TTL)
- When a patron initiates checkout on selected seats, the system establishes a temporary hold (`HELD`) for exactly 8 minutes (480 seconds).
- While held, those seats cannot be selected or locked by any other patron.
- If checkout is not completed within 8 minutes, an automatic expiry job releases the seats back to `AVAILABLE`.
- Atomic locking ensures that under concurrent requests for the same seat, exactly one patron receives the hold, while others receive an instant seat collision rejection.

### 3.3 Payment & Digital Ticket Issuance
- Integrated with deterministic Cartly sandbox payment provider (`tok_visa_success` or `tok_card_declined`).
- On successful payment:
  - Seats permanently transition from `HELD` to `BOOKED`.
  - Booking transitions to `CONFIRMED`.
  - Issues cryptographic single-use ticket verification code (`TKT-XXXXXX`).

### 3.4 Single-Use Usher Admission Gate
- Patrons present their digital ticket code at the entrance.
- Usher scanning endpoint validates:
  1. Ticket code exists and is `CONFIRMED`.
  2. Showtime matches the current screening window.
  3. Ticket has NOT been previously admitted.
- Once scanned:
  - Status immediately transitions to `ADMITTED`.
  - Timestamp and usher badge logged.
- If scanned again, the scanner returns `409 Conflict: TICKET ALREADY ADMITTED at <time>`, sounding an alert.

### 3.5 State Machines
- **Seat State**: `AVAILABLE` &rarr; `HELD` &rarr; `BOOKED` (or `AVAILABLE` upon hold expiry or cancellation).
- **Booking State**: `HELD` &rarr; `CONFIRMED` &rarr; `ADMITTED` (or `CANCELLED`, `EXPIRED`).
