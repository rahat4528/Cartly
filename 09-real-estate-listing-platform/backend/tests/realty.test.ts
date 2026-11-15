import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { RealEstateStore } from '../src/database/store.js';

describe('Phase 09: Real Estate Listing Platform Backend Unit & Integration Tests', () => {
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

  it('1. performs spatial bounding box search isolating San Francisco properties', async () => {
    // SF Bounding Box
    const res = await request(app).get(
      '/api/v1/properties?minLat=37.70&maxLat=37.85&minLng=-122.50&maxLng=-122.35'
    );
    expect(res.status).toBe(200);
    expect(res.body.properties.length).toBeGreaterThanOrEqual(2);
    // Must contain SF properties, must NOT contain Palo Alto
    expect(res.body.properties.every((p: any) => p.city === 'San Francisco')).toBe(true);
    expect(res.body.properties.some((p: any) => p.city === 'Palo Alto')).toBe(false);
  });

  it('2. performs spatial radius proximity search (Haversine 15km of SF center)', async () => {
    // SF Center: 37.7749, -122.4194 with radius 15km
    const res = await request(app).get(
      '/api/v1/properties?lat=37.7749&lng=-122.4194&radiusKm=15'
    );
    expect(res.status).toBe(200);
    expect(res.body.properties.length).toBeGreaterThan(0);
    expect(res.body.properties.every((p: any) => p.distanceKm <= 15)).toBe(true);
  });

  it('3. appends immutable price history record on price update', async () => {
    // Property 1 owned by agent 1, initially 4,850,000
    const updateRes = await request(app)
      .put('/api/v1/properties/prop_001')
      .set('Authorization', `Bearer ${agent1Token}`)
      .send({
        price: 4650000,
        priceChangeReason: 'Winter Motivated Seller Reduction'
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.property.price).toBe(4650000);

    // Verify price history ledger has newly prepended record
    const history = updateRes.body.property.priceHistory;
    expect(history.length).toBe(2);
    expect(history[0].previousPrice).toBe(4850000);
    expect(history[0].newPrice).toBe(4650000);
    expect(history[0].priceChangeAmount).toBe(-200000);
    expect(history[0].priceChangePercent).toBeCloseTo(-4.12, 1);
    expect(history[0].reason).toBe('Winter Motivated Seller Reduction');
  });

  it('4. strictly blocks cross-agent listing edits (403 Forbidden)', async () => {
    // Property 1 is owned by Agent 1. Agent 2 tries to update it.
    const crossAgentRes = await request(app)
      .put('/api/v1/properties/prop_001')
      .set('Authorization', `Bearer ${agent2Token}`)
      .send({ price: 4000000 });

    expect(crossAgentRes.status).toBe(403);
    expect(crossAgentRes.body.error).toContain('You do not have ownership of this property listing');
  });

  it('5. enforces listing state machine transitions: PUBLISHED -> UNDER_CONTRACT -> SOLD', async () => {
    // Agent 1 marks under contract
    const contractRes = await request(app)
      .patch('/api/v1/properties/prop_001/status')
      .set('Authorization', `Bearer ${agent1Token}`)
      .send({ status: 'UNDER_CONTRACT' });
    expect(contractRes.status).toBe(200);
    expect(contractRes.body.property.status).toBe('UNDER_CONTRACT');

    // Agent 1 marks sold
    const soldRes = await request(app)
      .patch('/api/v1/properties/prop_001/status')
      .set('Authorization', `Bearer ${agent1Token}`)
      .send({ status: 'SOLD' });
    expect(soldRes.status).toBe(200);
    expect(soldRes.body.property.status).toBe('SOLD');
  });

  it('6. schedules viewing tours and rejects double-booking collision (409 Conflict)', async () => {
    const tourRes1 = await request(app)
      .post('/api/v1/properties/prop_001/tours')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        tourDate: '2026-12-18',
        tourTime: '15:00',
        tourType: 'IN_PERSON',
        notes: 'Pre-approved buyer viewing'
      });
    expect(tourRes1.status).toBe(201);
    expect(tourRes1.body.tour.status).toBe('SCHEDULED');

    // Attempt second tour at same exact time
    const tourRes2 = await request(app)
      .post('/api/v1/properties/prop_001/tours')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        tourDate: '2026-12-18',
        tourTime: '15:00',
        tourType: 'VIRTUAL_WALKTHROUGH'
      });
    expect(tourRes2.status).toBe(409);
    expect(tourRes2.body.error).toContain('Viewing appointment conflict');
  });
});
