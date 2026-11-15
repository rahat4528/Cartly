import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { HotelStore } from '../src/database/store.js';
import { PricingService } from '../src/pricing/pricing.service.js';
import { ReservationStateMachine } from '../src/reservations/state-machine.js';

describe('Hotel Booking System Test Suite', () => {
  let app: any;
  let store: HotelStore;
  let guestToken: string;
  let guestId: string;
  let guest2Token: string;
  let guest2Id: string;

  beforeEach(async () => {
    store = HotelStore.getInstance();
    store.resetToSeed();
    app = createApp();

    // Authenticate Elena Rostova (guest 1)
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'guest@cartly.local', password: 'Pass123!' });
    guestToken = loginRes.body.token;
    guestId = loginRes.body.user.id;

    // Register guest 2
    const reg2Res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'traveler2@cartly.local',
        password: 'Pass123!',
        name: 'Julian Hayes'
      });
    guest2Token = reg2Res.body.token;
    guest2Id = reg2Res.body.user.id;
  });

  // ==================== 1. UNIT TESTS: PRICING & STATE MACHINE ====================
  describe('Unit: Seasonal Pricing, Weekend Multipliers & State Machine', () => {
    const pricingService = new PricingService();

    it('correctly applies weekend 1.20x multipliers and seasonal rates', () => {
      // rm_001 base price is $280.00
      // 2026-12-25 is Friday (Weekend 1.20x + Winter Festive season 1.50x)
      // 2026-12-26 is Saturday (Weekend 1.20x + Winter Festive season 1.50x)
      // 2026-12-27 is Sunday (Standard Day 1.00x + Winter Festive season 1.50x)
      const quote = pricingService.calculateStayQuote(
        'htl_001',
        'rm_001',
        '2026-12-25',
        '2026-12-28',
        1
      );

      expect(quote.nightsCount).toBe(3);
      expect(quote.nightlyBreakdown[0].isWeekend).toBe(true);
      expect(quote.nightlyBreakdown[0].seasonMultiplier).toBe(1.50);
      // $280 * 1.50 * 1.20 = $504.00
      expect(quote.nightlyBreakdown[0].nightlyTotal).toBe(504.00);

      expect(quote.nightlyBreakdown[2].isWeekend).toBe(false);
      // Sunday: $280 * 1.50 * 1.00 = $420.00
      expect(quote.nightlyBreakdown[2].nightlyTotal).toBe(420.00);

      // Subtotal = 504 + 504 + 420 = 1428.00
      expect(quote.subtotal).toBe(1428.00);
      // 12% tax = 1428 * 0.12 = 171.36
      expect(quote.taxAmount).toBe(171.36);
      expect(quote.feesAmount).toBe(35.00);
      // Total = 1428 + 171.36 + 35 = 1634.36
      expect(quote.totalAmount).toBe(1634.36);
    });

    it('enforces tiered cancellation refund rules based on hours prior to check-in', () => {
      const checkInDate = '2026-08-10';
      const checkInTime = '15:00';
      const total = 1000.00;

      // 1. More than 48 hours prior -> 100% refund
      const refund48Plus = pricingService.calculateCancellationRefund(
        checkInDate,
        checkInTime,
        total,
        new Date('2026-08-07T12:00:00Z') // ~75 hours before
      );
      expect(refund48Plus.refundPercentage).toBe(100);
      expect(refund48Plus.refundAmount).toBe(1000.00);

      // 2. Between 24 and 48 hours prior -> 50% refund
      const refund24To48 = pricingService.calculateCancellationRefund(
        checkInDate,
        checkInTime,
        total,
        new Date('2026-08-09T08:00:00Z') // ~31 hours before
      );
      expect(refund24To48.refundPercentage).toBe(50);
      expect(refund24To48.refundAmount).toBe(500.00);

      // 3. Less than 24 hours prior -> 0% refund
      const refundUnder24 = pricingService.calculateCancellationRefund(
        checkInDate,
        checkInTime,
        total,
        new Date('2026-08-10T09:00:00Z') // 6 hours before
      );
      expect(refundUnder24.refundPercentage).toBe(0);
      expect(refundUnder24.refundAmount).toBe(0.00);
    });

    it('validates reservation state transitions and rejects illegal jumps', () => {
      expect(ReservationStateMachine.canTransition('HELD', 'CONFIRMED')).toBe(true);
      expect(ReservationStateMachine.canTransition('CONFIRMED', 'CHECKED_IN')).toBe(true);
      expect(ReservationStateMachine.canTransition('CHECKED_IN', 'COMPLETED')).toBe(true);
      expect(ReservationStateMachine.canTransition('CONFIRMED', 'CANCELLED')).toBe(true);

      // Illegal jumps
      expect(ReservationStateMachine.canTransition('HELD', 'CHECKED_IN')).toBe(false);
      expect(ReservationStateMachine.canTransition('COMPLETED', 'CANCELLED')).toBe(false);
      expect(ReservationStateMachine.canTransition('CANCELLED', 'CONFIRMED')).toBe(false);
    });
  });

  // ==================== 2. INTEGRATION: SEARCH, HOLDS & CONCURRENCY ====================
  describe('Integration: Search, Holds, Payment & Concurrency', () => {
    it('searches hotels by destination city and date range', async () => {
      const res = await request(app)
        .get('/api/v1/hotels?city=Miami&checkIn=2026-10-10&checkOut=2026-10-14&guests=2');

      expect(res.status).toBe(200);
      expect(res.body.hotels.length).toBeGreaterThan(0);
      const hotel = res.body.hotels[0];
      expect(hotel.name).toContain('Grand Azure');
      expect(hotel.roomTypes.length).toBeGreaterThan(0);
      expect(hotel.startingPricePerNight).toBeGreaterThan(0);
    });

    it('creates temporary 10-minute hold and deducts available room inventory', async () => {
      // Initial availability for rm_001 (4 rooms total)
      const hotelRes = await request(app)
        .get('/api/v1/hotels/htl_001?checkIn=2026-10-10&checkOut=2026-10-13');
      const rm1 = hotelRes.body.hotel.roomTypes.find((r: any) => r.id === 'rm_001');
      expect(rm1.availableRooms).toBe(4);

      // Place a hold for 1 room
      const holdRes = await request(app)
        .post('/api/v1/reservations/hold')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          hotelId: 'htl_001',
          roomTypeId: 'rm_001',
          checkInDate: '2026-10-10',
          checkOutDate: '2026-10-13',
          roomsCount: 1,
          guestName: 'Elena Rostova',
          guestEmail: 'guest@cartly.local'
        });

      expect(holdRes.status).toBe(201);
      expect(holdRes.body.reservation.status).toBe('HELD');
      expect(holdRes.body.reservation.voucherCode).toContain('VCH-');

      // Check availability now reduced to 3 rooms
      const hotelAfterRes = await request(app)
        .get('/api/v1/hotels/htl_001?checkIn=2026-10-10&checkOut=2026-10-13');
      const rm1After = hotelAfterRes.body.hotel.roomTypes.find((r: any) => r.id === 'rm_001');
      expect(rm1After.availableRooms).toBe(3);
    });

    it('automatically restores inventory when hold times out / expires', async () => {
      // Place a hold
      const holdRes = await request(app)
        .post('/api/v1/reservations/hold')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          hotelId: 'htl_001',
          roomTypeId: 'rm_001',
          checkInDate: '2026-10-10',
          checkOutDate: '2026-10-13',
          roomsCount: 1,
          guestName: 'Elena Rostova',
          guestEmail: 'guest@cartly.local'
        });
      expect(holdRes.status).toBe(201);
      const resvId = holdRes.body.reservation.id;

      // Manually backdate the hold's expiresAt to 15 minutes ago
      const reservation = store.findReservation(resvId)!;
      reservation.expiresAt = new Date(Date.now() - 15 * 60 * 1000).toISOString();

      // Verify availability is restored to full 4 rooms
      const checkRes = await request(app)
        .get('/api/v1/hotels/htl_001?checkIn=2026-10-10&checkOut=2026-10-13');
      const rm1 = checkRes.body.hotel.roomTypes.find((r: any) => r.id === 'rm_001');
      expect(rm1.availableRooms).toBe(4);

      // Attempting to confirm this expired hold must fail
      const confirmRes = await request(app)
        .post(`/api/v1/reservations/${resvId}/confirm`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ cardToken: 'tok_visa_success' });
      expect(confirmRes.status).toBe(410);
      expect(confirmRes.body.error).toContain('expired');
    });

    it('confirms booking upon verified payment and issues voucher code', async () => {
      const holdRes = await request(app)
        .post('/api/v1/reservations/hold')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          hotelId: 'htl_001',
          roomTypeId: 'rm_001',
          checkInDate: '2026-10-10',
          checkOutDate: '2026-10-12',
          roomsCount: 1,
          guestName: 'Elena Rostova',
          guestEmail: 'guest@cartly.local'
        });
      const resvId = holdRes.body.reservation.id;

      const confirmRes = await request(app)
        .post(`/api/v1/reservations/${resvId}/confirm`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          cardToken: 'tok_visa_success',
          idempotencyKey: 'idem_test_confirm_1'
        });

      expect(confirmRes.status).toBe(200);
      expect(confirmRes.body.reservation.status).toBe('CONFIRMED');
      expect(confirmRes.body.paymentRef).toBeDefined();
    });

    it('rejects confirmation when card is declined and keeps reservation HELD', async () => {
      const holdRes = await request(app)
        .post('/api/v1/reservations/hold')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          hotelId: 'htl_001',
          roomTypeId: 'rm_001',
          checkInDate: '2026-10-10',
          checkOutDate: '2026-10-12',
          roomsCount: 1,
          guestName: 'Elena Rostova',
          guestEmail: 'guest@cartly.local'
        });
      const resvId = holdRes.body.reservation.id;

      const confirmRes = await request(app)
        .post(`/api/v1/reservations/${resvId}/confirm`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          cardToken: 'tok_card_declined',
          idempotencyKey: 'idem_test_declined'
        });

      expect(confirmRes.status).toBe(400);
      expect(confirmRes.body.error).toContain('declined');

      // Status remains HELD
      const resv = store.findReservation(resvId);
      expect(resv?.status).toBe('HELD');
    });

    // ==================== CONCURRENCY TEST ====================
    it('CONCURRENCY: 5 parallel requests for 2 available rooms results in exactly 2 holds and 3 rejections', async () => {
      // rm_002 has exactly 2 rooms total
      const rm2 = store.findRoomType('rm_002')!;
      expect(rm2.totalRooms).toBe(2);

      const makeRequest = (idx: number) => {
        return request(app)
          .post('/api/v1/reservations/hold')
          .set('Authorization', `Bearer ${guestToken}`)
          .send({
            hotelId: 'htl_001',
            roomTypeId: 'rm_002',
            checkInDate: '2026-11-20',
            checkOutDate: '2026-11-23',
            roomsCount: 1,
            guestName: `Guest ${idx}`,
            guestEmail: `guest${idx}@cartly.local`
          });
      };

      // Fire 5 concurrent requests
      const results = await Promise.all([
        makeRequest(1),
        makeRequest(2),
        makeRequest(3),
        makeRequest(4),
        makeRequest(5)
      ]);

      const successCount = results.filter(r => r.status === 201).length;
      const conflictCount = results.filter(r => r.status === 409).length;

      expect(successCount).toBe(2);
      expect(conflictCount).toBe(3);
    });

    it('cross-user boundary: another guest cannot confirm or cancel someone else reservation', async () => {
      const holdRes = await request(app)
        .post('/api/v1/reservations/hold')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          hotelId: 'htl_001',
          roomTypeId: 'rm_001',
          checkInDate: '2026-10-10',
          checkOutDate: '2026-10-12',
          roomsCount: 1,
          guestName: 'Elena Rostova',
          guestEmail: 'guest@cartly.local'
        });
      const resvId = holdRes.body.reservation.id;

      // Guest 2 tries to confirm Guest 1's hold
      const confirmRes = await request(app)
        .post(`/api/v1/reservations/${resvId}/confirm`)
        .set('Authorization', `Bearer ${guest2Token}`)
        .send({ cardToken: 'tok_visa_success' });
      expect(confirmRes.status).toBe(403);

      // Guest 2 tries to view Guest 1's reservation
      const viewRes = await request(app)
        .get(`/api/v1/reservations/${resvId}`)
        .set('Authorization', `Bearer ${guest2Token}`);
      expect(viewRes.status).toBe(403);
    });
  });
});
