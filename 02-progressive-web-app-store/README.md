# Progressive Web App (PWA) Store (`02-progressive-web-app-store`)

A mobile-first, installable Progressive Web App (PWA) store engineered for high reliability across unpredictable, intermittent, or completely offline connectivity, featuring client-side background action queuing, conflict resolution, and Web Push notifications.

---

## 1. Overview & UI Identity

- **Display Name**: Progressive Web App (PWA) Store
- **UI Identity**: Native mobile app-like interface featuring dark slate surfaces, electric cyan accents, bottom app navigation bar, and network connectivity indicators.
- **Audience**: Mobile shoppers, field technicians, and commuters requiring uninterrupted shopping across subway tunnels, flights, or weak networks.

---

## 2. Feature Matrix

### 2.1 Store Capabilities
- **Product Catalog & Search**: Instant filtering by category (Spatial Audio, Smart Wearables, Power & Cables, Ergonomics), keyword search, price ranges, and real-time inventory counts.
- **Product Details**: Multi-angle imagery, product specifications, inventory status, user reviews, related items.
- **Cart & Bag Management**: Real-time quantity adjustments, price calculations, local cache persistence.
- **Online Checkout**: Strict server-side price recalculation, address collection, payment processing via isolated sandbox adapter.
- **Order History & Tracking**: Real-time timeline transitions for submitted orders.
- **Store Administration**: Product CRUD, inventory tracking, push notification broadcast, sync conflict resolution.

### 2.2 PWA & Offline Engine
- **Web App Manifest**: Valid `manifest.webmanifest` defining `name`, `short_name`, `theme_color`, `background_color`, `display: standalone`, `scope`, and multiple crisp icons (`192x192`, `512x512`, `maskable`).
- **Service Worker Lifecycle**:
  - Install, activate, cache precaching (app shell: HTML, CSS, JS, essential icons).
  - Runtime caching strategies: Cache-First for static assets, Network-First with Cache fallback for catalog queries.
- **Offline Fallback Page**: Custom offline interface shown when navigating non-cached routes with no network.
- **Client Offline Storage (IndexedDB)**:
  - Cached catalog items and categories for offline browsing.
  - Pending Action Queue: Actions taken while disconnected (e.g. `ADD_TO_CART`, `UPDATE_CART_QUANTITY`, `REMOVE_CART_ITEM`, `TOGGLE_WISHLIST`) are captured with client-generated UUID idempotency keys.
- **Background Synchronization**:
  - Automatically replays queued pending actions when online connectivity is restored.
  - Returns per-event execution status (`APPLIED`, `REJECTED`, `CONFLICT`).
- **Push Notification Integration**:
  - Web Push API subscription storage per device (`DeviceSubscription`).
  - Ability for administrators to dispatch order status updates and store announcements.
- **Update Management**:
  - In-app toast prompt informing users when an updated service worker or new app release is ready to activate (`SkipWaiting`).

---

## 3. Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript (Strict), Tailwind CSS, Lucide Icons
- **Service Worker & Caching**: Cache Storage API, Web App Manifest, Service Workers
- **Client Storage**: LocalStorage / IndexedDB Sync Queue
- **Backend API**: Node.js, Express / Modular TypeScript Architecture, Zod validation, JWT authentication, Bcrypt
- **ORM & Data Layer**: Prisma ORM, PostgreSQL (`cartly_pwa_store_db`), In-Memory ACID datastore with idempotency tracking
- **Container Infrastructure**: Docker & Docker Compose (PostgreSQL 16, Redis 7)
- **Testing**: Vitest, Supertest (Unit, Integration, Security, and E2E suites)

---

## 4. Conflict Resolution Policy

1. **NO Offline Payment Processing**: Checkout and payment submission MUST only be validated and processed while online. Orders cannot be created in offline sync mode to prevent financial desynchronization or stock overselling.
2. **Client-Generated Idempotency Keys**: Every pending sync event carries an immutable UUIDv4 idempotency key. The server validates each key to guarantee duplicate sync replays never duplicate cart quantities or orders.
3. **Conflict Resolution Policy**:
   - **Out of Stock**: If an item in a queued `ADD_TO_CART` action becomes out of stock before sync occurs, the event is marked `CONFLICT` with message `"Item is currently out of stock"`.
   - **Price Change**: If the price changes while offline, the server records the event as `CONFLICT` with `"Price changed from $X to $Y"`, allowing the user to review the updated price before confirmation.
4. **Device Push Subscription Lifecycle**: Subscriptions are scoped per user device and removable via endpoint on sign-out or revocation.

---

## 5. Getting Started & Installation

### 5.1 Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 5.2 Starting Services (Docker Compose)
To start PostgreSQL and Redis:
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
- **Customer**: `customer@cartly.local` / `Pass123!`
- **Administrator**: `admin@cartly.local` / `AdminPass123!`

### 5.5 Running the Applications
```bash
# Start backend API (Port 4002)
cd backend && npm run dev

# Start frontend application (Port 3001)
cd frontend && npm run dev
```

Visit the storefront at `http://localhost:3001`.

---

## 6. Automated Verification & Testing

Run all 12 test suites covering Manifest, Offline Caching, Sync Idempotency, Conflict Resolution, and Online Checkout:

```bash
# Run backend test suite
cd backend && npm test

# Run end-to-end integration test
cd .. && npx vitest run tests/e2e.test.ts
```

### Verified Test Categories:
1. **PWA Manifest Validity**: Checks that `manifest.webmanifest` contains valid `name`, `short_name`, `display: standalone`, `start_url`, `theme_color`, and multiple icon sizes.
2. **Service Worker Assets**: Confirms presence of `sw.js` and standalone `offline.html`.
3. **Offline Queue Sync**: Replays batched client events with `ADD_TO_CART` actions and updates live cart.
4. **Sync Idempotency**: Replaying identical sync requests with same idempotency keys returns cached responses without duplicating cart quantities.
5. **Conflict Handling**: Out-of-stock items and stale price deltas correctly produce `CONFLICT` status.
6. **Offline Checkout Gating**: Verifies that checkout actions dispatched via background sync are strictly `REJECTED`.
7. **Online Checkout**: Verifies that live online checkout decrements stock and produces confirmed orders.
8. **Web Push Subscriptions**: Verifies device subscription creation, deletion, and admin broadcast delivery.

---

## 7. Known Limitations

- Real push notification delivery across external browsers requires valid VAPID public/private keypairs configured in production.
- Production deployment requires PostgreSQL connection string in `DATABASE_URL` and Redis instance in `REDIS_URL`.
