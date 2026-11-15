# Cartly

A production-grade collection of **12 standalone, independent applications** covering e-commerce, digital marketplaces, reservation engines, and booking systems.

Every application is engineered with its own dedicated frontend, backend, database schema, migrations, authentication lifecycle, automated test suites, and container orchestration.

---

## Repository Objectives

- **True Architectural Isolation**: Each application is 100% independent. There is zero shared code, no monolithic database, and no cross-project runtime coupling.
- **Enterprise-Grade Correctness**: Server-side price recalculation, race-condition mitigation with transactional locking, explicit domain state machines, and idempotent payment workflows.
- **Comprehensive Verification**: End-to-end type safety with TypeScript strict mode, accompanied by unit, integration, API, security, and concurrency test suites.
- **Production Readiness**: Realistic seed datasets, complete OpenAPI/Swagger documentation, Docker Compose environments, and operational deployment guides.

---

## The 12 Applications

| # | Directory | Project Display Name | Category | Primary Tech Stack | Status | Documentation |
|---|---|---|---|---|---|---|
| 01 | [`01-online-bookstore`](./01-online-bookstore/) | Online Bookstore | E-Commerce | Next.js, Express/TypeScript, PostgreSQL, Prisma, Redis | Completed | [Docs](./01-online-bookstore/docs/) |
| 02 | [`02-progressive-web-app-store`](./02-progressive-web-app-store/) | Progressive Web App (PWA) Store | Mobile Commerce | Next.js, Workbox, IndexedDB, NestJS, PostgreSQL | Planned | [Docs](./02-progressive-web-app-store/docs/) |
| 03 | [`03-job-board-platform`](./03-job-board-platform/) | Job Board Platform | Recruitment Marketplace | Next.js, NestJS, PostgreSQL, Prisma, Redis | Planned | [Docs](./03-job-board-platform/docs/) |
| 04 | [`04-hotel-booking-system`](./04-hotel-booking-system/) | Hotel Booking System | Hospitality Reservation | Next.js, NestJS, PostgreSQL, Prisma, Redis | Planned | [Docs](./04-hotel-booking-system/docs/) |
| 05 | [`05-restaurant-reservation-system`](./05-restaurant-reservation-system/) | Restaurant Reservation System | Dining Reservation | Next.js, NestJS, PostgreSQL, Prisma, Redis | Planned | [Docs](./05-restaurant-reservation-system/docs/) |
| 06 | [`06-movie-ticket-booking`](./06-movie-ticket-booking/) | Movie Ticket Booking | Cinema Ticketing | Next.js, NestJS, PostgreSQL, Socket.IO, Redis | Planned | [Docs](./06-movie-ticket-booking/docs/) |
| 07 | [`07-grocery-delivery-app`](./07-grocery-delivery-app/) | Grocery Delivery App | On-Demand Commerce | Next.js, NestJS, PostgreSQL, Prisma, BullMQ | Planned | [Docs](./07-grocery-delivery-app/docs/) |
| 08 | [`08-car-rental-system`](./08-car-rental-system/) | Car Rental System | Fleet Rental | Next.js, NestJS, PostgreSQL, Prisma, Redis | Planned | [Docs](./08-car-rental-system/docs/) |
| 09 | [`09-real-estate-listing-platform`](./09-real-estate-listing-platform/) | Real Estate Listing Platform | Spatial Property Marketplace | Next.js, NestJS, PostgreSQL, PostGIS, Prisma | Planned | [Docs](./09-real-estate-listing-platform/docs/) |
| 10 | [`10-house-rental-platform`](./10-house-rental-platform/) | House Rental Platform | Residential Leasing | Next.js, NestJS, PostgreSQL, Prisma, Redis | Planned | [Docs](./10-house-rental-platform/docs/) |
| 11 | [`11-airbnb-clone`](./11-airbnb-clone/) | Airbnb Clone | Short-Stay Marketplace | Next.js, NestJS, PostgreSQL, Prisma, Socket.IO | Planned | [Docs](./11-airbnb-clone/docs/) |
| 12 | [`12-flight-booking-system`](./12-flight-booking-system/) | Flight Booking System | Demonstration Travel Booking | Next.js, NestJS, PostgreSQL, Prisma, Redis | Planned | [Docs](./12-flight-booking-system/docs/) |

---

## Directory Structure

```text
Cartly/
├── README.md                          # Repository overview and application index
├── LICENSE                            # MIT License
├── .gitignore                         # Global ignore patterns
├── PROGRESS.md                        # Master phase execution tracker
├── docs/                              # Global architecture and developer guidelines
│   ├── repository-overview.md
│   ├── architecture.md
│   ├── development-guide.md
│   ├── technology-stack.md
│   ├── project-index.md
│   └── final-delivery-report.md       # Compiled following Phase 12 completion
└── NN-project-name/                   # Independent application workspaces
    ├── frontend/                      # User-facing Next.js / React application
    ├── backend/                       # NestJS / API services
    ├── database/                      # Schema, migrations, and seed scripts
    ├── tests/                         # Integration, API, security, and concurrency suites
    ├── docs/                          # Architecture, API specifications, and completion reports
    ├── docker-compose.yml             # Self-contained container infrastructure
    ├── .env.example                   # Environment variable blueprint
    └── README.md                      # Application-specific setup and operational guide
```

---

## Per-Application Setup

To run any application within Cartly, change into its directory and execute the standard lifecycle commands:

```bash
cd 01-online-bookstore

# 1. Environment configuration
cp .env.example .env

# 2. Local container infrastructure (Postgres, Redis, Storage)
docker compose up -d

# 3. Install dependencies
npm install

# 4. Migrate and seed the database
npm run db:migrate
npm run db:seed

# 5. Start development servers
npm run dev

# 6. Execute automated verification suite
npm test
```

---

## Tracking Progress

Refer to [PROGRESS.md](./PROGRESS.md) for real-time tracking of phase milestones, execution status, and automated test results.
