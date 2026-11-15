# Online Bookstore — Architecture & Domain Design

## 1. System Structure

```
01-online-bookstore/
├── backend/                  # NestJS TypeScript API service
│   ├── src/
│   │   ├── auth/             # Authentication & RBAC (Customer & Admin)
│   │   ├── catalog/          # Books, Editions, Authors, Publishers, Categories
│   │   ├── cart/             # Shopping Cart and Wishlist management
│   │   ├── orders/           # Checkout, Price calculation, Order lifecycle
│   │   ├── payments/         # PaymentProvider interface & Sandbox adapter
│   │   ├── inventory/        # Stock management & InventoryMovement tracking
│   │   ├── reviews/          # Verified purchaser feedback & moderation
│   │   ├── coupons/          # Promotional code validation engine
│   │   ├── reports/          # Invoice generation & sales analytics
│   │   └── common/           # Interceptors, filters, guards, and decorators
├── frontend/                 # Next.js App Router (Editorial Bookstore UI)
│   ├── app/                  # Storefront & Admin management pages
│   ├── components/           # Typography, book covers, cart drawer, modals
│   └── lib/                  # API client, auth context, cart store
├── database/                 # Prisma ORM schema, SQL migrations & seeds
│   ├── schema.prisma         # Relational schema definition
│   └── seed.ts               # Production-grade bookstore catalog seed data
├── tests/                    # Vitest / Jest test suites
│   ├── unit/                 # Price calculation, coupon rules, status machine
│   ├── integration/          # API endpoints, auth guards, verified reviews
│   └── concurrency/          # Race condition tests for scarce book editions
├── docker-compose.yml        # PostgreSQL, Redis & MinIO storage services
├── .env.example              # Environment blueprint
└── README.md                 # Setup, run, and operational guide
```

---

## 2. Domain State Machines

### 2.1 Order State Machine
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

Valid Transitions:
- `PENDING_PAYMENT` -> `PAID` (on successful payment confirmation)
- `PENDING_PAYMENT` -> `CANCELLED` (on payment timeout or user cancellation)
- `PAID` -> `PROCESSING` (store staff begins picking/packing)
- `PAID` -> `REFUNDED` (store administrator cancels before processing)
- `PROCESSING` -> `SHIPPED` (carrier tracking code assigned)
- `PROCESSING` -> `REFUNDED` (inventory discrepancy or cancellation)
- `SHIPPED` -> `DELIVERED` (package confirmed delivered)

### 2.2 Inventory Movement Flow
Every change in `BookEdition.stock` must write an immutable `InventoryMovement`:
- `PURCHASE`: Decrement on confirmed order payment.
- `RESTOCK`: Increment when warehouse receives stock.
- `DAMAGE_WRITE_OFF`: Decrement for damaged or lost items.
- `RETURN`: Increment on customer return after inspection.

---

## 3. Relational Data Model (Prisma)

Entities:
- `User`: Core authentication record (`id`, `email`, `passwordHash`, `role: CUSTOMER | ADMIN`).
- `CustomerProfile`: Shipping details, phone, biographical info.
- `Author`: Literary author (`id`, `name`, `bio`, `photoUrl`, `nationality`).
- `Publisher`: Publishing house (`id`, `name`, `country`, `website`).
- `Category`: Literary genre / classification (`id`, `name`, `slug`, `description`).
- `Book`: Creative work (`id`, `title`, `slug`, `synopsis`, `authorId`, `publisherId`, `categoryId`, `language`, `coverImage`, `featured`).
- `BookEdition`: Physical or digital variant (`id`, `bookId`, `format: HARDCOVER | PAPERBACK | DELUXE | EBOOK`, `isbn`, `pages`, `listPrice`, `salePrice`, `stock`, `sku`).
- `BookImage`: Gallery images for book editions.
- `Cart`: Active shopping basket linked to user or guest session.
- `CartItem`: Item line in cart (`cartId`, `editionId`, `quantity`).
- `Wishlist`: Saved books collection for registered customer.
- `Coupon`: Promotional code (`code`, `discountType: PERCENT | FIXED`, `discountValue`, `minOrderAmount`, `maxUses`, `usedCount`, `expiresAt`, `isActive`).
- `Order`: Completed or pending transaction (`orderNumber`, `userId`, `status`, `subtotal`, `shippingAmount`, `taxAmount`, `discountAmount`, `totalAmount`, `shippingAddress`, `createdAt`).
- `OrderItem`: Line item in order with immutable price snapshot (`orderId`, `editionId`, `quantity`, `unitPrice`, `totalPrice`, `titleSnapshot`, `formatSnapshot`).
- `Payment`: Financial transaction record (`orderId`, `provider: SANDBOX`, `transactionId`, `amount`, `status: PENDING | SUCCESS | FAILED | REFUNDED`, `idempotencyKey`).
- `InventoryMovement`: Stock audit ledger (`editionId`, `orderId?`, `changeAmount`, `previousStock`, `newStock`, `reason`, `createdAt`).
- `Review`: Verified purchaser rating (`bookId`, `userId`, `orderId`, `rating: 1-5`, `title`, `comment`, `isApproved`, `createdAt`).

---

## 4. Payment Provider Isolation

```typescript
export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'succeeded' | 'failed';
  clientSecret: string;
}

export interface PaymentProvider {
  createPaymentIntent(amount: number, currency: string, idempotencyKey: string): Promise<PaymentIntent>;
  confirmPayment(paymentIntentId: string, paymentMethodDetails?: any): Promise<{ success: boolean; transactionId: string }>;
  refundPayment(transactionId: string, amount: number): Promise<{ success: boolean; refundId: string }>;
}
```
The deterministic `SandboxPaymentAdapter` simulates approval, card declines, network timeouts, and duplicate webhook replays.
