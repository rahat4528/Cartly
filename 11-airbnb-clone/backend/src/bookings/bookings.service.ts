import { v4 as uuidv4 } from 'uuid';
import { AirbnbStore, Booking } from '../database/store.js';
import { ListingsService } from '../listings/listings.service.js';
import { PricingService } from '../pricing/pricing.service.js';

export class BookingsService {
  private store = AirbnbStore.getInstance();
  private listingsService = new ListingsService();
  private pricingService = new PricingService();

  public createHold(data: {
    listingId: string;
    guestId: string;
    checkIn: string;
    checkOut: string;
    guestCount: number;
  }): Booking {
    const listing = this.listingsService.getListingById(data.listingId);
    if (!listing) {
      throw new Error('Listing not found');
    }

    if (data.guestCount > listing.maxGuests) {
      const err = new Error(`Exceeds maximum guest capacity of ${listing.maxGuests}`);
      (err as any).statusCode = 400;
      throw err;
    }

    // Atomic Date-Overlap Check
    if (this.store.hasBookingOverlap(data.listingId, data.checkIn, data.checkOut)) {
      const err = new Error('Booking conflict: the selected dates are unavailable for this listing');
      (err as any).statusCode = 409;
      throw err;
    }

    // Authoritative Server-side Price Breakdown
    const pricing = this.pricingService.calculatePrice(listing, data.checkIn, data.checkOut);

    // 10-Minute Hold Expiration
    const holdExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const booking: Booking = {
      id: `book_${uuidv4().substring(0, 8)}`,
      listingId: data.listingId,
      guestId: data.guestId,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      nightsCount: pricing.nightsCount,
      guestCount: data.guestCount,
      nightlyRate: pricing.nightlyRate,
      baseSubtotal: pricing.baseSubtotal,
      cleaningFee: pricing.cleaningFee,
      serviceFee: pricing.serviceFee,
      occupancyTax: pricing.occupancyTax,
      totalPrice: pricing.totalPrice,
      status: 'PENDING',
      holdExpiresAt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.store.bookings.push(booking);
    return booking;
  }

  public confirmBooking(bookingId: string, guestId: string): Booking {
    this.store.expireStaleHolds();
    const booking = this.store.bookings.find(b => b.id === bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.guestId !== guestId) {
      const err = new Error('Unauthorized: you cannot confirm another guest reservation');
      (err as any).statusCode = 403;
      throw err;
    }

    if (booking.status === 'EXPIRED') {
      const err = new Error('Reservation hold has expired. Please create a new booking.');
      (err as any).statusCode = 410;
      throw err;
    }

    if (booking.status !== 'PENDING') {
      const err = new Error(`Cannot confirm booking with status ${booking.status}`);
      (err as any).statusCode = 400;
      throw err;
    }

    // Verify hold validity
    if (booking.holdExpiresAt && new Date(booking.holdExpiresAt).getTime() < Date.now()) {
      booking.status = 'EXPIRED';
      const err = new Error('Reservation hold has timed out');
      (err as any).statusCode = 410;
      throw err;
    }

    booking.status = 'CONFIRMED';
    booking.confirmedAt = new Date().toISOString();
    return booking;
  }

  public cancelBooking(bookingId: string, guestId: string): { booking: Booking; refundAmount: number } {
    const booking = this.store.bookings.find(b => b.id === bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.guestId !== guestId) {
      const err = new Error('Unauthorized: cannot cancel another guest booking');
      (err as any).statusCode = 403;
      throw err;
    }

    if (booking.status !== 'CONFIRMED' && booking.status !== 'PENDING') {
      const err = new Error(`Cannot cancel reservation with status ${booking.status}`);
      (err as any).statusCode = 400;
      throw err;
    }

    // Policy: full refund if cancelled > 5 days prior to check-in, otherwise 50%
    const checkInTime = new Date(booking.checkIn).getTime();
    const daysUntilCheckIn = (checkInTime - Date.now()) / (1000 * 60 * 60 * 24);

    let refund = 0;
    if (booking.status === 'CONFIRMED') {
      refund = daysUntilCheckIn >= 5 ? booking.totalPrice : Math.round(booking.totalPrice * 0.5);
    }

    booking.status = 'CANCELLED';
    booking.cancelledAt = new Date().toISOString();
    booking.refundAmount = refund;

    return { booking, refundAmount: refund };
  }

  public getGuestBookings(guestId: string): Booking[] {
    return this.store.bookings.filter(b => b.guestId === guestId);
  }

  public getHostBookings(hostId: string): (Booking & { listingTitle: string })[] {
    const hostListingIds = this.store.listings.filter(l => l.hostId === hostId).map(l => l.id);
    return this.store.bookings
      .filter(b => hostListingIds.includes(b.listingId))
      .map(b => {
        const listing = this.listingsService.getListingById(b.listingId)!;
        return {
          ...b,
          listingTitle: listing.title
        };
      });
  }

  // Helper for review gating
  public markCompletedForTesting(bookingId: string): Booking {
    const booking = this.store.bookings.find(b => b.id === bookingId);
    if (!booking) throw new Error('Booking not found');
    booking.status = 'COMPLETED';
    return booking;
  }
}
