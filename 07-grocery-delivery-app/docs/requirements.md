# Phase 07: Grocery Delivery App — Detailed Requirements

## 1. System Objective
Provide an on-demand supermarket grocery e-commerce and delivery fulfillment platform with department aisle browsing, dynamic cart and item substitution preferences (`SUBSTITUTE_BEST_MATCH`, `CONTACT_ME`, `CANCEL_ITEM`), delivery window scheduling with strict per-slot capacity limits (e.g., max 10 orders per 1-hour slot), recurring replenishment schedules, and an end-to-end order fulfillment pipeline (`PLACED` -> `PICKING` -> `OUT_FOR_DELIVERY` -> `DELIVERED`).

## 2. Functional Requirements

### 2.1 Catalog & Fresh Inventory
- Departments: Produce, Dairy & Eggs, Bakery, Pantry, Beverages, Frozen, Meat & Seafood.
- Unit types: By each (`COUNT`), by weight (`PER_KG`, `PER_LB`).
- Real-time stock decrement upon checkout.

### 2.2 Delivery Slot Reservation & Capacity Enforcement
- Delivery windows configured in 1-hour increments (e.g., 09:00-10:00, 10:00-11:00, up to 21:00).
- Strict capacity ceiling per slot (default: 10 orders).
- Concurrency control: Atomic increment of slot usage during checkout. If capacity is exhausted, additional orders are strictly rejected (`409 Conflict: Delivery slot capacity full`).

### 2.3 Item Substitution Management
- Each item line in the cart allows specifying a substitution policy:
  - `SUBSTITUTE_BEST_MATCH`: Pick alternative brand or size within +/- 15% price band.
  - `CONTACT_ME`: Picker sends SMS/call prompt before making replacement.
  - `DO_NOT_SUBSTITUTE`: Omit item and refund difference if out of stock.

### 2.4 Recurring Delivery Subscriptions
- Allows shoppers to schedule recurring weekly or bi-weekly replenishment bundles (e.g. milk, bread, organic eggs).

### 2.5 Fulfillment Pipeline (State Machine)
- `PLACED`: Order paid and scheduled into delivery window.
- `PICKING`: In-store shopper is assembling and scanning items.
- `OUT_FOR_DELIVERY`: Courier dispatched with grocery totes.
- `DELIVERED`: Delivered to customer door with proof of delivery.
- `CANCELLED`: Cancelled prior to picking with automatic refund.

### 2.6 Roles & Security
- `CUSTOMER`: Places grocery orders, configures substitutions, views delivery tracking.
- `PICKER_DRIVER`: In-store picker and delivery courier managing status updates.
- `STORE_ADMIN`: Manages inventory levels, catalog prices, and slot capacities.
