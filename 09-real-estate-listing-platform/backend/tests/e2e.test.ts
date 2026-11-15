import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { RealEstateStore } from '../src/database/store.js';

describe('Phase 09: Real Estate Listing Platform End-to-End Suite', () => {
  let app: any;
  let buyerToken: string;
  let agent1Token: string;
  let agent2Token: string;

  beforeEach(async () => {
    const store = RealEstateStore.getInstance();
    store.resetToSeed();
    app = createApp();

    const buyerRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'buyer@example.com', password: 'Pass123!' });
    buyerToken = buyerRes.body.token;

    const agent1Res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'agent@example.com', password: 'Pass123!' });
    agent1Token = agent1Res.body.token;

    const agent2Res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'agent2@example.com', password: 'Pass123!' });
    agent2Token = agent2Res.body.token;
  });

  it('runs complete lifecycle: Spatial Search -> Price Ledger -> Ownership Isolation -> Tour Scheduling', async () => {
    // 1. Spatial Search with Haversine radius
    const searchRes = await request(app).get('/api/v1/properties?lat=37.7749&lng=-122.4194&radiusKm=20');
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.properties.length).toBeGreaterThan(0);
    const prop1 = searchRes.body.properties[0];

    // 2. Agent 1 adjusts asking price
    const repricingRes = await request(app)
      .put(`/api/v1/properties/${prop1.id}`)
      .set('Authorization', `Bearer ${agent1Token}`)
      .send({
        price: 4700000,
        priceChangeReason: 'Strategic Winter Adjustment'
      });
    expect(repricingRes.status).toBe(200);
    expect(repricingRes.body.property.price).toBe(4700000);
    expect(repricingRes.body.property.priceHistory[0].newPrice).toBe(4700000);

    // 3. Agent 2 forbidden from modifying Agent 1's listing
    const maliciousEditRes = await request(app)
      .put(`/api/v1/properties/${prop1.id}`)
      .set('Authorization', `Bearer ${agent2Token}`)
      .send({ price: 3900000 });
    expect(maliciousEditRes.status).toBe(403);

    // 4. Buyer schedules an in-person viewing
    const tourRes = await request(app)
      .post(`/api/v1/properties/${prop1.id}/tours`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        tourDate: '2026-12-24',
        tourTime: '10:00',
        tourType: 'IN_PERSON',
        notes: 'Holiday weekend viewing'
      });
    expect(tourRes.status).toBe(201);
    expect(tourRes.body.tour.status).toBe('SCHEDULED');

    // 5. Viewing collision prevention
    const collisionRes = await request(app)
      .post(`/api/v1/properties/${prop1.id}/tours`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        tourDate: '2026-12-24',
        tourTime: '10:00',
        tourType: 'VIRTUAL_WALKTHROUGH'
      });
    expect(collisionRes.status).toBe(409);
  });
});
