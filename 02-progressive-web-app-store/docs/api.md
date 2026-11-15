# Progressive Web App (PWA) Store — REST API Specification

Base URL: `/api/v1`

---

## 1. Authentication

### `POST /auth/register` & `POST /auth/login`
Standard credential authentication producing JWT bearer tokens.

---

## 2. Catalog & Products

### `GET /products`
Paginated search and faceted filter for products.
- Parameters: `query`, `categoryId`, `minPrice`, `maxPrice`, `inStockOnly`, `sort`, `page`, `limit`.

### `GET /products/:idOrSlug`
Retrieve product specifications, gallery images, and live inventory.

### `GET /categories`
Retrieve product categories with item counts.

---

## 3. Cart & Orders

### `GET /cart` & `POST /cart/items` & `PATCH /cart/items/:id` & `DELETE /cart/items/:id`
Online cart operations with live stock checks.

### `POST /orders/checkout`
Submit online checkout. Strictly requires live network connectivity.
- Returns `201 Created` with confirmed order and transaction details.

---

## 4. Background Sync & Queue Processing

### `POST /sync/batch`
Replays a batch of pending client actions queued during offline mode.
- **Request Body**:
  ```json
  {
    "events": [
      {
        "idempotencyKey": "a82e1c3a-5921-4d3b-8219-9f0a1b2c3d4e",
        "actionType": "ADD_TO_CART",
        "payload": { "productId": "prod_001", "quantity": 1 },
        "timestamp": 1700000000000
      }
    ]
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "results": [
      {
        "idempotencyKey": "a82e1c3a-5921-4d3b-8219-9f0a1b2c3d4e",
        "actionType": "ADD_TO_CART",
        "status": "APPLIED",
        "message": "Item added to cart successfully."
      }
    ],
    "cart": { ... }
  }
  ```

---

## 5. Web Push Notifications

### `POST /push/subscribe`
Register a device Web Push subscription.
- **Request Body**:
  ```json
  {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": {
      "p256dh": "BNcRdreHz...",
      "auth": "tBHIt..."
    }
  }
  ```

### `POST /push/unsubscribe`
Remove device push subscription.

### `POST /admin/push/broadcast` (Admin only)
Dispatch push message notification to registered devices.
