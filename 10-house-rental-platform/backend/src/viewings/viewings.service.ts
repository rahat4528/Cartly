import { store, ViewingAppointment } from '../database/store';
import { v4 as uuidv4 } from 'uuid';

export class ViewingsService {
  private static mutex = new Set<string>();

  static async scheduleViewing(
    propertyId: string,
    tenantId: string,
    slotTime: string,
    notes?: string
  ): Promise<ViewingAppointment> {
    const slotKey = `${propertyId}_${slotTime}`;

    // Mutex check for concurrent requests
    if (this.mutex.has(slotKey)) {
      const err = new Error('Viewing appointment conflict: This time slot is currently being reserved');
      (err as any).statusCode = 409;
      throw err;
    }

    this.mutex.add(slotKey);
    try {
      // Check existing confirmed appointment in database store
      const conflict = store.viewings.find(
        v => v.propertyId === propertyId &&
             v.slotTime === slotTime &&
             v.status === 'CONFIRMED'
      );

      if (conflict) {
        const err = new Error('Viewing appointment conflict: Selected slot is already booked for this property');
        (err as any).statusCode = 409;
        throw err;
      }

      const appointment: ViewingAppointment = {
        id: `view-${uuidv4().substring(0, 8)}`,
        propertyId,
        tenantId,
        slotTime,
        status: 'CONFIRMED',
        notes,
        createdAt: new Date().toISOString()
      };

      store.viewings.push(appointment);
      return appointment;
    } finally {
      this.mutex.delete(slotKey);
    }
  }

  static getPropertyViewings(propertyId: string): ViewingAppointment[] {
    return store.viewings.filter(v => v.propertyId === propertyId);
  }

  static getTenantViewings(tenantId: string): ViewingAppointment[] {
    return store.viewings.filter(v => v.tenantId === tenantId);
  }
}
