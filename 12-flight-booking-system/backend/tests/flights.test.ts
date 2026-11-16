import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { FlightStore } from '../src/database/store.js';

describe('Phase 12: Flight Booking System Unit & Integration Tests (Demonstration Inventory)', () => {
  let app: any;
  let passengerToken: string;

  beforeEach(async () => {
    const store = FlightStore.getInstance();
    store.resetToSeed();
    app = createApp();

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'passenger@example.com', password: 'Pass123!' });
    passengerToken = loginRes.body.token;
  });

  it('1. searches direct flights between SFO and JFK', async () => {
    const res = await request(app).get('/api/v1/flights/search?origin=SFO&destination=JFK&date=2026-12-15');
    expect(res.status).toBe(200);
    expect(res.body.isDemonstration).toBe(true);
    expect(res.body.itineraries.length).toBeGreaterThanOrEqual(1);

    const directItin = res.body.itineraries.find((it: any) => it.type === 'DIRECT');
    expect(directItin).toBeDefined();
    expect(directItin.originCode).toBe('SFO');
    expect(directItin.destinationCode).toBe('JFK');
  });

  it('2. discovers validated connecting flight itineraries enforcing 45-min connection buffer', async () => {
    // SFO -> ORD arrives at 13:15; ORD -> JFK departs at 15:00 (105-min layover >= 45 min)
    const res = await request(app).get('/api/v1/flights/search?origin=SFO&destination=JFK&date=2026-12-15');
    expect(res.status).toBe(200);
    const connectingItin = res.body.itineraries.find((it: any) => it.type === 'CONNECTING');
    expect(connectingItin).toBeDefined();
    expect(connectingItin.legs.length).toBe(2);
    expect(connectingItin.layoverAirport).toBe('ORD');
    expect(connectingItin.connectionMinutes).toBe(105);
    expect(connectingItin.connectionMinutes).toBeGreaterThanOrEqual(45);
  });

  it('3. blocks overbooking when requested seats exceed cabin capacity (409 Conflict)', async () => {
    const store = FlightStore.getInstance();
    const flt = store.flights.find(f => f.id === 'flt_sfo_jfk_01')!;

    // Set business capacity full
    flt.businessCapacity = 2;
    flt.businessBooked = 2;

    const overbookRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({
        flightId: 'flt_sfo_jfk_01',
        cabinClass: 'BUSINESS',
        passengers: [
          {
            firstName: 'David',
            lastName: 'Sterling',
            passportNumber: 'A12345678',
            dateOfBirth: '1985-05-12'
          }
        ]
      });
    expect(overbookRes.status).toBe(409);
    expect(overbookRes.body.error).toContain('Flight segment capacity exhausted');
  });

  it('4. enforces seat assignment uniqueness and rejects duplicate seat collision (409 Conflict)', async () => {
    // 12A is already pre-booked on flt_sfo_jfk_01 in seed
    const seatConflictRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({
        flightId: 'flt_sfo_jfk_01',
        cabinClass: 'ECONOMY',
        passengers: [
          {
            firstName: 'David',
            lastName: 'Sterling',
            passportNumber: 'A12345678',
            dateOfBirth: '1985-05-12',
            seatNumber: '12A' // Collides with existing seed seat
          }
        ]
      });
    expect(seatConflictRes.status).toBe(409);
    expect(seatConflictRes.body.error).toContain('Seat collision');
  });

  it('5. books reservation, captures immutable fare snapshot, and tickets demonstration e-ticket', async () => {
    const bookRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({
        flightId: 'flt_sfo_jfk_01',
        cabinClass: 'ECONOMY',
        passengers: [
          {
            firstName: 'David',
            lastName: 'Sterling',
            passportNumber: 'A12345678',
            dateOfBirth: '1985-05-12',
            seatNumber: '14C'
          }
        ]
      });
    expect(bookRes.status).toBe(201);
    expect(bookRes.body.booking.status).toBe('HELD');
    expect(bookRes.body.booking.pnrLocator).toMatch(/^DEMO-[A-Z0-9]{6}$/);
    expect(bookRes.body.booking.baseFare).toBe(289);
    expect(bookRes.body.booking.isDemonstration).toBe(true);

    const bookingId = bookRes.body.booking.id;

    // Ticket & Pay
    const ticketRes = await request(app)
      .post(`/api/v1/bookings/${bookingId}/pay`)
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(ticketRes.status).toBe(200);
    expect(ticketRes.body.booking.status).toBe('TICKETED');
  });

  it('6. cancels booking and releases seat back to inventory', async () => {
    const store = FlightStore.getInstance();
    const flt = store.flights.find(f => f.id === 'flt_sfo_jfk_01')!;
    const initialBooked = flt.economyBooked;

    const bookRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({
        flightId: 'flt_sfo_jfk_01',
        cabinClass: 'ECONOMY',
        passengers: [
          {
            firstName: 'David',
            lastName: 'Sterling',
            passportNumber: 'A12345678',
            dateOfBirth: '1985-05-12',
            seatNumber: '15D'
          }
        ]
      });
    expect(flt.economyBooked).toBe(initialBooked + 1);
    expect(store.isSeatAvailable('flt_sfo_jfk_01', '15D')).toBe(false);

    // Cancel booking
    const cancelRes = await request(app)
      .post(`/api/v1/bookings/${bookRes.body.booking.id}/cancel`)
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.booking.status).toBe('CANCELLED');

    // Seat released and inventory restored
    expect(flt.economyBooked).toBe(initialBooked);
    expect(store.isSeatAvailable('flt_sfo_jfk_01', '15D')).toBe(true);
  });
});
