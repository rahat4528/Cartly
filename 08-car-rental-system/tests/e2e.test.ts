import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../backend/src/app.js';
import { CarRentalStore } from '../backend/src/database/store.js';

describe('Phase 08: Car Rental System End-to-End Integration Suite', () => {
  let app: any;
  let renterToken: string;
  let agentToken: string;

  beforeEach(async () => {
    const store = CarRentalStore.getInstance();
    store.resetToSeed();
    app = createApp();

    const renterRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'renter@example.com', password: 'Pass123!' });
    renterToken = renterRes.body.token;

    const agentRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'agent@example.com', password: 'Pass123!' });
    agentToken = agentRes.body.token;
  });

  it('runs complete lifecycle: Discovery -> Date-Overlap Race Contention -> Inspection -> Damage Escrow Settlement', async () => {
    // 1. Discover fleet
    const fleetRes = await request(app).get('/api/v1/vehicles');
    expect(fleetRes.status).toBe(200);
    expect(fleetRes.body.vehicles.length).toBeGreaterThan(0);

    // 2. Concurrency Test: 2 parallel requests attempt to book BMW (veh_002) for overlapping dates
    const [resA, resB] = await Promise.all([
      request(app)
        .post('/api/v1/rentals')
        .set('Authorization', `Bearer ${renterToken}`)
        .send({
          vehicleId: 'veh_002',
          startDate: '2026-12-15',
          endDate: '2026-12-19',
          includeInsurance: true,
          cardToken: 'tok_visa_success'
        }),
      request(app)
        .post('/api/v1/rentals')
        .set('Authorization', `Bearer ${renterToken}`)
        .send({
          vehicleId: 'veh_002',
          startDate: '2026-12-17',
          endDate: '2026-12-21',
          includeInsurance: true,
          cardToken: 'tok_visa_success'
        })
    ]);

    const statuses = [resA.status, resB.status].sort();
    expect(statuses).toEqual([201, 409]);

    const winningRental = resA.status === 201 ? resA.body.rental : resB.body.rental;
    const losingResponse = resA.status === 409 ? resA : resB;
    expect(losingResponse.body.error).toContain('Vehicle unavailable for the requested dates');

    // 3. Agent Pickup Inspection
    const pickupRes = await request(app)
      .post(`/api/v1/rentals/${winningRental.id}/pickup`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ odometer: 12000, fuelLevel: 'FULL' });
    expect(pickupRes.status).toBe(200);
    expect(pickupRes.body.rental.status).toBe('ACTIVE_RENTAL');

    // 4. Agent Return with $75 damage claim
    const returnRes = await request(app)
      .post(`/api/v1/rentals/${winningRental.id}/return`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        returnOdometer: 12350,
        returnFuelLevel: 'FULL',
        damagesNotes: 'Rim scuff on front left wheel',
        damageFee: 75.00
      });
    expect(returnRes.status).toBe(200);
    expect(returnRes.body.rental.status).toBe('RETURNED');
    expect(returnRes.body.rental.damageDeduction).toBe(75.00);

    // 5. Settle Security Deposit: $250 - $75 = $175 refunded
    const settleRes = await request(app)
      .post(`/api/v1/rentals/${winningRental.id}/settle`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send();
    expect(settleRes.status).toBe(200);
    expect(settleRes.body.rental.status).toBe('COMPLETED');
    expect(settleRes.body.rental.depositRefunded).toBe(175.00);
  });
});
