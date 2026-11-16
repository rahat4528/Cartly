import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { FlightStore } from '../src/database/store.js';

describe('Phase 12: Flight Booking System End-to-End Suite', () => {
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

  it('runs complete lifecycle: Search -> Itinerary Select -> Seat Assignment -> Ticket -> Overbooking Protection', async () => {
    // 1. Search flight schedule
    const searchRes = await request(app).get('/api/v1/flights/search?origin=SFO&destination=JFK&date=2026-12-15');
    expect(searchRes.status).toBe(200);
    const itin = searchRes.body.itineraries[0];

    // 2. Reserve seat and create booking hold
    const bookRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({
        flightId: itin.legs[0].id,
        cabinClass: 'ECONOMY',
        passengers: [
          {
            firstName: 'David',
            lastName: 'Sterling',
            passportNumber: 'PASS-9988',
            dateOfBirth: '1985-05-12',
            seatNumber: '19B'
          }
        ]
      });
    expect(bookRes.status).toBe(201);
    const bookingId = bookRes.body.booking.id;

    // 3. Issue Demonstration E-Ticket
    const ticketRes = await request(app)
      .post(`/api/v1/bookings/${bookingId}/pay`)
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(ticketRes.status).toBe(200);
    expect(ticketRes.body.booking.status).toBe('TICKETED');

    // 4. Duplicate seat reservation collision rejected
    const collisionRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({
        flightId: itin.legs[0].id,
        cabinClass: 'ECONOMY',
        passengers: [
          {
            firstName: 'Jane',
            lastName: 'Doe',
            passportNumber: 'PASS-7766',
            dateOfBirth: '1990-01-01',
            seatNumber: '19B' // Conflicting seat
          }
        ]
      });
    expect(collisionRes.status).toBe(409);
    expect(collisionRes.body.error).toContain('Seat collision');
  });
});
