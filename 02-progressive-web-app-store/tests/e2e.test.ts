import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { createApp } from '../backend/src/app.js';
import { PwaStore } from '../backend/src/database/store.js';

describe('PWA Store E2E & PWA Lifecycle Suite', () => {
  let app: any;
  let store: PwaStore;

  beforeEach(() => {
    store = PwaStore.getInstance();
    store.resetToSeed();
    app = createApp();
  });

  // ==================== 1. MANIFEST & SERVICE WORKER VALIDATION ====================
  describe('PWA Manifest & Service Worker Assets', () => {
    it('verifies that manifest.webmanifest exists and contains standard PWA installability fields', () => {
      const manifestPath = path.resolve(__dirname, '../frontend/public/manifest.webmanifest');
      expect(fs.existsSync(manifestPath)).toBe(true);

      const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      expect(manifestContent.name).toBe('Cartly PWA Store');
      expect(manifestContent.short_name).toBe('PWA Store');
      expect(manifestContent.display).toBe('standalone');
      expect(manifestContent.start_url).toBe('/');
      expect(manifestContent.theme_color).toBe('#06B6D4');
      expect(manifestContent.icons.length).toBeGreaterThanOrEqual(2);
    });

    it('verifies that sw.js and offline.html exist for offline caching and service worker lifecycle', () => {
      const swPath = path.resolve(__dirname, '../frontend/public/sw.js');
      const offlinePath = path.resolve(__dirname, '../frontend/public/offline.html');

      expect(fs.existsSync(swPath)).toBe(true);
      expect(fs.existsSync(offlinePath)).toBe(true);

      const swContent = fs.readFileSync(swPath, 'utf8');
      expect(swContent).toContain('offline.html');
      expect(swContent).toContain('SKIP_WAITING');
    });
  });

  // ==================== 2. COMPLETE OFFLINE QUEUE & SYNC WORKFLOW ====================
  describe('Full End-to-End Offline Queue -> Background Replay -> Online Order Flow', () => {
    it('runs the full client offline and online lifecycle', async () => {
      // 1. Authenticate customer
      const authRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'customer@cartly.local', password: 'Pass123!' });
      expect(authRes.status).toBe(200);
      const token = authRes.body.token;

      // 2. Discover catalog
      const catalogRes = await request(app).get('/api/v1/products');
      expect(catalogRes.status).toBe(200);
      expect(catalogRes.body.products.length).toBeGreaterThan(0);
      const prod = catalogRes.body.products[0];

      // 3. Client goes offline -> generates local idempotencyKey and queues action
      const queuedEvent = {
        idempotencyKey: 'idem_pwa_e2e_001',
        actionType: 'ADD_TO_CART',
        payload: { productId: prod.id, quantity: 2, expectedPrice: prod.price },
        clientTimestamp: Date.now()
      };

      // 4. Connectivity restored -> Background Sync batch dispatched
      const syncRes = await request(app)
        .post('/api/v1/sync/batch')
        .set('Authorization', `Bearer ${token}`)
        .send({ events: [queuedEvent] });

      expect(syncRes.status).toBe(200);
      expect(syncRes.body.results[0].status).toBe('APPLIED');
      expect(syncRes.body.cart.itemCount).toBe(2);

      // 5. Duplicate replay of same idempotency key (idempotent, doesn't duplicate)
      const replayRes = await request(app)
        .post('/api/v1/sync/batch')
        .set('Authorization', `Bearer ${token}`)
        .send({ events: [queuedEvent] });

      expect(replayRes.status).toBe(200);
      expect(replayRes.body.cart.itemCount).toBe(2);

      // 6. Online Checkout (Strictly validated)
      const stockBefore = prod.stock;
      const checkoutRes = await request(app)
        .post('/api/v1/orders/checkout')
        .set('Authorization', `Bearer ${token}`)
        .send({
          items: [{ productId: prod.id, quantity: 2 }],
          shippingAddress: { street: '123 Tech Boulevard', city: 'San Francisco' }
        });

      expect(checkoutRes.status).toBe(201);
      expect(checkoutRes.body.status).toBe('PAID');

      // Verify stock was decremented by 2
      const updatedProd = store.findProduct(prod.id)!;
      expect(updatedProd.stock).toBe(stockBefore - 2);
    });
  });
});
