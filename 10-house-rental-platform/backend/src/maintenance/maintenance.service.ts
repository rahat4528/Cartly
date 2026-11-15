import { store, MaintenanceTicket } from '../database/store';
import { v4 as uuidv4 } from 'uuid';

export class MaintenanceService {
  static createTicket(
    tenantId: string,
    data: {
      leaseId: string;
      propertyId: string;
      title: string;
      description: string;
      category: 'PLUMBING' | 'ELECTRICAL' | 'HVAC' | 'APPLIANCE' | 'GENERAL';
      urgency: 'EMERGENCY' | 'HIGH' | 'STANDARD';
      photoUrl?: string;
    }
  ): MaintenanceTicket {
    const lease = store.leases.find(l => l.id === data.leaseId && l.tenantId === tenantId);
    if (!lease) {
      const err = new Error('Forbidden: Active lease required to file maintenance requests');
      (err as any).statusCode = 403;
      throw err;
    }

    const ticket: MaintenanceTicket = {
      id: `tkt-${uuidv4().substring(0, 8)}`,
      leaseId: data.leaseId,
      propertyId: data.propertyId,
      tenantId,
      title: data.title,
      description: data.description,
      category: data.category,
      urgency: data.urgency,
      status: 'OPEN',
      photoUrl: data.photoUrl,
      createdAt: new Date().toISOString()
    };

    store.tickets.push(ticket);
    return ticket;
  }

  static getTenantTickets(tenantId: string): MaintenanceTicket[] {
    return store.tickets.filter(t => t.tenantId === tenantId);
  }

  static getLandlordTickets(landlordId: string): MaintenanceTicket[] {
    const landlordPropertyIds = new Set(
      store.properties.filter(p => p.landlordId === landlordId).map(p => p.id)
    );
    return store.tickets.filter(t => landlordPropertyIds.has(t.propertyId));
  }

  static updateTicketStatus(
    ticketId: string,
    landlordId: string,
    status: 'OPEN' | 'SCHEDULED' | 'IN_PROGRESS' | 'RESOLVED',
    resolutionNotes?: string
  ): MaintenanceTicket {
    const ticket = store.tickets.find(t => t.id === ticketId);
    if (!ticket) throw new Error('Maintenance ticket not found');

    const property = store.properties.find(p => p.id === ticket.propertyId);
    if (!property || property.landlordId !== landlordId) {
      const err = new Error('Forbidden: Only the property landlord can update maintenance tickets');
      (err as any).statusCode = 403;
      throw err;
    }

    ticket.status = status;
    if (resolutionNotes) ticket.resolutionNotes = resolutionNotes;
    return ticket;
  }
}
