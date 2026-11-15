import { store, LeaseAgreement, RentPayment } from '../database/store';
import { v4 as uuidv4 } from 'uuid';

export class LeasesService {
  static createLeaseOffer(
    landlordId: string,
    data: {
      propertyId: string;
      tenantId: string;
      applicationId?: string;
      startDate: string;
      endDate: string;
      monthlyRent: number;
      securityDeposit: number;
      termsAndConditions?: string;
    }
  ): LeaseAgreement {
    const property = store.properties.find(p => p.id === data.propertyId);
    if (!property) throw new Error('Property not found');
    if (property.landlordId !== landlordId) {
      const err = new Error('Forbidden: Only the property owner can issue a lease agreement');
      (err as any).statusCode = 403;
      throw err;
    }

    const lease: LeaseAgreement = {
      id: `lease-${uuidv4().substring(0, 8)}`,
      propertyId: data.propertyId,
      landlordId,
      tenantId: data.tenantId,
      applicationId: data.applicationId,
      startDate: data.startDate,
      endDate: data.endDate,
      monthlyRent: data.monthlyRent,
      securityDeposit: data.securityDeposit,
      status: 'LEASE_OFFERED',
      termsAndConditions: data.termsAndConditions || 'Standard 12-Month Residential Lease Agreement.',
      createdAt: new Date().toISOString()
    };

    store.leases.push(lease);

    // If an application is associated, mark it LEASE_OFFERED
    if (data.applicationId) {
      const app = store.applications.find(a => a.id === data.applicationId);
      if (app) app.status = 'LEASE_OFFERED';
    }

    return lease;
  }

  static signLease(leaseId: string, tenantId: string): LeaseAgreement {
    const lease = store.leases.find(l => l.id === leaseId);
    if (!lease) throw new Error('Lease agreement not found');
    if (lease.tenantId !== tenantId) {
      const err = new Error('Forbidden: Only the prospective tenant can execute this lease');
      (err as any).statusCode = 403;
      throw err;
    }
    if (lease.status !== 'LEASE_OFFERED') {
      const err = new Error(`Cannot sign lease with status ${lease.status}`);
      (err as any).statusCode = 400;
      throw err;
    }

    lease.status = 'ACTIVE';
    lease.signedAt = new Date().toISOString();

    // Mark property as OCCUPIED
    const property = store.properties.find(p => p.id === lease.propertyId);
    if (property) {
      property.status = 'OCCUPIED';
    }

    // Mark application as LEASE_SIGNED if exists
    if (lease.applicationId) {
      const app = store.applications.find(a => a.id === lease.applicationId);
      if (app) app.status = 'LEASE_SIGNED';
    }

    // Generate upcoming first month rent payment
    const firstRent: RentPayment = {
      id: `pay-${uuidv4().substring(0, 8)}`,
      leaseId: lease.id,
      tenantId: lease.tenantId,
      amount: lease.monthlyRent,
      dueDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };
    store.payments.push(firstRent);

    return lease;
  }

  static getTenantLeases(tenantId: string): LeaseAgreement[] {
    return store.leases.filter(l => l.tenantId === tenantId);
  }

  static getLandlordLeases(landlordId: string): LeaseAgreement[] {
    return store.leases.filter(l => l.landlordId === landlordId);
  }
}
