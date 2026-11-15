# Progressive Web App (PWA) Store — Architecture & Domain Design

## 1. System Structure

```
02-progressive-web-app-store/
├── backend/                   # Modular API service (Products, Auth, Cart, Sync, Push)
│   ├── src/
│   │   ├── auth/              # JWT Auth, password hashing, device tokens
│   │   ├── products/          # Catalog, categories, search, pricing
│   │   ├── cart/              # Persistent cart management
│   │   ├── orders/            # Online checkout and payment processing
│   │   ├── sync/              # SyncEvent processor & conflict resolution engine
│   │   ├── push/              # Web push notification subscription & dispatch
│   │   └── database/          # In-memory transactional datastore
├── frontend/                  # Next.js App Router (Mobile-First PWA)
│   ├── public/
│   │   ├── manifest.webmanifest # PWA Web App Manifest
│   │   ├── sw.js              # Service Worker (Cache strategies & offline support)
│   │   └── offline.html       # Standalone offline fallback view
│   ├── src/
│   │   ├── app/               # Storefront, cart, checkout, admin, offline views
│   │   ├── components/        # Mobile bottom navigation bar, install prompt, toast
│   │   └── lib/               # IndexedDB sync queue, service worker registrar
├── database/                  # Prisma schema & seed script
│   ├── schema.prisma          # Database schema (cartly_pwa_store_db)
│   └── seed.ts                # Mobile gadgets and accessories catalog seed
├── tests/                     # Automated test suites
│   ├── unit/                  # Sync event validation & conflict rules
│   ├── integration/           # Idempotent replay, manifest verification
│   └── e2e/                   # Offline queue and sync simulation
├── docker-compose.yml         # Dedicated PostgreSQL and Redis
├── .env.example
└── README.md
```

---

## 2. Sync Event State Machine & Conflict Engine

### 2.1 Sync Event Lifecycle
```
 [Client Queued] (IndexedDB)
        │
 Connectivity Restored
        ▼
 [Dispatched via /api/v1/sync/batch]
        │
   Server Validation
        ├── Idempotency Check & Duplicate Detection
        ├── Stock Availability Verification
        └── Current Price Verification
        │
        ├── All Valid ─────────► [Status: APPLIED]
        ├── Invalid Payload ───► [Status: REJECTED]
        └── Inventory/Price ───► [Status: CONFLICT]
```

### 2.2 Conflict Policy Matrix

| Action Type | Server Condition | Outcome Status | Resolution Strategy |
|---|---|---|---|
| `ADD_TO_CART` | Stock >= Requested Quantity | `APPLIED` | Cart updated with requested quantity |
| `ADD_TO_CART` | Stock < Requested Quantity | `CONFLICT` | Cart adjusted to available stock; user notified |
| `ADD_TO_CART` | Stock == 0 | `CONFLICT` | Item omitted from cart; notification shown |
| `ADD_TO_CART` | Price changed on server | `CONFLICT` | Item added at latest price; price delta flagged |
| `TOGGLE_WISHLIST` | Any valid product | `APPLIED` | Wishlist toggled idempotently |
| `CHECKOUT` | Dispatched offline | `REJECTED` | Offline checkout is forbidden by design |

---

## 3. Relational Data Model (Prisma)

Target Database: `cartly_pwa_store_db`

Entities:
- `User`: Core authentication record (`id`, `email`, `passwordHash`, `role: CUSTOMER | ADMIN`).
- `Product`: Catalog product (`id`, `title`, `slug`, `description`, `price`, `stock`, `categoryId`, `thumbnail`, `isFeatured`).
- `Category`: Hierarchy grouping (`id`, `name`, `slug`, `icon`).
- `ProductImage`: High-res gallery media.
- `Cart` & `CartItem`: Active shopping basket.
- `Order` & `OrderItem`: Finalized online orders.
- `Payment`: Financial transaction records.
- `SyncEvent`: Replayed client actions (`id`, `userId`, `idempotencyKey`, `actionType`, `payload`, `status: APPLIED | REJECTED | CONFLICT`, `conflictReason`, `appliedAt`).
- `DeviceSubscription`: Web Push subscriptions (`id`, `userId`, `endpoint`, `p256dh`, `authKey`, `userAgent`, `createdAt`).
