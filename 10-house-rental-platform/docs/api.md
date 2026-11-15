# House Rental Platform - REST API Reference

## Base URL
`http://localhost:5010/api/v1`

## Endpoints

### 1. Authentication
- `POST /auth/login`
  - Body: `{ email: string, password: string }`
  - Returns: `{ token: string, user: { id, email, fullName, role } }`

### 2. Properties
- `GET /properties` (Supports query filters: `propertyType`, `minRent`, `maxRent`, `bedrooms`, `petPolicy`, `status`)
- `GET /properties/:id`
- `POST /properties` (Authenticated Landlord/Admin)

### 3. Tour Viewings
- `POST /viewings` (Authenticated Tenant)
  - Body: `{ propertyId: string, slotTime: string, notes?: string }`
  - Error: Returns `409 Conflict` if slot already booked.
- `GET /viewings` (Authenticated)

### 4. Applications
- `POST /applications` (Authenticated Tenant)
  - Body: `{ propertyId, monthlyIncome, creditScoreBracket, employmentStatus, employerName, ... }`
- `GET /applications` (Tenant or Landlord filtered)
- `PATCH /applications/:id/status` (Landlord only)

### 5. Leases
- `POST /leases` (Landlord only - issues lease agreement)
- `POST /leases/:id/sign` (Tenant only - signs and activates lease)
- `GET /leases`

### 6. Maintenance
- `POST /maintenance` (Tenant only)
  - Body: `{ leaseId, propertyId, title, description, category, urgency }`
- `GET /maintenance`
- `PATCH /maintenance/:id/status` (Landlord only)

### 7. Payments
- `POST /payments/process` (Tenant only)
  - Body: `{ paymentId, paymentMethod }`
  - Returns: updated payment with `receiptNumber`
- `GET /payments/ledger`
