# Phase 08: Car Rental System — Detailed Requirements

## 1. System Objective
Provide an enterprise vehicle fleet rental marketplace with multi-tier duration pricing (daily, weekly, monthly discounts), strict date-range availability locking, security deposit authorization escrow, driver license verification, and return inspection damage tracking.

## 2. Functional Requirements

### 2.1 Fleet Management & Vehicle Categories
- Vehicle classes: Compact, Sedan, SUV, Electric, Luxury, Minivan.
- Specifications: Transmission (Automatic/Manual), Seats, Luggage Capacity, Fuel/Electric Range, Mileage limit.
- Vehicle status: `AVAILABLE`, `RENTED`, `MAINTENANCE`.

### 2.2 Date-Range Availability & Overlap Locking
- Customers select pickup and return dates/times.
- Overlap detection: Two rentals cannot overlap on the same vehicle.
- Database constraint / mutex guard prevents concurrent overlapping bookings. Parallel attempts to book the same vehicle for overlapping dates yield `409 Conflict: Vehicle unavailable for the requested dates`.

### 2.3 Tiered Duration Pricing & Security Deposit
- Base Daily Rate.
- Duration tiers:
  - Daily: Base rate.
  - Weekly (>= 7 days): 15% discount on daily rate.
  - Monthly (>= 30 days): 30% discount on daily rate.
- Optional Add-ons:
  - Collision Damage Waiver (CDW): $19.99/day.
  - Supplemental Liability: $12.99/day.
  - GPS & Child Seat: $7.99/day.
- Refundable Security Deposit: $250.00 held in escrow upon checkout and refunded upon vehicle return inspection.

### 2.4 Driver License Verification
- Drivers must provide license number, issuing state/country, and expiration date.
- Verification states: `PENDING_VERIFICATION`, `VERIFIED`, `REJECTED`.

### 2.5 Rental Lifecycle & Return Inspection
- `RESERVED`: Booking created, deposit + rental fees authorized.
- `ACTIVE_RENTAL`: Vehicle picked up, initial odometer & fuel level recorded.
- `RETURNED`: Vehicle returned, return inspection checks for new damages or fuel deficit.
- `COMPLETED`: Security deposit released (or adjusted for damages) and booking closed.
- `CANCELLED`: Cancelled prior to pickup with full refund.

### 2.6 Roles & Permissions
- `RENTER`: Discovers fleet, books vehicles, views rental agreements.
- `FLEET_AGENT`: Inspects vehicles at pickup and drop-off, adjusts fuel/odometer, records damage claims.
- `FLEET_MANAGER`: Manages vehicle fleet inventory, maintenance schedules, and rates.
