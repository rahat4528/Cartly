# House Rental Platform - System Architecture

## Architecture Overview
The platform operates as a modular, standalone application with completely isolated frontend and backend services, backed by dedicated PostgreSQL (`cartly_house_rental_db` on port 5441) and Redis (`cartly-house-rental-redis` on port 6388).

```text
+-----------------------------------------------------------+
|               Next.js 14 Frontend Client                  |
|  - Explorer Catalog & Filters (Rent, Type, Pets)          |
|  - Tour Booking & Confidential Screening Modal            |
|  - Tenant Portal (Leases, Rent Ledger, Maintenance)       |
|  - Landlord Portal (Screening Queue, Dispatch Orders)     |
+-----------------------------+-----------------------------+
                              | REST / JSON
+-----------------------------v-----------------------------+
|               Express TypeScript API Gateway              |
|  - JWT Authentication & RBAC Guard (TENANT, LANDLORD)     |
|  - Mutex Concurrency Lock on (propertyId, slotTime)       |
|  - Lease Lifecycle State Engine                           |
|  - Sandbox Payment & Deterministic Receipt Generator      |
+-----------------------------+-----------------------------+
                              |
+-----------------------------v-----------------------------+
|               Database & Cache Layer                      |
|  - PostgreSQL: cartly_house_rental_db (Port 5441)         |
|  - Redis Store: Port 6388                                 |
+-----------------------------------------------------------+
```
