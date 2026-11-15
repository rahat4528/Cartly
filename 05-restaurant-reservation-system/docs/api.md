# Restaurant Reservation System — REST API Specification

All endpoints are versioned under `/api/v1`.

---

## 1. Authentication Endpoints

### Register User
`POST /api/v1/auth/register`
- Request: `{ email, password, name, phone, role }` (`DINER`, `HOST`, `ADMIN`)
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

## 2. Restaurants & Time Slot Discovery

### Search Restaurants
`GET /api/v1/restaurants?cuisine=Italian&city=New+York&date=2026-11-20&time=19:00&partySize=4`
- Query Parameters: `cuisine`, `city`, `neighborhood`, `date`, `time`, `partySize`, `priceTier`
- Response: `200 OK` with restaurants list and nearby available time slots.

### Restaurant Details & Floor Plan
`GET /api/v1/restaurants/:idOrSlug?date=2026-11-20&partySize=4&zone=INDOOR_MAIN`
- Response: `200 OK` with restaurant profile, seating zones, and all time slots (17:00 through 22:00) with availability flags (`AVAILABLE` vs `FULL`).

---

## 3. Reservations & Waitlist

### Create Reservation
`POST /api/v1/reservations`
- Headers: `Authorization: Bearer <token>`
- Request:
  ```json
  {
    "restaurantId": "rst_001",
    "reservationDate": "2026-11-20",
    "timeSlot": "19:00",
    "partySize": 4,
    "seatingZone": "INDOOR_MAIN",
    "guestName": "Marcus Sterling",
    "guestEmail": "marcus@cartly.local",
    "guestPhone": "+1-555-0182",
    "specialRequests": "Anniversary celebration; quiet corner requested."
  }
  ```
- Response: `201 Created` with reservation details, allocated table numbers, dining window, and unique reservation code (`RES-XXXXXX`).
- Error: `409 Conflict` if no tables fit party size or all tables are booked for that slot.

### Join Automated Waitlist
`POST /api/v1/waitlist/join`
- Headers: `Authorization: Bearer <token>`
- Request:
  ```json
  {
    "restaurantId": "rst_001",
    "reservationDate": "2026-11-20",
    "preferredTimeSlot": "19:00",
    "partySize": 4,
    "seatingZone": "INDOOR_MAIN",
    "guestName": "Julian Hayes",
    "guestEmail": "julian@cartly.local",
    "guestPhone": "+1-555-0144"
  }
  ```
- Response: `201 Created` with waitlist ticket, priority position, and notification confirmation.

### Claim Promoted Waitlist Reservation
`POST /api/v1/waitlist/:id/claim`
- Headers: `Authorization: Bearer <token>`
- Response: `200 OK` with promoted waitlist ticket converted to `CONFIRMED` reservation.

### Cancel Reservation & Trigger Waitlist Promotion
`POST /api/v1/reservations/:id/cancel`
- Headers: `Authorization: Bearer <token>`
- Response: `200 OK` with cancellation confirmation and waitlist auto-promotion telemetry.

### Get My Reservations (Diner)
`GET /api/v1/reservations/my-reservations`
- Headers: `Authorization: Bearer <token>`
- Response: `200 OK` with past, upcoming, and waitlist reservations.

---

## 4. Host & Maitre D' Operations

### Floor Plan Occupancy Timeline
`GET /api/v1/host/restaurants/:id/timeline?date=2026-11-20`
- Headers: `Authorization: Bearer <token>` (Host role)
- Response: `200 OK` with tables matrix and reservation timeline.

### Update Reservation Status (Check-in / Seating)
`PATCH /api/v1/host/reservations/:id/status`
- Headers: `Authorization: Bearer <token>` (Host role)
- Request: `{ status: "SEATED" | "COMPLETED" | "NO_SHOW" }`
- Response: `200 OK` with updated reservation.
