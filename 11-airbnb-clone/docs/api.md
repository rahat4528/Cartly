# Accommodation Marketplace (Airbnb Clone) - REST API Specification

### Authentication
- `POST /api/v1/auth/login` - Login host or guest credentials.
- `GET /api/v1/auth/me` - Current session and profile.

### Listings & Discovery
- `GET /api/v1/listings` - Search vacation rentals with `location`, `category`, `checkIn`, `checkOut`, and `guests`.
- `GET /api/v1/listings/:id` - Full listing details, host profile, amenities, and photo gallery.
- `POST /api/v1/listings` - Host creates listing.
- `PUT /api/v1/listings/:id` - Host updates listing attributes and pricing.

### Quotes & Price Snapshots
- `POST /api/v1/listings/:id/quote` - Server-authoritative price breakdown calculation (nights, base, cleaning fee, 12% service fee, 10% tax).

### Bookings & Reservations
- `POST /api/v1/bookings` - Create reservation hold (validates date non-overlap mutex; creates immutable price snapshot).
- `POST /api/v1/bookings/:id/confirm` - Guest pays and confirms reservation hold.
- `GET /api/v1/bookings/my` - Guest views bookings.
- `GET /api/v1/host/bookings` - Host views reservations across owned listings.
- `POST /api/v1/bookings/:id/cancel` - Cancel reservation with refund calculation.

### Reviews
- `POST /api/v1/listings/:id/reviews` - Submit review (enforces gate: guest must have COMPLETED booking).
- `GET /api/v1/listings/:id/reviews` - List verified reviews for listing.
