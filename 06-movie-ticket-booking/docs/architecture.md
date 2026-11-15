# Movie Ticket Booking — System Architecture

## 1. Architectural Overview

The Movie Ticket Booking system is designed as a low-latency cinema reservation platform.

```
                      +---------------------------------------+
                      |   Next.js 14 Cinema Dark-Mode UI      |
                      |   (Interactive 2D Grid, Usher Scanner)|
                      +-------------------+-------------------+
                                          | HTTP / REST API
                                          v
                      +---------------------------------------+
                      |   Express + TypeScript API Server     |
                      +---+-----------+-------------------+---+
                          |           |                   |
            +-------------+     +-----+-----+             +-------------+
            |                   |           |                           |
            v                   v           v                           v
     +--------------+    +------------+ +---------------+        +---------------+
     | 2D Seat Map  |    | 8-Min Hold | | Usher Ticket  |        | Sandbox Card  |
     | Matrix Engine|    | TTL Sweeper| | Scanning Gate |        | Payments      |
     +--------------+    +------------+ +---------------+        +---------------+
            |                   |               |
            +-------------------+---------------+
                                |
                                v
               +----------------------------------+
               |  In-Memory / PostgreSQL          |
               |  Transactional Store             |
               |  (cartly_movie_booking_db)       |
               +----------------------------------+
```

---

## 2. Core Subsystems

### 2.1 Interactive 2D Seat Map & Pricing Tier Engine
- Screen layout: Rows A through G (7 rows), Seats 1 through 10 (10 columns) = 70 seats total.
- Seats are evaluated dynamically against active holds and confirmed bookings for the requested showtime ID.
- Base pricing per seat:
  - Standard (Rows A–C): \$14.50
  - Premium (Rows D–F): \$18.50
  - VIP Recliner (Row G): \$24.00
  - Convenience Fee: \$1.50 per seat.

### 2.2 Atomic Concurrency Mutex & Temporary Holds
- When a user selects $M$ seats (e.g. `['D4', 'D5']`), the server locks the showtime mutex.
- Verifies that NONE of the requested seats are in `BOOKED` or active `HELD` state.
- Establishes a temporary booking record with `status: 'HELD'` and `expiresAt = now + 480 seconds` (8 minutes).
- Releases mutex.

### 2.3 Hold Expiry & Seat Reclamation
- Background/on-demand sweeper checks for holds where `expiresAt < now() && status === 'HELD'`.
- Expired holds are marked `EXPIRED`, immediately liberating their seats to `AVAILABLE`.

### 2.4 Verifiable Digital Ticket & Usher Admission Gate
- Once payment is confirmed, generates a unique ticket verification code: `TKT-${alphanumeric(8)}`.
- Usher admission verification gate checks `status === 'CONFIRMED'`. If valid, atomically marks `status = 'ADMITTED'` with `admittedAt = new Date().toISOString()`.
- Subsequent scan attempts are rejected with `409 Conflict: Already admitted`.

---

## 3. Database Schema Blueprint (`cartly_movie_booking_db`)

- `Movie`: id, title, slug, synopsis, posterUrl, backdropUrl, genre, mpaaRating, durationMinutes, releaseDate, isFeatured.
- `Auditorium`: id, name, screenType (IMAX, Dolby Cinema, Standard), totalSeats, rowsCount, columnsPerRow.
- `Showtime`: id, movieId, auditoriumId, showDate (YYYY-MM-DD), startTime (HH:mm), endTime, format (2D, 3D, IMAX).
- `Booking`: id, ticketCode, showtimeId, guestId, guestName, guestEmail, seatNumbers (JSON array, e.g. `['D4', 'D5']`), subtotal, convenienceFee, totalAmount, status (`HELD`, `CONFIRMED`, `ADMITTED`, `CANCELLED`, `EXPIRED`), expiresAt, paidAt, admittedAt, createdAt, updatedAt.
