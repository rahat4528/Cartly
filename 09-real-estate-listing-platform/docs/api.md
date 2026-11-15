# Phase 09: Real Estate Listing Platform — REST API Specification

Base URL: `/api/v1`

## Endpoints

### 1. Health & Discovery
- `GET /health` — Service health check

### 2. Authentication
- `POST /auth/register` — Register buyer or agent
- `POST /auth/login` — Sign in and receive JWT
- `GET /auth/me` — Authenticated profile

### 3. Properties & Spatial Search
- `GET /properties` — Query properties with spatial filters (`minLat`, `maxLat`, `minLng`, `maxLng`, or `lat`, `lng`, `radiusKm`) plus criteria (`minPrice`, `maxPrice`, `beds`, `baths`, `propertyType`)
- `GET /properties/:id` — Property details, photos, agent contacts, and immutable price history
- `POST /properties` (Agent only) — Create new property listing
- `PUT /properties/:id` (Agent owner only) — Update listing details and adjust asking price (triggers price history ledger entry)
- `PATCH /properties/:id/status` (Agent owner or Admin) — Advance listing status (`DRAFT` -> `PENDING_VERIFICATION` -> `PUBLISHED` -> `UNDER_CONTRACT` -> `SOLD`, `DELISTED`)

### 4. Tour Schedule & Inquiries
- `POST /properties/:id/tours` (requireAuth) — Schedule in-person or video tour
- `GET /tours/my-tours` (requireAuth) — List scheduled viewing tours
