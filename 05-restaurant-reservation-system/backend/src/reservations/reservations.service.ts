import { RestaurantStore, ReservationRecord } from '../database/store.js';
import { TableAllocationService } from '../tables/table-allocation.service.js';
import { WaitlistService } from '../waitlist/waitlist.service.js';
import { ReservationStateMachine, ReservationStatus } from './state-machine.js';
import { v4 as uuidv4 } from 'uuid';

export interface CreateReservationDto {
  restaurantId: string;
  reservationDate: string; // YYYY-MM-DD
  timeSlot: string;        // HH:mm
  partySize: number;
  seatingZone?: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  specialRequests?: string;
}

export class ReservationsService {
  private store = RestaurantStore.getInstance();
  private allocationService = new TableAllocationService();
  private waitlistService = new WaitlistService();

  // Internal concurrency mutex for table allocation
  private isAllocatingTable = false;

  async createReservation(guestId: string, dto: CreateReservationDto): Promise<ReservationRecord> {
    while (this.isAllocatingTable) {
      await new Promise(resolve => setTimeout(resolve, 5));
    }
    this.isAllocatingTable = true;

    try {
      const {
        restaurantId,
        reservationDate,
        timeSlot,
        partySize,
        seatingZone = 'INDOOR_MAIN',
        guestName,
        guestEmail,
        guestPhone,
        specialRequests
      } = dto;

      const restaurant = this.store.findRestaurant(restaurantId);
      if (!restaurant) throw new Error(`Restaurant ${restaurantId} not found`);

      if (partySize < 1 || partySize > 12) {
        throw new Error('Party size must be between 1 and 12 guests');
      }

      // Check allocation
      const allocation = this.allocationService.allocateTables(
        restaurantId,
        reservationDate,
        timeSlot,
        partySize,
        seatingZone
      );

      if (!allocation) {
        const err: any = new Error(
          `No tables available for party of ${partySize} in ${seatingZone} at ${timeSlot}. Please select another time or join the waitlist.`
        );
        err.statusCode = 409;
        throw err;
      }

      const reservationCode = `RES-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const reservation: ReservationRecord = {
        id: `resv_${uuidv4().substring(0, 8)}`,
        reservationCode,
        restaurantId,
        tableIds: allocation.tableIds,
        tableNumbers: allocation.tableNumbers,
        guestId,
        guestName,
        guestEmail,
        guestPhone: guestPhone || '',
        reservationDate,
        timeSlot,
        partySize,
        seatingZone,
        specialRequests: specialRequests || '',
        status: 'CONFIRMED',
        durationMinutes: allocation.durationMinutes,
        turnoverBufferMinutes: allocation.turnoverBufferMinutes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.store.reservations.push(reservation);
      return reservation;
    } finally {
      this.isAllocatingTable = false;
    }
  }

  cancelReservation(reservationId: string, userId: string, userRole: string, reason?: string) {
    const reservation = this.store.findReservation(reservationId);
    if (!reservation) throw new Error(`Reservation ${reservationId} not found`);

    if (reservation.guestId !== userId && userRole !== 'HOST' && userRole !== 'ADMIN') {
      const err: any = new Error('Forbidden: You can only cancel your own dining reservation.');
      err.statusCode = 403;
      throw err;
    }

    ReservationStateMachine.validate(reservation.status, 'CANCELLED');
    reservation.status = 'CANCELLED';
    reservation.updatedAt = new Date().toISOString();

    // Trigger waitlist promotion for released capacity and slot
    const promotion = this.waitlistService.promoteNextEligibleDiner(
      reservation.restaurantId,
      reservation.reservationDate,
      reservation.timeSlot,
      reservation.partySize,
      reservation.seatingZone
    );

    return {
      reservation,
      waitlistPromotion: promotion
    };
  }

  getDinerReservations(guestId: string) {
    const reservations = this.store.reservations
      .filter(r => r.guestId === guestId)
      .map(r => {
        const restaurant = this.store.findRestaurant(r.restaurantId);
        return {
          ...r,
          restaurantName: restaurant?.name || 'Restaurant',
          restaurantAddress: restaurant?.address || '',
          restaurantImage: restaurant?.images?.[0] || ''
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const waitlist = this.store.waitlistEntries
      .filter(w => w.guestId === guestId)
      .map(w => {
        const restaurant = this.store.findRestaurant(w.restaurantId);
        return {
          ...w,
          restaurantName: restaurant?.name || 'Restaurant'
        };
      });

    return {
      reservations,
      waitlist
    };
  }

  updateStatus(reservationId: string, nextStatus: ReservationStatus) {
    const reservation = this.store.findReservation(reservationId);
    if (!reservation) throw new Error(`Reservation ${reservationId} not found`);

    ReservationStateMachine.validate(reservation.status, nextStatus);
    reservation.status = nextStatus;
    reservation.updatedAt = new Date().toISOString();

    return reservation;
  }
}
