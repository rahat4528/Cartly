# House Rental Platform - Functional & Non-Functional Requirements

## 1. System Overview
House Rental Platform is a dedicated, production-ready residential leasing marketplace providing complete lifecycle management for long-term residential rentals (apartments, single-family homes, townhouses, studios, condos).

## 2. Core Functional Requirements
1. **Property Discovery & Exploration**:
   - Filter by property type, maximum monthly rent, bedroom count, and pet policy.
   - Comprehensive property metadata: monthly rent, security deposit, square footage, bathrooms, available move-in date, utilities included, and amenities.
2. **Confidential Tenant Screening**:
   - Prospective tenants submit confidential income statements, employment status, employer details, and credit score brackets.
   - Masked verification document metadata handling (government ID, paystubs).
   - Landlord-only visibility for confidential applicant submissions.
3. **Escorted Tour Scheduling**:
   - 30-minute viewing slots for properties.
   - Concurrency locking with mutual exclusion preventing double-booking of any slot (`409 Conflict: Viewing appointment conflict`).
4. **Digital Lease Agreement Lifecycle**:
   - State machine: `APPLICATION_SUBMITTED` -> `UNDER_REVIEW` -> `LEASE_OFFERED` -> `LEASE_SIGNED` -> `ACTIVE` -> `TERMINATED`.
   - Automatic property state transition to `OCCUPIED` upon lease execution.
5. **Maintenance Service Requests**:
   - Tenant work order submission with photos, categories (Plumbing, Electrical, HVAC, Appliance, General), and urgency ratings (`EMERGENCY`, `HIGH`, `STANDARD`).
   - Landlord dispatch status progression: `OPEN` -> `SCHEDULED` -> `IN_PROGRESS` -> `RESOLVED`.
6. **Rent Payment Ledger**:
   - Sandbox payment provider integration.
   - Deterministic official receipt number generation (`RCPT-YYYYMM-...`).
