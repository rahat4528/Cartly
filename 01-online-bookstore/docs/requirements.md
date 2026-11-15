# Online Bookstore — Functional & System Requirements

## 1. Domain & Purpose

The Online Bookstore is an editorial, typography-focused, cover-forward e-commerce platform dedicated to literary discovery, multi-format book sales, and end-to-end order tracking. It provides a sanctuary for avid readers while equipping store administrators with sophisticated inventory, pricing, catalog, and revenue management tools.

---

## 2. User Roles & Capabilities

### 2.1 Customer / Reader
- **Account Management**: Register, authenticate (JWT with refresh), update profile (shipping addresses, phone, bio, reading preferences).
- **Discovery & Catalog**:
  - Editorial home page featuring curated book collections, new releases, and staff recommendations.
  - Multi-attribute search across Title, Author Name, and ISBN (ISBN-10 & ISBN-13).
  - Advanced faceted filtering by Price range, Minimum Rating, Literary Genre / Category, Language, Format (Hardcover, Paperback, Collector's Edition, Audio), and Stock Availability.
- **Product Details**:
  - Book overview with rich synopsis, author biography, publisher details, publication date, page count, and cover image gallery.
  - Edition selector (e.g. Paperback vs Hardcover vs Deluxe) reflecting real-time stock, pricing, and ISBN.
  - Verified Purchaser Reviews: Star ratings (1-5) and written feedback with verification badge.
  - Related book recommendations based on genre, author, and reading patterns.
- **Shopping Cart & Wishlist**:
  - Add/remove editions, update quantities up to available stock.
  - Persistent cart synchronized with user profile.
  - Move items between cart and personal wishlist.
- **Checkout & Payments**:
  - Multi-step checkout: Shipping address confirmation, shipping method selection, coupon/discount code entry.
  - Price computation strictly verified on backend: Subtotal + Shipping + Tax - Coupon discount.
  - Payment execution via deterministic sandbox payment adapter with simulated cards and error scenarios.
- **Order Tracking & Invoices**:
  - Real-time order progress timeline (`PENDING_PAYMENT` -> `PAID` -> `PROCESSING` -> `SHIPPED` -> `DELIVERED`).
  - Itemized downloadable/printable PDF invoice matching exact payment snapshot.

### 2.2 Store Administrator
- **Dashboard**: High-level store metrics: Total Sales, Daily Revenue, Active Orders, Low-Stock Alerts, Recent Customers.
- **Catalog Management (CRUD)**:
  - Books: Title, subtitle, description, categories, publication date, cover images.
  - Editions: Manage multiple editions per book (format type, ISBN, page count, list price, sale price, inventory stock).
  - Authors: Name, biography, nationality, profile photo.
  - Publishers: Company name, country, website.
  - Categories & Genres: Hierarchical taxomony for bookstore discovery.
- **Inventory & Stock Operations**:
  - Live stock adjustment with mandatory movement reasons (`RESTOCK`, `PURCHASE`, `DAMAGE_WRITE_OFF`, `RETURN`).
  - Automated low-stock alerts when inventory drops below configured thresholds.
  - Full audit trail of every stock modification in `InventoryMovement`.
- **Order Fulfillment**:
  - View all orders with customer details, line items, and payment status.
  - Transition order lifecycle (`PAID` -> `PROCESSING` -> `SHIPPED` -> `DELIVERED`, `CANCELLED`, `REFUNDED`).
- **Marketing & Promotions**:
  - Create and manage discount coupons (percentage or fixed discount, minimum order value, usage limits, expiration date).
- **Review Moderation**:
  - Review flagged reader submissions; approve or reject inappropriate content.

---

## 3. Data Integrity & Business Rules

1. **Server-Side Price Recalculation**: The backend never accepts client-calculated totals or prices. All subtotals, applied discounts, taxes, and shipping rates are freshly recomputed from the database records at checkout time.
2. **Atomic Inventory Decrements**: Stock is decremented only upon confirmed payment within an ACID transaction.
3. **Concurrency Protection**: During high-demand checkout of scarce editions, database transactional locking (`SELECT ... FOR UPDATE`) prevents negative stock and guarantees that two customers cannot purchase the same last remaining copy.
4. **Verified Purchaser Reviews**: Customers can only review editions/books if they hold an order in `PAID`, `PROCESSING`, `SHIPPED`, or `DELIVERED` status containing that book.
5. **Coupons Validity**: Enforces expiration timestamp, minimum order subtotal, and global/per-user maximum usage counts.
6. **Invoice Totals**: The invoice reflects the exact immutable snapshot stored in the Order record at the moment of payment completion.
