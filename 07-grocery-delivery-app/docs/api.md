# Phase 07: Grocery Delivery App — REST API Specification

Base URL: `/api/v1`

## Endpoints

### 1. Health & Discovery
- `GET /health` — Service health check

### 2. Authentication
- `POST /auth/register` — Register new customer or staff
- `POST /auth/login` — Authenticate and receive JWT
- `GET /auth/me` — Retrieve authenticated user profile

### 3. Grocery Catalog
- `GET /products` — List products by category aisle or search keyword (`category`, `q`)
- `GET /products/:id` — Get product details and stock status

### 4. Delivery Slots
- `GET /delivery-slots?date=YYYY-MM-DD` — List delivery windows with current capacity & availability
- `POST /delivery-slots` (Admin only) — Create or configure slot capacity

### 5. Orders & Fulfillment
- `POST /orders` — Checkout cart items, specify substitution policies, reserve delivery slot, and charge payment
- `GET /orders/my-orders` — List customer orders
- `GET /orders/:id` — Order status, item breakdown, and substitution tracking
- `PATCH /orders/:id/status` — Advance fulfillment state (`PLACED` -> `PICKING` -> `OUT_FOR_DELIVERY` -> `DELIVERED`, `CANCELLED`)
- `POST /orders/:id/cancel` — Cancel order prior to picking and refund payment

### 6. Subscriptions
- `POST /subscriptions` — Set up recurring grocery delivery frequency (`WEEKLY`, `BI_WEEKLY`)
- `GET /subscriptions/my-subscriptions` — List customer subscriptions
