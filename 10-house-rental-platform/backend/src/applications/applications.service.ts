import { store, TenantApplication } from '../database/store';
import { v4 as uuidv4 } from 'uuid';

export class ApplicationsService {
  static submitApplication(
    applicantId: string,
    data: {
      propertyId: string;
      monthlyIncome: number;
      creditScoreBracket: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
      employmentStatus: string;
      employerName: string;
      idDocumentName: string;
      incomeProofName: string;
      proposedMoveInDate: string;
      proposedLeaseMonths: number;
    }
  ): TenantApplication {
    const property = store.properties.find(p => p.id === data.propertyId);
    if (!property) throw new Error('Property not found');

    const app: TenantApplication = {
      id: `app-${uuidv4().substring(0, 8)}`,
      propertyId: data.propertyId,
      applicantId,
      monthlyIncome: data.monthlyIncome,
      creditScoreBracket: data.creditScoreBracket,
      employmentStatus: data.employmentStatus,
      employerName: data.employerName,
      documentMetadata: {
        idDocumentName: data.idDocumentName,
        incomeProofName: data.incomeProofName,
        verified: true
      },
      proposedMoveInDate: data.proposedMoveInDate,
      proposedLeaseMonths: data.proposedLeaseMonths || 12,
      status: 'APPLICATION_SUBMITTED',
      createdAt: new Date().toISOString()
    };

    store.applications.push(app);
    return app;
  }

  static getLandlordApplications(landlordId: string): (TenantApplication & { applicantName?: string; propertyTitle?: string })[] {
    const landlordProperties = new Set(
      store.properties.filter(p => p.landlordId === landlordId).map(p => p.id)
    );

    return store.applications
      .filter(a => landlordProperties.has(a.propertyId))
      .map(a => {
        const applicant = store.users.find(u => u.id === a.applicantId);
        const prop = store.properties.find(p => p.id === a.propertyId);
        return {
          ...a,
          applicantName: applicant?.fullName || 'Anonymous Applicant',
          propertyTitle: prop?.title || 'Rental Property'
        };
      });
  }

  static getTenantApplications(applicantId: string): TenantApplication[] {
    return store.applications.filter(a => a.applicantId === applicantId);
  }

  static updateApplicationStatus(
    applicationId: string,
    landlordId: string,
    status: 'UNDER_REVIEW' | 'LEASE_OFFERED' | 'REJECTED',
    notes?: string
  ): TenantApplication {
    const app = store.applications.find(a => a.id === applicationId);
    if (!app) throw new Error('Application not found');

    const property = store.properties.find(p => p.id === app.propertyId);
    if (!property || property.landlordId !== landlordId) {
      const err = new Error('Forbidden: Only the property owner can review applications');
      (err as any).statusCode = 403;
      throw err;
    }

    app.status = status;
    if (notes) app.landlordNotes = notes;
    return app;
  }
}
