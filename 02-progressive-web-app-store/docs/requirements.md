# Progressive Web App (PWA) Store — Functional & System Requirements

## 1. Domain & Purpose

The Progressive Web App (PWA) Store is an installable, mobile-first e-commerce application engineered to provide a responsive native-like shopping experience with high reliability across unstable, intermittent, or completely offline network connectivity.

---

## 2. Core User & Application Capabilities

### 2.1 Store Capabilities
- **Catalog Discovery**: Category hierarchy, product search, faceted attribute filters (price, category, availability, rating).
- **Product Details**: Multi-angle imagery, product specifications, inventory status, user reviews, related items.
- **Cart & Wishlist**: Real-time quantity adjustments, price calculations, local cache persistence.
- **Authentication**: JWT authentication with refresh tokens, password hashing, user session management.
- **Online Checkout**: Strict server-side price recalculation, address collection, payment processing via isolated sandbox adapter.
- **Order History & Tracking**: Real-time timeline transitions for submitted orders.
- **Store Administration**: Product CRUD, inventory tracking, push notification broadcast, sync conflict resolution.

### 2.2 Progressive Web App (PWA) Capabilities
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

## 3. Critical Business Rules & Integrity

1. **NO Offline Payment Processing**: Checkout and payment submission MUST only be validated and processed while online. Orders cannot be created in offline sync mode to prevent financial desynchronization or stock overselling.
2. **Client-Generated Idempotency Keys**: Every pending sync event carries an immutable UUIDv4 idempotency key. The server validates each key to guarantee duplicate sync replays never duplicate cart quantities or orders.
3. **Conflict Resolution Policy**:
   - **Out of Stock**: If an item in a queued `ADD_TO_CART` action becomes out of stock before sync occurs, the event is marked `CONFLICT` with message `"Item is currently out of stock"`.
   - **Price Change**: If the price changes while offline, the server records the event as `CONFLICT` with `"Price changed from $X to $Y"`, allowing the user to review the updated price before confirmation.
4. **Device Push Subscription Lifecycle**: Subscriptions are scoped per user device and removable via endpoint on sign-out or revocation.
