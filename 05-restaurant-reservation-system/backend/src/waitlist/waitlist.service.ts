import { RestaurantStore, WaitlistRecord, ReservationRecord } from '../database/store.js';
import { TableAllocationService } from '../tables/table-allocation.service.js';
import { ReservationStateMachine } from '../reservations/state-machine.js';
import { v4 as uuidv4 } from 'uuid';

export interface JoinWaitlistDto {
  restaurantId: string;
  reservationDate: string; // YYYY-MM-DD
  preferredTimeSlot: string; // HH:mm
  partySize: number;
  seatingZone?: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
}

export class WaitlistService {
  private store = RestaurantStore.getInstance();
  private allocationService = new TableAllocationService();

  joinWaitlist(guestId: string, dto: JoinWaitlistDto): WaitlistRecord {
    const { restaurantId, reservationDate, preferredTimeSlot, partySize, seatingZone = 'INDOOR_MAIN', guestName, guestEmail, guestPhone } = dto;

    const restaurant = this.store.findRestaurant(restaurantId);
    if (!restaurant) throw new Error(`Restaurant ${restaurantId} not found`);

    if (partySize < 1 || partySize > 12) {
      throw new Error('Party size must be between 1 and 12 guests');
    }

    const priorityIndex = this.store.waitlistEntries.filter(w => w.restaurantId === restaurantId && w.reservationDate === reservationDate).length + 1;

    const waitlistEntry: WaitlistRecord = {
      id: `wtl_${uuidv4().substring(0, 8)}`,
      restaurantId,
      guestId,
      guestName,
      guestEmail,
      guestPhone: guestPhone || '',
      reservationDate,
      preferredTimeSlot,
      partySize,
      seatingZone,
      priorityIndex,
      status: 'WAITLIST',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.store.waitlistEntries.push(waitlistEntry);
    return waitlistEntry;
  }

  promoteNextEligibleDiner(
    restaurantId: string,
    reservationDate: string,
    releasedSlot: string,
    releasedCapacity: number,
    releasedZone: string
  ): { promoted: boolean; waitlistEntry?: WaitlistRecord; reservation?: ReservationRecord } {
    const releasedMinutes = this.allocationService.timeToMinutes(releasedSlot);

    // Candidates in queue
    const candidates = this.store.waitlistEntries.filter(w => {
      if (w.restaurantId !== restaurantId) return false;
      if (w.reservationDate !== reservationDate) return false;
      if (w.status !== 'WAITLIST') return false;
      if (w.partySize > releasedCapacity) return false;

      // Within 30 minutes of preferred time slot
      const prefMinutes = this.allocationService.timeToMinutes(w.preferredTimeSlot);
      return Math.abs(prefMinutes - releasedMinutes) <= 30;
    });

    if (candidates.length === 0) {
      return { promoted: false };
    }

    // Sort by priorityIndex ascending (FIFO)
    candidates.sort((a, b) => a.priorityIndex - b.priorityIndex);
    const chosen = candidates[0];

    // Attempt table allocation for the chosen waitlisted party
    const allocation = this.allocationService.allocateTables(
      restaurantId,
      reservationDate,
      releasedSlot,
      chosen.partySize,
      chosen.seatingZone
    );

    if (!allocation) {
      return { promoted: false };
    }

    // Promote waitlist entry with 15-minute claim deadline
    const promotedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    chosen.status = 'PROMOTED';
    chosen.promotedUntil = promotedUntil;
    chosen.updatedAt = new Date().toISOString();

    const reservationCode = `RES-PROM-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const reservation: ReservationRecord = {
      id: `resv_${uuidv4().substring(0, 8)}`,
      reservationCode,
      restaurantId,
      tableIds: allocation.tableIds,
      tableNumbers: allocation.tableNumbers,
      guestId: chosen.guestId,
      guestName: chosen.guestName,
      guestEmail: chosen.guestEmail,
      guestPhone: chosen.guestPhone,
      reservationDate,
      timeSlot: releasedSlot,
      partySize: chosen.partySize,
      seatingZone: chosen.seatingZone,
      status: 'PROMOTED',
      durationMinutes: allocation.durationMinutes,
      turnoverBufferMinutes: allocation.turnoverBufferMinutes,
      promotedUntil,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    chosen.promotedReservationId = reservation.id;
    this.store.reservations.push(reservation);

    return {
      promoted: true,
      waitlistEntry: chosen,
      reservation
    };
  }

  claimPromoted(waitlistId: string, guestId: string): ReservationRecord {
    const entry = this.store.waitlistEntries.find(w => w.id === waitlistId);
    if (!entry) throw new Error(`Waitlist entry ${waitlistId} not found`);

    if (entry.guestId !== guestId) {
      throw new Error('Forbidden: You can only claim your own waitlist promotion');
    }

    if (entry.status !== 'PROMOTED') {
      throw new Error(`Cannot claim waitlist entry in status ${entry.status}`);
    }

    if (entry.promotedUntil && new Date(entry.promotedUntil) < new Date()) {
      entry.status = 'EXPIRED';
      throw new Error('Waitlist promotion claim window has expired.');
    }

    const reservation = this.store.findReservation(entry.promotedReservationId!);
    if (!reservation) {
      throw new Error('Promoted reservation record not found');
    }

    ReservationStateMachine.validate(reservation.status, 'CONFIRMED');
    reservation.status = 'CONFIRMED';
    reservation.updatedAt = new Date().toISOString();

    entry.status = 'CLAIMED';
    entry.updatedAt = new Date().toISOString();

    return reservation;
  }
}
