import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../backend/src/app';
import { store } from '../backend/src/database/store';

describe('Accommodation Marketplace (Phase 11) - Root Verification Suite', () => {
  beforeEach(() => {
    store.seed();
  });

  it('runs health check and validates accommodation availability engine', async () => {
    const health = await request(app).get('/health');
    expect(health.status).toBe(200);
    expect(health.body.database).toBe('cartly_airbnb_db');

    const listings = await request(app).get('/api/v1/listings');
    expect(listings.status).toBe(200);
    const list = listings.body.listings || listings.body;
    expect(list.length).toBeGreaterThan(0);
  });
});
