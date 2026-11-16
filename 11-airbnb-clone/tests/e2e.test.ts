import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../backend/src/app.js';
import { AirbnbStore } from '../backend/src/database/store.js';

describe('Phase 11: Top-Level Airbnb Clone E2E Suite', () => {
  let app: any;
  let guestToken: string;

  beforeEach(async () => {
    const store = AirbnbStore.getInstance();
    store.resetToSeed();
    app = createApp();

    const guestRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'guest@example.com', password: 'Pass123!' });
    guestToken = guestRes.body.token;
  });

  it('verifies vacation rental search, booking confirmation, and date collision rejection', async () => {
    const listRes = await request(app).get('/api/v1/listings');
    expect(listRes.status).toBe(200);
    const target = listRes.body.listings[0];

    const holdRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({
        listingId: target.id,
        checkIn: '2027-05-01',
        checkOut: '2027-05-05',
        guestCount: 2
      });
    expect(holdRes.status).toBe(201);

    const confirmRes = await request(app)
      .post(`/api/v1/bookings/${holdRes.body.booking.id}/confirm`)
      .set('Authorization', `Bearer ${guestToken}`);
    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.booking.status).toBe('CONFIRMED');

    // Overlapping booking rejected
    const conflictRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({
        listingId: target.id,
        checkIn: '2027-05-03',
        checkOut: '2027-05-07',
        guestCount: 2
      });
    expect(conflictRes.status).toBe(409);
  });
});
