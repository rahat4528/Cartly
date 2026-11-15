# Cartly Development Guide

## Prerequisites

- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **Package Manager**: `npm`
- **Docker & Docker Compose**: For containerized PostgreSQL, Redis, and MinIO storage (optional if running external local services)
- **Git**: Configured with your local environment credentials

## Getting Started With An Application

Each application is located in its numbered folder (e.g., `01-online-bookstore/`). To develop or run an application:

1. **Navigate to the target application directory**:
   ```bash
   cd 01-online-bookstore
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

3. **Start Local Infrastructure (Optional/Docker)**:
   ```bash
   docker compose up -d
   ```

4. **Install Dependencies**:
   ```bash
   npm install
   ```

5. **Run Database Migrations & Seeds**:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

6. **Start Backend & Frontend**:
   ```bash
   npm run dev
   ```

7. **Execute Tests**:
   ```bash
   npm test
   ```

## Development Standards

- **TypeScript Strict Mode**: Enforce strict type checking across all client and server code.
- **Explicit State Transitions**: Use state machines for orders, bookings, and applications.
- **Server-Side Validation**: Never trust incoming client pricing, calculated totals, or status fields.
- **Sanitized Logging**: Never log passwords, tokens, or PII.
