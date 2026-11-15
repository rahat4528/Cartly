import { MovieStore, BookingRecord } from '../database/store.js';
import { SeatMatrixService } from '../seats/seat-matrix.service.js';
import { BookingStateMachine } from './state-machine.js';
import { SandboxPaymentAdapter } from '../payments/payment.adapter.js';
import { v4 as uuidv4 } from 'uuid';

export interface CreateHoldDto {
  showtimeId: string;
  seatNumbers: string[];
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
}

export class BookingsService {
  private store = MovieStore.getInstance();
  private seatService = new SeatMatrixService();
  private paymentAdapter = SandboxPaymentAdapter.getInstance();

  // Internal concurrency lock per showtime
  private isHoldingSeats = false;

  async createSeatHold(guestId: string, dto: CreateHoldDto): Promise<BookingRecord> {
    while (this.isHoldingSeats) {
      await new Promise(resolve => setTimeout(resolve, 5));
    }
    this.isHoldingSeats = true;

    try {
      this.store.cleanupExpiredHolds();

      const showtimeId = dto.showtimeId;
      const seatNumbers = dto.seatNumbers || (dto as any).seatLabels || [];
      const user = this.store.findUser(guestId);
      const guestName = dto.guestName || user?.name || 'Cinema Patron';
      const guestEmail = dto.guestEmail || user?.email || 'patron@example.com';
      const guestPhone = dto.guestPhone || user?.phone || '';

      const showtime = this.store.findShowtime(showtimeId);
      if (!showtime) throw new Error(`Showtime ${showtimeId} not found`);

      if (!seatNumbers || seatNumbers.length === 0) {
        throw new Error('At least one seat must be selected');
      }

      if (seatNumbers.length > 10) {
        throw new Error('Cannot book more than 10 seats in a single reservation');
      }

      const now = new Date();

      // Check for seat collisions
      const unavailableSeats: string[] = [];
      for (const b of this.store.bookings) {
        if (b.showtimeId !== showtimeId) continue;

        const isSold = b.status === 'CONFIRMED' || b.status === 'ADMITTED';
        const isHeldValid = b.status === 'HELD' && new Date(b.expiresAt) > now;

        if (isSold || isHeldValid) {
          for (const s of seatNumbers) {
            if (b.seatNumbers.includes(s)) {
              unavailableSeats.push(s);
            }
          }
        }
      }

      if (unavailableSeats.length > 0) {
        const err: any = new Error(
          `Seat selection collision: Seat(s) ${unavailableSeats.join(', ')} are already held or booked by another patron.`
        );
        err.statusCode = 409;
        throw err;
      }

      // Calculate authoritative server price
      const pricing = this.seatService.calculatePricing(seatNumbers);
      const ticketCode = `TKT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const expiresAt = new Date(Date.now() + 8 * 60 * 1000).toISOString(); // 8 minutes TTL

      const booking: BookingRecord = {
        id: `bkg_${uuidv4().substring(0, 8)}`,
        ticketCode,
        showtimeId,
        guestId,
        guestName,
        guestEmail,
        guestPhone: guestPhone || '',
        seatNumbers,
        subtotal: pricing.subtotal,
        convenienceFee: pricing.convenienceFee,
        totalAmount: pricing.totalAmount,
        status: 'HELD',
        expiresAt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.store.bookings.push(booking);
      return booking;
    } finally {
      this.isHoldingSeats = false;
    }
  }

  confirmBooking(
    bookingId: string,
    guestId: string,
    cardToken: string,
    idempotencyKey: string
  ): { booking: BookingRecord; transactionId: string } {
    this.store.cleanupExpiredHolds();

    const booking = this.store.findBooking(bookingId);
    if (!booking) throw new Error(`Booking ${bookingId} not found`);

    if (booking.guestId !== guestId) {
      const err: any = new Error('Forbidden: You can only confirm your own seat hold.');
      err.statusCode = 403;
      throw err;
    }

    if (booking.status === 'EXPIRED' || new Date(booking.expiresAt) <= new Date()) {
      booking.status = 'EXPIRED';
      const err: any = new Error('Seat hold has expired. Please re-select your seats on the auditorium map.');
      err.statusCode = 410;
      throw err;
    }

    if (booking.status !== 'HELD') {
      throw new Error(`Cannot confirm booking in status ${booking.status}`);
    }

    // Process payment
    const payment = this.paymentAdapter.processPayment(
      booking.totalAmount,
      'USD',
      cardToken,
      idempotencyKey
    );

    if (!payment.success) {
      throw new Error(payment.error || 'Payment failed. Seat hold remains active until countdown expires.');
    }

    BookingStateMachine.validate('HELD', 'CONFIRMED');
    booking.status = 'CONFIRMED';
    booking.paidAt = new Date().toISOString();
    booking.updatedAt = new Date().toISOString();

    this.store.paymentRecords.push({
      id: `pay_${uuidv4().substring(0, 8)}`,
      bookingId: booking.id,
      amount: booking.totalAmount,
      currency: 'USD',
      status: 'SUCCESS',
      idempotencyKey,
      providerRef: payment.transactionId!,
      createdAt: new Date().toISOString()
    });

    return {
      booking,
      transactionId: payment.transactionId!
    };
  }

  admitTicket(ticketCode: string, usherId: string): {
    success: boolean;
    admitted: boolean;
    movieTitle: string;
    auditoriumName: string;
    seatNumbers: string[];
    admittedAt: string;
  } {
    const booking = this.store.findBooking(ticketCode);
    if (!booking) {
      const err: any = new Error(`Invalid ticket code: ${ticketCode}`);
      err.statusCode = 404;
      throw err;
    }

    if (booking.status === 'ADMITTED') {
      const err: any = new Error(
        `DUPLICATE ENTRY ALERT: Ticket ${ticketCode} was already admitted at ${booking.admittedAt}.`
      );
      err.statusCode = 409;
      throw err;
    }

    if (booking.status !== 'CONFIRMED') {
      const err: any = new Error(`Cannot admit ticket in status ${booking.status}`);
      err.statusCode = 400;
      throw err;
    }

    BookingStateMachine.validate('CONFIRMED', 'ADMITTED');
    booking.status = 'ADMITTED';
    booking.admittedAt = new Date().toISOString();
    booking.admittedByUsherId = usherId;
    booking.updatedAt = new Date().toISOString();

    const showtime = this.store.findShowtime(booking.showtimeId);
    const movie = showtime ? this.store.findMovie(showtime.movieId) : null;
    const auditorium = showtime ? this.store.findAuditorium(showtime.auditoriumId) : null;

    return {
      success: true,
      admitted: true,
      movieTitle: movie?.title || 'Feature Film',
      auditoriumName: auditorium?.name || 'Screen 1',
      seatNumbers: booking.seatNumbers,
      admittedAt: booking.admittedAt
    };
  }

  getPatronBookings(guestId: string) {
    this.store.cleanupExpiredHolds();
    return this.store.bookings
      .filter(b => b.guestId === guestId)
      .map(b => {
        const showtime = this.store.findShowtime(b.showtimeId);
        const movie = showtime ? this.store.findMovie(showtime.movieId) : null;
        const auditorium = showtime ? this.store.findAuditorium(showtime.auditoriumId) : null;
        return {
          ...b,
          movieTitle: movie?.title || 'Movie',
          moviePoster: movie?.posterUrl || '',
          auditoriumName: auditorium?.name || 'Auditorium',
          showDate: showtime?.showDate || '',
          startTime: showtime?.startTime || '',
          format: showtime?.format || '2D'
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}
