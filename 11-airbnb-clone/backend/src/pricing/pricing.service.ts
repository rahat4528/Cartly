import { Listing } from '../database/store';

export interface PriceBreakdown {
  checkIn: string;
  checkOut: string;
  nightsCount: number;
  guestCount: number;
  nightlyRate: number;
  baseSubtotal: number;
  cleaningFee: number;
  serviceFee: number;
  occupancyTax: number;
  totalPrice: number;
}

export class PricingService {
  static calculatePrice(
    listing: Listing,
    checkIn: string,
    checkOut: string,
    guestCount: number = 1
  ): PriceBreakdown {
    const start = new Date(checkIn).getTime();
    const end = new Date(checkOut).getTime();

    if (isNaN(start) || isNaN(end) || end <= start) {
      throw new Error('Invalid date span: checkOut must be strictly after checkIn');
    }

    const nightsCount = Math.round((end - start) / (1000 * 60 * 60 * 24));
    if (nightsCount < 1) {
      throw new Error('Minimum stay is 1 night');
    }

    const baseSubtotal = nightsCount * listing.nightlyRate;
    const cleaningFee = listing.cleaningFee;
    const serviceFee = Math.round(baseSubtotal * 0.12); // 12% platform guest service fee
    const occupancyTax = Math.round((baseSubtotal + cleaningFee) * 0.10); // 10% tax on stay + cleaning
    const totalPrice = baseSubtotal + cleaningFee + serviceFee + occupancyTax;

    return {
      checkIn,
      checkOut,
      nightsCount,
      guestCount,
      nightlyRate: listing.nightlyRate,
      baseSubtotal,
      cleaningFee,
      serviceFee,
      occupancyTax,
      totalPrice
    };
  }
}
