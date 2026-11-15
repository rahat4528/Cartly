# Hotel Booking System — REST API Specification

All endpoints are prefixed with `/api/v1`.

---

## 1. Authentication Endpoints

### Register User
`POST /api/v1/auth/register`
- Request: `{ email, password, name, phone, role }` (`GUEST`, `HOTELIER`, `ADMIN`)
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

## 2. Hotels & Room Availability

### Search Hotels
`GET /api/v1/hotels?city=Paris&checkIn=2026-12-20&checkOut=2026-12-24&guests=2&rooms=1`
- Query Parameters:
  - `city`: Destination city (e.g., "Kyoto", "Zurich", "Miami")
  - `checkIn`: YYYY-MM-DD
  - `checkOut`: YYYY-MM-DD
  - `guests`: Number of total guests (default: 1)
  - `rooms`: Number of rooms required (default: 1)
  - `minRating`: Star rating filter (1-5)
- Response: `200 OK` with list of hotels, room types, dynamic pricing estimates, and available room counts.

### Hotel Details
`GET /api/v1/hotels/:idOrSlug?checkIn=...&checkOut=...`
- Response: `200 OK` with complete hotel details, photo galleries, amenities, and room availability breakdown for the requested date range.

### Quote Pricing
`POST /api/v1/hotels/quote`
- Request: `{ hotelId, roomTypeId, checkInDate, checkOutDate, roomsCount }`
- Response: `200 OK` with detailed nightly rate calculations, weekend multipliers, season multipliers, subtotal, 12% tax, $35 cleaning fee, and grand total.

---

## 3. Reservations & Holds

### Create Temporary Hold (10-minute Lock)
`POST /api/v1/reservations/hold`
- Headers: `Authorization: Bearer <token>`
- Request:
  ```json
  {
    "hotelId": "htl_001",
    "roomTypeId": "rm_001",
    "checkInDate": "2026-12-20",
    "checkOutDate": "2026-12-23",
    "roomsCount": 1,
    "guestName": "Elena Rostova",
    "guestEmail": "elena@cartly.local",
    "guestPhone": "+1-555-0199"
  }
  ```
- Response: `201 Created` with `{ reservationId, voucherCode, expiresAt, totalAmount, nightlyBreakdown }`
- Concurrency Error: `409 Conflict` if requested rooms are sold out or held by other users for the requested dates.

### Confirm Reservation (Payment)
`POST /api/v1/reservations/:id/confirm`
- Headers: `Authorization: Bearer <token>`
- Request:
  ```json
  {
    "paymentMethod": "SANDBOX_CARD",
    "cardToken": "tok_visa_success",
    "idempotencyKey": "idem_hold_88492"
  }
  ```
- Response: `200 OK` with confirmed reservation details, payment status, and voucher.
- Errors:
  - `400 Bad Request` if hold expired or invalid card token.

### Get My Reservations (Guest)
`GET /api/v1/reservations/my-reservations`
- Headers: `Authorization: Bearer <token>`
- Response: `200 OK` with list of reservations, past and upcoming.

### Get Reservation Details & Folio
`GET /api/v1/reservations/:id`
- Headers: `Authorization: Bearer <token>`
- Response: `200 OK` with full reservation details, nightly breakdown, and voucher.

### Cancel Reservation & Calculate Refund
`POST /api/v1/reservations/:id/cancel`
- Headers: `Authorization: Bearer <token>`
- Request: `{ reason: "Trip rescheduling" }`
- Response: `200 OK` with cancellation confirmation, refund percentage (100%, 50%, or 0%), and net refund amount.

---

## 4. Hotelier Operations

### Property Occupancy & Calendar
`GET /api/v1/hotelier/hotels/:id/calendar?month=2026-12`
- Headers: `Authorization: Bearer <token>` (Hotelier role)
- Response: `200 OK` with daily occupancy matrix per room type.

### Check-in / Check-out Guest
`PATCH /api/v1/hotelier/reservations/:id/status`
- Headers: `Authorization: Bearer <token>` (Hotelier role)
- Request: `{ status: "CHECKED_IN" | "COMPLETED" }`
- Response: `200 OK` with updated reservation.
