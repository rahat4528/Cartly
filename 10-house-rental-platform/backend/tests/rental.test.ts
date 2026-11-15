import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { store } from '../src/database/store';

describe('House Rental Platform - Residential Leasing Suite', () => {
  let tenantToken: string;
  let landlordToken: string;

  beforeEach(async () => {
    store.seed();

    const tenantLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'tenant@example.com', password: 'Pass123!' });
    tenantToken = tenantLogin.body.token;

    const landlordLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'landlord@example.com', password: 'Pass123!' });
    landlordToken = landlordLogin.body.token;
  });

  it('GET /api/v1/properties - retrieves properties and filters by criteria', async () => {
    const res = await request(app)
      .get('/api/v1/properties?propertyType=TOWNHOUSE');

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].propertyType).toBe('TOWNHOUSE');
  });

  it('POST /api/v1/viewings - schedules viewing and strictly rejects conflicting slots (409 Conflict)', async () => {
    const slotTime = '2026-12-05T15:00:00.000Z';

    // First booking succeeds
    const firstRes = await request(app)
      .post('/api/v1/viewings')
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({
        propertyId: 'prop-02',
        slotTime,
        notes: 'Would like afternoon tour'
      });
    expect(firstRes.status).toBe(201);
    expect(firstRes.body.status).toBe('CONFIRMED');

    // Duplicate booking for same property and slot fails with 409
    const secondRes = await request(app)
      .post('/api/v1/viewings')
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({
        propertyId: 'prop-02',
        slotTime,
        notes: 'Another prospective tenant request'
      });
    expect(secondRes.status).toBe(409);
    expect(secondRes.body.error).toContain('conflict');
  });

  it('POST /api/v1/applications - submits tenant application with background income info', async () => {
    const res = await request(app)
      .post('/api/v1/applications')
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({
        propertyId: 'prop-03',
        monthlyIncome: 9500,
        creditScoreBracket: 'EXCELLENT',
        employmentStatus: 'FULL_TIME',
        employerName: 'Midwest Tech Solutions',
        idDocumentName: 'state_id_card.pdf',
        incomeProofName: 'tax_return_2025.pdf',
        proposedMoveInDate: '2026-12-15',
        proposedLeaseMonths: 12
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('APPLICATION_SUBMITTED');
    expect(res.body.creditScoreBracket).toBe('EXCELLENT');
  });

  it('POST /api/v1/leases/:id/sign - executes lease and transitions property to OCCUPIED', async () => {
    // 1. Landlord issues lease offer
    const offerRes = await request(app)
      .post('/api/v1/leases')
      .set('Authorization', `Bearer ${landlordToken}`)
      .send({
        propertyId: 'prop-01',
        tenantId: 'usr-tenant-01',
        startDate: '2026-12-01',
        endDate: '2027-11-30',
        monthlyRent: 2450,
        securityDeposit: 2450,
        termsAndConditions: 'Official 1-Year Residential Lease'
      });
    expect(offerRes.status).toBe(201);
    const leaseId = offerRes.body.id;

    // 2. Tenant signs lease
    const signRes = await request(app)
      .post(`/api/v1/leases/${leaseId}/sign`)
      .set('Authorization', `Bearer ${tenantToken}`);

    expect(signRes.status).toBe(200);
    expect(signRes.body.status).toBe('ACTIVE');
    expect(signRes.body.signedAt).toBeDefined();

    // 3. Verify property is now OCCUPIED
    const propRes = await request(app).get('/api/v1/properties/prop-01');
    expect(propRes.body.status).toBe('OCCUPIED');
  });

  it('POST /api/v1/maintenance - files tenant maintenance ticket with urgency rating', async () => {
    const res = await request(app)
      .post('/api/v1/maintenance')
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({
        leaseId: 'lease-101',
        propertyId: 'prop-04',
        title: 'Heater blowing cool air',
        description: 'Thermostat set to 72 but temperature reading remains 63 degrees.',
        category: 'HVAC',
        urgency: 'HIGH'
      });

    expect(res.status).toBe(201);
    expect(res.body.urgency).toBe('HIGH');
    expect(res.body.status).toBe('OPEN');
  });

  it('POST /api/v1/payments/process - fulfills scheduled rent payment with receipt generation', async () => {
    const res = await request(app)
      .post('/api/v1/payments/process')
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({
        paymentId: 'pay-03',
        paymentMethod: 'SANDBOX_ACH'
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('PAID');
    expect(res.body.receiptNumber).toMatch(/^RCPT-/);
    expect(res.body.transactionRef).toBeDefined();
  });
});
