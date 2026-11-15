# Real Estate Listing Platform (Phase 09)

A full-featured property marketplace for sales and rentals, featuring geospatial radius and bounding-box search, interactive split-view map discovery, an immutable price history ledger, strict agent ownership verification, and anti-collision viewing tour scheduling.

---

## Architecture Overview

```
                      ┌───────────────────────────────────────────────┐
                      │              CartlyEstate UI                  │
                      │   (Next.js 14 App Router, Emerald Theme)      │
                      └──────────────────────┬────────────────────────┘
                                             │ REST / JSON
                                             ▼
                      ┌───────────────────────────────────────────────┐
                      │               Express Backend                 │
                      │  - Spatial Bounding Box & Haversine Radius    │
                      │  - Immutable Price History Ledger             │
                      │  - Strict Agent Ownership Enforcement         │
                      │  - Tour Viewing Schedule Anti-Collision Mutex │
                      │  - State Machine (DRAFT -> PUBLISHED ->       │
                      │    UNDER_CONTRACT -> SOLD / RENTED / ARCHIVED)│
                      └──────────────────────┬────────────────────────┘
                                             │
                      ┌──────────────────────┴────────────────────────┐
                      │ PostgreSQL (cartly_real_estate_db) & Redis    │
                      └───────────────────────────────────────────────┘
```

---

## Key Features

1. **Geospatial Discovery (Bounding Box & Haversine Radius)**:
   - Queries properties within rectangular geographic viewports (`minLat`, `maxLat`, `minLng`, `maxLng`) or radial distance boundaries (`lat`, `lng`, `radiusKm`).
   - Computes precise surface distances in kilometers using the Haversine trigonometric formulation.
2. **Immutable Price History Ledger**:
   - Every price modification appends an immutable historical entry recording `previousPrice`, `newPrice`, `priceChangeAmount`, `priceChangePercent`, timestamp, and modification reason.
   - Preserves price history transparency for prospective buyers and historical valuation analytics.
3. **Strict Agent Ownership & Listing Lifecycle**:
   - Cross-agent listing mutation is strictly forbidden (`403 Forbidden`). Only the listing's verified listing agent can modify attributes or status.
   - Manages formal state transitions: `DRAFT` -> `PUBLISHED` -> `UNDER_CONTRACT` -> `SOLD` / `RENTED` / `ARCHIVED`.
4. **Tour Viewing Scheduling with Anti-Collision Guard**:
   - Prospective buyers schedule in-person tours or virtual walkthroughs with dedicated agents.
   - Enforces atomic time-slot locking to prevent overlapping viewing collisions (`409 Conflict`).

---

## Technical Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Express.js, TypeScript, Helmet, CORS, JWT authentication, Bcrypt.
- **Database**: PostgreSQL (`cartly_real_estate_db`), Redis cache.
- **Testing**: Vitest, Supertest.

---

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Authenticate buyer or licensed agent.
- `GET /api/v1/auth/me` - Retrieve current session and profile.

### Properties & Spatial Search
- `GET /api/v1/properties` - Filter properties with bounding box (`minLat`, `maxLat`, `minLng`, `maxLng`) or radial proximity (`lat`, `lng`, `radiusKm`), property type, and bedroom count.
- `GET /api/v1/properties/:id` - Retrieve listing details with full price history ledger.
- `POST /api/v1/properties` - Agent submission of new property listing.
- `PUT /api/v1/properties/:id` - Agent property update with automatic price history recording.
- `PATCH /api/v1/properties/:id/status` - Transition property lifecycle state.

### Viewing Tours
- `POST /api/v1/properties/:id/tours` - Schedule viewing appointment with collision prevention.
- `GET /api/v1/properties/:id/tours` - Retrieve scheduled tours.

---

## Verification & Testing

```bash
cd backend
npm test
```
Runs 7 comprehensive tests across 2 test suites verifying spatial search mathematics, price ledger immutability, agent ownership security, and viewing appointment collision prevention.
