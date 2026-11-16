import { store, Listing } from '../database/store';
import { v4 as uuidv4 } from 'uuid';

export interface ListingFilter {
  category?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  guests?: number;
}

export class ListingsService {
  static getListings(filters: ListingFilter = {}): Listing[] {
    return store.listings.filter(listing => {
      if (filters.category && filters.category !== 'All' && listing.category !== filters.category) {
        return false;
      }
      if (filters.city && !listing.city.toLowerCase().includes(filters.city.toLowerCase()) && !listing.location.toLowerCase().includes(filters.city.toLowerCase())) {
        return false;
      }
      if (filters.minPrice && listing.nightlyRate < filters.minPrice) {
        return false;
      }
      if (filters.maxPrice && listing.nightlyRate > filters.maxPrice) {
        return false;
      }
      if (filters.guests && listing.maxGuests < filters.guests) {
        return false;
      }
      return true;
    });
  }

  static getListingById(id: string): Listing | null {
    return store.listings.find(l => l.id === id) || null;
  }

  static createListing(hostId: string, data: Omit<Listing, 'id' | 'hostId' | 'createdAt' | 'updatedAt'>): Listing {
    const listing: Listing = {
      ...data,
      id: `list_${uuidv4().substring(0, 8)}`,
      hostId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    store.listings.push(listing);
    return listing;
  }

  static updateListing(listingId: string, hostId: string, updates: Partial<Listing>, isAdmin: boolean = false): Listing {
    const listing = store.listings.find(l => l.id === listingId);
    if (!listing) throw new Error('Listing not found');

    if (!isAdmin && listing.hostId !== hostId) {
      const err = new Error('Forbidden: You do not own this accommodation listing');
      (err as any).statusCode = 403;
      throw err;
    }

    Object.assign(listing, updates, { updatedAt: new Date().toISOString() });
    return listing;
  }

  static getHostListings(hostId: string): Listing[] {
    return store.listings.filter(l => l.hostId === hostId);
  }
}
