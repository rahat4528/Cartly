import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../backend/src/app.js';
import { RestaurantStore } from '../backend/src/database/store.js';

describe('E2E Dining Journey: Search -> Reserve -> Waitlist Queue -> Cancel & Auto-Promote -> Claim & Seating', () => {
  let app: any;
  let store: RestaurantStore;

  beforeEach(() => {
    store = RestaurantStore.getInstance();
    store.resetToSeed();
    app = createApp();
  });

  it('completes the complete dining reservation and automated waitlist promotion lifecycle', async () => {
    // 1. Diner 1 registers
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'diner.marcus@cartly.local',
        password: 'Password123!',
        name: 'Marcus Sterling',
        phone: '+1-555-1234',
        role: 'DINER'
      });
    expect(regRes.status).toBe(201);
    const dinerToken = regRes.body.token;
    expect(dinerToken).toBeDefined();

    // 2. Search restaurants in New York
    const searchRes = await request(app)
      .get('/api/v1/restaurants?cuisine=Italian&city=New+York&partySize=2');
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.restaurants.length).toBeGreaterThan(0);
    const restaurant = searchRes.body.restaurants[0];
    expect(restaurant.id).toBe('rst_001');

    // 3. Inspect restaurant profile and table slots
    const detailRes = await request(app)
      .get(`/api/v1/restaurants/${restaurant.id}?partySize=2&zone=BAR_HIGHTOP`);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.restaurant.availableSlots.length).toBeGreaterThan(0);

    // 4. Diner 1 reserves Table B1 (the only BAR_HIGHTOP table)
    const diningDate = '2026-11-20';
    const diningTime = '19:00';

    const bookRes = await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', `Bearer ${dinerToken}`)
      .send({
        restaurantId: restaurant.id,
        reservationDate: diningDate,
        timeSlot: diningTime,
        partySize: 2,
        seatingZone: 'BAR_HIGHTOP',
        guestName: 'Marcus Sterling',
        guestEmail: 'diner.marcus@cartly.local',
        guestPhone: '+1-555-1234',
        specialRequests: 'Counter seating requested'
      });
    expect(bookRes.status).toBe(201);
    expect(bookRes.body.reservation).toBeDefined();
    expect(bookRes.body.reservation.status).toBe('CONFIRMED');
    expect(bookRes.body.reservation.tableNumbers).toEqual(['B1']);
    expect(bookRes.body.reservation.reservationCode).toContain('RES-');
    const resv1Id = bookRes.body.reservation.id;

    // 5. Diner 2 registers
    const reg2Res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'diner.sophie@cartly.local',
        password: 'Password123!',
        name: 'Sophie Chen',
        phone: '+1-555-5678',
        role: 'DINER'
      });
    expect(reg2Res.status).toBe(201);
    const diner2Token = reg2Res.body.token;

    // Diner 2 tries to reserve the same slot and zone (should fail with 409 because B1 is booked)
    const bookFailRes = await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', `Bearer ${diner2Token}`)
      .send({
        restaurantId: restaurant.id,
        reservationDate: diningDate,
        timeSlot: diningTime,
        partySize: 2,
        seatingZone: 'BAR_HIGHTOP',
        guestName: 'Sophie Chen',
        guestEmail: 'diner.sophie@cartly.local'
      });
    expect(bookFailRes.status).toBe(409);

    // 6. Diner 2 joins automated waitlist for 19:00
    const waitlistRes = await request(app)
      .post('/api/v1/waitlist/join')
      .set('Authorization', `Bearer ${diner2Token}`)
      .send({
        restaurantId: restaurant.id,
        reservationDate: diningDate,
        preferredTimeSlot: diningTime,
        partySize: 2,
        seatingZone: 'BAR_HIGHTOP',
        guestName: 'Sophie Chen',
        guestEmail: 'diner.sophie@cartly.local'
      });
    expect(waitlistRes.status).toBe(201);
    expect(waitlistRes.body.waitlistEntry.status).toBe('WAITLIST');
    const waitlistTicketId = waitlistRes.body.waitlistEntry.id;

    // 7. Host logs in and inspects timeline
    const hostLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'host@cartly.local', password: 'Pass123!' });
    expect(hostLoginRes.status).toBe(200);
    const hostToken = hostLoginRes.body.token;

    const timelineRes = await request(app)
      .get(`/api/v1/host/restaurants/${restaurant.id}/timeline?date=${diningDate}`)
      .set('Authorization', `Bearer ${hostToken}`);
    expect(timelineRes.status).toBe(200);
    expect(timelineRes.body.reservations.length).toBe(1);

    // 8. Diner 1 cancels reservation -> Triggers automated waitlist promotion!
    const cancelRes = await request(app)
      .post(`/api/v1/reservations/${resv1Id}/cancel`)
      .set('Authorization', `Bearer ${dinerToken}`)
      .send({ reason: 'Trip rescheduled' });
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.reservation.status).toBe('CANCELLED');
    expect(cancelRes.body.waitlistPromotion.promoted).toBe(true);
    expect(cancelRes.body.waitlistPromotion.waitlistEntry.id).toBe(waitlistTicketId);
    expect(cancelRes.body.waitlistPromotion.waitlistEntry.status).toBe('PROMOTED');

    // 9. Diner 2 claims their promoted reservation
    const claimRes = await request(app)
      .post(`/api/v1/waitlist/${waitlistTicketId}/claim`)
      .set('Authorization', `Bearer ${diner2Token}`);
    expect(claimRes.status).toBe(200);
    expect(claimRes.body.reservation.status).toBe('CONFIRMED');
    expect(claimRes.body.reservation.guestName).toBe('Sophie Chen');
    const promotedResvId = claimRes.body.reservation.id;

    // 10. Host seats Diner 2 upon arrival
    const seatRes = await request(app)
      .patch(`/api/v1/host/reservations/${promotedResvId}/status`)
      .set('Authorization', `Bearer ${hostToken}`)
      .send({ status: 'SEATED' });
    expect(seatRes.status).toBe(200);
    expect(seatRes.body.reservation.status).toBe('SEATED');

    // 11. Host marks dining completed
    const completeRes = await request(app)
      .patch(`/api/v1/host/reservations/${promotedResvId}/status`)
      .set('Authorization', `Bearer ${hostToken}`)
      .send({ status: 'COMPLETED' });
    expect(completeRes.status).toBe(200);
    expect(completeRes.body.reservation.status).toBe('COMPLETED');
  });
});
