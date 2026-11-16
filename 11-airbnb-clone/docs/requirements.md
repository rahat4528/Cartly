# Accommodation Marketplace (Airbnb Clone) - Requirements & Blueprint

## 1. Scope & Core Objectives
A short-stay vacation rental and accommodation marketplace connecting hosts and travelers. The platform delivers photo-first discovery, location and date search, category browsing (Beachfront, Cabins, Iconic Cities), transparent backend fee calculation (nightly rate, cleaning fee, guest service fee, and local occupancy taxes), atomic reservation holds with expiration sweeper, date-range exclusion collision locking, host listing onboarding, and post-stay verified guest reviews.

## 2. Key Entities & Data Model
- **User**: Guests and Hosts with authentication, role segregation, and profile management.
- **Listing**: Vacation rental properties with title, description, category, address, coordinates, nightly price, cleaning fee, minimum stay, maximum guests, and amenities.
- **AvailabilityCalendar**: Blocked dates, host-reserved blocks, and booked date spans.
- **Booking**: Reservation entity with state machine: `PENDING` -> `CONFIRMED` -> `CHECKED_IN` -> `COMPLETED` (plus `CANCELLED`, `EXPIRED`).
- **PriceSnapshot**: Immutable breakdown calculated strictly by backend upon booking creation: `baseNightlyRate`, `nightsCount`, `subtotal`, `cleaningFee`, `serviceFee` (12%), `occupancyTax` (10%), and `totalPrice`.
- **Review**: Verified post-checkout reviews. Only guests who completed a verified reservation can leave a review.
- **Wishlist**: Guest saved collections with heart toggles.

## 3. Critical Security & Concurrency Requirements
1. **Date-Range Collision Mutex**: No two confirmed or active reservations can overlap on the same listing (`checkIn < existingCheckOut && checkOut > existingCheckIn`). Overlapping attempts return `409 Conflict`.
2. **Backend Fee Calculation Authority**: Nightly rates, service fees (12%), cleaning fees, and taxes must never be computed or trusted from client requests. The backend creates an immutable snapshot.
3. **Reservation Hold Expiry**: Temporary reservation holds expire within 10 minutes if unconfirmed/unpaid.
4. **Review Verification Gate**: Only guests with status `COMPLETED` can publish reviews on a listing.
5. **Host Isolation**: Hosts can only edit and manage their own listings.
