# Online Bookstore (`01-online-bookstore`)

An editorial, typography-led, cover-forward e-commerce platform engineered for discovering, purchasing, and auditing multi-format books, complete with an administrative suite and automated inventory tracking.

---

## 1. Overview & UI Identity

- **Display Name**: Online Bookstore
- **UI Identity**: Editorial bookstore storefront with a warm parchment aesthetic, classical serif typography, and cover-forward book display.
- **Audience**: Book lovers, literary collectors, and bookstore inventory managers.

---

## 2. Feature Matrix

### 2.1 Customer Capabilities
- **Authentication & RBAC**: Register, authenticate (JWT with refresh), profile management.
- **Curated Discovery**: Editorial homepage with featured collection, cover gallery, staff picks, and new releases.
- **Search & Advanced Faceted Filtering**:
  - Full-text search across Title, Author, and Synopsis.
  - Dedicated ISBN lookup supporting ISBN-10 and ISBN-13.
  - Faceted filters: Literary Category, Format (Paperback, Hardcover, Deluxe, eBook), Price Range, Minimum Rating, and In-Stock Only.
- **Multi-Format Edition Selector**:
  - Switch between Paperback, Hardcover, and Deluxe editions with real-time stock levels and instant price updates.
  - Physical specifications: ISBN, page count, weight, and inventory SKU.
- **Shopping Bag & Wishlist**:
  - Add items to persistent cart with quantity controls validated against available inventory.
  - Save books to a personal reading wishlist.
- **Checkout & Deterministic Sandbox Payments**:
  - Server-side price recalculation: Subtotal + Standard / Free Shipping + Sales Tax (8.25%) - Promotional Discounts.
  - Deterministic Sandbox Payment Adapter simulating successful approvals and card declines without external API dependencies.
  - Idempotency key tracking preventing duplicate charges.
- **Order Tracking & Digital Invoices**:
  - Visual fulfillment lifecycle progress timeline (`PENDING_PAYMENT` &rarr; `PAID` &rarr; `PROCESSING` &rarr; `SHIPPED` &rarr; `DELIVERED`).
  - Itemized official printable invoice matching order totals down to the cent.
- **Verified Reader Reviews**:
  - 1-to-5 star ratings and reviews restricted strictly to customers who purchased the title.

### 2.2 Store Administrator Capabilities
- **Executive Analytics Dashboard**:
  - Gross sales revenue, total orders, active customer accounts, and low-stock warnings.
  - Sales performance breakdown by literary genre.
- **Catalog Management**: Create and update books, editions, authors, and publishers.
- **Audited Stock Operations**:
  - Live inventory adjustments with required operational reasons (`RESTOCK`, `PURCHASE`, `DAMAGE_WRITE_OFF`, `RETURN`, `ADJUSTMENT`).
  - Automated low-stock alerts when stock drops below threshold (10 copies).
  - Permanent audit trail recorded in the `InventoryMovement` ledger.
- **Order Fulfillment Lifecycle**:
  - Progress orders through state machine: `PAID` &rarr; `PROCESSING` (pick/pack) &rarr; `SHIPPED` &rarr; `DELIVERED`, or issue cancellations and refunds with automatic stock restoration.
- **Marketing & Promotions**:
  - Issue discount coupons with percentage or fixed deductions, minimum order requirements, usage ceilings, and expiration dates.
  - Real-time activation and deactivation toggles.
- **Community Review Moderation**:
  - Inspect, approve, or reject customer-submitted book reviews.

---

## 3. Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript (Strict), Tailwind CSS, Lucide Icons
- **Backend API**: Node.js, Express / Modular TypeScript Architecture, Zod validation, JWT authentication, Bcrypt
- **ORM & Data Layer**: Prisma ORM, PostgreSQL (`cartly_bookstore_db`), In-Memory ACID datastore with concurrency locks
- **Container Infrastructure**: Docker & Docker Compose (PostgreSQL 16, Redis 7, MinIO S3-compatible storage)
- **Testing**: Vitest, Supertest (Unit, Integration, Security, and Concurrency suites)

---

## 4. Architecture & State Machines

### 4.1 Order Lifecycle State Machine
```
   [PENDING_PAYMENT]
          │
     Payment Success
          ▼
       [PAID] ───────────────┐
          │                  │
    Fulfillment Start        │
          ▼                  ▼
    [PROCESSING]        [CANCELLED / REFUNDED]
          │                  ▲
       Dispatched            │
          ▼                  │
      [SHIPPED] ─────────────┘
          │
       Delivered
          ▼
     [DELIVERED]
```

### 4.2 Inventory Movement Audit
Every decrement or increment writes an immutable ledger entry into `InventoryMovement`:
- `PURCHASE`: Decrements stock on verified payment.
- `RESTOCK`: Increments stock upon warehouse intake.
- `DAMAGE_WRITE_OFF`: Records loss or damages.
- `RETURN`: Restores stock after returned goods inspection.

---

## 5. Getting Started & Installation

### 5.1 Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 5.2 Starting Services (Docker Compose)
To start PostgreSQL, Redis, and MinIO:
```bash
docker compose up -d
```

### 5.3 Installing Dependencies
```bash
# Backend dependencies
cd backend && npm install

# Frontend dependencies
cd ../frontend && npm install
```

### 5.4 Database Migration & Seeding
```bash
cd backend && npm run db:seed
```

Demo Accounts:
- **Administrator**: `admin@cartly.local` / `AdminPass123!`
- **Customer**: `customer@cartly.local` / `Pass123!`
- **Reader Two**: `reader2@cartly.local` / `Pass123!`

### 5.5 Running the Applications
```bash
# Start backend API (Port 4001)
cd backend && npm run dev

# Start frontend application (Port 3000)
cd frontend && npm run dev
```

Visit the storefront at `http://localhost:3000`.

---

## 6. Automated Verification & Testing

Run all 16 test suites covering Unit, Integration, Security, and Concurrency:

```bash
# Run backend test suite
cd backend && npm test

# Run end-to-end integration test
cd .. && npx vitest run tests/e2e.test.ts
```

### Verified Test Categories:
1. **Pricing Engine Unit Tests**: Server-side subtotal, sales tax, shipping thresholds, and percentage/fixed coupon validation.
2. **State Machine Unit Tests**: Verification of valid and illegal order status transitions.
3. **API Integration Tests**: Full-text query search, direct ISBN lookup, cart item addition and quantity updates.
4. **Security Tests**: Resistance to client-submitted price tampering; access boundaries preventing customers from accessing administrative analytics.
5. **Payment Failure Tests**: Confirms that declined payments leave stock completely unchanged and create no purchase movements.
6. **Verified Purchaser Reviews**: Confirms non-purchasers cannot submit reviews, while purchasers are authorized.
7. **Concurrency Race Condition Test**: Parallel checkouts racing for the very last single copy (`stock = 1`) guarantee that exactly one succeeds and stock never falls below zero.

---

## 7. Known Limitations

- Production deployment requires an active PostgreSQL connection string in `DATABASE_URL` and Redis instance in `REDIS_URL`.
- The bundled payment provider is an isolated sandbox adapter for deterministic local and testing environments; production requires configuring commercial provider credentials.
