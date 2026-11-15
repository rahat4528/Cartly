import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { GroceryStore } from '../src/database/store.js';

describe('Phase 07: Grocery Delivery App Backend Unit & Integration Tests', () => {
  let app: any;
  let customerToken: string;
  let driverToken: string;

  beforeEach(async () => {
    const store = GroceryStore.getInstance();
    store.resetToSeed();
    app = createApp();

    const customerRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer@example.com', password: 'Pass123!' });
    customerToken = customerRes.body.token;

    const driverRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'driver@example.com', password: 'Pass123!' });
    driverToken = driverRes.body.token;
  });

  it('1. filters products by category aisle and query search', async () => {
    const produceRes = await request(app).get('/api/v1/products?category=Produce');
    expect(produceRes.status).toBe(200);
    expect(produceRes.body.products.length).toBeGreaterThan(0);
    expect(produceRes.body.products.every((p: any) => p.category === 'Produce')).toBe(true);

    const queryRes = await request(app).get('/api/v1/products?q=sourdough');
    expect(queryRes.status).toBe(200);
    expect(queryRes.body.products.length).toBe(1);
    expect(queryRes.body.products[0].name).toContain('Sourdough');
  });

  it('2. returns delivery slots with remaining capacity and sold-out flags', async () => {
    const slotsRes = await request(app).get('/api/v1/delivery-slots');
    expect(slotsRes.status).toBe(200);
    expect(slotsRes.body.slots.length).toBe(5);

    // Slot 5 was seeded as 2/2 booked (Sold out)
    const slot5 = slotsRes.body.slots.find((s: any) => s.id === 'slt_005');
    expect(slot5.isSoldOut).toBe(true);
    expect(slot5.status).toBe('SOLD_OUT');
    expect(slot5.remainingCapacity).toBe(0);
  });

  it('3. places order with item substitution policies and authoritative price recalculation', async () => {
    const orderRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        deliverySlotId: 'slt_001',
        deliveryAddress: '123 Market St, Apt 2',
        contactPhone: '+1 555-999-0000',
        items: [
          { productId: 'prd_001', quantity: 2, substitutionPolicy: 'SUBSTITUTE_BEST_MATCH' },
          { productId: 'prd_002', quantity: 1, substitutionPolicy: 'DO_NOT_SUBSTITUTE' }
        ],
        driverTip: 4.00,
        cardToken: 'tok_visa_success'
      });

    expect(orderRes.status).toBe(201);
    const order = orderRes.body.order;
    expect(order.status).toBe('PLACED');
    expect(order.items.length).toBe(2);
    expect(order.items[0].substitutionPolicy).toBe('SUBSTITUTE_BEST_MATCH');
    expect(order.items[1].substitutionPolicy).toBe('DO_NOT_SUBSTITUTE');

    // Subtotal: 2 * 4.99 + 1 * 4.29 = 9.98 + 4.29 = 14.27
    expect(order.subtotal).toBe(14.27);
    expect(order.deliveryFee).toBe(4.99);
    expect(order.driverTip).toBe(4.00);
    expect(order.totalAmount).toBeGreaterThan(23.00);
  });

  it('4. strictly rejects checkout when delivery slot is sold out (409 Conflict)', async () => {
    const fullSlotRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        deliverySlotId: 'slt_005', // Capacity 2, Booked 2
        deliveryAddress: '123 Market St',
        contactPhone: '+1 555-999-0000',
        items: [{ productId: 'prd_001', quantity: 1 }],
        cardToken: 'tok_visa_success'
      });

    expect(fullSlotRes.status).toBe(409);
    expect(fullSlotRes.body.error).toContain('Delivery slot capacity full');
  });

  it('5. handles payment decline cleanly and does not consume slot or stock', async () => {
    const store = GroceryStore.getInstance();
    const product = store.findProduct('prd_001')!;
    const initialStock = product.stockQuantity;
    const slot = store.findSlot('slt_001')!;
    const initialBooked = slot.bookedCount;

    const declineRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        deliverySlotId: 'slt_001',
        deliveryAddress: '123 Market St',
        contactPhone: '+1 555-999-0000',
        items: [{ productId: 'prd_001', quantity: 2 }],
        cardToken: 'tok_declined'
      });

    expect(declineRes.status).toBe(402);
    expect(declineRes.body.error).toContain('Payment declined');

    // Verify rollbacks
    expect(product.stockQuantity).toBe(initialStock);
    expect(slot.bookedCount).toBe(initialBooked);
  });

  it('6. advances fulfillment state machine: PLACED -> PICKING -> OUT_FOR_DELIVERY -> DELIVERED', async () => {
    const orderRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        deliverySlotId: 'slt_002',
        deliveryAddress: '123 Market St',
        contactPhone: '+1 555-999-0000',
        items: [{ productId: 'prd_003', quantity: 1 }],
        cardToken: 'tok_visa_success'
      });
    const orderId = orderRes.body.order.id;

    // Driver picks order
    const pickRes = await request(app)
      .patch(`/api/v1/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ status: 'PICKING' });
    expect(pickRes.status).toBe(200);
    expect(pickRes.body.order.status).toBe('PICKING');

    // Driver sets out for delivery
    const outRes = await request(app)
      .patch(`/api/v1/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ status: 'OUT_FOR_DELIVERY' });
    expect(outRes.status).toBe(200);
    expect(outRes.body.order.status).toBe('OUT_FOR_DELIVERY');

    // Delivered
    const deliveredRes = await request(app)
      .patch(`/api/v1/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ status: 'DELIVERED' });
    expect(deliveredRes.status).toBe(200);
    expect(deliveredRes.body.order.status).toBe('DELIVERED');
  });

  it('7. cancels order in PLACED state, restores slot capacity and restocks inventory', async () => {
    const store = GroceryStore.getInstance();
    const product = store.findProduct('prd_004')!;
    const initialStock = product.stockQuantity;
    const slot = store.findSlot('slt_003')!;
    const initialBooked = slot.bookedCount;

    const orderRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        deliverySlotId: 'slt_003',
        deliveryAddress: '123 Market St',
        contactPhone: '+1 555-999-0000',
        items: [{ productId: 'prd_004', quantity: 3 }],
        cardToken: 'tok_visa_success'
      });
    const orderId = orderRes.body.order.id;

    expect(product.stockQuantity).toBe(initialStock - 3);
    expect(slot.bookedCount).toBe(initialBooked + 1);

    // Cancel
    const cancelRes = await request(app)
      .post(`/api/v1/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send();

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.order.status).toBe('CANCELLED');

    // Restocked and slot released
    expect(product.stockQuantity).toBe(initialStock);
    expect(slot.bookedCount).toBe(initialBooked);
  });
});
