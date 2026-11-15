import { MovieStore } from '../database/store.js';

export type SeatTier = 'STANDARD' | 'PREMIUM' | 'VIP_RECLINER';
export type SeatStatus = 'AVAILABLE' | 'HELD' | 'BOOKED';

export interface SeatInfo {
  seatNumber: string; // e.g. "D5"
  row: string;        // "D"
  col: number;        // 5
  tier: SeatTier;
  price: number;
  status: SeatStatus;
}

export interface PricingBreakdown {
  seatNumbers: string[];
  seatsCount: number;
  itemizedSeats: Array<{ seatNumber: string; tier: SeatTier; price: number }>;
  subtotal: number;
  convenienceFee: number;
  totalAmount: number;
}

export class SeatMatrixService {
  private store = MovieStore.getInstance();

  readonly ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  readonly COLS = 10;
  readonly CONVENIENCE_FEE_PER_TICKET = 1.50;

  getSeatTier(row: string): { tier: SeatTier; price: number } {
    if (row === 'G') {
      return { tier: 'VIP_RECLINER', price: 24.00 };
    }
    if (['D', 'E', 'F'].includes(row)) {
      return { tier: 'PREMIUM', price: 18.50 };
    }
    return { tier: 'STANDARD', price: 14.50 };
  }

  calculatePricing(seatNumbers: string[]): PricingBreakdown {
    const itemized = seatNumbers.map(seat => {
      const row = seat.charAt(0).toUpperCase();
      const { tier, price } = this.getSeatTier(row);
      return { seatNumber: seat, tier, price };
    });

    const subtotal = itemized.reduce((sum, s) => sum + s.price, 0);
    const convenienceFee = seatNumbers.length * this.CONVENIENCE_FEE_PER_TICKET;
    const totalAmount = Math.round((subtotal + convenienceFee) * 100) / 100;

    return {
      seatNumbers,
      seatsCount: seatNumbers.length,
      itemizedSeats: itemized,
      subtotal: Math.round(subtotal * 100) / 100,
      convenienceFee: Math.round(convenienceFee * 100) / 100,
      totalAmount
    };
  }

  getShowtimeSeatMatrix(showtimeId: string): {
    showtimeId: string;
    totalSeats: number;
    availableSeatsCount: number;
    heldSeatsCount: number;
    bookedSeatsCount: number;
    matrix: Record<string, SeatInfo[]>;
  } {
    this.store.cleanupExpiredHolds();

    const showtime = this.store.findShowtime(showtimeId);
    if (!showtime) throw new Error(`Showtime ${showtimeId} not found`);

    const now = new Date();

    // Collect all occupied or held seats
    const bookedSeats = new Set<string>();
    const heldSeats = new Set<string>();

    for (const b of this.store.bookings) {
      if (b.showtimeId !== showtimeId) continue;

      if (b.status === 'CONFIRMED' || b.status === 'ADMITTED') {
        b.seatNumbers.forEach(s => bookedSeats.add(s));
      } else if (b.status === 'HELD' && new Date(b.expiresAt) > now) {
        b.seatNumbers.forEach(s => heldSeats.add(s));
      }
    }

    const matrix: Record<string, SeatInfo[]> = {};
    let availableCount = 0;

    const allSeats: SeatInfo[] = [];
    for (const row of this.ROWS) {
      matrix[row] = [];
      const { tier, price } = this.getSeatTier(row);

      for (let col = 1; col <= this.COLS; col++) {
        const seatNumber = `${row}${col}`;
        let status: SeatStatus = 'AVAILABLE';

        if (bookedSeats.has(seatNumber)) {
          status = 'BOOKED';
        } else if (heldSeats.has(seatNumber)) {
          status = 'HELD';
        } else {
          availableCount++;
        }

        const seatObj: SeatInfo = {
          seatNumber,
          row,
          col,
          tier,
          price,
          status
        };

        matrix[row].push(seatObj);
        allSeats.push(seatObj);
      }
    }

    return {
      showtimeId,
      totalSeats: this.ROWS.length * this.COLS,
      availableSeatsCount: availableCount,
      heldSeatsCount: heldSeats.size,
      bookedSeatsCount: bookedSeats.size,
      matrix,
      seats: allSeats,
      rows: this.ROWS,
      cols: Array.from({ length: this.COLS }, (_, i) => i + 1)
    };
  }
}
