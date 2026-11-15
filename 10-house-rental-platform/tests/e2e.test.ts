import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../backend/src/app';
import { store } from '../backend/src/database/store';

describe('House Rental Platform - Root E2E Verification', () => {
  beforeEach(() => {
    store.seed();
  });

  it('runs health check and validates core residential leasing capabilities', async () => {
    const health = await request(app).get('/health');
    expect(health.status).toBe(200);
    expect(health.body.database).toBe('cartly_house_rental_db');

    const propList = await request(app).get('/api/v1/properties');
    expect(propList.status).toBe(200);
    expect(propList.body.length).toBeGreaterThan(0);
  });
});
