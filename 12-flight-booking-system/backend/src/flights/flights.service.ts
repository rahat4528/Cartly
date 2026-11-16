import { FlightStore, Flight, Airport } from '../database/store.js';

export interface Itinerary {
  id: string;
  type: 'DIRECT' | 'CONNECTING';
  legs: Flight[];
  totalDurationMinutes: number;
  totalPrice: number;
  originCode: string;
  destinationCode: string;
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  connectionMinutes?: number;
  layoverAirport?: string;
  isDemonstration: boolean;
}

export class FlightsService {
  private store = FlightStore.getInstance();

  public getAirports(): Airport[] {
    return this.store.airports;
  }

  public getFlightById(id: string): Flight | undefined {
    return this.store.flights.find(f => f.id === id);
  }

  public searchFlights(params: {
    origin: string;
    destination: string;
    date: string;
    cabinClass?: 'ECONOMY' | 'BUSINESS';
    passengers?: number;
  }): Itinerary[] {
    const origin = params.origin.toUpperCase();
    const destination = params.destination.toUpperCase();
    const date = params.date;
    const cabin = params.cabinClass || 'ECONOMY';
    const pax = params.passengers || 1;

    const itineraries: Itinerary[] = [];

    // 1. Direct Flights
    const directFlights = this.store.flights.filter(f => {
      if (f.originCode !== origin || f.destinationCode !== destination) return false;
      if (f.departureDate !== date) return false;

      const availableSeats = cabin === 'ECONOMY'
        ? f.economyCapacity - f.economyBooked
        : f.businessCapacity - f.businessBooked;

      return availableSeats >= pax;
    });

    for (const df of directFlights) {
      const price = cabin === 'ECONOMY' ? df.economyPrice : df.businessPrice;
      itineraries.push({
        id: `itin_${df.id}`,
        type: 'DIRECT',
        legs: [df],
        totalDurationMinutes: df.durationMinutes,
        totalPrice: price * pax,
        originCode: df.originCode,
        destinationCode: df.destinationCode,
        departureDate: df.departureDate,
        departureTime: df.departureTime,
        arrivalDate: df.arrivalDate,
        arrivalTime: df.arrivalTime,
        isDemonstration: true
      });
    }

    // 2. Connecting Itineraries (1-stop)
    const leg1Candidates = this.store.flights.filter(f => {
      if (f.originCode !== origin || f.destinationCode === destination) return false;
      if (f.departureDate !== date) return false;

      const avail = cabin === 'ECONOMY' ? f.economyCapacity - f.economyBooked : f.businessCapacity - f.businessBooked;
      return avail >= pax;
    });

    for (const leg1 of leg1Candidates) {
      const layover = leg1.destinationCode;
      const leg2Candidates = this.store.flights.filter(f => {
        if (f.originCode !== layover || f.destinationCode !== destination) return false;

        const avail = cabin === 'ECONOMY' ? f.economyCapacity - f.economyBooked : f.businessCapacity - f.businessBooked;
        return avail >= pax;
      });

      for (const leg2 of leg2Candidates) {
        // Temporal connection check
        const leg1ArrTime = this.parseDateTime(leg1.arrivalDate, leg1.arrivalTime);
        const leg2DepTime = this.parseDateTime(leg2.departureDate, leg2.departureTime);

        const connectionMinutes = (leg2DepTime - leg1ArrTime) / (1000 * 60);

        // Minimum connection time: 45 minutes; Max connection: 480 minutes (8 hours)
        if (connectionMinutes >= 45 && connectionMinutes <= 480) {
          const leg1Price = cabin === 'ECONOMY' ? leg1.economyPrice : leg1.businessPrice;
          const leg2Price = cabin === 'ECONOMY' ? leg2.economyPrice : leg2.businessPrice;
          const combinedPrice = Math.round((leg1Price + leg2Price) * 0.9); // 10% connecting itinerary discount

          itineraries.push({
            id: `itin_${leg1.id}_${leg2.id}`,
            type: 'CONNECTING',
            legs: [leg1, leg2],
            totalDurationMinutes: leg1.durationMinutes + leg2.durationMinutes + connectionMinutes,
            totalPrice: combinedPrice * pax,
            originCode: leg1.originCode,
            destinationCode: leg2.destinationCode,
            departureDate: leg1.departureDate,
            departureTime: leg1.departureTime,
            arrivalDate: leg2.arrivalDate,
            arrivalTime: leg2.arrivalTime,
            connectionMinutes,
            layoverAirport: layover,
            isDemonstration: true
          });
        }
      }
    }

    return itineraries;
  }

  private parseDateTime(dateStr: string, timeStr: string): number {
    return new Date(`${dateStr}T${timeStr}:00Z`).getTime();
  }
}
