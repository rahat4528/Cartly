import { HotelStore } from '../database/store.js';
import { AvailabilityService } from '../reservations/availability.service.js';

export interface HotelSearchQuery {
  city?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  rooms?: number;
  minRating?: number;
}

export class HotelsService {
  private store = HotelStore.getInstance();
  private availabilityService = new AvailabilityService();

  searchHotels(query: HotelSearchQuery = {}) {
    const { city, checkIn, checkOut, guests = 1, rooms = 1, minRating } = query;

    let hotels = this.store.hotels;

    if (city && city.trim()) {
      const c = city.toLowerCase().trim();
      hotels = hotels.filter(h =>
        h.city.toLowerCase().includes(c) ||
        h.country.toLowerCase().includes(c) ||
        h.name.toLowerCase().includes(c)
      );
    }

    if (minRating !== undefined && !isNaN(Number(minRating))) {
      hotels = hotels.filter(h => h.starRating >= Number(minRating));
    }

    // Enrich each hotel with room types and availability
    return hotels.map(hotel => {
      let roomTypes = this.store.roomTypes.filter(r => r.hotelId === hotel.id);

      if (guests > 1) {
        roomTypes = roomTypes.filter(r => r.maxGuests >= Number(guests));
      }

      const enrichedRoomTypes = roomTypes.map(rt => {
        let availableRooms = rt.totalRooms;
        if (checkIn && checkOut) {
          try {
            const avail = this.availabilityService.getRoomAvailability(rt.id, checkIn, checkOut);
            availableRooms = avail.availableRooms;
          } catch {
            availableRooms = 0;
          }
        }
        return {
          ...rt,
          availableRooms,
          isAvailable: availableRooms >= Number(rooms)
        };
      });

      const availableTypes = enrichedRoomTypes.filter(rt => rt.isAvailable);
      const minPrice = availableTypes.length > 0
        ? Math.min(...availableTypes.map(rt => rt.basePricePerNight))
        : (roomTypes.length > 0 ? Math.min(...roomTypes.map(rt => rt.basePricePerNight)) : 0);

      return {
        ...hotel,
        roomTypes: enrichedRoomTypes,
        availableRoomTypesCount: availableTypes.length,
        startingPricePerNight: minPrice,
        isFullyBooked: checkIn && checkOut ? availableTypes.length === 0 : false
      };
    });
  }

  getHotelByIdOrSlug(idOrSlug: string, checkIn?: string, checkOut?: string) {
    const hotel = this.store.findHotel(idOrSlug);
    if (!hotel) return null;

    const roomTypes = this.store.roomTypes
      .filter(r => r.hotelId === hotel.id)
      .map(rt => {
        let availableRooms = rt.totalRooms;
        if (checkIn && checkOut) {
          try {
            const avail = this.availabilityService.getRoomAvailability(rt.id, checkIn, checkOut);
            availableRooms = avail.availableRooms;
          } catch {
            availableRooms = 0;
          }
        }
        return {
          ...rt,
          availableRooms
        };
      });

    const seasonalRules = this.store.seasonalRules.filter(r => r.hotelId === hotel.id);

    return {
      ...hotel,
      roomTypes,
      seasonalRules
    };
  }
}
