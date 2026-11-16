import { v4 as uuidv4 } from 'uuid';
import { initialUsers, initialAirports, initialFlights } from '../../../database/seed.js';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'PASSENGER' | 'ADMIN';
}

export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface Flight {
  id: string;
  flightNumber: string;
  airlineName: string;
  aircraftModel: string;
  originCode: string;
  destinationCode: string;
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  durationMinutes: number;
  economyCapacity: number;
  economyBooked: number;
  economyPrice: number;
  businessCapacity: number;
  businessBooked: number;
  businessPrice: number;
  isDemonstration: boolean;
}

export interface Passenger {
  firstName: string;
  lastName: string;
  passportNumber: string;
  dateOfBirth: string;
  seatNumber?: string;
}

export interface Booking {
  id: string;
  pnrLocator: string;
  userId: string;
  flightId: string;
  flightIds?: string[]; // for connecting itineraries
  cabinClass: 'ECONOMY' | 'BUSINESS' | 'FIRST';
  passengerCount: number;
  baseFare: number;
  carrierFees: number;
  aviationTaxes: number;
  totalAmount: number;
  status: 'SEARCHED' | 'PRICED' | 'HELD' | 'PAID' | 'TICKETED' | 'CANCELLED' | 'EXPIRED';
  seatNumbers: string[];
  passengers: Passenger[];
  isDemonstration: boolean;
  ticketUrl?: string;
  createdAt: string;
}

export class FlightStore {
  private static instance: FlightStore;

  public users: User[] = [];
  public airports: Airport[] = [];
  public flights: Flight[] = [];
  public bookings: Booking[] = [];
  public reservedSeats: Map<string, Set<string>> = new Map(); // flightId -> Set of seatNumbers

  private constructor() {
    this.resetToSeed();
  }

  public static getInstance(): FlightStore {
    if (!FlightStore.instance) {
      FlightStore.instance = new FlightStore();
    }
    return FlightStore.instance;
  }

  public resetToSeed(): void {
    this.users = JSON.parse(JSON.stringify(initialUsers));
    this.airports = JSON.parse(JSON.stringify(initialAirports));
    this.flights = JSON.parse(JSON.stringify(initialFlights));
    this.bookings = [];
    this.reservedSeats.clear();

    // Mark pre-booked seats for flight 1
    const sfoJfkSeats = new Set<string>();
    sfoJfkSeats.add('12A');
    sfoJfkSeats.add('12B');
    this.reservedSeats.set('flt_sfo_jfk_01', sfoJfkSeats);
  }

  public isSeatAvailable(flightId: string, seatNumber: string): boolean {
    const seats = this.reservedSeats.get(flightId);
    if (!seats) return true;
    return !seats.has(seatNumber);
  }

  public reserveSeat(flightId: string, seatNumber: string): void {
    if (!this.reservedSeats.has(flightId)) {
      this.reservedSeats.set(flightId, new Set<string>());
    }
    this.reservedSeats.get(flightId)!.add(seatNumber);
  }

  public releaseSeat(flightId: string, seatNumber: string): void {
    const seats = this.reservedSeats.get(flightId);
    if (seats) {
      seats.delete(seatNumber);
    }
  }
}
