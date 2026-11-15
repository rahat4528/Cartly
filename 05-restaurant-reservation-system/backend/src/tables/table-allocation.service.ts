import { RestaurantStore } from '../database/store.js';

export interface AllocationResult {
  tableIds: string[];
  tableNumbers: string[];
  isCombined: boolean;
  totalCapacity: number;
  durationMinutes: number;
  turnoverBufferMinutes: number;
}

export class TableAllocationService {
  private store = RestaurantStore.getInstance();
  readonly TURNOVER_BUFFER_MINUTES = 15;

  calculateDurationMinutes(partySize: number): number {
    if (partySize <= 2) return 75;
    if (partySize <= 4) return 90;
    return 120;
  }

  timeToMinutes(hhmm: string): number {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  }

  isWindowOverlapping(
    timeSlotA: string,
    durationA: number,
    timeSlotB: string,
    durationB: number
  ): boolean {
    const startA = this.timeToMinutes(timeSlotA);
    const endA = startA + durationA + this.TURNOVER_BUFFER_MINUTES;

    const startB = this.timeToMinutes(timeSlotB);
    const endB = startB + durationB + this.TURNOVER_BUFFER_MINUTES;

    return startA < endB && startB < endA;
  }

  isTableOccupied(
    tableId: string,
    date: string,
    timeSlot: string,
    durationMinutes: number
  ): boolean {
    const activeReservations = this.store.reservations.filter(r => {
      if (r.reservationDate !== date) return false;
      if (!r.tableIds.includes(tableId)) return false;

      const now = new Date();
      const isConfirmedOrSeated = r.status === 'CONFIRMED' || r.status === 'SEATED';
      const isPromotedValid = r.status === 'PROMOTED' && r.promotedUntil && new Date(r.promotedUntil) > now;

      if (!isConfirmedOrSeated && !isPromotedValid) return false;

      return this.isWindowOverlapping(
        timeSlot,
        durationMinutes,
        r.timeSlot,
        r.durationMinutes
      );
    });

    return activeReservations.length > 0;
  }

  allocateTables(
    restaurantId: string,
    date: string,
    timeSlot: string,
    partySize: number,
    preferredZone?: string
  ): AllocationResult | null {
    const durationMinutes = this.calculateDurationMinutes(partySize);

    let tables = this.store.diningTables.filter(t => t.restaurantId === restaurantId);
    if (preferredZone) {
      tables = tables.filter(t => t.seatingZone === preferredZone);
    }

    // 1. Single Table Best-Fit Allocation
    const singleCandidates = tables.filter(t => {
      if (t.minCapacity > partySize || t.maxCapacity < partySize) return false;
      return !this.isTableOccupied(t.id, date, timeSlot, durationMinutes);
    });

    if (singleCandidates.length > 0) {
      // Pick best fit (smallest excess capacity)
      singleCandidates.sort((a, b) => (a.maxCapacity - partySize) - (b.maxCapacity - partySize));
      const chosen = singleCandidates[0];
      return {
        tableIds: [chosen.id],
        tableNumbers: [chosen.tableNumber],
        isCombined: false,
        totalCapacity: chosen.maxCapacity,
        durationMinutes,
        turnoverBufferMinutes: this.TURNOVER_BUFFER_MINUTES
      };
    }

    // 2. Dynamic Combinable Tables Allocation (for partySize >= 3)
    if (partySize >= 3) {
      const combinableTables = tables.filter(t => t.isCombinable);

      for (let i = 0; i < combinableTables.length; i++) {
        const tableA = combinableTables[i];
        if (this.isTableOccupied(tableA.id, date, timeSlot, durationMinutes)) continue;

        for (const targetId of tableA.combinableWithTableIds) {
          const tableB = combinableTables.find(t => t.id === targetId);
          if (!tableB) continue;
          if (this.isTableOccupied(tableB.id, date, timeSlot, durationMinutes)) continue;

          const combinedCapacity = tableA.maxCapacity + tableB.maxCapacity;
          if (combinedCapacity >= partySize) {
            return {
              tableIds: [tableA.id, tableB.id],
              tableNumbers: [tableA.tableNumber, tableB.tableNumber],
              isCombined: true,
              totalCapacity: combinedCapacity,
              durationMinutes,
              turnoverBufferMinutes: this.TURNOVER_BUFFER_MINUTES
            };
          }
        }
      }
    }

    return null;
  }
}
