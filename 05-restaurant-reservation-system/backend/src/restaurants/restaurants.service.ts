import { RestaurantStore } from '../database/store.js';
import { TableAllocationService } from '../tables/table-allocation.service.js';

export interface RestaurantSearchQuery {
  cuisine?: string;
  city?: string;
  neighborhood?: string;
  date?: string;
  time?: string;
  partySize?: number;
  priceTier?: string;
}

export class RestaurantsService {
  private store = RestaurantStore.getInstance();
  private allocationService = new TableAllocationService();

  readonly STANDARD_SLOTS = [
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'
  ];

  searchRestaurants(query: RestaurantSearchQuery = {}) {
    const { cuisine, city, neighborhood, date = new Date().toISOString().split('T')[0], partySize = 2, priceTier } = query;

    let list = this.store.restaurants;

    if (cuisine && cuisine.trim()) {
      const c = cuisine.toLowerCase().trim();
      list = list.filter(r => r.cuisine.toLowerCase().includes(c));
    }

    if (city && city.trim()) {
      const ci = city.toLowerCase().trim();
      list = list.filter(r => r.city.toLowerCase().includes(ci));
    }

    if (neighborhood && neighborhood.trim()) {
      const n = neighborhood.toLowerCase().trim();
      list = list.filter(r => r.neighborhood.toLowerCase().includes(n));
    }

    if (priceTier && priceTier.trim()) {
      list = list.filter(r => r.priceTier === priceTier);
    }

    return list.map(rest => {
      const slotsWithAvailability = this.STANDARD_SLOTS.map(slot => {
        const alloc = this.allocationService.allocateTables(
          rest.id,
          date,
          slot,
          Number(partySize)
        );
        return {
          timeSlot: slot,
          isAvailable: alloc !== null
        };
      });

      return {
        ...rest,
        timeSlots: slotsWithAvailability,
        availableSlotsCount: slotsWithAvailability.filter(s => s.isAvailable).length
      };
    });
  }

  getRestaurantByIdOrSlug(idOrSlug: string, date?: string, partySize: number = 2, zone?: string) {
    const rest = this.store.findRestaurant(idOrSlug);
    if (!rest) return null;

    const targetDate = date || new Date().toISOString().split('T')[0];
    const tables = this.store.diningTables.filter(t => t.restaurantId === rest.id);

    const slots = this.STANDARD_SLOTS.map(slot => {
      const alloc = this.allocationService.allocateTables(
        rest.id,
        targetDate,
        slot,
        partySize,
        zone
      );
      return {
        timeSlot: slot,
        isAvailable: alloc !== null,
        allocatedTables: alloc?.tableNumbers || []
      };
    });

    return {
      ...rest,
      tables,
      seatingZones: ['INDOOR_MAIN', 'PATIO_TERRACE', 'BAR_HIGHTOP', 'CHEFS_COUNTER'],
      availableSlots: slots
    };
  }
}
