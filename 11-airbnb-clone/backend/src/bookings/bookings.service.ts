import { store, Booking } from '../database/store';
import { PricingService } from '../pricing/pricing.service';
import { v4 as uuidv4 } from 'uuid';

export class BookingsService {
  private static mutex = new Set<string>();

  static async createHold(
    guestId: string,
    listingId: string,
    checkIn: string,
    checkOut: string,
    guestCount: number = 1
  ): Promise<Booking> {
    const listing = store.listings.find(l => l.id === listingId);
    if (!listing) {
      throw new Error('Listing not found');
    }

    const lockKey = `${listingId}_${checkIn}_${checkOut}`;
    if (this.mutex.has(lockKey)) {
      const err = new Error('Booking conflict: Dates currently being reserved by another traveler');
      (err as any).statusCode = 409;
      throw err;
    }

    this.mutex.add(lockKey);
    try {
      store.sweepExpiredHolds();

      const reqStart = new Date(checkIn).getTime();
      const reqEnd = new Date(checkOut).getTime();

      const collision = store.bookings.find(b => {
        if (b.listingId !== listingId) return false;
        if (['CANCELLED', 'EXPIRED'].includes(b.status)) return false;

        const bStart = new Date(b.checkIn).getTime();
        const bEnd = new Date(b.checkOut).getTime();

        return reqStart < bEnd && reqEnd > bStart;
      });

      if (collision) {
        const err = new Error('Booking conflict: Selected dates are already booked for this property');
        (err as any).statusCode = 409;
        throw err;
      }

      const pricing = PricingService.calculatePrice(listing, checkIn, checkOut, guestCount);
      const holdExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      const booking: Booking = {
        id: `book_${uuidv4().substring(0, 8)}`,
        listingId,
        guestId,
        checkIn,
        checkOut,
        nightsCount: pricing.nightsCount,
        guestCount,
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

      store.bookings.push(booking);
      return booking;
    } finally {
      this.mutex.delete(lockKey);
    }
  }

  static confirmBooking(bookingId: string, guestId: string): Booking {
    const booking = store.bookings.find(b => b.id === bookingId);
    if (!booking) throw new Error('Booking not found');

    if (booking.guestId !== guestId) {
      const err = new Error('Forbidden: You can only confirm your own reservations');
      (err as any).statusCode = 403;
      throw err;
    }

    if (booking.status !== 'PENDING') {
      const err = new Error(`Cannot confirm booking with status ${booking.status}`);
      (err as any).statusCode = 400;
      throw err;
    }

    if (booking.holdExpiresAt && new Date(booking.holdExpiresAt).getTime() < Date.now()) {
      booking.status = 'EXPIRED';
      const err = new Error('Reservation hold has expired. Please select new dates.');
      (err as any).statusCode = 410;
      throw err;
    }

    booking.status = 'CONFIRMED';
    booking.confirmedAt = new Date().toISOString();
    booking.updatedAt = new Date().toISOString();

    return booking;
  }

  static cancelBooking(bookingId: string, userId: string, isHost: boolean = false): Booking {
    const booking = store.bookings.find(b => b.id === bookingId);
    if (!booking) throw new Error('Booking not found');

    const listing = store.listings.find(l => l.id === booking.listingId);

    if (!isHost && booking.guestId !== userId) {
      const err = new Error('Forbidden: Unauthorized to cancel this booking');
      (err as any).statusCode = 403;
      throw err;
    }

    if (isHost && listing?.hostId !== userId) {
      const err = new Error('Forbidden: Unauthorized host cancellation');
      (err as any).statusCode = 403;
      throw err;
    }

    booking.status = 'CANCELLED';
    booking.cancelledAt = new Date().toISOString();
    booking.refundAmount = booking.totalPrice;
    booking.updatedAt = new Date().toISOString();

    return booking;
  }

  static getGuestBookings(guestId: string): Booking[] {
    return store.bookings.filter(b => b.guestId === guestId);
  }

  static getHostBookings(hostId: string): Booking[] {
    const hostListingIds = new Set(store.listings.filter(l => l.hostId === hostId).map(l => l.id));
    return store.bookings.filter(b => hostListingIds.has(b.listingId));
  }
}
