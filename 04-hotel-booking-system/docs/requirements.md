# Hotel Booking System — Product Requirements Document (PRD)

## 1. Executive Summary

The Hotel Booking System (`04-hotel-booking-system`) is an independent hospitality reservation platform designed to handle multi-property, multi-room discovery, real-time date-range availability computation, atomic temporary booking holds, seasonal dynamic rate calculation, and multi-night guest reservations.

---

## 2. Target Personas

1. **Guest / Traveler**:
   - Searches accommodations by destination city, check-in/check-out date ranges, and guest counts (adults, children, rooms).
   - Explores photo galleries, room amenities (WiFi, pool, breakfast, ocean view), guest ratings, and verified reviews.
   - Secures a temporary 10-minute hold on selected rooms while reviewing the itemized nightly breakdown.
   - Completes payment via isolated deterministic sandbox adapter with booking voucher confirmation.
   - Manages upcoming reservations with tiered cancellation refund policies.

2. **Hotelier / Property Manager**:
   - Manages hotel inventory, room categories (Deluxe King, Executive Suite, Family Villa), and total available room stock.
   - Configures seasonal rate multipliers (Peak Summer, Holiday Season, Standard) and weekend surcharges.
   - Monitors live occupancy calendars and room cleaning / maintenance blocks.
   - Processes guest check-in, check-out, and cancellation refunds.

3. **Platform Administrator**:
   - Verifies properties, oversees city catalogs, inspects system telemetry, and audits booking holds.

---

## 3. Core System Requirements & Business Rules

### 3.1 Multi-Night Date-Range Availability Computation
- Each room type has a physical inventory count per hotel (e.g., 5 Deluxe King rooms).
- Availability is computed dynamically across the entire date range `[checkInDate, checkOutDate)`.
- For each night in the requested range:
  $$\text{Available Stock}(date) = \text{Total Inventory} - \left( \text{Active Confirmed Reservations}(date) + \text{Active Temporary Holds}(date) \right)$$
- If $\text{Available Stock}(date) < \text{Requested Rooms}$ for ANY single night in the range, the room type is unavailable for that search.

### 3.2 Temporary Booking Holds with TTL (Atomic Lock)
- When a guest proceeds to checkout, the system places a temporary reservation hold (`HELD`) for exactly 10 minutes (600 seconds).
- While in `HELD` state, the room quantity is deducted from available inventory across those dates.
- An automated expiry worker (or evaluation check) transitions holds with `expiresAt < now()` to `EXPIRED`, immediately restoring room availability.
- Under high concurrency (N guests attempting to hold the last room simultaneously), transactional locking guarantees that exactly one guest secures the hold, while others receive clear error feedback.

### 3.3 Dynamic Seasonal & Weekend Pricing Engine
- Server strictly recalculates all prices. Client-submitted prices are rejected.
- Daily Rate Formula:
  $$\text{Nightly Rate} = \text{Base Price} \times \text{Season Multiplier} \times \text{Weekend Multiplier} \times \text{Room Tier Multiplier}$$
  - **Weekend Surcharge**: Friday and Saturday nights apply a 1.20x multiplier.
  - **Season Multipliers**:
    - High / Peak Summer (June 1 - August 31): 1.35x
    - Holiday Season (December 15 - January 5): 1.50x
    - Standard / Regular Season: 1.00x
- Taxes and Fees:
  - Hospitality Occupancy Tax: 12%
  - Resort / Cleaning Fee: $35 flat per stay

### 3.4 Tiered Cancellation & Refund Policy
- Guests can cancel confirmed bookings according to explicit cancellation windows:
  - **Full Refund (100%)**: Cancelled $> 48\text{ hours}$ before 3:00 PM check-in date.
  - **Partial Refund (50%)**: Cancelled between $24\text{ hours}$ and $48\text{ hours}$ before check-in.
  - **Non-Refundable (0%)**: Cancelled $< 24\text{ hours}$ before check-in or on/after check-in date.
- Cancelled reservations immediately release inventory for all affected nights.

### 3.5 Reservation State Machine
- States:
  - `HELD`: Temporary 10-minute inventory lock pending payment.
  - `CONFIRMED`: Payment verified, room inventory permanently locked, booking voucher issued.
  - `CHECKED_IN`: Guest has arrived and checked in.
  - `COMPLETED`: Guest has checked out and stay is finalized.
  - `CANCELLED`: Cancelled by guest or hotelier; refund processed.
  - `EXPIRED`: Hold timed out without payment confirmation; inventory restored.
- Permitted Transitions:
  - `HELD` &rarr; `CONFIRMED`
  - `HELD` &rarr; `EXPIRED`
  - `HELD` &rarr; `CANCELLED`
  - `CONFIRMED` &rarr; `CHECKED_IN`
  - `CONFIRMED` &rarr; `CANCELLED`
  - `CHECKED_IN` &rarr; `COMPLETED`
- All other transitions are strictly forbidden.
