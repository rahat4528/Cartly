export interface RentalPricingQuote {
  totalDays: number;
  baseDailyRate: number;
  discountPct: number;
  effectiveDailyRate: number;
  baseRentalSubtotal: number;
  insuranceDailyRate: number;
  insuranceSubtotal: number;
  securityDeposit: number;
  tax: number;
  grandTotal: number;
}

export class PricingService {
  readonly SECURITY_DEPOSIT_AMOUNT = 250.00;
  readonly CDW_INSURANCE_DAILY_RATE = 19.99;
  readonly TAX_RATE = 0.0825; // 8.25%

  calculateQuote(
    baseDailyRate: number,
    startDateStr: string,
    endDateStr: string,
    includeInsurance: boolean = true
  ): RentalPricingQuote {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);

    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    let discountPct = 0.0;
    if (diffDays >= 30) {
      discountPct = 0.30; // 30% monthly discount
    } else if (diffDays >= 7) {
      discountPct = 0.15; // 15% weekly discount
    }

    const effectiveDailyRate = Math.round(baseDailyRate * (1 - discountPct) * 100) / 100;
    const baseRentalSubtotal = Math.round(effectiveDailyRate * diffDays * 100) / 100;
    const insuranceSubtotal = includeInsurance
      ? Math.round(this.CDW_INSURANCE_DAILY_RATE * diffDays * 100) / 100
      : 0;

    const taxableAmount = baseRentalSubtotal + insuranceSubtotal;
    const tax = Math.round(taxableAmount * this.TAX_RATE * 100) / 100;

    const grandTotal = Math.round((baseRentalSubtotal + insuranceSubtotal + tax + this.SECURITY_DEPOSIT_AMOUNT) * 100) / 100;

    return {
      totalDays: diffDays,
      baseDailyRate,
      discountPct,
      effectiveDailyRate,
      baseRentalSubtotal,
      insuranceDailyRate: includeInsurance ? this.CDW_INSURANCE_DAILY_RATE : 0,
      insuranceSubtotal,
      securityDeposit: this.SECURITY_DEPOSIT_AMOUNT,
      tax,
      grandTotal
    };
  }
}
