# Movie Ticket Booking — REST API Specification

All endpoints are versioned under `/api/v1`.

---

## 1. Authentication Endpoints

### Register User
`POST /api/v1/auth/register`
- Request: `{ email, password, name, phone, role }` (`PATRON`, `USHER`, `ADMIN`)
- Response: `201 Created` with `{ token, user }`

### Login User
`POST /api/v1/auth/login`
- Request: `{ email, password }`
- Response: `200 OK` with `{ token, user }`

### Current Profile
`GET /api/v1/auth/me`
- Headers: `Authorization: Bearer <token>`
- Response: `200 OK` with user details

---

## 2. Movies & Showtimes Discovery

### List Movies
`GET /api/v1/movies?genre=Sci-Fi`
- Response: `200 OK` with active movies and upcoming screenings.

### Movie Details & Showtimes
`GET /api/v1/movies/:idOrSlug?date=2026-11-20`
- Response: `200 OK` with film synopsis, trailer, cast, and showtimes by auditorium format (IMAX, Dolby Atmos).

### Showtime Interactive Seat Map
`GET /api/v1/showtimes/:id/seats`
- Response: `200 OK` with complete 2D matrix (Rows A–G, Seats 1–10), showing:
  - Seat Number (`A1`, `D5`, `G8`)
  - Tier (`STANDARD`, `PREMIUM`, `VIP_RECLINER`)
  - Price (\$14.50, \$18.50, \$24.00)
  - Status (`AVAILABLE`, `HELD`, `BOOKED`)

---

## 3. Bookings, Holds & Payments

### Hold Selected Seats (8-Minute Lock)
`POST /api/v1/bookings/hold`
- Headers: `Authorization: Bearer <token>`
- Request:
  ```json
  {
    "showtimeId": "sht_001",
    "seatNumbers": ["D5", "D6"],
    "guestName": "Elena Rostova",
    "guestEmail": "elena@cartly.local"
  }
  ```
- Response: `201 Created` with temporary booking record, 8-minute expiry countdown (`expiresAt`), price breakdown, and temporary lock.
- Concurrency Collision: `409 Conflict: One or more selected seats (D5) are already held or booked by another patron.`

### Confirm Booking & Pay
`POST /api/v1/bookings/:id/confirm`
- Headers: `Authorization: Bearer <token>`
- Request:
  ```json
  {
    "cardToken": "tok_visa_success",
    "idempotencyKey": "idem_movie_89321"
  }
  ```
- Response: `200 OK` with confirmed booking, permanent seat lock, and digital ticket verification code (`TKT-XXXXXX`).

### My Bookings (Patron)
`GET /api/v1/bookings/my-bookings`
- Headers: `Authorization: Bearer <token>`
- Response: `200 OK` with past, upcoming, and admitted digital tickets.

---

## 4. Usher Ticket Scanning Admission Gate

### Scan Ticket & Admit Patron
`POST /api/v1/usher/scan`
- Headers: `Authorization: Bearer <token>` (Usher or Admin role)
- Request: `{ ticketCode: "TKT-8X92B1" }`
- Response:
  - `200 OK`: `{ success: true, admitted: true, movieTitle: "...", seatNumbers: ["D5", "D6"], admittedAt: "..." }`
  - `409 Conflict`: `{ error: "DUPLICATE ENTRY ALERT: Ticket TKT-8X92B1 was already admitted at 18:45" }`
  - `404 Not Found`: `{ error: "Invalid ticket verification code" }`
