# Airbnb Clone - Short-Stay Accommodation Marketplace

Independent vacation rental and accommodation marketplace engineered as Phase 11 of the Cartly repository.

## Capabilities
- **Photo-First Stays Catalog**: Search across categories (Beachfront, Cabins, Iconic Cities) with destination city filters.
- **Server Price Authority**: Backend fee recalculation computing base stay, cleaning fee, 12% service fee, and 10% municipality taxes.
- **Date-Range Overlap Locking**: Strict concurrency mutex preventing double-booking of any date span (`409 Conflict`).
- **Temporary Hold Lifecycle**: 10-minute hold reservation with automatic expiration sweeping.
- **Review Gating Gate**: Verified stay completion check (`COMPLETED`) required before submitting reviews (`403 Forbidden` for unverified attempts).
- **Host Dashboard**: Onboard new properties with photo galleries, pricing tiers, and monitor reservations.

## Ports & Services
- **Backend API**: Port 5011
- **Frontend Next.js**: Port 3011
- **PostgreSQL**: Port 5443 (`cartly_airbnb_db`)
- **Redis**: Port 6390 (`cartly-airbnb-redis`)

## Quickstart

```bash
# 1. Environment
cp .env.example .env

# 2. Containers
docker compose up -d

# 3. Dependencies
npm install
cd backend && npm install
cd ../frontend && npm install

# 4. Run tests
npm test
```
