import { v4 as uuidv4 } from 'uuid';
import { AirbnbStore, Listing } from '../database/store.js';

export class ListingsService {
  private store = AirbnbStore.getInstance();

  public getListings(filters?: {
    category?: string;
    city?: string;
    guests?: number;
    checkIn?: string;
    checkOut?: string;
  }): Listing[] {
    let result = this.store.listings;

    if (filters?.category && filters.category !== 'All') {
      result = result.filter(l => l.category.toLowerCase() === filters.category!.toLowerCase());
    }

    if (filters?.city) {
      const c = filters.city.toLowerCase();
      result = result.filter(l => l.city.toLowerCase().includes(c) || l.location.toLowerCase().includes(c));
    }

    if (filters?.guests) {
      const g = Number(filters.guests);
      result = result.filter(l => l.maxGuests >= g);
    }

    if (filters?.checkIn && filters?.checkOut) {
      result = result.filter(l => !this.store.hasBookingOverlap(l.id, filters.checkIn!, filters.checkOut!));
    }

    return result;
  }

  public getListingById(id: string): Listing | undefined {
    return this.store.listings.find(l => l.id === id);
  }

  public createListing(data: Omit<Listing, 'id'>, hostId: string): Listing {
    const listing: Listing = {
      id: `list_${uuidv4().substring(0, 8)}`,
      ...data,
      hostId
    };
    this.store.listings.push(listing);
    return listing;
  }

  public updateListing(id: string, updates: Partial<Listing>, hostId: string): Listing {
    const listing = this.store.listings.find(l => l.id === id);
    if (!listing) {
      throw new Error('Listing not found');
    }
    if (listing.hostId !== hostId) {
      const err = new Error('You do not have permission to modify this listing');
      (err as any).statusCode = 403;
      throw err;
    }

    Object.assign(listing, updates);
    return listing;
  }
}
