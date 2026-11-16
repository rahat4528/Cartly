import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { AirbnbStore } from '../src/database/store.js';

describe('Phase 11: Accommodation Marketplace Unit & Integration Tests', () => {
  let app: any;
  let hostToken: string;
  let guest1Token: string;
  let guest2Token: string;

  beforeEach(async () => {
    const store = AirbnbStore.getInstance();
    store.resetToSeed();
    app = createApp();

    const hostRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'host@cartlystays.com', password: 'Pass123!' });
    hostToken = hostRes.body.token;

    const guest1Res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'guest@example.com', password: 'Pass123!' });
    guest1Token = guest1Res.body.token;

    const guest2Res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'alex@example.com', password: 'Pass123!' });
    guest2Token = guest2Res.body.token;
  });

  it('1. discovers listings by category and guest capacity', async () => {
    const res = await request(app).get('/api/v1/listings?category=Cabins&guests=4');
    expect(res.status).toBe(200);
    expect(res.body.listings.length).toBeGreaterThanOrEqual(1);
    expect(res.body.listings[0].title).toContain('Lake Tahoe');
  });

  it('2. calculates authoritative backend price snapshot (nights, 12% service fee, 10% tax)', async () => {
    // 3 nights at $480/night = 1440 base; 150 cleaning; 12% of 1440 = 173; 10% of (1440+150) = 159
    const res = await request(app)
      .post('/api/v1/listings/list_coastal_haven/quote')
      .send({
        checkIn: '2027-01-10',
        checkOut: '2027-01-13'
      });
    expect(res.status).toBe(200);
    const quote = res.body.quote;
    expect(quote.nightsCount).toBe(3);
    expect(quote.baseSubtotal).toBe(1440);
    expect(quote.cleaningFee).toBe(150);
    expect(quote.serviceFee).toBe(173);
    expect(quote.occupancyTax).toBe(159);
    expect(quote.totalPrice).toBe(1440 + 150 + 173 + 159);
  });

  it('3. rejects overlapping reservation on confirmed dates (409 Conflict)', async () => {
    // Coastal haven has seed booking 2026-12-20 to 2026-12-25
    // Attempting 2026-12-22 to 2026-12-27 overlaps
    const conflictRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${guest1Token}`)
      .send({
        listingId: 'list_coastal_haven',
        checkIn: '2026-12-22',
        checkOut: '2026-12-27',
        guestCount: 2
      });
    expect(conflictRes.status).toBe(409);
    expect(conflictRes.body.error).toContain('Booking conflict');
  });

  it('4. reserves temporary hold and confirms reservation', async () => {
    const holdRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${guest1Token}`)
      .send({
        listingId: 'list_alpine_lodge',
        checkIn: '2027-02-01',
        checkOut: '2027-02-05',
        guestCount: 4
      });
    expect(holdRes.status).toBe(201);
    expect(holdRes.body.booking.status).toBe('PENDING');
    expect(holdRes.body.booking.holdExpiresAt).toBeDefined();
    const bookingId = holdRes.body.booking.id;

    // Confirm booking
    const confirmRes = await request(app)
      .post(`/api/v1/bookings/${bookingId}/confirm`)
      .set('Authorization', `Bearer ${guest1Token}`);
    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.booking.status).toBe('CONFIRMED');
    expect(confirmRes.body.booking.confirmedAt).toBeDefined();
  });

  it('5. handles reservation hold timeout and rejects confirmation of expired hold (410 Gone)', async () => {
    const store = AirbnbStore.getInstance();
    const holdRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${guest1Token}`)
      .send({
        listingId: 'list_alpine_lodge',
        checkIn: '2027-03-01',
        checkOut: '2027-03-05',
        guestCount: 2
      });
    const bookingId = holdRes.body.booking.id;

    // Manually backdate hold expiration in store to simulate 10-minute timeout
    const b = store.bookings.find(x => x.id === bookingId)!;
    b.holdExpiresAt = new Date(Date.now() - 1000).toISOString();

    const lateConfirmRes = await request(app)
      .post(`/api/v1/bookings/${bookingId}/confirm`)
      .set('Authorization', `Bearer ${guest1Token}`);
    expect(lateConfirmRes.status).toBe(410);
    expect(lateConfirmRes.body.error).toContain('Reservation hold has');
  });

  it('6. strictly enforces post-stay completion before permitting guest reviews (403 Forbidden)', async () => {
    // Guest 1 has not completed a stay on coastal haven
    const reviewRes = await request(app)
      .post('/api/v1/listings/list_coastal_haven/reviews')
      .set('Authorization', `Bearer ${guest1Token}`)
      .send({
        rating: 5,
        comment: 'Pre-mature review without a verified stay'
      });
    expect(reviewRes.status).toBe(403);
    expect(reviewRes.body.error).toContain('verified reviews are permitted only following a completed stay');

    // Seed completed booking for guest 1
    const store = AirbnbStore.getInstance();
    store.bookings.push({
      id: 'book_completed_test',
      listingId: 'list_coastal_haven',
      guestId: 'user_guest_1',
      checkIn: '2025-10-01',
      checkOut: '2025-10-05',
      nightsCount: 4,
      guestCount: 2,
      nightlyRate: 480,
      baseSubtotal: 1920,
      cleaningFee: 150,
      serviceFee: 230,
      occupancyTax: 207,
      totalPrice: 2507,
      status: 'COMPLETED',
      createdAt: '2025-09-01T10:00:00.000Z'
    });

    const verifiedReviewRes = await request(app)
      .post('/api/v1/listings/list_coastal_haven/reviews')
      .set('Authorization', `Bearer ${guest1Token}`)
      .send({
        rating: 5,
        comment: 'Incredible ocean cliff sunrise and impeccable host communication!'
      });
    expect(verifiedReviewRes.status).toBe(201);
    expect(verifiedReviewRes.body.review.rating).toBe(5);
  });
});
