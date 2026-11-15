import { v4 as uuidv4 } from 'uuid';
import { HouseRentalStore, RentalProperty, RentalUnit, ViewingAppointment } from '../database/store.js';

export class RentalsService {
  private store = HouseRentalStore.getInstance();

  public getProperties(filters?: { city?: string; maxRent?: number; minBedrooms?: number }): RentalProperty[] {
    let result = this.store.properties;

    if (filters?.city) {
      const c = filters.city.toLowerCase();
      result = result.filter(p => p.city.toLowerCase().includes(c));
    }

    if (filters?.minBedrooms) {
      const minB = Number(filters.minBedrooms);
      result = result.filter(p => p.units.some(u => u.bedrooms >= minB));
    }

    if (filters?.maxRent) {
      const maxR = Number(filters.maxRent);
      result = result.filter(p => p.units.some(u => u.monthlyRent <= maxR));
    }

    return result;
  }

  public getPropertyById(id: string): RentalProperty | undefined {
    return this.store.properties.find(p => p.id === id);
  }

  public findUnit(unitId: string): { property: RentalProperty; unit: RentalUnit } | null {
    for (const property of this.store.properties) {
      const unit = property.units.find(u => u.id === unitId);
      if (unit) {
        return { property, unit };
      }
    }
    return null;
  }

  public scheduleViewing(data: {
    unitId: string;
    tenantId: string;
    date: string;
    timeSlot: string;
    notes?: string;
  }): ViewingAppointment {
    const unitFound = this.findUnit(data.unitId);
    if (!unitFound) {
      throw new Error('Rental unit not found');
    }

    // Anti-double-booking mutex check
    if (!this.store.isViewingSlotAvailable(data.unitId, data.date, data.timeSlot)) {
      const err = new Error('Viewing appointment conflict: this time slot is already reserved');
      (err as any).statusCode = 409;
      throw err;
    }

    const viewing: ViewingAppointment = {
      id: `view_${uuidv4().substring(0, 8)}`,
      unitId: data.unitId,
      tenantId: data.tenantId,
      date: data.date,
      timeSlot: data.timeSlot,
      status: 'CONFIRMED',
      notes: data.notes,
      createdAt: new Date().toISOString()
    };

    this.store.viewings.push(viewing);
    return viewing;
  }

  public getViewingsForUnit(unitId: string): ViewingAppointment[] {
    return this.store.viewings.filter(v => v.unitId === unitId);
  }
}
