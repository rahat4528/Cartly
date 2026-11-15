# Hotel Booking System (Cartly - Phase 4)

A full-stack, standalone hospitality reservation engine built with Next.js 14 App Router, Express, TypeScript, and Tailwind CSS. The application guarantees multi-night room inventory reliability through atomic date-range locking, temporary 10-minute hold countdowns with automatic inventory reclamation, transparent seasonal and weekend pricing recalculation, and tiered cancellation refund policies.

---

## 1. Features

### Guests & Travelers
- **Multi-Night Date-Range Search**: Find accommodations by city destination, check-in / check-out dates, guest party size, and required room count.
- **Photo Galleries & Amenities**: Rich visual galleries, room categories (Deluxe King, Executive Panorama Suite, Fir Chalet), star ratings, and detailed amenity lists.
- **Authoritative Dynamic Pricing Engine**: Server recalculates nightly rates, applying 1.20x weekend surcharges (Friday/Saturday), seasonal multipliers (Summer Peak 1.35x, Holiday 1.50x), 12% hospitality occupancy tax, and flat $35 resort fees.
- **10-Minute Hold Window**: Temporary hold locks rooms during checkout with live countdown timer. Stale holds automatically expire and restore inventory.
- **Deterministic Sandbox Payment**: Visa/Mastercard test card simulation (`tok_visa_success` and `tok_card_declined`) with idempotency key protection.
- **Booking Voucher Issuance**: Instant voucher code generation (`VCH-XXXXXX`) and printable itemized folio.
- **Tiered Cancellation Policy**:
  - Full 100% refund for cancellations $> 48\text{ hours}$ before check-in.
  - Partial 50% refund for cancellations between $24\text{ and }48\text{ hours}$ before check-in.
  - Non-refundable ($0$) within $24\text{ hours}$ of check-in.

### Hoteliers & Property Managers
- **Multi-Property Management**: Manage rooms across Miami, Zurich, and Kyoto locations.
- **Occupancy & Capacity Dashboard**: Real-time physical inventory monitoring per room type.
- **Live Guest Roster**: View active guest holds, confirmed stays, and stay durations.
- **Guest Front Desk Lifecycle**: Transition reservations through `CHECKED_IN` and `COMPLETED`.

---

## 2. Architecture & Tech Stack

```
04-hotel-booking-system/
├── backend/
│   ├── src/
│   │   ├── auth/           # JWT authentication, role guards (GUEST, HOTELIER, ADMIN)
│   │   ├── database/       # In-memory transactional datastore & seed generator
│   │   ├── hotels/         # Property discovery & room availability engine
│   │   ├── payments/       # Deterministic sandbox payment adapter
│   │   ├── pricing/        # Seasonal & weekend pricing rules, refund calculator
│   │   ├── reservations/   # Multi-night locking engine, holds, state machine
│   │   ├── app.ts          # Express application setup, routes, and security middlewares
│   │   └── server.ts       # Server listener
│   └── tests/              # Unit & integration test suites
├── frontend/               # Next.js 14 App Router + Tailwind CSS
│   ├── src/
│   │   ├── app/            # Landing (/), hotel detail (/hotels/[id]), guest portal (/reservations), hotelier (/hotelier)
│   │   ├── components/     # Navigation, headers, status badges
│   │   └── lib/            # API client and authentication context provider
├── database/
│   ├── schema.prisma       # Prisma schema for PostgreSQL deployment
│   └── seed.ts             # Initial seed fixtures
├── docs/                   # Requirements, architecture, API, and completion report
├── docker-compose.yml      # Dedicated PostgreSQL & Redis container definitions
├── package.json            # Monorepo task runner & test runner scripts
└── README.md
```

### Technology Matrix
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide React
- **Backend**: Express.js, TypeScript, jsonwebtoken, bcryptjs, cors, helmet
- **Database (Production)**: PostgreSQL (`cartly_hotel_booking_db`) with Prisma ORM
- **Cache / Locks (Production)**: Redis for hold TTL and distributed mutex locks
- **Testing**: Vitest, Supertest

---

## 3. Getting Started

### Prerequisites
- Node.js >= 18.17.0
- npm >= 9.0.0
- Docker & Docker Compose (optional, for standalone database container)

### Environment Setup
Copy the example environment configuration:
```bash
cp .env.example .env
```

### Installation
Install dependencies across both backend and frontend:
```bash
# In the 04-hotel-booking-system folder
npm install
npm install --prefix backend
npm install --prefix frontend
```

### Running the Services

#### 1. Start the Backend API
```bash
npm run dev:backend
# API server starts on http://localhost:4004
```

#### 2. Start the Frontend Application
```bash
npm run dev:frontend
# Web interface starts on http://localhost:3004
```

---

## 4. Demo Accounts & Seed Credentials

The local seed database includes pre-configured roles for immediate exploration:

| Role | Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **Guest** | `guest@cartly.local` | `Pass123!` | Active traveler profile with confirmed reservations |
| **Hotelier** | `hotelier@cartly.local` | `Pass123!` | Property operations manager for Grand Azure & Alpine Lumina |
| **Platform Admin** | `admin@cartly.local` | `AdminPass123!` | Platform supervisor with system audit rights |

---

## 5. API Reference

All endpoints are versioned under `/api/v1`.

### Authentication
- `POST /api/v1/auth/register` - Create guest or hotelier account
- `POST /api/v1/auth/login` - Authenticate and receive a JWT session bearer token
- `GET /api/v1/auth/me` - Retrieve current authenticated profile

### Hotel Discovery & Availability
- `GET /api/v1/hotels` - Search hotels (`city`, `checkIn`, `checkOut`, `guests`, `rooms`, `minRating`)
- `GET /api/v1/hotels/:idOrSlug` - Detailed hotel information with room availability breakdown
- `POST /api/v1/hotels/quote` - Request itemized nightly cost calculation with seasonal rules

### Reservations & Holds
- `POST /api/v1/reservations/hold` - Place atomic 10-minute hold on rooms
- `POST /api/v1/reservations/:id/confirm` - Confirm hold via sandbox card payment
- `GET /api/v1/reservations/my-reservations` - View guest's past and upcoming stays
- `GET /api/v1/reservations/:id` - Full reservation details, nightly breakdown, and voucher
- `POST /api/v1/reservations/:id/cancel` - Cancel reservation and calculate tiered refund

### Hotelier Operations
- `GET /api/v1/hotelier/hotels/:id/calendar` - Daily room type capacity and active reservations
- `PATCH /api/v1/hotelier/reservations/:id/status` - Transition reservation (`CHECKED_IN`, `COMPLETED`)

---

## 6. Testing

Run all unit, integration, and end-to-end tests:
```bash
# Execute full test suite
npm test

# Run backend unit, pricing, and concurrency tests
npm run test:backend

# Run end-to-end hospitality lifecycle tests
npm run test:e2e
```

---

## 7. Known Limitations
- Real credit card gateway webhooks are replaced with deterministic local sandbox adapters.
- SMS booking voucher reminders log to the console rather than dispatching via cellular gateways.
