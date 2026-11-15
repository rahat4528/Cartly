import { HotelStore, NightlyCost } from '../database/store.js';

export interface PriceQuote {
  roomTypeId: string;
  checkInDate: string;
  checkOutDate: string;
  nightsCount: number;
  roomsCount: number;
  nightlyBreakdown: NightlyCost[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  feesAmount: number;
  totalAmount: number;
}

export interface RefundCalculation {
  refundPercentage: number;
  refundAmount: number;
  hoursUntilCheckIn: number;
  policyApplied: string;
}

export class PricingService {
  private store = HotelStore.getInstance();
  private readonly TAX_RATE = 0.12;
  private readonly RESORT_FEE = 35.00;

  calculateStayQuote(
    hotelId: string,
    roomTypeId: string,
    checkInDate: string,
    checkOutDate: string,
    roomsCount: number = 1
  ): PriceQuote {
    const roomType = this.store.findRoomType(roomTypeId);
    if (!roomType) throw new Error(`Room type ${roomTypeId} not found`);

    const start = new Date(checkInDate + 'T00:00:00Z');
    const end = new Date(checkOutDate + 'T00:00:00Z');

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date format. Expected YYYY-MM-DD');
    }

    if (end <= start) {
      throw new Error('Check-out date must be strictly after check-in date');
    }

    const hotelSeasonalRules = this.store.seasonalRules.filter(r => r.hotelId === hotelId);
    const breakdown: NightlyCost[] = [];

    const current = new Date(start);
    while (current < end) {
      const dateStr = current.toISOString().split('T')[0];
      const mmdd = dateStr.substring(5); // "MM-DD"
      const dayOfWeek = current.getUTCDay(); // 0 = Sun, 5 = Fri, 6 = Sat
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
      const weekendMultiplier = isWeekend ? 1.20 : 1.00;

      // Check seasonal rule
      let seasonMultiplier = 1.00;
      let seasonName = 'Standard';
      for (const rule of hotelSeasonalRules) {
        if (this.isDateInRange(mmdd, rule.startDate, rule.endDate)) {
          seasonMultiplier = rule.multiplier;
          seasonName = rule.name;
          break;
        }
      }

      const nightlyTotal = Math.round(roomType.basePricePerNight * seasonMultiplier * weekendMultiplier * 100) / 100;

      breakdown.push({
        date: dateStr,
        baseRate: roomType.basePricePerNight,
        seasonMultiplier,
        seasonName,
        isWeekend,
        weekendMultiplier,
        nightlyTotal
      });

      // Advance by 1 day
      current.setUTCDate(current.getUTCDate() + 1);
    }

    const nightlySubtotal = breakdown.reduce((sum, n) => sum + n.nightlyTotal, 0);
    const subtotal = Math.round(nightlySubtotal * roomsCount * 100) / 100;
    const taxAmount = Math.round(subtotal * this.TAX_RATE * 100) / 100;
    const feesAmount = this.RESORT_FEE;
    const totalAmount = Math.round((subtotal + taxAmount + feesAmount) * 100) / 100;

    return {
      roomTypeId,
      checkInDate,
      checkOutDate,
      nightsCount: breakdown.length,
      roomsCount,
      nightlyBreakdown: breakdown,
      subtotal,
      taxRate: this.TAX_RATE,
      taxAmount,
      feesAmount,
      totalAmount
    };
  }

  calculateCancellationRefund(
    checkInDate: string,
    checkInTime: string = '15:00',
    totalAmount: number,
    cancellationDate: Date = new Date()
  ): RefundCalculation {
    const checkInDateTime = new Date(`${checkInDate}T${checkInTime}:00Z`);
    const diffMs = checkInDateTime.getTime() - cancellationDate.getTime();
    const hoursUntilCheckIn = diffMs / (1000 * 60 * 60);

    if (hoursUntilCheckIn >= 48) {
      return {
        refundPercentage: 100,
        refundAmount: totalAmount,
        hoursUntilCheckIn,
        policyApplied: 'Full 100% refund (Cancelled more than 48 hours before check-in)'
      };
    } else if (hoursUntilCheckIn >= 24) {
      const half = Math.round(totalAmount * 0.5 * 100) / 100;
      return {
        refundPercentage: 50,
        refundAmount: half,
        hoursUntilCheckIn,
        policyApplied: 'Partial 50% refund (Cancelled between 24 and 48 hours before check-in)'
      };
    } else {
      return {
        refundPercentage: 0,
        refundAmount: 0.00,
        hoursUntilCheckIn,
        policyApplied: 'Non-refundable (Cancelled less than 24 hours before check-in)'
      };
    }
  }

  private isDateInRange(mmdd: string, start: string, end: string): boolean {
    if (start <= end) {
      return mmdd >= start && mmdd <= end;
    } else {
      // Year-end rollover: e.g. 12-15 to 01-05
      return mmdd >= start || mmdd <= end;
    }
  }
}
