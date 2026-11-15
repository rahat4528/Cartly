# Restaurant Reservation System — Product Requirements Document (PRD)

## 1. Executive Summary

The Restaurant Reservation System (`05-restaurant-reservation-system`) is an independent dining discovery and table reservation platform. It models real-world dining floor plans with table capacity constraints, turnover buffer times, dynamic table combinations for large parties, multi-zone seating (Indoor, Patio, Bar, Chef's Counter), and an automated waitlist promotion engine that notifies waitlisted diners when cancellations occur.

---

## 2. Target Personas

1. **Diner / Guest**:
   - Discovers restaurants by cuisine (Italian, French Bistro, Japanese Izakaya), neighborhood, price tier (\$\$, \$\$\$, \$\$\$\$), and dining time slots.
   - Selects party size (1 to 10 guests) and preferred seating area (Main Dining Room, Outdoor Patio, Chef's Table).
   - Receives instant confirmation with reservation code and dietary preferences (e.g. Vegetarian, Gluten-Free).
   - When a prime time slot is fully booked, joins the automated waitlist with party size and notification alert.
   - Manages, modifies, or cancels reservations with automated waitlist ripple updates.

2. **Maitre D' / Restaurant Host / Manager**:
   - Manages physical dining tables (2-top, 4-top, 6-top, private dining) across seating zones.
   - Views floor plan occupancy timeline and table turnaround schedules (90-minute dining duration + 15-minute cleaning buffer).
   - Processes diner arrival: transitions status from `CONFIRMED` &rarr; `SEATED` &rarr; `COMPLETED`, or marks `NO_SHOW`.
   - Manages waitlist queue and manual seating overrides.

3. **Platform Administrator**:
   - Onboards restaurants, verifies hygiene and food service licenses, audits reservation dispute logs.

---

## 3. Core System Requirements & Business Rules

### 3.1 Dining Duration & Turnover Buffer Times
- Every reservation is allocated a strict dining duration based on party size:
  - 1–2 Guests: 75 minutes
  - 3–4 Guests: 90 minutes
  - 5+ Guests: 120 minutes
- A mandatory **15-minute turnover buffer** is enforced between consecutive seatings on any table for sanitization, table setting, and guest transition.
- Total blocked window for a 4-guest party at 19:00: `19:00` to `20:45` (90m dining + 15m turnover). Subsequent reservations on that table can begin at `20:45` or later.

### 3.2 Table Allocation & Dynamic Combinations
- Single Table Allocation:
  - Best fit: A party of 2 is assigned a 2-top table before a 4-top.
  - A table's `minCapacity <= partySize <= maxCapacity`.
- Combinable Tables:
  - Adjacent tables in the same zone flagged with `isCombinable = true` can be dynamically merged to accommodate large parties when no single table fits.
  - For example, Table 3 (2-top) + Table 4 (2-top) can merge into a 4-top or 5-top.
  - When merged, both constituent tables are locked for the reservation window.

### 3.3 Automated Waitlist Promotion Engine
- When all tables in a restaurant zone are fully booked for a given time window, guests can join the waitlist (`status: 'WAITLIST'`).
- Waitlist records include: `partySize`, `requestedTimeSlot`, `seatingZone`, `priorityTimestamp`.
- When a confirmed reservation is cancelled:
  1. The table allocation engine releases the table(s).
  2. The waitlist engine queries eligible waitlisted parties whose `partySize <= releasedCapacity` and whose requested time slot overlaps within 30 minutes.
  3. The highest priority (earliest joined) matching waitlist party is automatically promoted:
     - State transitions to `PROMOTED`.
     - The diner is granted a 15-minute claim window to confirm or decline.
     - If claimed, it transitions to `CONFIRMED`. If declined or timed out, the next eligible waitlisted diner is promoted.

### 3.4 Seating Zones
- `INDOOR_MAIN`: Elegant main dining room tables.
- `PATIO_TERRACE`: Outdoor climate-controlled dining.
- `BAR_HIGHTOP`: Casual walk-in and cocktail bar high-tops.
- `CHEFS_COUNTER`: Omakase / tasting menu bar overlooking the kitchen.

### 3.5 Reservation State Machine
- States:
  - `CONFIRMED`: Table and time slot reserved.
  - `SEATED`: Diner arrived and is currently dining.
  - `COMPLETED`: Dining finished, bill settled, table vacated.
  - `CANCELLED`: Cancelled by diner or restaurant (triggers waitlist promotion).
  - `NO_SHOW`: Diner failed to arrive within 20 minutes of reservation time.
  - `WAITLIST`: Diner queued for notification when a slot opens.
  - `PROMOTED`: Waitlisted diner promoted following a cancellation with temporary claim window.
- Valid Transitions:
  - `CONFIRMED` &rarr; `SEATED`
  - `CONFIRMED` &rarr; `CANCELLED`
  - `CONFIRMED` &rarr; `NO_SHOW`
  - `SEATED` &rarr; `COMPLETED`
  - `WAITLIST` &rarr; `PROMOTED`
  - `PROMOTED` &rarr; `CONFIRMED`
  - `PROMOTED` &rarr; `CANCELLED` (or expired)
