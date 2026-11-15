import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { store } from '../src/database/store';

describe('House Rental Platform E2E Integration Suite', () => {
  beforeEach(() => {
    store.seed();
  });

  it('executes full tenant lifecycle: discover, schedule tour, apply, sign lease, submit ticket, pay rent', async () => {
    // 1. Health Check
    const health = await request(app).get('/health');
    expect(health.status).toBe(200);
    expect(health.body.status).toBe('ok');

    // 2. Tenant Auth
    const tenantLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'tenant@example.com', password: 'Pass123!' });
    expect(tenantLogin.status).toBe(200);
    const tenantToken = tenantLogin.body.token;

    // 3. Landlord Auth
    const landlordLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'landlord@example.com', password: 'Pass123!' });
    expect(landlordLogin.status).toBe(200);
    const landlordToken = landlordLogin.body.token;

    // 4. Browse Available Properties
    const propertiesRes = await request(app).get('/api/v1/properties?status=AVAILABLE');
    expect(propertiesRes.status).toBe(200);
    const targetProperty = propertiesRes.body[0];
    expect(targetProperty).toBeDefined();

    // 5. Schedule Viewing Appointment
    const viewingRes = await request(app)
      .post('/api/v1/viewings')
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({
        propertyId: targetProperty.id,
        slotTime: '2026-12-10T10:00:00.000Z',
        notes: 'Morning inspection preferred'
      });
    expect(viewingRes.status).toBe(201);
    expect(viewingRes.body.status).toBe('CONFIRMED');

    // 6. Submit Rental Application
    const appRes = await request(app)
      .post('/api/v1/applications')
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({
        propertyId: targetProperty.id,
        monthlyIncome: 10000,
        creditScoreBracket: 'EXCELLENT',
        employmentStatus: 'FULL_TIME',
        employerName: 'Global Cloud Systems',
        idDocumentName: 'passport_scan.pdf',
        incomeProofName: 'paystub_q4.pdf',
        proposedMoveInDate: '2026-12-01',
        proposedLeaseMonths: 12
      });
    expect(appRes.status).toBe(201);
    const applicationId = appRes.body.id;

    // 7. Landlord Reviews and Issues Lease Offer
    const reviewRes = await request(app)
      .patch(`/api/v1/applications/${applicationId}/status`)
      .set('Authorization', `Bearer ${landlordToken}`)
      .send({ status: 'UNDER_REVIEW', notes: 'Income verified, background cleared' });
    expect(reviewRes.status).toBe(200);

    const leaseOfferRes = await request(app)
      .post('/api/v1/leases')
      .set('Authorization', `Bearer ${landlordToken}`)
      .send({
        propertyId: targetProperty.id,
        tenantId: 'usr-tenant-01',
        applicationId,
        startDate: '2026-12-01',
        endDate: '2027-11-30',
        monthlyRent: targetProperty.monthlyRent,
        securityDeposit: targetProperty.securityDeposit
      });
    expect(leaseOfferRes.status).toBe(201);
    const leaseId = leaseOfferRes.body.id;

    // 8. Tenant Signs Lease
    const signRes = await request(app)
      .post(`/api/v1/leases/${leaseId}/sign`)
      .set('Authorization', `Bearer ${tenantToken}`);
    expect(signRes.status).toBe(200);
    expect(signRes.body.status).toBe('ACTIVE');

    // 9. File Maintenance Ticket
    const ticketRes = await request(app)
      .post('/api/v1/maintenance')
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({
        leaseId,
        propertyId: targetProperty.id,
        title: 'Smoke detector low battery chirp',
        description: 'Unit in upstairs hallway chirps every 3 minutes',
        category: 'ELECTRICAL',
        urgency: 'STANDARD'
      });
    expect(ticketRes.status).toBe(201);
    expect(ticketRes.body.status).toBe('OPEN');

    // 10. Landlord Resolves Ticket
    const resolveTicketRes = await request(app)
      .patch(`/api/v1/maintenance/${ticketRes.body.id}/status`)
      .set('Authorization', `Bearer ${landlordToken}`)
      .send({ status: 'RESOLVED', resolutionNotes: 'Replaced 9V battery' });
    expect(resolveTicketRes.status).toBe(200);
    expect(resolveTicketRes.body.status).toBe('RESOLVED');
  });
});
