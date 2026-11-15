import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../backend/src/app.js';
import { GroceryStore } from '../backend/src/database/store.js';

describe('Phase 07: Grocery Delivery App End-to-End Suite', () => {
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

  it('runs complete lifecycle: Catalog -> Concurrency Slot Contention -> Picking -> Delivery', async () => {
    // 1. Browse Catalog
    const catalogRes = await request(app).get('/api/v1/products?category=Produce');
    expect(catalogRes.status).toBe(200);
    expect(catalogRes.body.products.length).toBeGreaterThan(0);
    const avocado = catalogRes.body.products[0];

    // 2. Query delivery slots: slt_004 has capacity 10 and 9 booked (exactly 1 spot left)
    const slotsRes = await request(app).get('/api/v1/delivery-slots');
    expect(slotsRes.status).toBe(200);
    const slot4 = slotsRes.body.slots.find((s: any) => s.id === 'slt_004');
    expect(slot4.remainingCapacity).toBe(1);

    // 3. Concurrency Test: 2 simultaneous orders compete for the last single slot
    const [resA, resB] = await Promise.all([
      request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          deliverySlotId: 'slt_004',
          deliveryAddress: '100 Main St',
          contactPhone: '+1 555-111-2222',
          items: [{ productId: avocado.id, quantity: 1, substitutionPolicy: 'SUBSTITUTE_BEST_MATCH' }],
          cardToken: 'tok_visa_success'
        }),
      request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          deliverySlotId: 'slt_004',
          deliveryAddress: '102 Main St',
          contactPhone: '+1 555-333-4444',
          items: [{ productId: avocado.id, quantity: 1, substitutionPolicy: 'DO_NOT_SUBSTITUTE' }],
          cardToken: 'tok_visa_success'
        })
    ]);

    const statuses = [resA.status, resB.status].sort();
    expect(statuses).toEqual([201, 409]);

    const winningOrder = resA.status === 201 ? resA.body.order : resB.body.order;
    const losingResponse = resA.status === 409 ? resA : resB;
    expect(losingResponse.body.error).toContain('Delivery slot capacity full');

    // 4. Verify slot is now completely SOLD OUT
    const updatedSlotsRes = await request(app).get('/api/v1/delivery-slots');
    const updatedSlot4 = updatedSlotsRes.body.slots.find((s: any) => s.id === 'slt_004');
    expect(updatedSlot4.isSoldOut).toBe(true);
    expect(updatedSlot4.remainingCapacity).toBe(0);

    // 5. Driver updates order: PICKING -> OUT_FOR_DELIVERY -> DELIVERED
    const pickRes = await request(app)
      .patch(`/api/v1/orders/${winningOrder.id}/status`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ status: 'PICKING' });
    expect(pickRes.status).toBe(200);
    expect(pickRes.body.order.status).toBe('PICKING');

    const outRes = await request(app)
      .patch(`/api/v1/orders/${winningOrder.id}/status`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ status: 'OUT_FOR_DELIVERY' });
    expect(outRes.status).toBe(200);
    expect(outRes.body.order.status).toBe('OUT_FOR_DELIVERY');

    const delRes = await request(app)
      .patch(`/api/v1/orders/${winningOrder.id}/status`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ status: 'DELIVERED' });
    expect(delRes.status).toBe(200);
    expect(delRes.body.order.status).toBe('DELIVERED');
  });
});
