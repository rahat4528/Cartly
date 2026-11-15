import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../backend/src/app.js';
import { HotelStore } from '../backend/src/database/store.js';

describe('E2E Hospitality Journey: Search -> Quote -> Hold -> Confirm -> Hotelier Check-In -> Cancel & Refund', () => {
  let app: any;
  let store: HotelStore;

  beforeEach(() => {
    store = HotelStore.getInstance();
    store.resetToSeed();
    app = createApp();
  });

  it('completes the complete hospitality guest reservation lifecycle', async () => {
    // 1. Guest registers
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'traveler.claire@cartly.local',
        password: 'Password123!',
        name: 'Claire Dupont',
        phone: '+1-555-0987',
        role: 'GUEST'
      });
    expect(regRes.status).toBe(201);
    const guestToken = regRes.body.token;
    const guestId = regRes.body.user.id;
    expect(guestToken).toBeDefined();

    // 2. Guest searches for hotels in Miami
    const checkInDate = '2026-11-12';
    const checkOutDate = '2026-11-15'; // 3 nights

    const searchRes = await request(app)
      .get(`/api/v1/hotels?city=Miami&checkIn=${checkInDate}&checkOut=${checkOutDate}&guests=2&rooms=1`);
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.hotels.length).toBeGreaterThan(0);
    const hotel = searchRes.body.hotels[0];
    expect(hotel.id).toBe('htl_001');

    // 3. Guest views hotel details and inspects room inventory
    const detailRes = await request(app)
      .get(`/api/v1/hotels/${hotel.id}?checkIn=${checkInDate}&checkOut=${checkOutDate}`);
    expect(detailRes.status).toBe(200);
    const roomType = detailRes.body.hotel.roomTypes.find((r: any) => r.id === 'rm_001');
    expect(roomType).toBeDefined();
    expect(roomType.availableRooms).toBe(4); // 4 total rooms initially

    // 4. Guest requests authoritative server price quote
    const quoteRes = await request(app)
      .post('/api/v1/hotels/quote')
      .send({
        hotelId: hotel.id,
        roomTypeId: roomType.id,
        checkInDate,
        checkOutDate,
        roomsCount: 1
      });
    expect(quoteRes.status).toBe(200);
    expect(quoteRes.body.quote.nightsCount).toBe(3);
    expect(quoteRes.body.quote.taxRate).toBe(0.12);
    expect(quoteRes.body.quote.feesAmount).toBe(35.00);
    expect(quoteRes.body.quote.totalAmount).toBeGreaterThan(0);

    // 5. Guest places a temporary 10-minute hold on the room
    const holdRes = await request(app)
      .post('/api/v1/reservations/hold')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({
        hotelId: hotel.id,
        roomTypeId: roomType.id,
        checkInDate,
        checkOutDate,
        roomsCount: 1,
        guestName: 'Claire Dupont',
        guestEmail: 'traveler.claire@cartly.local',
        guestPhone: '+1-555-0987'
      });
    expect(holdRes.status).toBe(201);
    expect(holdRes.body.reservation).toBeDefined();
    expect(holdRes.body.reservation.status).toBe('HELD');
    expect(holdRes.body.reservation.voucherCode).toContain('VCH-');
    const reservationId = holdRes.body.reservation.id;

    // Verify room availability was decremented from 4 to 3
    const checkAfterHold = await request(app)
      .get(`/api/v1/hotels/${hotel.id}?checkIn=${checkInDate}&checkOut=${checkOutDate}`);
    const roomAfterHold = checkAfterHold.body.hotel.roomTypes.find((r: any) => r.id === 'rm_001');
    expect(roomAfterHold.availableRooms).toBe(3);

    // 6. Guest completes sandbox card payment to confirm booking
    const confirmRes = await request(app)
      .post(`/api/v1/reservations/${reservationId}/confirm`)
      .set('Authorization', `Bearer ${guestToken}`)
      .send({
        cardToken: 'tok_visa_success',
        idempotencyKey: `idem_claire_${reservationId}`
      });
    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.reservation.status).toBe('CONFIRMED');
    expect(confirmRes.body.reservation.paidAt).toBeDefined();

    // 7. Guest checks their personal reservation portal
    const myResvRes = await request(app)
      .get('/api/v1/reservations/my-reservations')
      .set('Authorization', `Bearer ${guestToken}`);
    expect(myResvRes.status).toBe(200);
    expect(myResvRes.body.reservations.length).toBe(1);
    expect(myResvRes.body.reservations[0].voucherCode).toBe(holdRes.body.reservation.voucherCode);

    // 8. Hotelier logs in to property management
    const hotelierLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'hotelier@cartly.local',
        password: 'Pass123!'
      });
    expect(hotelierLoginRes.status).toBe(200);
    const hotelierToken = hotelierLoginRes.body.token;

    // 9. Hotelier views occupancy calendar
    const calRes = await request(app)
      .get(`/api/v1/hotelier/hotels/${hotel.id}/calendar`)
      .set('Authorization', `Bearer ${hotelierToken}`);
    expect(calRes.status).toBe(200);
    const activeResv = calRes.body.activeReservations.find((r: any) => r.id === reservationId);
    expect(activeResv).toBeDefined();
    expect(activeResv.guestName).toBe('Claire Dupont');

    // 10. Hotelier processes guest check-in
    const checkInRes = await request(app)
      .patch(`/api/v1/hotelier/reservations/${reservationId}/status`)
      .set('Authorization', `Bearer ${hotelierToken}`)
      .send({ status: 'CHECKED_IN' });
    expect(checkInRes.status).toBe(200);
    expect(checkInRes.body.reservation.status).toBe('CHECKED_IN');

    // 11. Guest creates and cancels a second upcoming stay > 48h prior (Full 100% refund)
    const futureCheckIn = '2026-12-20';
    const futureCheckOut = '2026-12-23';

    const hold2Res = await request(app)
      .post('/api/v1/reservations/hold')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({
        hotelId: hotel.id,
        roomTypeId: roomType.id,
        checkInDate: futureCheckIn,
        checkOutDate: futureCheckOut,
        roomsCount: 1,
        guestName: 'Claire Dupont',
        guestEmail: 'traveler.claire@cartly.local'
      });
    const resv2Id = hold2Res.body.reservation.id;

    await request(app)
      .post(`/api/v1/reservations/${resv2Id}/confirm`)
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ cardToken: 'tok_visa_success', idempotencyKey: `idem_2_${resv2Id}` });

    // Cancel reservation 2
    const cancelRes = await request(app)
      .post(`/api/v1/reservations/${resv2Id}/cancel`)
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ reason: 'Flight change' });
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.reservation.status).toBe('CANCELLED');
    expect(cancelRes.body.refund.refundPercentage).toBe(100);
    expect(cancelRes.body.refund.refundAmount).toBe(cancelRes.body.reservation.totalAmount);

    // Verify room inventory for future dates was restored to 4
    const checkAfterCancel = await request(app)
      .get(`/api/v1/hotels/${hotel.id}?checkIn=${futureCheckIn}&checkOut=${futureCheckOut}`);
    const roomAfterCancel = checkAfterCancel.body.hotel.roomTypes.find((r: any) => r.id === 'rm_001');
    expect(roomAfterCancel.availableRooms).toBe(4);
  });
});
