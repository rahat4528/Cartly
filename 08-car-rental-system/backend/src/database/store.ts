import { initialCarRentalSeed } from '../../../database/seed.js';

export interface VehicleRecord {
  id: string;
  make: string;
  model: string;
  year: number;
  category: 'SEDAN' | 'SUV' | 'ELECTRIC' | 'LUXURY' | 'MINIVAN' | 'COMPACT';
  vin: string;
  licensePlate: string;
  transmission: 'AUTOMATIC' | 'MANUAL';
  fuelType: 'GASOLINE' | 'ELECTRIC' | 'HYBRID';
  seats: number;
  dailyRate: number;
  imageUrl: string;
  features: string[];
  isAvailable: boolean;
}

export interface InspectionRecord {
  id: string;
  rentalId: string;
  pickupOdometer: number;
  returnOdometer?: number;
  pickupFuelLevel: string;
  returnFuelLevel?: string;
  damagesNotes?: string;
  damageFeeAssessed: number;
  inspectedByAgentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RentalRecord {
  id: string;
  rentalNumber: string;
  userId: string;
  vehicleId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  totalDays: number;
  dailyRateApplied: number;
  durationDiscountPct: number;
  baseRentalAmount: number;
  insuranceAmount: number;
  securityDepositAmount: number;
  totalCharged: number;
  depositRefunded: number;
  damageDeduction: number;
  status: 'RESERVED' | 'ACTIVE_RENTAL' | 'RETURNED' | 'COMPLETED' | 'CANCELLED';
  inspection?: InspectionRecord;
  createdAt: string;
  updatedAt: string;
}

export class CarRentalStore {
  private static instance: CarRentalStore;

  users: any[] = [];
  vehicles: VehicleRecord[] = [];
  rentals: RentalRecord[] = [];
  inspections: InspectionRecord[] = [];
  payments: any[] = [];

  private constructor() {
    this.resetToSeed();
  }

  static getInstance(): CarRentalStore {
    if (!CarRentalStore.instance) {
      CarRentalStore.instance = new CarRentalStore();
    }
    return CarRentalStore.instance;
  }

  resetToSeed(): void {
    this.users = JSON.parse(JSON.stringify(initialCarRentalSeed.users));
    this.vehicles = JSON.parse(JSON.stringify(initialCarRentalSeed.vehicles));
    this.rentals = JSON.parse(JSON.stringify(initialCarRentalSeed.rentals));
    this.inspections = [];
    this.payments = [];
  }

  findUser(id: string) {
    return this.users.find(u => u.id === id);
  }

  findUserByEmail(email: string) {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  findVehicle(id: string) {
    return this.vehicles.find(v => v.id === id);
  }

  findRental(idOrNumber: string) {
    return this.rentals.find(r => r.id === idOrNumber || r.rentalNumber === idOrNumber);
  }
}
