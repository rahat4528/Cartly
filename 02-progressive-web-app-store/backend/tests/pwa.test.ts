import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { PwaStore } from '../src/database/store.js';

describe('Progressive Web App (PWA) Store Test Suite', () => {
  let app: any;
  let store: PwaStore;
  let customerToken: string;

  beforeEach(async () => {
    store = PwaStore.getInstance();
    store.resetToSeed();
    app = createApp();

    const authRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer@cartly.local', password: 'Pass123!' });
    customerToken = authRes.body.token;
  });

  // ==================== 1. CATALOG & SEARCH ====================
  describe('Catalog & Products', () => {
    it('returns filtered products by category', async () => {
      const res = await request(app).get('/api/v1/products?categoryId=cat_audio');
      expect(res.status).toBe(200);
      expect(res.body.products.length).toBeGreaterThan(0);
      expect(res.body.products[0].categoryId).toBe('cat_audio');
    });

    it('retrieves single product by slug', async () => {
      const res = await request(app).get('/api/v1/products/aura-anc-wireless-headphones');
      expect(res.status).toBe(200);
      expect(res.body.title).toContain('Aura ANC');
    });
  });

  // ==================== 2. OFFLINE SYNC QUEUE & IDEMPOTENCY ====================
  describe('Offline Action Queue & Idempotent Synchronization', () => {
    it('synchronizes queued offline ADD_TO_CART actions and updates user cart', async () => {
      const syncEvent = {
        idempotencyKey: 'idem_sync_001',
        actionType: 'ADD_TO_CART',
        payload: { productId: 'prod_001', quantity: 2, expectedPrice: 249.00 }
      };

      const res = await request(app)
        .post('/api/v1/sync/batch')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ events: [syncEvent] });

      expect(res.status).toBe(200);
      expect(res.body.processedCount).toBe(1);
      expect(res.body.results[0].status).toBe('APPLIED');
      expect(res.body.results[0].message).toContain('Successfully added');
      expect(res.body.cart.itemCount).toBe(2);
    });

    it('guarantees duplicate sync event replay is idempotent and does not duplicate items', async () => {
      const syncEvent = {
        idempotencyKey: 'idem_sync_duplicate_test',
        actionType: 'ADD_TO_CART',
        payload: { productId: 'prod_002', quantity: 1, expectedPrice: 329.00 }
      };

      // First sync call
      const res1 = await request(app)
        .post('/api/v1/sync/batch')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ events: [syncEvent] });

      expect(res1.status).toBe(200);
      expect(res1.body.cart.itemCount).toBe(1);

      // Replay identical sync event with same idempotency key (e.g. on client network reconnection retry)
      const res2 = await request(app)
        .post('/api/v1/sync/batch')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ events: [syncEvent] });

      expect(res2.status).toBe(200);
      // Cart itemCount must remain 1, NOT incremented to 2!
      expect(res2.body.cart.itemCount).toBe(1);
      expect(res2.body.results[0].status).toBe('APPLIED');
    });
  });

  // ==================== 3. CONFLICT POLICY & RULES ====================
  describe('Sync Conflict Resolution Policy', () => {
    it('flags CONFLICT when attempting to sync an item that became out of stock', async () => {
      // Set prod_004 stock to 0
      const prod4 = store.findProduct('prod_004')!;
      prod4.stock = 0;

      const syncEvent = {
        idempotencyKey: 'idem_sync_out_of_stock',
        actionType: 'ADD_TO_CART',
        payload: { productId: 'prod_004', quantity: 1 }
      };

      const res = await request(app)
        .post('/api/v1/sync/batch')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ events: [syncEvent] });

      expect(res.status).toBe(200);
      expect(res.body.results[0].status).toBe('CONFLICT');
      expect(res.body.results[0].message).toContain('out of stock');
    });

    it('flags CONFLICT when item price changed on server while client was offline', async () => {
      const syncEvent = {
        idempotencyKey: 'idem_sync_stale_price',
        actionType: 'ADD_TO_CART',
        payload: { productId: 'prod_001', quantity: 1, expectedPrice: 199.00 } // Real price is 249.00
      };

      const res = await request(app)
        .post('/api/v1/sync/batch')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ events: [syncEvent] });

      expect(res.status).toBe(200);
      expect(res.body.results[0].status).toBe('CONFLICT');
      expect(res.body.results[0].message).toContain('Price for');
      expect(res.body.results[0].details.newPrice).toBe(249.00);
    });

    it('strictly REJECTS offline checkout actions dispatched via background sync', async () => {
      const checkoutEvent = {
        idempotencyKey: 'idem_offline_checkout',
        actionType: 'CHECKOUT',
        payload: { items: [{ productId: 'prod_001', quantity: 1 }] }
      };

      const res = await request(app)
        .post('/api/v1/sync/batch')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ events: [checkoutEvent] });

      expect(res.status).toBe(200);
      expect(res.body.results[0].status).toBe('REJECTED');
      expect(res.body.results[0].message).toContain('Offline checkout rejected');
    });
  });

  // ==================== 4. LIVE ONLINE CHECKOUT ====================
  describe('Live Online Checkout', () => {
    it('processes live checkout, decrements stock, and returns confirmed order', async () => {
      const prod = store.findProduct('prod_001')!;
      const stockBefore = prod.stock;

      const res = await request(app)
        .post('/api/v1/orders/checkout')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ productId: 'prod_001', quantity: 1 }],
          shippingAddress: { street: '10 Downing St', city: 'London' }
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('PAID');
      expect(prod.stock).toBe(stockBefore - 1);
    });
  });

  // ==================== 5. PUSH NOTIFICATIONS ====================
  describe('Web Push Notifications', () => {
    it('registers and unregisters device push subscriptions', async () => {
      const subRes = await request(app)
        .post('/api/v1/push/subscribe')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          endpoint: 'https://fcm.googleapis.com/fcm/send/test_sub_endpoint',
          keys: { p256dh: 'test_p256dh_key', auth: 'test_auth_key' }
        });

      expect(subRes.status).toBe(201);
      expect(subRes.body.success).toBe(true);
      expect(store.deviceSubscriptions.length).toBe(1);

      const unsubRes = await request(app)
        .post('/api/v1/push/unsubscribe')
        .send({ endpoint: 'https://fcm.googleapis.com/fcm/send/test_sub_endpoint' });

      expect(unsubRes.status).toBe(200);
      expect(store.deviceSubscriptions.length).toBe(0);
    });
  });
});
