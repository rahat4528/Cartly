import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { RestaurantStore } from '../src/database/store.js';
import { TableAllocationService } from '../src/tables/table-allocation.service.js';
import { ReservationStateMachine } from '../src/reservations/state-machine.js';

describe('Restaurant Reservation System Test Suite', () => {
  let app: any;
  let store: RestaurantStore;
  let dinerToken: string;
  let dinerId: string;
  let diner2Token: string;
  let diner2Id: string;
  let hostToken: string;

  beforeEach(async () => {
    store = RestaurantStore.getInstance();
    store.resetToSeed();
    app = createApp();

    // Authenticate Marcus Sterling (diner 1)
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'diner@cartly.local', password: 'Pass123!' });
    dinerToken = loginRes.body.token;
    dinerId = loginRes.body.user.id;

    // Register diner 2
    const reg2Res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'diner2@cartly.local',
        password: 'Pass123!',
        name: 'Sophie Chen'
      });
    diner2Token = reg2Res.body.token;
    diner2Id = reg2Res.body.user.id;

    // Authenticate host
    const hostRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'host@cartly.local', password: 'Pass123!' });
    hostToken = hostRes.body.token;
  });

  // ==================== 1. UNIT: ALLOCATION, COMBINATIONS & STATE MACHINE ====================
  describe('Unit: Table Allocation, Combinations & Buffer Calculation', () => {
    const allocationService = new TableAllocationService();

    it('allocates best-fit single table (2-top for party of 2 rather than 4-top)', () => {
      const alloc = allocationService.allocateTables(
        'rst_001',
        '2026-11-20',
        '19:00',
        2,
        'INDOOR_MAIN'
      );

      expect(alloc).not.toBeNull();
      expect(alloc!.tableIds.length).toBe(1);
      // Best fit should pick a 2-top table (tbl_001, tbl_002, or tbl_003)
      const allocatedTable = store.findTable(alloc!.tableIds[0])!;
      expect(allocatedTable.maxCapacity).toBe(2);
      expect(alloc!.isCombined).toBe(false);
    });

    it('dynamically merges adjacent combinable tables for larger party sizes', () => {
      // Reserve the single 6-top table (tbl_006) to force combination
      store.reservations.push({
        id: 'resv_dummy_6top',
        reservationCode: 'RES-DUMMY',
        restaurantId: 'rst_001',
        tableIds: ['tbl_006'],
        tableNumbers: ['T6'],
        guestId: 'usr_other',
        guestName: 'Other Party',
        guestEmail: 'other@cartly.local',
        guestPhone: '555',
        reservationDate: '2026-11-20',
        timeSlot: '19:00',
        partySize: 6,
        seatingZone: 'INDOOR_MAIN',
        status: 'CONFIRMED',
        durationMinutes: 120,
        turnoverBufferMinutes: 15,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Party of 7 requests a table in INDOOR_MAIN.
      // Table 4 (4-top) and Table 5 (4-top) are combinable together (combined capacity = 8)
      const alloc = allocationService.allocateTables(
        'rst_001',
        '2026-11-20',
        '19:00',
        7,
        'INDOOR_MAIN'
      );

      expect(alloc).not.toBeNull();
      expect(alloc!.isCombined).toBe(true);
      expect(alloc!.tableIds.length).toBe(2);
      expect(alloc!.tableIds).toContain('tbl_004');
      expect(alloc!.tableIds).toContain('tbl_005');
      expect(alloc!.totalCapacity).toBe(8);
    });

    it('enforces 15-minute turnover buffer between consecutive seatings', () => {
      // Party of 4 dining at 19:00: duration = 90 mins, turnover buffer = 15 mins.
      // Total window: 19:00 to 20:45.
      expect(allocationService.isWindowOverlapping('19:00', 90, '20:00', 90)).toBe(true);
      expect(allocationService.isWindowOverlapping('19:00', 90, '20:30', 90)).toBe(true);
      // Exactly at 20:45, turnover is completed: should not overlap
      expect(allocationService.isWindowOverlapping('19:00', 90, '20:45', 90)).toBe(false);
    });

    it('enforces valid dining reservation state machine transitions', () => {
      expect(ReservationStateMachine.canTransition('CONFIRMED', 'SEATED')).toBe(true);
      expect(ReservationStateMachine.canTransition('SEATED', 'COMPLETED')).toBe(true);
      expect(ReservationStateMachine.canTransition('CONFIRMED', 'CANCELLED')).toBe(true);
      expect(ReservationStateMachine.canTransition('CONFIRMED', 'NO_SHOW')).toBe(true);
      expect(ReservationStateMachine.canTransition('WAITLIST', 'PROMOTED')).toBe(true);
      expect(ReservationStateMachine.canTransition('PROMOTED', 'CONFIRMED')).toBe(true);

      // Illegal transitions
      expect(ReservationStateMachine.canTransition('CONFIRMED', 'COMPLETED')).toBe(false);
      expect(ReservationStateMachine.canTransition('CANCELLED', 'SEATED')).toBe(false);
    });
  });

  // ==================== 2. INTEGRATION: BOOKING & AUTOMATED WAITLIST ====================
  describe('Integration: Reservation Creation, Waitlist Queue & Auto-Promotion', () => {
    it('creates confirmed reservation with specific table assignment and confirmation code', async () => {
      const res = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', `Bearer ${dinerToken}`)
        .send({
          restaurantId: 'rst_001',
          reservationDate: '2026-11-20',
          timeSlot: '19:00',
          partySize: 2,
          seatingZone: 'BAR_HIGHTOP',
          guestName: 'Marcus Sterling',
          guestEmail: 'diner@cartly.local'
        });

      expect(res.status).toBe(201);
      expect(res.body.reservation.status).toBe('CONFIRMED');
      expect(res.body.reservation.tableNumbers).toEqual(['B1']);
      expect(res.body.reservation.reservationCode).toContain('RES-');
    });

    it('promotes highest-priority waitlisted party when a confirmed reservation is cancelled', async () => {
      // 1. Diner 1 books Table 8 (BAR_HIGHTOP) at 19:00
      const bookRes = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', `Bearer ${dinerToken}`)
        .send({
          restaurantId: 'rst_001',
          reservationDate: '2026-11-20',
          timeSlot: '19:00',
          partySize: 2,
          seatingZone: 'BAR_HIGHTOP',
          guestName: 'Marcus Sterling',
          guestEmail: 'diner@cartly.local'
        });
      expect(bookRes.status).toBe(201);
      const resv1Id = bookRes.body.reservation.id;

      // 2. Diner 2 attempts to book BAR_HIGHTOP at 19:00 -> fails because only 1 table exists
      const conflictRes = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', `Bearer ${diner2Token}`)
        .send({
          restaurantId: 'rst_001',
          reservationDate: '2026-11-20',
          timeSlot: '19:00',
          partySize: 2,
          seatingZone: 'BAR_HIGHTOP',
          guestName: 'Sophie Chen',
          guestEmail: 'diner2@cartly.local'
        });
      expect(conflictRes.status).toBe(409);

      // 3. Diner 2 joins automated waitlist for 19:00
      const waitlistRes = await request(app)
        .post('/api/v1/waitlist/join')
        .set('Authorization', `Bearer ${diner2Token}`)
        .send({
          restaurantId: 'rst_001',
          reservationDate: '2026-11-20',
          preferredTimeSlot: '19:00',
          partySize: 2,
          seatingZone: 'BAR_HIGHTOP',
          guestName: 'Sophie Chen',
          guestEmail: 'diner2@cartly.local'
        });
      expect(waitlistRes.status).toBe(201);
      const waitlistId = waitlistRes.body.waitlistEntry.id;
      expect(waitlistRes.body.waitlistEntry.status).toBe('WAITLIST');

      // 4. Diner 1 cancels reservation -> Triggers automated waitlist promotion!
      const cancelRes = await request(app)
        .post(`/api/v1/reservations/${resv1Id}/cancel`)
        .set('Authorization', `Bearer ${dinerToken}`)
        .send({ reason: 'Plans changed' });

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.reservation.status).toBe('CANCELLED');
      expect(cancelRes.body.waitlistPromotion.promoted).toBe(true);
      expect(cancelRes.body.waitlistPromotion.waitlistEntry.id).toBe(waitlistId);
      expect(cancelRes.body.waitlistPromotion.waitlistEntry.status).toBe('PROMOTED');

      // 5. Diner 2 claims their promoted reservation within the claim window
      const claimRes = await request(app)
        .post(`/api/v1/waitlist/${waitlistId}/claim`)
        .set('Authorization', `Bearer ${diner2Token}`);

      expect(claimRes.status).toBe(200);
      expect(claimRes.body.reservation.status).toBe('CONFIRMED');
      expect(claimRes.body.reservation.guestName).toBe('Sophie Chen');
    });

    // ==================== CONCURRENCY TEST ====================
    it('CONCURRENCY: 4 concurrent reservation requests for 1 table results in exactly 1 confirmed and 3 rejections', async () => {
      // tbl_007 in PATIO_TERRACE is the only table in that zone
      const makeRequest = (idx: number) => {
        return request(app)
          .post('/api/v1/reservations')
          .set('Authorization', `Bearer ${dinerToken}`)
          .send({
            restaurantId: 'rst_001',
            reservationDate: '2026-11-25',
            timeSlot: '19:30',
            partySize: 3,
            seatingZone: 'PATIO_TERRACE',
            guestName: `Diner Party ${idx}`,
            guestEmail: `party${idx}@cartly.local`
          });
      };

      const results = await Promise.all([
        makeRequest(1),
        makeRequest(2),
        makeRequest(3),
        makeRequest(4)
      ]);

      const confirmedCount = results.filter(r => r.status === 201).length;
      const conflictCount = results.filter(r => r.status === 409).length;

      expect(confirmedCount).toBe(1);
      expect(conflictCount).toBe(3);
    });
  });
});
