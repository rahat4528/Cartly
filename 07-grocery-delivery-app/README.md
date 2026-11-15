# Grocery Delivery App (Phase 07)

A full-stack on-demand supermarket grocery e-commerce and delivery fulfillment platform with department aisle browsing, dynamic per-item substitution preferences (`SUBSTITUTE_BEST_MATCH`, `CONTACT_ME`, `DO_NOT_SUBSTITUTE`), 1-hour delivery window capacity management with strict quota enforcement, recurring grocery replenishment subscriptions, and a multi-stage order fulfillment pipeline.

---

## Architecture Overview

```
                      ┌───────────────────────────────────────────────┐
                      │              CartlyFresh UI                   │
                      │   (Next.js 14 App Router, Emerald Theme)      │
                      └──────────────────────┬────────────────────────┘
                                             │ REST / JSON
                                             ▼
                      ┌───────────────────────────────────────────────┐
                      │               Express Backend                 │
                      │  - Delivery Slot Capacity Mutex Guard         │
                      │  - Substitution Preference Router             │
                      │  - Authoritative Price Recalculation Engine   │
                      │  - Order Fulfillment State Machine            │
                      │    (PLACED -> PICKING -> OUT -> DELIVERED)    │
                      │  - Sandbox Payment & Refund Adapter           │
                      └──────────────────────┬────────────────────────┘
                                             │
                      ┌──────────────────────┴────────────────────────┐
                      │ PostgreSQL (cartly_grocery_delivery_db) & Redis│
                      └───────────────────────────────────────────────┘
```

---

## Key Features

1. **Delivery Window Capacity Control**:
   - 1-hour increment delivery slots with maximum capacity limits (e.g. 10 orders per window).
   - Atomic reservation locking rejects checkout with `409 Conflict: Delivery slot capacity full` when slots reach maximum capacity.
2. **Customizable Item Substitution Routing**:
   - Each item in the cart allows shoppers to select:
     - `SUBSTITUTE_BEST_MATCH`: In-store picker selects equivalent brand or organic variant.
     - `CONTACT_ME`: In-store picker prompts customer before substituting.
     - `DO_NOT_SUBSTITUTE`: Omit item and refund customer automatically.
3. **End-to-End Fulfillment Pipeline**:
   - Role-based dispatch for customers, store pickers, and delivery drivers.
   - Live order tracking through `PLACED` -> `PICKING` -> `OUT_FOR_DELIVERY` -> `DELIVERED`.
4. **Order Cancellation & Stock Restoration**:
   - Orders in `PLACED` status can be cancelled with automatic slot release, inventory replenishment, and refund issuance.

---

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: Express.js, TypeScript, Helmet, CORS, Bcryptjs, JSON Web Tokens (JWT)
- **Database**: PostgreSQL (`cartly_grocery_delivery_db`), Prisma ORM
- **Cache**: Redis (`port 6385`)
- **Testing**: Vitest, Supertest

---

## Port Allocation

| Component | Port |
| :--- | :--- |
| Frontend | `3007` |
| Backend API | `5007` |
| PostgreSQL | `5438` (`cartly_grocery_delivery_db`) |
| Redis | `6385` |

---

## Seed Accounts (Local Development)

| Role | Email | Password |
| :--- | :--- | :--- |
| **Customer** | `customer@example.com` | `Pass123!` |
| **Driver / Picker** | `driver@example.com` | `Pass123!` |
| **Store Admin** | `admin@example.com` | `AdminPass123!` |

---

## Setup & Running

### 1. Database & Cache
```bash
docker-compose up -d
```

### 2. Backend Setup
```bash
cd backend
npm install
npm test
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run build
npm run dev
```

### 4. Running Integration Tests
```bash
npm test
```
