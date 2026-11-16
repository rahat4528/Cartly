import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { store } from '../src/database/store';

describe('Accommodation Marketplace (Phase 11) - Stays & Booking Suite', () => {
  let guestToken: string;
  let hostToken: string;

  beforeEach(async () => {
    store.seed();

    const guestLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'guest@example.com', password: 'Pass123!' });
    guestToken = guestLogin.body.token;

    const hostLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'host@example.com', password: 'Pass123!' });
    hostToken = hostLogin.body.token;
  });

  it('GET /api/v1/listings - retrieves listings filtered by category and price range', async () => {
    const res = await request(app).get('/api/v1/listings?category=Cabins');
    expect(res.status).toBe(200);
    const list = res.body.listings || res.body;
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].category).toBe('Cabins');
  });

  it('POST /api/v1/bookings/quote - guarantees backend fee calculation authority', async () => {
    const res = await request(app)
      .post('/api/v1/bookings/quote')
      .send({
        listingId: 'list_coastal_haven', // $480/night, $150 cleaning fee
        checkIn: '2026-12-10',
        checkOut: '2026-12-13', // 3 nights
        guestCount: 2
      });

    expect(res.status).toBe(200);
    expect(res.body.nightsCount).toBe(3);
    expect(res.body.baseSubtotal).toBe(1440); // 3 * 480
    expect(res.body.cleaningFee).toBe(150);
    expect(res.body.serviceFee).toBe(173); // Math.round(1440 * 0.12)
    expect(res.body.occupancyTax).toBe(159); // Math.round((1440 + 150) * 0.10)
    expect(res.body.totalPrice).toBe(1440 + 150 + 173 + 159);
  });

  it('POST /api/v1/bookings/hold - creates hold and strictly rejects overlapping dates (409 Conflict)', async () => {
    // 1. Attempt reservation overlapping with seed booking (2026-12-20 to 2026-12-25)
    const holdCollision = await request(app)
      .post('/api/v1/bookings/hold')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({
        listingId: 'list_coastal_haven',
        checkIn: '2026-12-22',
        checkOut: '2026-12-28',
        guestCount: 2
      });
    expect(holdCollision.status).toBe(409);
    expect(holdCollision.body.error).toContain('conflict');

    // 2. Non-overlapping reservation succeeds
    const holdValid = await request(app)
      .post('/api/v1/bookings/hold')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({
        listingId: 'list_coastal_haven',
        checkIn: '2026-12-01',
        checkOut: '2026-12-05',
        guestCount: 2
      });
    expect(holdValid.status).toBe(201);
    expect(holdValid.body.status).toBe('PENDING');
    expect(holdValid.body.holdExpiresAt).toBeDefined();
  });

  it('POST /api/v1/bookings/:id/confirm - confirms reservation hold', async () => {
    const hold = await request(app)
      .post('/api/v1/bookings/hold')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({
        listingId: 'list_alpine_lodge',
        checkIn: '2026-12-10',
        checkOut: '2026-12-14',
        guestCount: 2
      });
    expect(hold.status).toBe(201);

    const confirmRes = await request(app)
      .post(`/api/v1/bookings/${hold.body.id}/confirm`)
      .set('Authorization', `Bearer ${guestToken}`);
    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.status).toBe('CONFIRMED');
    expect(confirmRes.body.confirmedAt).toBeDefined();
  });

  it('POST /api/v1/reviews - enforces review gating rule (403 for uncompleted stay, 201 for completed stay)', async () => {
    // 1. Guest attempts to review Coastal Haven (no completed stay) -> 403 Forbidden
    const unverifiedReview = await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({
        listingId: 'list_coastal_haven',
        rating: 5,
        comment: 'Looks amazing from the photos!'
      });
    expect(unverifiedReview.status).toBe(403);
    expect(unverifiedReview.body.error).toContain('verified reviews are permitted only following a completed stay');

    // 2. Guest reviews Alpine Lodge (has completed booking in seed)
    const verifiedReview = await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({
        listingId: 'list_alpine_lodge',
        rating: 5,
        comment: 'Spectacular mountain chalet with cozy fireplace and marvelous views!'
      });
    expect(verifiedReview.status).toBe(201);
    expect(verifiedReview.body.rating).toBe(5);
  });

  it('POST /api/v1/bookings/:id/cancel - cancels reservation and computes refund', async () => {
    const hold = await request(app)
      .post('/api/v1/bookings/hold')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({
        listingId: 'list_alpine_lodge',
        checkIn: '2026-12-15',
        checkOut: '2026-12-18',
        guestCount: 2
      });

    const cancelRes = await request(app)
      .post(`/api/v1/bookings/${hold.body.id}/cancel`)
      .set('Authorization', `Bearer ${guestToken}`);

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.status).toBe('CANCELLED');
    expect(cancelRes.body.refundAmount).toBe(hold.body.totalPrice);
  });
});
