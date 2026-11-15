import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { BookstoreStore } from '../src/database/store.js';
import { PricingEngine } from '../src/orders/pricing.js';
import { OrderStateMachine } from '../src/orders/state-machine.js';

describe('Online Bookstore Test Suite', () => {
  let app: any;
  let store: BookstoreStore;
  let customerToken: string;
  let adminToken: string;

  beforeEach(async () => {
    store = BookstoreStore.getInstance();
    store.resetToSeed();
    app = createApp();

    // Authenticate demo customer
    const custRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer@cartly.local', password: 'Pass123!' });
    customerToken = custRes.body.token;

    // Authenticate demo admin
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@cartly.local', password: 'AdminPass123!' });
    adminToken = adminRes.body.token;
  });

  // ==================== 1. UNIT TESTS ====================
  describe('Unit: Pricing Engine & State Machine', () => {
    it('accurately recalculates subtotal, standard shipping, and 8.25% tax', () => {
      const breakdown = PricingEngine.calculate(
        [{ editionId: 'ed_001_pb', quantity: 2 }], // 16.50 * 2 = 33.00
        (id) => {
          const ed = store.findEdition(id);
          return ed ? {
            id: ed.id,
            bookId: ed.bookId,
            format: ed.format,
            isbn: ed.isbn,
            salePrice: Number(ed.salePrice),
            stock: ed.stock,
            bookTitle: 'Test Book'
          } : undefined;
        }
      );

      expect(breakdown.subtotal).toBe(33.00);
      expect(breakdown.discountAmount).toBe(0.00);
      expect(breakdown.shippingAmount).toBe(4.50); // Under $50 threshold
      expect(breakdown.taxAmount).toBe(2.72); // 33.00 * 0.0825 = 2.7225 -> 2.72
      expect(breakdown.totalAmount).toBe(40.22); // 33.00 + 4.50 + 2.72
    });

    it('applies percentage coupon correctly and qualifies for free shipping over $50', () => {
      const breakdown = PricingEngine.calculate(
        [{ editionId: 'ed_001_hc', quantity: 2 }], // 26.99 * 2 = 53.98
        (id) => {
          const ed = store.findEdition(id);
          return ed ? {
            id: ed.id,
            bookId: ed.bookId,
            format: ed.format,
            isbn: ed.isbn,
            salePrice: Number(ed.salePrice),
            stock: ed.stock,
            bookTitle: 'Test Book'
          } : undefined;
        },
        store.findCoupon('EDITORIAL15') // 15% discount
      );

      expect(breakdown.subtotal).toBe(53.98);
      expect(breakdown.discountAmount).toBe(8.10); // 53.98 * 0.15 = 8.097 -> 8.10
      expect(breakdown.shippingAmount).toBe(4.50); // Net taxable 45.88 is < $50
      expect(breakdown.taxAmount).toBe(3.79); // 45.88 * 0.0825 = 3.7851 -> 3.79
    });

    it('rejects expired coupons', () => {
      const expiredCoupon = store.findCoupon('EXPIRED5');
      expect(() => {
        PricingEngine.calculate(
          [{ editionId: 'ed_001_pb', quantity: 1 }],
          (id) => {
            const ed = store.findEdition(id);
            return ed ? {
              id: ed.id,
              bookId: ed.bookId,
              format: ed.format,
              isbn: ed.isbn,
              salePrice: Number(ed.salePrice),
              stock: ed.stock,
              bookTitle: 'Test'
            } : undefined;
          },
          expiredCoupon
        );
      }).toThrow(/expired|inactive/);
    });

    it('enforces order state machine transition rules', () => {
      expect(OrderStateMachine.canTransition('PENDING_PAYMENT', 'PAID')).toBe(true);
      expect(OrderStateMachine.canTransition('PAID', 'PROCESSING')).toBe(true);
      expect(OrderStateMachine.canTransition('PROCESSING', 'SHIPPED')).toBe(true);
      expect(OrderStateMachine.canTransition('SHIPPED', 'DELIVERED')).toBe(true);

      // Illegal jumps
      expect(OrderStateMachine.canTransition('PENDING_PAYMENT', 'SHIPPED')).toBe(false);
      expect(OrderStateMachine.canTransition('DELIVERED', 'PAID')).toBe(false);
      expect(() => OrderStateMachine.validateTransition('PENDING_PAYMENT', 'DELIVERED')).toThrow();
    });
  });

  // ==================== 2. INTEGRATION & API TESTS ====================
  describe('Integration: Catalog, Search & Cart', () => {
    it('supports text query search across title and synopsis', async () => {
      const res = await request(app)
        .get('/api/v1/catalog/books?query=oblivion');
      expect(res.status).toBe(200);
      expect(res.body.books.length).toBeGreaterThan(0);
      expect(res.body.books[0].title).toContain('Oblivion');
    });

    it('supports direct ISBN lookup for specific editions', async () => {
      const res = await request(app)
        .get('/api/v1/catalog/books/isbn/978-1-98765-401-2');
      expect(res.status).toBe(200);
      expect(res.body.edition.isbn).toBe('978-1-98765-401-2');
      expect(res.body.book.title).toContain('Architecture of Oblivion');
    });

    it('allows a customer to add to cart, update quantity, and fetch cart', async () => {
      const addRes = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ editionId: 'ed_001_pb', quantity: 2 });
      expect(addRes.status).toBe(201);
      expect(addRes.body.itemCount).toBe(2);

      const cartRes = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(cartRes.status).toBe(200);
      expect(cartRes.body.items.length).toBe(1);
      expect(cartRes.body.items[0].unitPrice).toBe(16.50);
    });
  });

  // ==================== 3. SECURITY & TAMPERING TESTS ====================
  describe('Security & Price Tampering', () => {
    it('strictly recalculates price on server and rejects fake client prices', async () => {
      const quoteRes = await request(app)
        .post('/api/v1/orders/quote')
        .send({
          items: [{ editionId: 'ed_001_pb', quantity: 1, fakePrice: 0.01 }]
        });
      expect(quoteRes.status).toBe(200);
      // Real price is 16.50, NOT 0.01
      expect(quoteRes.body.subtotal).toBe(16.50);
      expect(quoteRes.body.totalAmount).toBeGreaterThan(16.50);
    });

    it('blocks regular customers from accessing administrative endpoints', async () => {
      const res = await request(app)
        .get('/api/v1/admin/analytics')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Administrator privileges required');
    });

    it('allows administrators to access analytics and low-stock alerts', async () => {
      const res = await request(app)
        .get('/api/v1/admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('grossRevenue');
      expect(res.body).toHaveProperty('lowStockAlerts');
    });
  });

  // ==================== 4. PAYMENT & INVENTORY AUDIT ====================
  describe('Payment Adapter & Inventory Movement Ledger', () => {
    it('leaves stock unchanged and writes no purchase movement if payment fails', async () => {
      const edition = store.findEdition('ed_001_pb')!;
      const stockBefore = edition.stock;
      const initialMovementCount = store.inventoryMovements.length;

      const checkoutRes = await request(app)
        .post('/api/v1/orders/checkout')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ editionId: 'ed_001_pb', quantity: 2 }],
          shippingAddress: {
            street: '12 Grosvenor Crescent',
            city: 'Edinburgh',
            postalCode: 'EH12 5EL',
            country: 'UK'
          },
          paymentMethod: 'simulate_failure'
        });

      expect(checkoutRes.status).toBe(400);
      expect(checkoutRes.body.error).toContain('Checkout failed');

      // Stock must remain unchanged
      expect(edition.stock).toBe(stockBefore);
      // No purchase movement added
      expect(store.inventoryMovements.filter(m => m.reason === 'PURCHASE').length).toBe(0);
    });

    it('decrements stock on confirmed payment and creates verified purchaser invoice', async () => {
      const edition = store.findEdition('ed_001_pb')!;
      const stockBefore = edition.stock;

      const checkoutRes = await request(app)
        .post('/api/v1/orders/checkout')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ editionId: 'ed_001_pb', quantity: 3 }], // 16.50 * 3 = 49.50 >= 40.00 min for WELCOME10
          shippingAddress: {
            street: '12 Grosvenor Crescent',
            city: 'Edinburgh',
            postalCode: 'EH12 5EL',
            country: 'UK'
          },
          couponCode: 'WELCOME10',
          paymentMethod: 'sandbox_card'
        });

      expect(checkoutRes.status).toBe(201);
      const orderNumber = checkoutRes.body.order.orderNumber;
      expect(checkoutRes.body.order.status).toBe('PAID');
      expect(edition.stock).toBe(stockBefore - 3);

      // Verify InventoryMovement audit ledger
      const movements = store.inventoryMovements.filter(m => m.orderNumber === orderNumber);
      expect(movements.length).toBe(1);
      expect(movements[0].reason).toBe('PURCHASE');
      expect(movements[0].changeAmount).toBe(-3);

      // Verify invoice generation matches exact order totals
      const invoiceRes = await request(app)
        .get(`/api/v1/orders/${orderNumber}/invoice`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(invoiceRes.status).toBe(200);
      expect(invoiceRes.body.data.totalAmount).toBe(checkoutRes.body.order.totalAmount);
      expect(invoiceRes.body.formattedText).toContain(orderNumber);
    });
  });

  // ==================== 5. VERIFIED PURCHASER REVIEWS ====================
  describe('Verified Purchaser Reviews', () => {
    it('rejects reviews from readers who have not purchased the book', async () => {
      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          bookId: 'bk_003', // Unpurchased book
          rating: 5,
          title: 'Unverified Review',
          comment: 'I did not purchase this copy.'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Verified Purchase Required');
    });

    it('accepts reviews from customers after successful purchase', async () => {
      // 1. Purchase book bk_003
      await request(app)
        .post('/api/v1/orders/checkout')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ editionId: 'ed_003_pb', quantity: 1 }],
          shippingAddress: {
            street: '12 Grosvenor Crescent',
            city: 'Edinburgh',
            postalCode: 'EH12 5EL',
            country: 'UK'
          }
        });

      // 2. Submit review for bk_003
      const reviewRes = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          bookId: 'bk_003',
          rating: 5,
          title: 'Remarkable scholarship',
          comment: 'An astonishing exposition of medieval mathematical theory.'
        });

      expect(reviewRes.status).toBe(201);
      expect(reviewRes.body.rating).toBe(5);
    });
  });

  // ==================== 6. CONCURRENCY TESTS ====================
  describe('Concurrency: Parallel Checkouts for Last Copy', () => {
    it('ensures exactly one checkout succeeds and stock never goes negative when 2 parallel requests race for 1 copy', async () => {
      // ed_004_dlx has stock = 1 in seed data!
      const edition = store.findEdition('ed_004_dlx')!;
      expect(edition.stock).toBe(1);

      // Authenticate second reader
      const reader2Res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'reader2@cartly.local', password: 'Pass123!' });
      const reader2Token = reader2Res.body.token;

      // Fire 2 simultaneous parallel checkouts for the single copy
      const checkout1 = request(app)
        .post('/api/v1/orders/checkout')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ editionId: 'ed_004_dlx', quantity: 1 }],
          shippingAddress: {
            street: '12 Grosvenor Crescent',
            city: 'Edinburgh',
            postalCode: 'EH12 5EL',
            country: 'UK'
          }
        });

      const checkout2 = request(app)
        .post('/api/v1/orders/checkout')
        .set('Authorization', `Bearer ${reader2Token}`)
        .send({
          items: [{ editionId: 'ed_004_dlx', quantity: 1 }],
          shippingAddress: {
            street: '408 Rue Saint-Honore',
            city: 'Paris',
            postalCode: '75001',
            country: 'France'
          }
        });

      const [res1, res2] = await Promise.all([checkout1, checkout2]);

      const statuses = [res1.status, res2.status];
      expect(statuses).toContain(201); // Exactly one succeeded
      expect(statuses).toContain(400); // Exactly one was rejected due to lack of stock

      // Stock must be exactly 0, never negative
      expect(edition.stock).toBe(0);
    });
  });
});
