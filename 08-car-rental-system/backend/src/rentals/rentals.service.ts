import { CarRentalStore, RentalRecord, InspectionRecord } from '../database/store.js';
import { PricingService } from '../pricing/pricing.service.js';
import { RentalStateMachine, RentalStatus } from './state-machine.js';
import { SandboxPaymentAdapter } from '../payments/payment.adapter.js';
import { v4 as uuidv4 } from 'uuid';

export interface CreateRentalDto {
  vehicleId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  includeInsurance?: boolean;
  cardToken?: string;
  idempotencyKey?: string;
}

export class RentalsService {
  private store = CarRentalStore.getInstance();
  private pricingService = new PricingService();
  private paymentAdapter = SandboxPaymentAdapter.getInstance();
  private rentalLock = false;

  async createRental(userId: string, dto: CreateRentalDto): Promise<RentalRecord> {
    while (this.rentalLock) {
      await new Promise(resolve => setTimeout(resolve, 5));
    }
    this.rentalLock = true;

    try {
      const { vehicleId, startDate, endDate, includeInsurance, cardToken, idempotencyKey } = dto;

      const user = this.store.findUser(userId);
      if (!user) throw new Error('User not found');

      // 1. Driver license verification check
      if (!user.license || user.license.status !== 'VERIFIED') {
        const err: any = new Error(
          'Driver license verification required: You must have a verified driver license on file prior to vehicle booking.'
        );
        err.statusCode = 400;
        throw err;
      }

      // 2. Validate dates
      const reqStart = new Date(startDate).getTime();
      const reqEnd = new Date(endDate).getTime();
      if (isNaN(reqStart) || isNaN(reqEnd) || reqEnd <= reqStart) {
        throw new Error('Invalid rental dates. Return date must be after pickup date.');
      }

      const vehicle = this.store.findVehicle(vehicleId);
      if (!vehicle) throw new Error(`Vehicle ${vehicleId} not found in fleet.`);

      // 3. Overlap check with existing active rentals
      for (const r of this.store.rentals) {
        if (r.vehicleId !== vehicleId || r.status === 'CANCELLED') continue;
        const rStart = new Date(r.startDate).getTime();
        const rEnd = new Date(r.endDate).getTime();

        if (reqStart < rEnd && reqEnd > rStart) {
          const err: any = new Error(
            `Vehicle unavailable for the requested dates: ${vehicle.make} ${vehicle.model} is already booked from ${r.startDate} to ${r.endDate}.`
          );
          err.statusCode = 409;
          throw err;
        }
      }

      // 4. Authoritative pricing quote
      const quote = this.pricingService.calculateQuote(
        vehicle.dailyRate,
        startDate,
        endDate,
        includeInsurance ?? true
      );

      // 5. Payment authorization (Rental fees + $250 Security Deposit)
      const payment = this.paymentAdapter.processPayment(
        quote.grandTotal,
        'USD',
        cardToken || 'tok_visa_success',
        idempotencyKey || `idem_car_${Date.now()}`
      );

      if (!payment.success) {
        const err: any = new Error(payment.error || 'Payment authorization failed');
        err.statusCode = 402;
        throw err;
      }

      const rentalNumber = `RNT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const rental: RentalRecord = {
        id: `rnt_${uuidv4().substring(0, 8)}`,
        rentalNumber,
        userId,
        vehicleId,
        startDate,
        endDate,
        totalDays: quote.totalDays,
        dailyRateApplied: quote.effectiveDailyRate,
        durationDiscountPct: quote.discountPct,
        baseRentalAmount: quote.baseRentalSubtotal,
        insuranceAmount: quote.insuranceSubtotal,
        securityDepositAmount: quote.securityDeposit,
        totalCharged: quote.grandTotal,
        depositRefunded: 0.0,
        damageDeduction: 0.0,
        status: 'RESERVED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.store.rentals.push(rental);
      return rental;
    } finally {
      this.rentalLock = false;
    }
  }

  pickupVehicle(
    rentalId: string,
    agentId: string,
    odometer: number,
    fuelLevel: string = 'FULL'
  ): RentalRecord {
    const rental = this.store.findRental(rentalId);
    if (!rental) throw new Error(`Rental ${rentalId} not found`);

    RentalStateMachine.validate(rental.status, 'ACTIVE_RENTAL');
    rental.status = 'ACTIVE_RENTAL';
    rental.updatedAt = new Date().toISOString();

    const inspection: InspectionRecord = {
      id: `ins_${uuidv4().substring(0, 8)}`,
      rentalId: rental.id,
      pickupOdometer: odometer,
      pickupFuelLevel: fuelLevel,
      damageFeeAssessed: 0.0,
      inspectedByAgentId: agentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    rental.inspection = inspection;
    this.store.inspections.push(inspection);

    return rental;
  }

  returnVehicle(
    rentalId: string,
    agentId: string,
    returnOdometer: number,
    returnFuelLevel: string = 'FULL',
    damagesNotes?: string,
    damageFee: number = 0.0
  ): RentalRecord {
    const rental = this.store.findRental(rentalId);
    if (!rental) throw new Error(`Rental ${rentalId} not found`);

    RentalStateMachine.validate(rental.status, 'RETURNED');
    rental.status = 'RETURNED';
    rental.damageDeduction = damageFee;
    rental.updatedAt = new Date().toISOString();

    if (rental.inspection) {
      rental.inspection.returnOdometer = returnOdometer;
      rental.inspection.returnFuelLevel = returnFuelLevel;
      rental.inspection.damagesNotes = damagesNotes || 'No damages noted';
      rental.inspection.damageFeeAssessed = damageFee;
      rental.inspection.updatedAt = new Date().toISOString();
    }

    return rental;
  }

  settleRental(rentalId: string, agentId: string): RentalRecord {
    const rental = this.store.findRental(rentalId);
    if (!rental) throw new Error(`Rental ${rentalId} not found`);

    RentalStateMachine.validate(rental.status, 'COMPLETED');
    rental.status = 'COMPLETED';

    const netDepositRefund = Math.max(0, rental.securityDepositAmount - rental.damageDeduction);
    rental.depositRefunded = netDepositRefund;
    rental.updatedAt = new Date().toISOString();

    if (netDepositRefund > 0) {
      this.paymentAdapter.processRefund(`txn_dep_${rental.id}`, netDepositRefund);
    }

    return rental;
  }

  cancelRental(rentalId: string, userId: string, role: string): RentalRecord {
    const rental = this.store.findRental(rentalId);
    if (!rental) throw new Error(`Rental ${rentalId} not found`);

    if (rental.userId !== userId && role !== 'FLEET_MANAGER') {
      const err: any = new Error('Forbidden: You can only cancel your own reservations.');
      err.statusCode = 403;
      throw err;
    }

    RentalStateMachine.validate(rental.status, 'CANCELLED');
    rental.status = 'CANCELLED';
    rental.updatedAt = new Date().toISOString();

    // Refund full amount
    this.paymentAdapter.processRefund(`txn_canc_${rental.id}`, rental.totalCharged);

    return rental;
  }

  getUserRentals(userId: string): any[] {
    return this.store.rentals
      .filter(r => r.userId === userId)
      .map(r => ({
        ...r,
        vehicle: this.store.findVehicle(r.vehicleId)
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getRentalById(rentalId: string): any {
    const rental = this.store.findRental(rentalId);
    if (!rental) return null;
    return {
      ...rental,
      vehicle: this.store.findVehicle(rental.vehicleId),
      renter: this.store.findUser(rental.userId)
    };
  }
}
