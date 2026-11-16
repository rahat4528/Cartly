export interface FareSnapshot {
  baseFare: number;
  carrierFees: number;
  aviationTaxes: number;
  totalAmount: number;
}

export class PricingService {
  public calculateFare(rawBaseFare: number, passengerCount: number): FareSnapshot {
    const baseFare = rawBaseFare;
    const carrierFees = Math.round(baseFare * 0.15); // fuel & carrier surcharge
    const aviationTaxes = passengerCount * 60; // $25 TSA security + $35 airport facility tax
    const totalAmount = baseFare + carrierFees + aviationTaxes;

    return {
      baseFare,
      carrierFees,
      aviationTaxes,
      totalAmount
    };
  }
}
