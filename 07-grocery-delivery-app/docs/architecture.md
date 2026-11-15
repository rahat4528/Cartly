# Phase 07: Grocery Delivery App — Architecture

## System Diagram

```
                 ┌────────────────────────────────────────────────────────┐
                 │                Cartly Fresh Grocery UI                 │
                 │          (Next.js 14 App Router, Emerald Theme)        │
                 └───────────────────────────┬────────────────────────────┘
                                             │ HTTP REST / JSON
                                             ▼
                 ┌────────────────────────────────────────────────────────┐
                 │                  Express / Node API                    │
                 │  - Slot Scheduler & Concurrency Guard                  │
                 │  - Substitution Preference Engine                      │
                 │  - Recurring Subscription Planner                      │
                 │  - Fulfillment State Machine                           │
                 │  - Sandbox Payment Adapter & Idempotency Store         │
                 └───────────────────────────┬────────────────────────────┘
                                             │
                 ┌───────────────────────────┴────────────────────────────┐
                 │ PostgreSQL (cartly_grocery_delivery_db) & Redis        │
                 └────────────────────────────────────────────────────────┘
```

## Data Schema & Port Blueprint
- Database: `cartly_grocery_delivery_db` (Postgres Port `5438`)
- Cache & Queue: Redis Port `6385`
- Backend API Port: `5007`
- Frontend Port: `3007`

## Concurrency & Slot Locking
- Each delivery slot has an allocated capacity counter and an atomic compare-and-swap mechanism.
- Slot bookings check `slotOrderCount < maxCapacity`. If reached, the slot status changes to `SOLD_OUT`.
- Parallel checkout requests attempting to claim the final slot space are serialized; exactly one succeeds and subsequent requests receive `409 Conflict: Delivery slot capacity full`.
