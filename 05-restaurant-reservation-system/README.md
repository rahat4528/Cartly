# Restaurant Reservation System (Cartly - Phase 5)

A full-stack, standalone dining discovery, table reservation, and automated waitlist promotion platform built with Next.js 14 App Router, Express, TypeScript, and Tailwind CSS. The application models real-world dining floor plans with table capacity constraints, turnover sanitization buffers, dynamic table merging for large dinner parties, multi-zone seating, and priority waitlist queue auto-promotions upon cancellations.

---

## 1. Features

### Diners & Guests
- **Restaurant Discovery Matrix**: Search dining destinations by cuisine (Northern Italian, French Bistro, Japanese Omakase), neighborhood, party size, and price tier ($$, $$$, $$$$).
- **Interactive Time Slot Picker**: View 30-minute interval dinner slots (17:00 through 22:30) with real-time table availability.
- **Seating Zone Preferences**: Select between Main Dining Room, Outdoor Patio, Bar High-tops, and Chef's Tasting Counter.
- **Single-Table Best-Fit Allocation**: Intelligent table assignment allocates a 2-top table to a party of 2 before considering a 4-top, preserving larger tables for bigger parties.
- **Dynamic Table Merging**: Combinable adjacent tables dynamically merge to accommodate larger groups (e.g. merging two 2-tops or two 4-tops).
- **Automated Waitlist Promotion Engine**: When prime dinner slots are fully booked, guests can queue on the automated waitlist. Cancellations trigger instant auto-promotions granting a 15-minute exclusive claim window.
- **Diner Reservation Portal**: View upcoming reservations with unique reservation codes (`RES-XXXXXX`), table assignments, and one-click cancellation.

### Hosts, Maitre D's & Restaurant Operations
- **Floor Plan Timeline**: Real-time dining table capacity matrix and seat occupancy overview.
- **Guest Front Desk Lifecycle**: Manage arrivals through `CONFIRMED` &rarr; `SEATED` &rarr; `COMPLETED`, or mark `NO_SHOW`.
- **Turnover Buffer Management**: Enforces a mandatory 15-minute turnover buffer after dining finishes for sanitization and reset.

---

## 2. Architecture & Tech Stack

```
05-restaurant-reservation-system/
├── backend/
│   ├── src/
│   │   ├── auth/           # JWT authentication, role guards (DINER, HOST, ADMIN)
│   │   ├── database/       # In-memory transactional datastore & seed generator
│   │   ├── reservations/   # Reservation lifecycle, concurrency mutex, state machine
│   │   ├── restaurants/    # Discovery, cuisine filtering & time slots
│   │   ├── tables/         # Table allocation, dynamic combinations & buffer logic
│   │   ├── waitlist/       # Priority queue & automated promotion engine
│   │   ├── app.ts          # Express application setup, routes, and security middlewares
│   │   └── server.ts       # Server listener
│   └── tests/              # Unit & integration test suites
├── frontend/               # Next.js 14 App Router + Tailwind CSS
│   ├── src/
│   │   ├── app/            # Landing (/), restaurant detail (/restaurants/[id]), diner portal (/reservations), host (/host)
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
- **Database (Production)**: PostgreSQL (`cartly_restaurant_reservation_db`) with Prisma ORM
- **Cache / Queues (Production)**: Redis for session caching and waitlist promotion jobs
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
# In the 05-restaurant-reservation-system folder
npm install
npm install --prefix backend
npm install --prefix frontend
```

### Running the Services

#### 1. Start the Backend API
```bash
npm run dev:backend
# API server starts on http://localhost:4005
```

#### 2. Start the Frontend Application
```bash
npm run dev:frontend
# Web interface starts on http://localhost:3005
```

---

## 4. Demo Accounts & Seed Credentials

The local seed database includes pre-configured roles for immediate exploration:

| Role | Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **Diner** | `diner@cartly.local` | `Pass123!` | Active dinner guest with confirmed reservations |
| **Host / Maitre D'** | `host@cartly.local` | `Pass123!` | Host for L'Aura Osteria and Bistrot Lumière |
| **Platform Admin** | `admin@cartly.local` | `AdminPass123!` | Dining platform supervisor |

---

## 5. API Reference

All endpoints are versioned under `/api/v1`.

### Authentication
- `POST /api/v1/auth/register` - Create diner or host account
- `POST /api/v1/auth/login` - Authenticate and receive a JWT session bearer token
- `GET /api/v1/auth/me` - Retrieve current authenticated profile

### Restaurant Discovery & Time Slots
- `GET /api/v1/restaurants` - Search restaurants (`cuisine`, `city`, `neighborhood`, `date`, `partySize`, `priceTier`)
- `GET /api/v1/restaurants/:idOrSlug` - Detailed restaurant profile with floor plan and time slot availability

### Reservations & Waitlist
- `POST /api/v1/reservations` - Book dining table with capacity check and allocation
- `POST /api/v1/reservations/:id/cancel` - Cancel reservation and trigger waitlist auto-promotion
- `GET /api/v1/reservations/my-reservations` - Diner's reservation and waitlist tickets
- `POST /api/v1/waitlist/join` - Queue for fully booked dinner slots
- `POST /api/v1/waitlist/:id/claim` - Claim promoted waitlist ticket

### Host Operations
- `GET /api/v1/host/restaurants/:id/timeline` - Daily floor plan occupancy and reservation roster
- `PATCH /api/v1/host/reservations/:id/status` - Transition reservation (`SEATED`, `COMPLETED`, `NO_SHOW`)

---

## 6. Testing

Run all unit, integration, and end-to-end tests:
```bash
# Execute full test suite
npm test

# Run backend unit, allocation, buffer, and concurrency tests
npm run test:backend

# Run end-to-end dining lifecycle tests
npm run test:e2e
```

---

## 7. Known Limitations
- SMS table-ready notifications are simulated in local development via automated waitlist status polling and promotion event logs.
