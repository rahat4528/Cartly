import { HotelStore, ReservationRecord } from '../database/store.js';
import { PricingService } from '../pricing/pricing.service.js';
import { ReservationStateMachine } from './state-machine.js';
import { SandboxPaymentAdapter } from '../payments/payment.adapter.js';
import { v4 as uuidv4 } from 'uuid';

export interface CreateHoldDto {
  hotelId: string;
  roomTypeId: string;
  checkInDate: string;  // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  roomsCount: number;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
}

export class AvailabilityService {
  private store = HotelStore.getInstance();
  private pricingService = new PricingService();
  private paymentAdapter = SandboxPaymentAdapter.getInstance();

  // Internal concurrency lock for atomic room booking
  private isHoldingRoom = false;

  getRoomAvailability(roomTypeId: string, checkInDate: string, checkOutDate: string): {
    roomTypeId: string;
    totalRooms: number;
    availableRooms: number;
    nightlyAvailability: Array<{ date: string; available: number; reserved: number }>;
  } {
    this.store.cleanupExpiredHolds();

    const roomType = this.store.findRoomType(roomTypeId);
    if (!roomType) throw new Error(`Room type ${roomTypeId} not found`);

    const start = new Date(checkInDate + 'T00:00:00Z');
    const end = new Date(checkOutDate + 'T00:00:00Z');

    if (end <= start) {
      throw new Error('Check-out date must be strictly after check-in date');
    }

    const nights: Array<{ date: string; available: number; reserved: number }> = [];
    let minAvailable = roomType.totalRooms;

    const current = new Date(start);
    const now = new Date();

    while (current < end) {
      const dateStr = current.toISOString().split('T')[0];

      // Active reservations covering this night
      const activeReservations = this.store.reservations.filter(r => {
        if (r.roomTypeId !== roomTypeId) return false;

        // Is status active?
        const isHeldValid = r.status === 'HELD' && new Date(r.expiresAt) > now;
        const isConfirmedOrSeated = r.status === 'CONFIRMED' || r.status === 'CHECKED_IN';
        if (!isHeldValid && !isConfirmedOrSeated) return false;

        // Does the reservation span dateStr? [checkInDate, checkOutDate)
        return r.checkInDate <= dateStr && dateStr < r.checkOutDate;
      });

      const reservedCount = activeReservations.reduce((sum, r) => sum + r.roomsCount, 0);
      const availableCount = Math.max(0, roomType.totalRooms - reservedCount);

      if (availableCount < minAvailable) {
        minAvailable = availableCount;
      }

      nights.push({
        date: dateStr,
        available: availableCount,
        reserved: reservedCount
      });

      current.setUTCDate(current.getUTCDate() + 1);
    }

    return {
      roomTypeId,
      totalRooms: roomType.totalRooms,
      availableRooms: minAvailable,
      nightlyAvailability: nights
    };
  }

  async createHold(guestId: string, dto: CreateHoldDto): Promise<ReservationRecord> {
    // Acquire concurrency lock
    while (this.isHoldingRoom) {
      await new Promise(resolve => setTimeout(resolve, 5));
    }
    this.isHoldingRoom = true;

    try {
      this.store.cleanupExpiredHolds();

      const { hotelId, roomTypeId, checkInDate, checkOutDate, roomsCount = 1, guestName, guestEmail, guestPhone } = dto;

      const roomType = this.store.findRoomType(roomTypeId);
      if (!roomType) throw new Error(`Room type ${roomTypeId} not found`);

      if (roomsCount <= 0) throw new Error('Requested rooms count must be at least 1');

      // Check date validity
      const start = new Date(checkInDate + 'T00:00:00Z');
      const end = new Date(checkOutDate + 'T00:00:00Z');
      if (end <= start) {
        throw new Error('Check-out date must be strictly after check-in date');
      }

      // Check atomic room availability across all nights
      const availability = this.getRoomAvailability(roomTypeId, checkInDate, checkOutDate);
      if (availability.availableRooms < roomsCount) {
        const err: any = new Error(
          `Inventory unavailable: Only ${availability.availableRooms} room(s) available for selected dates (requested ${roomsCount}).`
        );
        err.statusCode = 409;
        throw err;
      }

      // Calculate authoritative server price
      const quote = this.pricingService.calculateStayQuote(
        hotelId,
        roomTypeId,
        checkInDate,
        checkOutDate,
        roomsCount
      );

      const voucherCode = `VCH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minute hold

      const reservation: ReservationRecord = {
        id: `resv_${uuidv4().substring(0, 8)}`,
        voucherCode,
        hotelId,
        roomTypeId,
        guestId,
        guestName,
        guestEmail,
        guestPhone: guestPhone || '',
        checkInDate,
        checkOutDate,
        nightsCount: quote.nightsCount,
        roomsCount,
        status: 'HELD',
        nightlyBreakdown: quote.nightlyBreakdown,
        subtotal: quote.subtotal,
        taxAmount: quote.taxAmount,
        feesAmount: quote.feesAmount,
        totalAmount: quote.totalAmount,
        expiresAt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.store.reservations.push(reservation);
      return reservation;
    } finally {
      this.isHoldingRoom = false;
    }
  }

  confirmReservation(
    reservationId: string,
    guestId: string,
    cardToken: string,
    idempotencyKey: string
  ): { reservation: ReservationRecord; paymentRef: string } {
    this.store.cleanupExpiredHolds();

    const reservation = this.store.findReservation(reservationId);
    if (!reservation) throw new Error(`Reservation ${reservationId} not found`);

    if (reservation.guestId !== guestId) {
      const err: any = new Error('Forbidden: You can only confirm your own reservation hold.');
      err.statusCode = 403;
      throw err;
    }

    if (reservation.status === 'EXPIRED' || new Date(reservation.expiresAt) <= new Date()) {
      reservation.status = 'EXPIRED';
      const err: any = new Error('Reservation hold has expired. Please re-select your room.');
      err.statusCode = 410;
      throw err;
    }

    if (reservation.status !== 'HELD') {
      throw new Error(`Cannot confirm reservation in status ${reservation.status}`);
    }

    // Process sandbox payment
    const paymentResult = this.paymentAdapter.processPayment(
      reservation.totalAmount,
      'USD',
      cardToken,
      idempotencyKey
    );

    if (!paymentResult.success) {
      throw new Error(paymentResult.error || 'Payment failed. Reservation hold remains active until expiry.');
    }

    ReservationStateMachine.validate('HELD', 'CONFIRMED');
    reservation.status = 'CONFIRMED';
    reservation.paidAt = new Date().toISOString();
    reservation.updatedAt = new Date().toISOString();

    this.store.paymentRecords.push({
      id: `pay_${uuidv4().substring(0, 8)}`,
      reservationId: reservation.id,
      amount: reservation.totalAmount,
      currency: 'USD',
      status: 'SUCCESS',
      idempotencyKey,
      providerRef: paymentResult.transactionId!,
      createdAt: new Date().toISOString()
    });

    return {
      reservation,
      paymentRef: paymentResult.transactionId!
    };
  }

  cancelReservation(reservationId: string, guestId: string, reason?: string) {
    const reservation = this.store.findReservation(reservationId);
    if (!reservation) throw new Error(`Reservation ${reservationId} not found`);

    if (reservation.guestId !== guestId) {
      const err: any = new Error('Forbidden: You can only cancel your own reservation.');
      err.statusCode = 403;
      throw err;
    }

    if (reservation.status !== 'CONFIRMED') {
      throw new Error(`Only CONFIRMED reservations can be cancelled (current status: ${reservation.status})`);
    }

    const hotel = this.store.findHotel(reservation.hotelId);
    const refund = this.pricingService.calculateCancellationRefund(
      reservation.checkInDate,
      hotel?.checkInTime || '15:00',
      reservation.totalAmount
    );

    // Process refund adapter
    if (refund.refundAmount > 0) {
      this.paymentAdapter.processRefund(`txn_${reservation.id}`, refund.refundAmount);
    }

    ReservationStateMachine.validate('CONFIRMED', 'CANCELLED');
    reservation.status = 'CANCELLED';
    reservation.cancelledAt = new Date().toISOString();
    reservation.refundAmount = refund.refundAmount;
    reservation.updatedAt = new Date().toISOString();

    return {
      reservation,
      refund
    };
  }
}
