# Hotel Booking System — System Architecture

## 1. Architectural Overview

The Hotel Booking System is built as a high-performance reservation platform engineered to solve the classic hotel booking concurrency challenge: zero double-bookings across multi-night stays.

```
                      +------------------------------------+
                      |    Next.js 14 Hospitality Frontend |
                      |    (Date Picker, Photo Grid, Map)  |
                      +-----------------+------------------+
                                        | HTTP / JSON REST
                                        v
                      +------------------------------------+
                      |    Express + TypeScript API Server |
                      +----+-----------+--------------+----+
                           |           |              |
            +--------------+     +-----+-----+        +-------------+
            |                    |           |                      |
            v                    v           v                      v
     +--------------+     +------------+ +--------------+    +--------------+
     | Availability |     | Seasonal   | | Reservation  |    | Deterministic|
     | Engine       |     | Pricing    | | State Machine|    | Sandbox      |
     | (Night Locks)|     | Engine     | | (Hold & TTL) |    | Payments     |
     +--------------+     +------------+ +--------------+    +--------------+
            |                                |
            +----------------+---------------+
                             v
               +---------------------------+
               |  In-Memory / PostgreSQL   |
               |  Transactional Store      |
               |  (cartly_hotel_booking_db)|
               +---------------------------+
```

---

## 2. Core Subsystems

### 2.1 Multi-Night Availability & Locking Engine
- Maintains per-date room allocation tallies.
- Employs an internal mutex / lock during hold creation to prevent race conditions when two concurrent requests try to reserve the last remaining room for overlapping date ranges.
- Uses date-segment discretization: a reservation from `2026-12-20` to `2026-12-23` locks nights `2026-12-20`, `2026-12-21`, and `2026-12-22`. Check-out day is available for subsequent check-in.

### 2.2 Seasonal Pricing Calculator
- Dynamically iterates over every individual night of the stay.
- Determines if the night is a Friday/Saturday (weekend rate).
- Determines if the date falls inside a defined seasonal multiplier band.
- Sums the nightly room rates, applies the 12% occupancy tax, and adds the one-time $35 resort/cleaning fee.
- Emits an itemized daily cost breakdown so travelers have 100% price transparency.

### 2.3 Hold Expiry & Automatic Inventory Reclamation
- Each hold carries an ISO `expiresAt` timestamp set to `now + 600 seconds` (10 minutes).
- Availability checks automatically evaluate and prune expired holds on-the-fly before calculating active capacity.
- Background sweepers permanently mark stale holds as `EXPIRED`.

### 2.4 Payment Adapter & Voucher Issuance
- Isolated `PaymentProvider` interface following Cartly standards.
- Supports instant confirmation or declined transaction simulation (e.g. invalid test card numbers).
- On verified confirmation, transitions reservation to `CONFIRMED` and issues a unique booking confirmation voucher code (`VCH-XXXXXX`) and downloadable itemized folio.

---

## 3. Database Schema Blueprint (`cartly_hotel_booking_db`)

- `Hotel`: id, name, slug, address, city, country, starRating, checkInTime, checkOutTime, amenities (JSON), images (JSON), createdAt.
- `RoomType`: id, hotelId, name, description, maxGuests, bedType, basePricePerNight, totalRooms, amenities (JSON), images (JSON).
- `SeasonalRule`: id, hotelId, name, startDate, endDate, multiplier.
- `Reservation`: id, voucherCode, hotelId, roomTypeId, guestId, guestName, guestEmail, guestPhone, checkInDate, checkOutDate, nightsCount, roomsCount, status (`HELD`, `CONFIRMED`, `CHECKED_IN`, `COMPLETED`, `CANCELLED`, `EXPIRED`), nightlyBreakdown (JSON), subtotal, taxAmount, feesAmount, totalAmount, expiresAt, paidAt, cancelledAt, refundAmount, createdAt.
- `PaymentRecord`: id, reservationId, amount, currency, status, idempotencyKey, providerRef, createdAt.
