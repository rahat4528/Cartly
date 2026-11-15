# Online Bookstore — REST API Specification

Base URL: `/api/v1`

---

## 1. Authentication & Profile

### `POST /auth/register`
Create a customer account.
- **Request Body**:
  ```json
  {
    "email": "reader@example.com",
    "password": "Password123!",
    "firstName": "Arthur",
    "lastName": "Conan"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "user": { "id": "usr_123", "email": "reader@example.com", "role": "CUSTOMER" },
    "token": "jwt_token_string",
    "refreshToken": "refresh_token_string"
  }
  ```

### `POST /auth/login`
Authenticate user credentials.
- **Request Body**:
  ```json
  { "email": "reader@example.com", "password": "Password123!" }
  ```
- **Response `200 OK`**:
  ```json
  {
    "user": { "id": "usr_123", "email": "reader@example.com", "role": "CUSTOMER" },
    "token": "jwt_token_string"
  }
  ```

### `GET /auth/me`
Retrieve currently authenticated user profile (`Bearer` token required).

---

## 2. Catalog & Discovery

### `GET /catalog/books`
Paginated search and faceted filter for books.
- **Query Parameters**:
  - `query`: Text search across title, author, and description
  - `isbn`: Specific ISBN-10 or ISBN-13 lookup
  - `categoryId`: Filter by category
  - `minPrice`, `maxPrice`: Filter by edition price range
  - `format`: Filter by format (`HARDCOVER`, `PAPERBACK`, `DELUXE`, `EBOOK`)
  - `minRating`: Filter by minimum average rating (1-5)
  - `page`: Page number (default: 1)
  - `limit`: Page size (default: 12)
  - `sort`: `featured` | `price_asc` | `price_desc` | `rating_desc` | `newest`

### `GET /catalog/books/:idOrSlug`
Retrieve complete book details including author bio, editions with real-time stock, gallery images, rating statistics, and verified reviews.

### `GET /catalog/books/:id/recommendations`
Retrieve related books matching genre or author.

### `GET /catalog/categories`
Retrieve all categories with book counts.

### `GET /catalog/authors/:id`
Retrieve author profile and bibliography.

---

## 3. Cart & Wishlist

### `GET /cart`
Retrieve the current user's cart with recalculation of current edition availability and prices.

### `POST /cart/items`
Add an edition to the cart.
- **Body**: `{ "editionId": "ed_123", "quantity": 1 }`

### `PATCH /cart/items/:id`
Update line item quantity.

### `DELETE /cart/items/:id`
Remove line item from cart.

### `GET /wishlist` & `POST /wishlist/:bookId` & `DELETE /wishlist/:bookId`
Manage personal reading wishlist.

---

## 4. Checkout & Orders

### `POST /orders/quote`
Recalculate order subtotal, shipping, applicable coupon discount, and taxes on server side.
- **Body**:
  ```json
  {
    "items": [{ "editionId": "ed_123", "quantity": 1 }],
    "couponCode": "LITREAD10",
    "shippingAddress": {
      "street": "221B Baker St",
      "city": "London",
      "country": "UK",
      "postalCode": "NW1 6XE"
    }
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "subtotal": 29.99,
    "discount": 3.00,
    "shipping": 4.50,
    "tax": 2.25,
    "total": 33.74,
    "couponApplied": "LITREAD10"
  }
  ```

### `POST /orders/checkout`
Submit checkout intent and initiate payment.
- **Body**:
  ```json
  {
    "items": [{ "editionId": "ed_123", "quantity": 1 }],
    "couponCode": "LITREAD10",
    "shippingAddress": { ... },
    "paymentMethod": "sandbox_card",
    "idempotencyKey": "uuid_v4"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "order": {
      "orderNumber": "ORD-2026-9021",
      "status": "PAID",
      "totalAmount": 33.74
    },
    "payment": {
      "status": "SUCCESS",
      "transactionId": "txn_sb_83921"
    }
  }
  ```

### `GET /orders`
List user's past orders.

### `GET /orders/:orderNumber`
Retrieve order details, timeline, and tracking info.

### `GET /orders/:orderNumber/invoice`
Generate and return the formatted PDF invoice for the specified order.

---

## 5. Reviews

### `POST /reviews`
Submit a book review. Restricted to verified purchasers.
- **Body**:
  ```json
  {
    "bookId": "bk_123",
    "rating": 5,
    "title": "Masterpiece of historical prose",
    "comment": "Exquisitely bound edition with detailed footnotes."
  }
  ```

---

## 6. Admin Endpoints (`Role: ADMIN` required)

### `GET /admin/analytics`
Store analytics: Gross revenue, order counts, top-selling titles, low-stock inventory alerts.

### `POST /admin/catalog/books` & `PATCH /admin/catalog/books/:id`
Create and update book and editions data.

### `POST /admin/inventory/adjust`
Adjust edition stock level with audit reason:
- **Body**: `{ "editionId": "ed_123", "quantityDelta": 25, "reason": "RESTOCK" }`

### `GET /admin/orders` & `PATCH /admin/orders/:orderNumber/status`
Manage customer orders and progress fulfillment state machine.

### `POST /admin/coupons`
Create promotional coupons with discount rules and expiry.

### `GET /admin/reviews` & `PATCH /admin/reviews/:id/moderate`
Approve or reject customer reviews.
