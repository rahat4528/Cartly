import { Listing } from '../database/store.js';

export interface PriceBreakdown {
  nightlyRate: number;
  nightsCount: number;
  baseSubtotal: number;
  cleaningFee: number;
  serviceFee: number;
  occupancyTax: number;
  totalPrice: number;
}

export class PricingService {
  public calculatePrice(listing: Listing, checkIn: string, checkOut: string): PriceBreakdown {
    const start = new Date(checkIn).getTime();
    const end = new Date(checkOut).getTime();

    if (start >= end) {
      const err = new Error('Check-out date must be strictly after check-in date');
      (err as any).statusCode = 400;
      throw err;
    }

    const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
    if (diffDays < 1) {
      const err = new Error('Reservation must be at least 1 night');
      (err as any).statusCode = 400;
      throw err;
    }

    const nightlyRate = listing.nightlyRate;
    const baseSubtotal = diffDays * nightlyRate;
    const cleaningFee = listing.cleaningFee;
    const serviceFee = Math.round(baseSubtotal * 0.12); // 12% marketplace service fee
    const occupancyTax = Math.round((baseSubtotal + cleaningFee) * 0.10); // 10% occupancy tax
    const totalPrice = baseSubtotal + cleaningFee + serviceFee + occupancyTax;

    return {
      nightlyRate,
      nightsCount: diffDays,
      baseSubtotal,
      cleaningFee,
      serviceFee,
      occupancyTax,
      totalPrice
    };
  }
}
