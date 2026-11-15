import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { MovieStore } from '../src/database/store.js';
import { SeatMatrixService } from '../src/seats/seat-matrix.service.js';
import { BookingStateMachine } from '../src/bookings/state-machine.js';

describe('Movie Ticket Booking System Test Suite', () => {
  let app: any;
  let store: MovieStore;
  let patronToken: string;
  let patronId: string;
  let patron2Token: string;
  let patron2Id: string;
  let usherToken: string;

  beforeEach(async () => {
    store = MovieStore.getInstance();
    store.resetToSeed();
    app = createApp();

    // Authenticate Darius Vance (patron 1)
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'patron@cartly.local', password: 'Pass123!' });
    patronToken = loginRes.body.token;
    patronId = loginRes.body.user.id;

    // Register patron 2
    const reg2Res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'patron2@cartly.local',
        password: 'Pass123!',
        name: 'Maya Lin'
      });
    patron2Token = reg2Res.body.token;
    patron2Id = reg2Res.body.user.id;

    // Authenticate usher
    const usherRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'usher@cartly.local', password: 'Pass123!' });
    usherToken = usherRes.body.token;
  });

  // ==================== 1. UNIT: SEAT MATRIX & STATE MACHINE ====================
  describe('Unit: 2D Seat Matrix, Tiers & State Machine', () => {
    const seatService = new SeatMatrixService();

    it('generates 2D auditorium matrix with accurate tier pricing', () => {
      const pricing = seatService.calculatePricing(['A1', 'D5', 'G8']);
      // A1 is STANDARD: $14.50
      // D5 is PREMIUM: $18.50
      // G8 is VIP_RECLINER: $24.00
      // Subtotal = 14.50 + 18.50 + 24.00 = 57.00
      // Convenience Fee = 3 * 1.50 = 4.50
      // Total = 61.50
      expect(pricing.seatsCount).toBe(3);
      expect(pricing.subtotal).toBe(57.00);
      expect(pricing.convenienceFee).toBe(4.50);
      expect(pricing.totalAmount).toBe(61.50);
    });

    it('enforces ticket booking state machine transitions', () => {
      expect(BookingStateMachine.canTransition('HELD', 'CONFIRMED')).toBe(true);
      expect(BookingStateMachine.canTransition('CONFIRMED', 'ADMITTED')).toBe(true);
      expect(BookingStateMachine.canTransition('CONFIRMED', 'CANCELLED')).toBe(true);
      expect(BookingStateMachine.canTransition('HELD', 'EXPIRED')).toBe(true);

      // Illegal transitions
      expect(BookingStateMachine.canTransition('HELD', 'ADMITTED')).toBe(false);
      expect(BookingStateMachine.canTransition('ADMITTED', 'CONFIRMED')).toBe(false);
      expect(BookingStateMachine.canTransition('CANCELLED', 'CONFIRMED')).toBe(false);
    });
  });

  // ==================== 2. INTEGRATION: SEAT HOLDS & EXPIRY ====================
  describe('Integration: Seat Holds, Payment & Admission Gate', () => {
    it('creates temporary 8-minute seat hold and reflects held status in seat matrix', async () => {
      // Check initial seat matrix for sht_001
      const initialMatrix = await request(app).get('/api/v1/showtimes/sht_001/seats');
      expect(initialMatrix.status).toBe(200);
      const seatD5Before = initialMatrix.body.matrix['D'].find((s: any) => s.seatNumber === 'D5');
      expect(seatD5Before.status).toBe('AVAILABLE');

      // Place hold on D5 and D6
      const holdRes = await request(app)
        .post('/api/v1/bookings/hold')
        .set('Authorization', `Bearer ${patronToken}`)
        .send({
          showtimeId: 'sht_001',
          seatNumbers: ['D5', 'D6'],
          guestName: 'Darius Vance',
          guestEmail: 'patron@cartly.local'
        });

      expect(holdRes.status).toBe(201);
      expect(holdRes.body.booking.status).toBe('HELD');
      expect(holdRes.body.booking.seatNumbers).toEqual(['D5', 'D6']);
      expect(holdRes.body.booking.ticketCode).toContain('TKT-');

      // Check seat matrix: D5 and D6 must now be HELD
      const matrixAfter = await request(app).get('/api/v1/showtimes/sht_001/seats');
      const seatD5After = matrixAfter.body.matrix['D'].find((s: any) => s.seatNumber === 'D5');
      const seatD6After = matrixAfter.body.matrix['D'].find((s: any) => s.seatNumber === 'D6');
      expect(seatD5After.status).toBe('HELD');
      expect(seatD6After.status).toBe('HELD');
    });

    it('automatically restores seat availability when hold times out / expires', async () => {
      const holdRes = await request(app)
        .post('/api/v1/bookings/hold')
        .set('Authorization', `Bearer ${patronToken}`)
        .send({
          showtimeId: 'sht_001',
          seatNumbers: ['C1'],
          guestName: 'Darius Vance',
          guestEmail: 'patron@cartly.local'
        });
      expect(holdRes.status).toBe(201);
      const bookingId = holdRes.body.booking.id;

      // Manually backdate hold's expiresAt to 10 minutes ago
      const booking = store.findBooking(bookingId)!;
      booking.expiresAt = new Date(Date.now() - 10 * 60 * 1000).toISOString();

      // Check matrix: C1 is automatically restored to AVAILABLE
      const matrix = await request(app).get('/api/v1/showtimes/sht_001/seats');
      const seatC1 = matrix.body.matrix['C'].find((s: any) => s.seatNumber === 'C1');
      expect(seatC1.status).toBe('AVAILABLE');

      // Attempting to confirm this expired hold must fail with 410 Gone
      const confirmRes = await request(app)
        .post(`/api/v1/bookings/${bookingId}/confirm`)
        .set('Authorization', `Bearer ${patronToken}`)
        .send({ cardToken: 'tok_visa_success' });
      expect(confirmRes.status).toBe(410);
      expect(confirmRes.body.error).toContain('expired');
    });

    it('confirms booking upon payment and locks seats permanently as BOOKED', async () => {
      const holdRes = await request(app)
        .post('/api/v1/bookings/hold')
        .set('Authorization', `Bearer ${patronToken}`)
        .send({
          showtimeId: 'sht_001',
          seatNumbers: ['G1', 'G2'], // VIP recliners
          guestName: 'Darius Vance',
          guestEmail: 'patron@cartly.local'
        });
      const bookingId = holdRes.body.booking.id;

      const confirmRes = await request(app)
        .post(`/api/v1/bookings/${bookingId}/confirm`)
        .set('Authorization', `Bearer ${patronToken}`)
        .send({ cardToken: 'tok_visa_success', idempotencyKey: 'idem_movie_conf_1' });

      expect(confirmRes.status).toBe(200);
      expect(confirmRes.body.booking.status).toBe('CONFIRMED');

      // Verify seats are permanently BOOKED
      const matrix = await request(app).get('/api/v1/showtimes/sht_001/seats');
      const seatG1 = matrix.body.matrix['G'].find((s: any) => s.seatNumber === 'G1');
      expect(seatG1.status).toBe('BOOKED');
    });

    // ==================== USHER ADMISSION GATE TEST ====================
    it('admits patron on first scan, and strictly blocks duplicate entrance on subsequent scan', async () => {
      const holdRes = await request(app)
        .post('/api/v1/bookings/hold')
        .set('Authorization', `Bearer ${patronToken}`)
        .send({
          showtimeId: 'sht_001',
          seatNumbers: ['B4'],
          guestName: 'Darius Vance',
          guestEmail: 'patron@cartly.local'
        });
      const bookingId = holdRes.body.booking.id;

      const confirmRes = await request(app)
        .post(`/api/v1/bookings/${bookingId}/confirm`)
        .set('Authorization', `Bearer ${patronToken}`)
        .send({ cardToken: 'tok_visa_success' });
      const ticketCode = confirmRes.body.booking.ticketCode;

      // 1. First scan by usher -> SUCCESS
      const scan1Res = await request(app)
        .post('/api/v1/usher/scan')
        .set('Authorization', `Bearer ${usherToken}`)
        .send({ ticketCode });

      expect(scan1Res.status).toBe(200);
      expect(scan1Res.body.admitted).toBe(true);
      expect(scan1Res.body.seatNumbers).toEqual(['B4']);

      // 2. Duplicate scan attempt of the exact same ticket -> BLOCKED with 409 Conflict!
      const scan2Res = await request(app)
        .post('/api/v1/usher/scan')
        .set('Authorization', `Bearer ${usherToken}`)
        .send({ ticketCode });

      expect(scan2Res.status).toBe(409);
      expect(scan2Res.body.error).toContain('DUPLICATE ENTRY ALERT');
    });

    // ==================== CONCURRENCY TEST ====================
    it('CONCURRENCY: 4 patrons race to hold the same center seat D5; exactly 1 succeeds, 3 denied', async () => {
      const makeRequest = (idx: number) => {
        return request(app)
          .post('/api/v1/bookings/hold')
          .set('Authorization', `Bearer ${patronToken}`)
          .send({
            showtimeId: 'sht_001',
            seatNumbers: ['D5'],
            guestName: `Patron ${idx}`,
            guestEmail: `patron${idx}@cartly.local`
          });
      };

      const results = await Promise.all([
        makeRequest(1),
        makeRequest(2),
        makeRequest(3),
        makeRequest(4)
      ]);

      const successCount = results.filter(r => r.status === 201).length;
      const conflictCount = results.filter(r => r.status === 409).length;

      expect(successCount).toBe(1);
      expect(conflictCount).toBe(3);
    });
  });
});
