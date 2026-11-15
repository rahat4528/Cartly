import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { CarRentalStore } from '../src/database/store.js';

describe('Phase 08: Car Rental System Backend Unit & Integration Tests', () => {
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

  it('1. queries fleet by category and transmission', async () => {
    const evRes = await request(app).get('/api/v1/vehicles?category=ELECTRIC');
    expect(evRes.status).toBe(200);
    expect(evRes.body.vehicles.length).toBe(1);
    expect(evRes.body.vehicles[0].make).toBe('Tesla');

    const luxRes = await request(app).get('/api/v1/vehicles?category=LUXURY');
    expect(luxRes.status).toBe(200);
    expect(luxRes.body.vehicles.length).toBe(2);
  });

  it('2. calculates tiered duration pricing: 0% daily, 15% weekly, 30% monthly', async () => {
    // 3 days
    const q3 = await request(app).post('/api/v1/rentals/quote').send({
      dailyRate: 100,
      startDate: '2026-12-10',
      endDate: '2026-12-13',
      includeInsurance: false
    });
    expect(q3.status).toBe(200);
    expect(q3.body.quote.totalDays).toBe(3);
    expect(q3.body.quote.discountPct).toBe(0.0);
    expect(q3.body.quote.baseRentalSubtotal).toBe(300);
    expect(q3.body.quote.securityDeposit).toBe(250);

    // 7 days (weekly discount)
    const q7 = await request(app).post('/api/v1/rentals/quote').send({
      dailyRate: 100,
      startDate: '2026-12-10',
      endDate: '2026-12-17',
      includeInsurance: false
    });
    expect(q7.status).toBe(200);
    expect(q7.body.quote.totalDays).toBe(7);
    expect(q7.body.quote.discountPct).toBe(0.15);
    expect(q7.body.quote.effectiveDailyRate).toBe(85);

    // 30 days (monthly discount)
    const q30 = await request(app).post('/api/v1/rentals/quote').send({
      dailyRate: 100,
      startDate: '2026-12-10',
      endDate: '2027-01-09',
      includeInsurance: false
    });
    expect(q30.status).toBe(200);
    expect(q30.body.quote.totalDays).toBe(30);
    expect(q30.body.quote.discountPct).toBe(0.30);
    expect(q30.body.quote.effectiveDailyRate).toBe(70);
  });

  it('3. requires verified driver license on file before booking', async () => {
    // Register unverified renter
    const regRes = await request(app).post('/api/v1/auth/register').send({
      email: 'newbie@example.com',
      password: 'Pass123!',
      name: 'Unverified Driver'
    });
    const newbieToken = regRes.body.token;

    const bookRes = await request(app)
      .post('/api/v1/rentals')
      .set('Authorization', `Bearer ${newbieToken}`)
      .send({
        vehicleId: 'veh_002',
        startDate: '2026-12-20',
        endDate: '2026-12-24',
        cardToken: 'tok_visa_success'
      });

    expect(bookRes.status).toBe(400);
    expect(bookRes.body.error).toContain('Driver license verification required');

    // Submit license verification
    const licRes = await request(app)
      .post('/api/v1/license/verify')
      .set('Authorization', `Bearer ${newbieToken}`)
      .send({
        licenseNumber: 'DL-55443322-NY',
        issuingState: 'New York'
      });
    expect(licRes.status).toBe(200);

    // Now booking succeeds
    const bookAgainRes = await request(app)
      .post('/api/v1/rentals')
      .set('Authorization', `Bearer ${newbieToken}`)
      .send({
        vehicleId: 'veh_002',
        startDate: '2026-12-20',
        endDate: '2026-12-24',
        cardToken: 'tok_visa_success'
      });
    expect(bookAgainRes.status).toBe(201);
    expect(bookAgainRes.body.rental.status).toBe('RESERVED');
  });

  it('4. strictly blocks overlapping rental dates on the same vehicle (409 Conflict)', async () => {
    // Vehicle 1 has a pre-seeded rental from 2026-12-01 to 2026-12-05
    const overlapRes = await request(app)
      .post('/api/v1/rentals')
      .set('Authorization', `Bearer ${renterToken}`)
      .send({
        vehicleId: 'veh_001',
        startDate: '2026-12-03',
        endDate: '2026-12-07',
        cardToken: 'tok_visa_success'
      });

    expect(overlapRes.status).toBe(409);
    expect(overlapRes.body.error).toContain('Vehicle unavailable for the requested dates');
  });

  it('5. handles card authorization decline cleanly', async () => {
    const declineRes = await request(app)
      .post('/api/v1/rentals')
      .set('Authorization', `Bearer ${renterToken}`)
      .send({
        vehicleId: 'veh_003',
        startDate: '2026-12-15',
        endDate: '2026-12-18',
        cardToken: 'tok_declined'
      });

    expect(declineRes.status).toBe(402);
    expect(declineRes.body.error).toContain('Payment declined');
  });

  it('6. advances rental lifecycle with inspection, damage deduction, and deposit settlement', async () => {
    // Book Toyota RAV4
    const bookRes = await request(app)
      .post('/api/v1/rentals')
      .set('Authorization', `Bearer ${renterToken}`)
      .send({
        vehicleId: 'veh_003',
        startDate: '2026-12-10',
        endDate: '2026-12-14',
        includeInsurance: true,
        cardToken: 'tok_visa_success'
      });
    const rentalId = bookRes.body.rental.id;
    expect(bookRes.body.rental.status).toBe('RESERVED');

    // Agent Pickup
    const pickupRes = await request(app)
      .post(`/api/v1/rentals/${rentalId}/pickup`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ odometer: 18400, fuelLevel: 'FULL' });
    expect(pickupRes.status).toBe(200);
    expect(pickupRes.body.rental.status).toBe('ACTIVE_RENTAL');

    // Agent Return with $50 scratch damage fee
    const returnRes = await request(app)
      .post(`/api/v1/rentals/${rentalId}/return`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        returnOdometer: 18750,
        returnFuelLevel: 'FULL',
        damagesNotes: 'Minor scratch on rear bumper',
        damageFee: 50.00
      });
    expect(returnRes.status).toBe(200);
    expect(returnRes.body.rental.status).toBe('RETURNED');
    expect(returnRes.body.rental.damageDeduction).toBe(50.00);

    // Agent Settle Security Deposit: $250 deposit - $50 damage = $200 refunded
    const settleRes = await request(app)
      .post(`/api/v1/rentals/${rentalId}/settle`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send();
    expect(settleRes.status).toBe(200);
    expect(settleRes.body.rental.status).toBe('COMPLETED');
    expect(settleRes.body.rental.depositRefunded).toBe(200.00);
  });

  it('7. allows cancellation prior to pickup with full refund', async () => {
    const bookRes = await request(app)
      .post('/api/v1/rentals')
      .set('Authorization', `Bearer ${renterToken}`)
      .send({
        vehicleId: 'veh_005',
        startDate: '2026-12-25',
        endDate: '2026-12-28',
        cardToken: 'tok_visa_success'
      });
    const rentalId = bookRes.body.rental.id;

    const cancelRes = await request(app)
      .post(`/api/v1/rentals/${rentalId}/cancel`)
      .set('Authorization', `Bearer ${renterToken}`)
      .send();
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.rental.status).toBe('CANCELLED');
  });
});
