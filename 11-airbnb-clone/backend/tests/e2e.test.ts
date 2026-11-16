import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { AirbnbStore } from '../src/database/store.js';

describe('Phase 11: Accommodation Marketplace End-to-End Suite', () => {
  let app: any;
  let hostToken: string;
  let guestToken: string;

  beforeEach(async () => {
    const store = AirbnbStore.getInstance();
    store.resetToSeed();
    app = createApp();

    const hostRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'host@cartlystays.com', password: 'Pass123!' });
    hostToken = hostRes.body.token;

    const guestRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'guest@example.com', password: 'Pass123!' });
    guestToken = guestRes.body.token;
  });

  it('runs complete lifecycle: Search -> Price Quote -> Hold -> Payment Confirmation -> Overlap Rejection', async () => {
    // 1. Search listings
    const searchRes = await request(app).get('/api/v1/listings?category=Cabins');
    expect(searchRes.status).toBe(200);
    const listing = searchRes.body.listings[0];

    // 2. Request backend price quote
    const quoteRes = await request(app)
      .post(`/api/v1/listings/${listing.id}/quote`)
      .send({ checkIn: '2027-04-10', checkOut: '2027-04-15' });
    expect(quoteRes.status).toBe(200);
    expect(quoteRes.body.quote.nightsCount).toBe(5);

    // 3. Create booking hold
    const holdRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({
        listingId: listing.id,
        checkIn: '2027-04-10',
        checkOut: '2027-04-15',
        guestCount: 3
      });
    expect(holdRes.status).toBe(201);
    const bookingId = holdRes.body.booking.id;

    // 4. Confirm booking
    const confirmRes = await request(app)
      .post(`/api/v1/bookings/${bookingId}/confirm`)
      .set('Authorization', `Bearer ${guestToken}`);
    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.booking.status).toBe('CONFIRMED');

    // 5. Parallel overlapping reservation attempt rejected
    const overlapRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({
        listingId: listing.id,
        checkIn: '2027-04-12',
        checkOut: '2027-04-18',
        guestCount: 2
      });
    expect(overlapRes.status).toBe(409);
    expect(overlapRes.body.error).toContain('Booking conflict');
  });
});
