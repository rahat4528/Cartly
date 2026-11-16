# Flight Booking System - REST API Specification

### Status & Airports
- `GET /api/v1/health` - Health status and demonstration notice.
- `GET /api/v1/airports` - List supported airports (IATA codes, cities, names).

### Flight Search
- `GET /api/v1/flights/search` - Search flights with `origin`, `destination`, `date`, `cabinClass`, `passengers`. Returns direct flights and validated connecting itineraries.
- `GET /api/v1/flights/:id` - Detailed flight schedule, aircraft model, and seat availability.

### Bookings & Reservations
- `POST /api/v1/bookings` - Create reservation hold with passenger manifest and seat selections. Decrements inventory and locks seats.
- `POST /api/v1/bookings/:id/pay` - Pay and transition to `TICKETED`, generating demonstration PNR and e-ticket.
- `GET /api/v1/bookings/:id` - Retrieve booking status, e-ticket details, and itinerary timeline.
- `GET /api/v1/bookings/my` - Passenger booking history.
- `POST /api/v1/bookings/:id/cancel` - Cancel booking and restore seat inventory.

### Administrative Management
- `POST /api/v1/admin/flights` - Add flight schedule and set cabin capacities.
- `GET /api/v1/admin/manifest/:flightId` - Retrieve flight passenger manifest.
