import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../backend/src/app.js';
import { BookstoreStore } from '../backend/src/database/store.js';

describe('E2E User Journey: Browse -> Cart -> Checkout -> Stock Audit -> Invoice -> Review', () => {
  let app: any;
  let store: BookstoreStore;

  beforeEach(() => {
    store = BookstoreStore.getInstance();
    store.resetToSeed();
    app = createApp();
  });

  it('completes the entire end-to-end customer workflow seamlessly', async () => {
    // 1. Register a new customer
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'reader.clara@cartly.local',
        password: 'ReaderPassword123!',
        firstName: 'Clara',
        lastName: 'Oswald'
      });
    expect(regRes.status).toBe(201);
    const token = regRes.body.token;
    const userId = regRes.body.user.id;

    // 2. Discover books via catalog with genre filter and ISBN lookup
    const catRes = await request(app)
      .get('/api/v1/catalog/books?categoryId=cat_002&sort=featured');
    expect(catRes.status).toBe(200);
    expect(catRes.body.books.length).toBeGreaterThan(0);
    const chosenBook = catRes.body.books[0];

    // Check ISBN lookup
    const isbnRes = await request(app)
      .get(`/api/v1/catalog/books/isbn/${chosenBook.editions[0].isbn}`);
    expect(isbnRes.status).toBe(200);

    // 3. Add Hardcover edition to Cart
    const edition = chosenBook.editions.find((e: any) => e.format === 'HARDCOVER') || chosenBook.editions[0];
    const initialStock = edition.stock;

    const cartAddRes = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ editionId: edition.id, quantity: 1 });
    expect(cartAddRes.status).toBe(201);
    expect(cartAddRes.body.itemCount).toBe(1);

    // 4. Request a formal Price Quote (backend recalculation)
    const quoteRes = await request(app)
      .post('/api/v1/orders/quote')
      .send({
        items: [{ editionId: edition.id, quantity: 1 }],
        couponCode: 'EDITORIAL15'
      });
    expect(quoteRes.status).toBe(200);
    expect(quoteRes.body.totalAmount).toBeGreaterThan(0);

    // 5. Execute Checkout with Sandbox Payment
    const checkoutRes = await request(app)
      .post('/api/v1/orders/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ editionId: edition.id, quantity: 1 }],
        shippingAddress: {
          street: '76 Totter\'s Lane',
          city: 'London',
          postalCode: 'E1 6AN',
          country: 'United Kingdom'
        },
        couponCode: 'EDITORIAL15',
        paymentMethod: 'sandbox_card'
      });
    expect(checkoutRes.status).toBe(201);
    const order = checkoutRes.body.order;
    expect(order.status).toBe('PAID');

    // 6. Verify inventory was decremented by 1
    const updatedEdition = store.findEdition(edition.id)!;
    expect(updatedEdition.stock).toBe(initialStock - 1);

    // 7. Verify audit movement record
    const movement = store.inventoryMovements.find(m => m.orderNumber === order.orderNumber);
    expect(movement).toBeDefined();
    expect(movement.reason).toBe('PURCHASE');
    expect(movement.changeAmount).toBe(-1);

    // 8. Fetch official invoice
    const invoiceRes = await request(app)
      .get(`/api/v1/orders/${order.orderNumber}/invoice`)
      .set('Authorization', `Bearer ${token}`);
    expect(invoiceRes.status).toBe(200);
    expect(invoiceRes.body.data.totalAmount).toBe(order.totalAmount);
    expect(invoiceRes.body.formattedText).toContain(order.orderNumber);

    // 9. Submit a verified purchaser review
    const reviewRes = await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({
        bookId: chosenBook.id,
        rating: 5,
        title: 'Exemplary editorial production',
        comment: 'Superb binding, fine typography, and swift fulfillment.'
      });
    expect(reviewRes.status).toBe(201);
    expect(reviewRes.body.rating).toBe(5);

    // 10. Admin advances fulfillment status to PROCESSING then SHIPPED
    const adminLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@cartly.local', password: 'AdminPass123!' });
    const adminToken = adminLoginRes.body.token;

    const processRes = await request(app)
      .patch(`/api/v1/admin/orders/${order.orderNumber}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'PROCESSING', note: 'Order picked and packed in custom carton' });
    expect(processRes.status).toBe(200);
    expect(processRes.body.status).toBe('PROCESSING');

    const shipRes = await request(app)
      .patch(`/api/v1/admin/orders/${order.orderNumber}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'SHIPPED', note: 'Dispatched via Royal Mail Tracked 24' });
    expect(shipRes.status).toBe(200);
    expect(shipRes.body.status).toBe('SHIPPED');
  });
});
