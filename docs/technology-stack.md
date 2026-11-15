# Cartly Technology Stack

Each application independently selects and configures its technology stack to mirror real-world production requirements.

## Core Technologies

| Category | Primary Technology | Usage & Rationale |
|---|---|---|
| **Frontend Framework** | Next.js (App Router / Pages) & React | Server-side rendering, client hydration, and routing |
| **Language** | TypeScript (Strict) | End-to-end type safety, domain model contracts |
| **Styling** | Tailwind CSS | Utility-first, responsive, and composable UI styling |
| **Backend Framework** | NestJS / Express | Modular dependency injection, controllers, and services |
| **Database ORM** | Prisma | Schema definitions, migration management, and typed client |
| **Primary Database** | PostgreSQL | Relational integrity, ACID transactions, and robust locking |
| **Caching & Queues** | Redis & BullMQ | Temporary reservation holds, session stores, background workers |
| **File Storage** | S3-Compatible Storage | Media assets, digital documents, and secure signed URLs |
| **Payments** | Sandbox Payment Adapter | Idempotent transaction verification and webhook simulation |
| **Testing** | Vitest / Jest / Supertest | Unit, integration, security, and concurrency verification |
