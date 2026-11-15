# Cartly Architecture

## System Topography

Each application in Cartly is structured as a self-contained domain system:

```
[ Application Boundary ]
  ├── Frontend: Next.js / React (Client / SSR / Edge)
  │     ├── Tailwind CSS & Component System
  │     └── Client State & API Integration
  ├── Backend: NestJS / Node.js
  │     ├── Domain Modules & Services
  │     ├── Security, Auth & RBAC Guards
  │     ├── Availability & Concurrency Control
  │     ├── Payment Provider Adapter (Deterministic Sandbox)
  │     └── Storage Adapter (S3-compatible / Local file storage)
  ├── Data Layer
  │     ├── PostgreSQL Database (Prisma ORM & SQL Migrations)
  │     └── Redis Cache & Temporary Locks / Queues
  └── Deployment & Orchestration
        └── docker-compose.yml (Local multi-service provisioning)
```

## Core Architectural Guarantees

### 1. Isolated State & Databases
Every project has its own database named specifically for its domain:
- `cartly_bookstore_db`
- `cartly_pwa_store_db`
- `cartly_job_board_db`
- `cartly_hotel_booking_db`
- `cartly_restaurant_reservation_db`
- `cartly_movie_booking_db`
- `cartly_grocery_delivery_db`
- `cartly_car_rental_db`
- `cartly_real_estate_db`
- `cartly_house_rental_db`
- `cartly_airbnb_db`
- `cartly_flight_booking_db`

### 2. Concurrency & Overbooking Prevention
Where resources are uniquely constrained (hotel rooms, restaurant tables, cinema seats, vehicles, limited-inventory books):
- Critical write paths use database transactions with explicit locking or constraint mechanisms (`FOR UPDATE` / unique exclusion).
- Temporary holds enforce strict TTL limits via Redis and background expiry sweeps.
- Payment confirmation strictly verifies hold validity before finalizing reservations.

### 3. Isolated Payment Architecture
Payment interactions are abstracted behind a clean `PaymentProvider` interface:
```typescript
export interface PaymentIntentOptions {
  amount: number;
  currency: string;
  orderId: string;
  metadata?: Record<string, any>;
  idempotencyKey: string;
}

export interface PaymentProvider {
  createIntent(options: PaymentIntentOptions): Promise<PaymentIntentResult>;
  confirmPayment(intentId: string): Promise<PaymentConfirmResult>;
  refund(intentId: string, amount?: number): Promise<PaymentRefundResult>;
  verifyWebhook(payload: any, signature: string): Promise<boolean>;
}
```
A deterministic sandbox provider is bundled with each application for consistent local development and test execution.

### 4. Zero Cross-App Leakage
No shared libraries, no internal monorepo symlinks, and no cross-database foreign keys. Each application can be detached from the repository and operated as an independent standalone system.
