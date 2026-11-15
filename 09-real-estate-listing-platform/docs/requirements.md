# Phase 09: Real Estate Listing Platform — Detailed Requirements

## 1. System Objective
Provide an enterprise spatial property marketplace for residential and commercial real estate with geospatial bounding box and radius proximity queries, agent listing verification workflows, immutable price history audit ledgers, and property viewing tour scheduling.

## 2. Functional Requirements

### 2.1 Spatial Property Search & Filtering
- Spatial Coordinate Search:
  - Bounding Box: `minLat`, `maxLat`, `minLng`, `maxLng`
  - Radius: `lat`, `lng`, `radiusKm` (Haversine formula distance filter)
- Filters: Price range, bedrooms, bathrooms, square footage, property type (`SINGLE_FAMILY`, `CONDO`, `TOWNHOUSE`, `MULTI_FAMILY`, `COMMERCIAL`).
- High-resolution photo galleries and floor plan blueprints.

### 2.2 Agent Listing Verification & Ownership
- Strict role isolation: `BUYER_USER`, `REAL_ESTATE_AGENT`, `PLATFORM_ADMIN`.
- Only the verified listing agent or platform admin can edit property details, modify asking price, or advance listing status.
- Cross-agent modification attempts strictly rejected (`403 Forbidden: You do not have ownership of this property listing`).

### 2.3 Immutable Price History Ledger
- Whenever asking price is updated:
  - New record appended to `PriceHistoryRecord`.
  - Captures `date`, `previousPrice`, `newPrice`, `priceChangePercent`, `reason`.
  - Read-only historical timeline presented to buyers.

### 2.4 Listing Lifecycle (State Machine)
- `DRAFT`: Agent drafting listing specs.
- `PENDING_VERIFICATION`: Submitted to platform administrator with title deed documentation.
- `PUBLISHED`: Verified and visible to public buyers in spatial search.
- `UNDER_CONTRACT`: Escrow deposit received; contingent on inspection/financing.
- `SOLD`: Final closing complete.
- `DELISTED`: Removed by agent or owner.

### 2.5 Viewing & Tour Scheduler
- Buyers schedule in-person private viewings or virtual video walk-throughs.
- Automatic double-booking prevention for overlapping tour time-slots.
