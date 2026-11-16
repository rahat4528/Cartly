import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../backend/src/app.js';
import { FlightStore } from '../backend/src/database/store.js';

describe('Phase 12: Top-Level Flight Booking System E2E Suite', () => {
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

  it('verifies demonstration flight search, e-ticket issuance, and seat mutex', async () => {
    const searchRes = await request(app).get('/api/v1/flights/search?origin=SFO&destination=JFK&date=2026-12-15');
    expect(searchRes.status).toBe(200);

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
            passportNumber: 'PASS-1234',
            dateOfBirth: '1985-05-12',
            seatNumber: '21A'
          }
        ]
      });
    expect(bookRes.status).toBe(201);
    expect(bookRes.body.booking.isDemonstration).toBe(true);

    // Collision
    const collisionRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({
        flightId: 'flt_sfo_jfk_01',
        cabinClass: 'ECONOMY',
        passengers: [
          {
            firstName: 'Alex',
            lastName: 'Jones',
            passportNumber: 'PASS-5544',
            dateOfBirth: '1992-03-15',
            seatNumber: '21A'
          }
        ]
      });
    expect(collisionRes.status).toBe(409);
  });
});
