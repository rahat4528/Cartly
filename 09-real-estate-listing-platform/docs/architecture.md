# Phase 09: Real Estate Listing Platform — Architecture

## System Diagram

```
                 ┌────────────────────────────────────────────────────────┐
                 │                Cartly Realty UI                        │
                 │         (Next.js 14 App Router, Slate/Amber Theme)     │
                 └───────────────────────────┬────────────────────────────┘
                                             │ HTTP REST / JSON
                                             ▼
                 ┌────────────────────────────────────────────────────────┐
                 │                  Express / Node API                    │
                 │  - Geospatial Bounding Box & Haversine Radius Engine   │
                 │  - Immutable Price History Audit Ledger                │
                 │  - Agent Listing Ownership & Verification Guard        │
                 │  - Listing State Machine (DRAFT -> PUBLISHED ->        │
                 │    UNDER_CONTRACT -> SOLD / DELISTED)                  │
                 │  - Tour Appointment Scheduler (Conflict Free)          │
                 └───────────────────────────┬────────────────────────────┘
                                             │
                 ┌───────────────────────────┴────────────────────────────┐
                 │ PostgreSQL (cartly_real_estate_db) & Redis             │
                 └────────────────────────────────────────────────────────┘
```

## Data Schema & Port Blueprint
- Database: `cartly_real_estate_db` (Postgres Port `5440`)
- Cache: Redis Port `6387`
- Backend API Port: `5009`
- Frontend Port: `3009`

## Spatial Indexing & Math
The platform employs the spherical Haversine formula to compute great-circle distances:
$$d = 2r \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
Allowing accurate radial search (e.g., within 10 km of coordinate $(37.7749, -122.4194)$).
