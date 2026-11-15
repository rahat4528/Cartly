import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../backend/src/app.js';
import { MovieStore } from '../backend/src/database/store.js';

describe('Phase 06: Movie Ticket Booking E2E Integration Suite', () => {
  let app: any;
  let patronToken: string;
  let usherToken: string;

  beforeEach(async () => {
    // Reset singleton store
    const store = MovieStore.getInstance();
    (store as any).bookings = [];
    app = createApp();

    // Authenticate Patron
    const patronRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'patron@example.com', password: 'Pass123!' });
    expect(patronRes.status).toBe(200);
    patronToken = patronRes.body.token;

    // Authenticate Usher
    const usherRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'usher@example.com', password: 'Pass123!' });
    expect(usherRes.status).toBe(200);
    usherToken = usherRes.body.token;
  });

  it('runs complete lifecycle: Seat Selection -> 8-min Hold -> Payment -> Usher Gate Admission -> Duplicate Scan Block', async () => {
    // 1. Browse Movies
    const moviesRes = await request(app).get('/api/v1/movies');
    expect(moviesRes.status).toBe(200);
    expect(moviesRes.body.movies.length).toBeGreaterThan(0);
    const movie = moviesRes.body.movies[0];

    // 2. Fetch Showtimes & Seat Matrix
    const showtime = movie.showtimes[0];
    const seatRes = await request(app).get(`/api/v1/showtimes/${showtime.id}/seats`);
    expect(seatRes.status).toBe(200);
    expect(seatRes.body.totalSeats).toBe(70);

    // 3. Request Seat Hold on C4 and C5
    const holdRes = await request(app)
      .post('/api/v1/bookings/hold')
      .set('Authorization', `Bearer ${patronToken}`)
      .send({
        showtimeId: showtime.id,
        seatNumbers: ['C4', 'C5'],
      });
    expect(holdRes.status).toBe(201);
    const bookingId = holdRes.body.booking.id;
    expect(holdRes.body.booking.status).toBe('HELD');
    expect(holdRes.body.booking.seatNumbers).toEqual(['C4', 'C5']);

    // 4. Concurrency Collision Guard: Another user attempts to hold the same seats
    const conflictRes = await request(app)
      .post('/api/v1/bookings/hold')
      .set('Authorization', `Bearer ${patronToken}`)
      .send({
        showtimeId: showtime.id,
        seatNumbers: ['C5', 'C6'],
      });
    expect(conflictRes.status).toBe(409);
    expect(conflictRes.body.error).toContain('Seat selection collision');

    // 5. Confirm Booking with Payment
    const confirmRes = await request(app)
      .post(`/api/v1/bookings/${bookingId}/confirm`)
      .set('Authorization', `Bearer ${patronToken}`)
      .send({
        cardToken: 'tok_visa_success',
        idempotencyKey: `idem_test_${Date.now()}`,
      });
    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.booking.status).toBe('CONFIRMED');
    const ticketCode = confirmRes.body.booking.ticketCode;
    expect(ticketCode).toBeDefined();

    // 6. Usher Admission Gate: First scan succeeds
    const scanRes = await request(app)
      .post('/api/v1/usher/scan')
      .set('Authorization', `Bearer ${usherToken}`)
      .send({ ticketCode });
    expect(scanRes.status).toBe(200);
    expect(scanRes.body.success).toBe(true);
    expect(scanRes.body.admitted).toBe(true);

    // 7. Security Alarm: Second scan of the exact same ticket code is rejected as duplicate
    const duplicateScanRes = await request(app)
      .post('/api/v1/usher/scan')
      .set('Authorization', `Bearer ${usherToken}`)
      .send({ ticketCode });
    expect(duplicateScanRes.status).toBe(409);
    expect(duplicateScanRes.body.error).toContain('DUPLICATE ENTRY ALERT');
  });
});
