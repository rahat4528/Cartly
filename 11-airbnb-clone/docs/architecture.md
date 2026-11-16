# Accommodation Marketplace (Airbnb Clone) - Architecture

## Architecture Diagram

```
[ Next.js 14 Accommodation UI ]
      │
      ├── Discovery Marketplace (Photo cards, category filters, wishlist hearts)
      ├── Reservation Bar (Date selection, dynamic backend price calculator, hold checkout)
      └── Host Management Hub (Publish listings, manage rates, review reservations)
      │
      ▼ (REST / JSON API on port 5011)
[ Express / NestJS Backend ]
      │
      ├── Listings & Availability Engine
      ├── Booking Engine (Atomic date-range overlap mutex)
      ├── Backend Fee & Tax Snapshot Calculator (Strict server pricing authority)
      ├── Reservation Hold Sweeper (10-minute hold expiration)
      ├── Reviews Service (Strict post-stay completion verification gate)
      │
      ▼
[ PostgreSQL (cartly_airbnb_db) & Redis Cache ]
```

## State Machine: Booking Lifecycle
```
[PENDING (Hold: 10 min)] ──┬──> [CONFIRMED (Paid)] ──> [CHECKED_IN] ──> [COMPLETED] ──> [ELIGIBLE_FOR_REVIEW]
                           ├──> [EXPIRED (Hold timed out)]
                           └──> [CANCELLED (Refund policy)]
```
An active hold or confirmed booking acquires an exclusive date span:
`requestedCheckIn < bookingCheckOut && requestedCheckOut > bookingCheckIn`
Any conflicting overlapping booking attempt throws `409 Conflict: Dates unavailable`.
