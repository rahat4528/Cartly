# Cartly Repository Overview

## Mission & Architecture Philosophy

**Cartly** is a curated monorepo containing exactly **12 independent, production-grade applications** covering e-commerce, digital marketplaces, reservation engines, and booking systems.

Unlike monolithic suites or shared-core platforms, Cartly adheres strictly to an **isolation-first architecture**:
- **Zero Shared Runtime Dependencies**: Each application manages its own independent runtime environment, dependencies, build processes, and container configurations.
- **Dedicated Databases**: Each application operates against its own distinct PostgreSQL database schema (`cartly_*_db`), complete with dedicated migrations and seeds.
- **Independent Security & Auth**: No cross-application SSO or shared JWT secrets; each platform implements role-based access control, cryptographic password hashing, and isolated session lifecycles tailored to its business domain.
- **Deterministic Business Logic**: Financial operations, inventory holds, seat locks, and reservation windows are strictly validated on the server side with atomic transactions and explicit state machines.

---

## The 12 Applications

1. [01-online-bookstore](../01-online-bookstore/README.md) — Editorial bookstore storefront with multi-format editions, catalog filters, cart, checkout, recommendations, and comprehensive admin suite.
2. [02-progressive-web-app-store](../02-progressive-web-app-store/README.md) — Offline-first Progressive Web App store with service worker caching, IndexedDB synchronization queue, and device push notifications.
3. [03-job-board-platform](../03-job-board-platform/README.md) — Recruitment marketplace connecting job seekers and employers with candidate pipelines, resume management, and keyword skill matching.
4. [04-hotel-booking-system](../04-hotel-booking-system/README.md) — Hospitality reservation platform with multi-night date-range inventory locking, seasonal rate engines, and guest management.
5. [05-restaurant-reservation-system](../05-restaurant-reservation-system/README.md) — Dining discovery and table reservation engine supporting slot capacity buffers, table combinations, and automated waitlist promotion.
6. [06-movie-ticket-booking](../06-movie-ticket-booking/README.md) — Cinema ticket platform featuring interactive seat matrix maps, real-time temporary seat locks, QR code tickets, and showtime management.
7. [07-grocery-delivery-app](../07-grocery-delivery-app/README.md) — Supermarket grocery ordering platform with delivery slot capacity control, item substitution rules, and scheduled orders.
8. [08-car-rental-system](../08-car-rental-system/README.md) — Vehicle rental engine featuring fleet availability scheduling, tiered duration pricing, security deposit escrows, and driver document review.
9. [09-real-estate-listing-platform](../09-real-estate-listing-platform/README.md) — Spatial property marketplace featuring geospatial coordinate search (bounding box / radius), agent portfolios, and price history tracking.
10. [10-house-rental-platform](../10-house-rental-platform/README.md) — Long-term residential leasing portal with tenant background applications, private document handling, viewing appointments, and lease agreements.
11. [11-airbnb-clone](../11-airbnb-clone/README.md) — Short-stay accommodation marketplace featuring host listing onboarding, dynamic pricing rules, instant/request booking holds, and verified stay reviews.
12. [12-flight-booking-system](../12-flight-booking-system/README.md) — Demonstration flight search and multi-segment itinerary booking platform with fare rules, capacity controls, seat allocation, and e-ticket generation.
