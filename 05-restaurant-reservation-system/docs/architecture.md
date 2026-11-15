# Restaurant Reservation System — System Architecture

## 1. Architectural Overview

The Restaurant Reservation System provides deterministic table allocation, floor plan scheduling, and automated waitlist promotion.

```
                      +---------------------------------------+
                      |   Next.js 14 Dining & Host Frontend   |
                      |   (Time Slot Picker, Zone Selector)   |
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
     | Table        |    | Slot &     | | Waitlist      |        | Reservation   |
     | Allocation   |    | Buffer     | | Promotion     |        | State Machine |
     | Engine       |    | Scheduler  | | Engine        |        | (Audit Trail) |
     +--------------+    +------------+ +---------------+        +---------------+
            |                   |               |
            +-------------------+---------------+
                                |
                                v
               +----------------------------------+
               |  In-Memory / PostgreSQL          |
               |  Transactional Store             |
               |  (cartly_restaurant_reservation_db)
               +----------------------------------+
```

---

## 2. Core Subsystems

### 2.1 Table Allocation & Combinations Engine
- Each table has: `id`, `tableNumber`, `minCapacity`, `maxCapacity`, `seatingZone`, `isCombinable`, `combinableWithTableIds`.
- When a party of size $N$ requests slot $T$:
  1. Searches for single unreserved tables in the preferred zone where `minCapacity <= N <= maxCapacity`, sorted by capacity difference ascending (best fit).
  2. If no single table fits and $N > 4$, searches for valid combinations of 2 adjacent combinable tables where $\sum \text{maxCapacity} \ge N$.
  3. Locks table(s) for the duration of $[T, T + \text{duration} + \text{turnoverBuffer}]$.

### 2.2 Time Slot Generation & Turnover Buffer
- Operating hours: e.g. 17:00 to 22:30 (intervals every 15 or 30 minutes: 17:00, 17:30, 18:00, 18:30, 19:00, 19:30, 20:00, 20:30, 21:00).
- Computes real-time availability for each individual time slot for a requested party size.
- Slots with at least one available table configuration are marked `AVAILABLE`.
- Slots where all tables are occupied are marked `FULL` with an option to `JOIN_WAITLIST`.

### 2.3 Automated Waitlist Promotion Engine
- Waitlist records maintain a priority queue ordered by `createdAt ASC` (first-come, first-served).
- When a reservation is cancelled:
  - Table(s) are released back to the floor plan.
  - The waitlist queue is filtered for parties of matching or lesser size requesting a time slot within 30 minutes of the cancelled slot.
  - The first matching entry is promoted to `PROMOTED` status with a 15-minute claim expiry.
  - A notification event is emitted.

---

## 3. Database Schema Blueprint (`cartly_restaurant_reservation_db`)

- `Restaurant`: id, name, slug, description, cuisine, priceTier, address, city, neighborhood, openTime, closeTime, amenities (JSON), images (JSON).
- `DiningTable`: id, restaurantId, tableNumber, seatingZone (`INDOOR_MAIN`, `PATIO_TERRACE`, `BAR_HIGHTOP`, `CHEFS_COUNTER`), minCapacity, maxCapacity, isCombinable, combinableWithTableIds (JSON).
- `Reservation`: id, reservationCode, restaurantId, tableIds (JSON), guestId, guestName, guestEmail, guestPhone, reservationDate (YYYY-MM-DD), timeSlot (HH:mm), partySize, seatingZone, specialRequests, status (`CONFIRMED`, `SEATED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`, `WAITLIST`, `PROMOTED`), durationMinutes, turnoverBufferMinutes, promotedUntil, createdAt, updatedAt.
- `WaitlistEntry`: id, restaurantId, guestId, guestName, guestEmail, guestPhone, reservationDate, preferredTimeSlot, partySize, seatingZone, priorityIndex, status, promotedReservationId, createdAt.
