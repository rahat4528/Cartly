import { v4 as uuidv4 } from 'uuid';
import { FlightStore, Booking, Passenger, Flight } from '../database/store.js';
import { FlightsService } from '../flights/flights.service.js';
import { PricingService } from '../pricing/pricing.service.js';

export class BookingsService {
  private store = FlightStore.getInstance();
  private flightsService = new FlightsService();
  private pricingService = new PricingService();

  public createBooking(data: {
    userId: string;
    flightId: string;
    flightIds?: string[];
    cabinClass: 'ECONOMY' | 'BUSINESS';
    passengers: Passenger[];
  }): Booking {
    const flightIds = data.flightIds && data.flightIds.length > 0 ? data.flightIds : [data.flightId];
    const flights: Flight[] = [];

    for (const fid of flightIds) {
      const flt = this.flightsService.getFlightById(fid);
      if (!flt) {
        throw new Error(`Flight ${fid} not found`);
      }
      flights.push(flt);
    }

    const paxCount = data.passengers.length;
    if (paxCount < 1) {
      const err = new Error('Booking must contain at least one passenger');
      (err as any).statusCode = 400;
      throw err;
    }

    // 1. Concurrency Check: Check capacity on all flight segments
    for (const flt of flights) {
      const avail = data.cabinClass === 'ECONOMY'
        ? flt.economyCapacity - flt.economyBooked
        : flt.businessCapacity - flt.businessBooked;

      if (avail < paxCount) {
        const err = new Error(`Flight segment capacity exhausted for ${flt.flightNumber} in ${data.cabinClass}`);
        (err as any).statusCode = 409;
        throw err;
      }
    }

    // 2. Concurrency Check: Seat assignment uniqueness
    const seatNumbers: string[] = [];
    for (const p of data.passengers) {
      if (p.seatNumber) {
        for (const flt of flights) {
          if (!this.store.isSeatAvailable(flt.id, p.seatNumber)) {
            const err = new Error(`Seat collision: seat ${p.seatNumber} is already occupied on flight ${flt.flightNumber}`);
            (err as any).statusCode = 409;
            throw err;
          }
        }
        seatNumbers.push(p.seatNumber);
      }
    }

    // 3. Atomically decrement inventory & reserve seats
    for (const flt of flights) {
      if (data.cabinClass === 'ECONOMY') {
        flt.economyBooked += paxCount;
      } else {
        flt.businessBooked += paxCount;
      }

      for (const seat of seatNumbers) {
        this.store.reserveSeat(flt.id, seat);
      }
    }

    // 4. Calculate Authoritative Fare Snapshot
    let rawBase = 0;
    for (const flt of flights) {
      rawBase += (data.cabinClass === 'ECONOMY' ? flt.economyPrice : flt.businessPrice) * paxCount;
    }
    const fareSnapshot = this.pricingService.calculateFare(rawBase, paxCount);

    const pnrLocator = `DEMO-${uuidv4().substring(0, 6).toUpperCase()}`;

    const booking: Booking = {
      id: `book_${uuidv4().substring(0, 8)}`,
      pnrLocator,
      userId: data.userId,
      flightId: flights[0].id,
      flightIds,
      cabinClass: data.cabinClass,
      passengerCount: paxCount,
      baseFare: fareSnapshot.baseFare,
      carrierFees: fareSnapshot.carrierFees,
      aviationTaxes: fareSnapshot.aviationTaxes,
      totalAmount: fareSnapshot.totalAmount,
      status: 'HELD',
      seatNumbers,
      passengers: data.passengers,
      isDemonstration: true,
      ticketUrl: `/api/v1/tickets/${pnrLocator}`,
      createdAt: new Date().toISOString()
    };

    this.store.bookings.push(booking);
    return booking;
  }

  public payAndTicket(bookingId: string, userId: string): Booking {
    const booking = this.store.bookings.find(b => b.id === bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }
    if (booking.userId !== userId) {
      const err = new Error('Unauthorized');
      (err as any).statusCode = 403;
      throw err;
    }

    if (booking.status !== 'HELD') {
      const err = new Error(`Cannot ticket booking with status ${booking.status}`);
      (err as any).statusCode = 400;
      throw err;
    }

    booking.status = 'TICKETED';
    return booking;
  }

  public getBookingById(id: string): Booking | undefined {
    return this.store.bookings.find(b => b.id === id || b.pnrLocator === id);
  }

  public getUserBookings(userId: string): Booking[] {
    return this.store.bookings.filter(b => b.userId === userId);
  }

  public cancelBooking(bookingId: string, userId: string): Booking {
    const booking = this.store.bookings.find(b => b.id === bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }
    if (booking.userId !== userId) {
      const err = new Error('Unauthorized');
      (err as any).statusCode = 403;
      throw err;
    }

    if (booking.status === 'CANCELLED') {
      const err = new Error('Booking is already cancelled');
      (err as any).statusCode = 400;
      throw err;
    }

    // Restore seat inventory & release seats
    const flightIds = booking.flightIds || [booking.flightId];
    for (const fid of flightIds) {
      const flt = this.flightsService.getFlightById(fid);
      if (flt) {
        if (booking.cabinClass === 'ECONOMY') {
          flt.economyBooked = Math.max(0, flt.economyBooked - booking.passengerCount);
        } else {
          flt.businessBooked = Math.max(0, flt.businessBooked - booking.passengerCount);
        }

        for (const seat of booking.seatNumbers) {
          this.store.releaseSeat(flt.id, seat);
        }
      }
    }

    booking.status = 'CANCELLED';
    return booking;
  }
}
