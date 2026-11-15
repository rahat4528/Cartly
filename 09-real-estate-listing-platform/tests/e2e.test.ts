import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../backend/src/app.js';
import { RealEstateStore } from '../backend/src/database/store.js';

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

    // 3. Security Boundary: Agent 2 forbidden from modifying Agent 1's listing
    const unauthorizedRes = await request(app)
      .put(`/api/v1/properties/${prop1.id}`)
      .set('Authorization', `Bearer ${agent2Token}`)
      .send({ price: 3000000 });
    expect(unauthorizedRes.status).toBe(403);
    expect(unauthorizedRes.body.error).toContain('You do not have ownership of this property listing');

    // 4. Tour Scheduling with double-booking prevention
    const [tourA, tourB] = await Promise.all([
      request(app)
        .post(`/api/v1/properties/${prop1.id}/tours`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          tourDate: '2026-12-22',
          tourTime: '11:30',
          tourType: 'IN_PERSON'
        }),
      request(app)
        .post(`/api/v1/properties/${prop1.id}/tours`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          tourDate: '2026-12-22',
          tourTime: '11:30',
          tourType: 'VIRTUAL_WALKTHROUGH'
        })
    ]);

    const statuses = [tourA.status, tourB.status].sort();
    expect(statuses).toEqual([201, 409]);

    // 5. Agent 1 marks listing UNDER_CONTRACT
    const contractRes = await request(app)
      .patch(`/api/v1/properties/${prop1.id}/status`)
      .set('Authorization', `Bearer ${agent1Token}`)
      .send({ status: 'UNDER_CONTRACT' });
    expect(contractRes.status).toBe(200);
    expect(contractRes.body.property.status).toBe('UNDER_CONTRACT');
  });
});
