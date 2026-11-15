import { CarRentalStore, VehicleRecord } from '../database/store.js';

export class VehiclesService {
  private store = CarRentalStore.getInstance();

  getVehicles(category?: string, transmission?: string, pickupDate?: string, returnDate?: string) {
    let list = this.store.vehicles;

    if (category && category.trim() && category !== 'ALL') {
      const c = category.toUpperCase().trim();
      list = list.filter(v => v.category === c);
    }

    if (transmission && transmission.trim() && transmission !== 'ALL') {
      const t = transmission.toUpperCase().trim();
      list = list.filter(v => v.transmission === t);
    }

    if (pickupDate && returnDate) {
      const reqStart = new Date(pickupDate).getTime();
      const reqEnd = new Date(returnDate).getTime();

      return list.map(v => {
        const hasOverlap = this.store.rentals.some(r => {
          if (r.vehicleId !== v.id || r.status === 'CANCELLED') return false;
          const rStart = new Date(r.startDate).getTime();
          const rEnd = new Date(r.endDate).getTime();
          return reqStart < rEnd && reqEnd > rStart;
        });

        return {
          ...v,
          isAvailableForDates: !hasOverlap && v.isAvailable
        };
      });
    }

    return list.map(v => ({
      ...v,
      isAvailableForDates: v.isAvailable
    }));
  }

  getVehicleById(id: string) {
    return this.store.findVehicle(id) || null;
  }
}
