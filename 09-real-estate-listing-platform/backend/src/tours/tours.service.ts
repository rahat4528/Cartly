import { RealEstateStore, TourRecord } from '../database/store.js';
import { v4 as uuidv4 } from 'uuid';

export interface CreateTourDto {
  propertyId: string;
  tourDate: string; // YYYY-MM-DD
  tourTime: string; // "14:00"
  tourType?: 'IN_PERSON' | 'VIRTUAL_WALKTHROUGH';
  notes?: string;
}

export class ToursService {
  private store = RealEstateStore.getInstance();

  scheduleTour(userId: string, dto: CreateTourDto): TourRecord {
    const { propertyId, tourDate, tourTime, tourType, notes } = dto;

    const property = this.store.findProperty(propertyId);
    if (!property) throw new Error(`Property ${propertyId} not found`);

    // Conflict check: no duplicate appointments for same property & slot
    const existing = this.store.tours.find(
      t => t.propertyId === propertyId && t.tourDate === tourDate && t.tourTime === tourTime && t.status === 'SCHEDULED'
    );

    if (existing) {
      const err: any = new Error(
        `Viewing appointment conflict: A tour is already scheduled for ${property.title} on ${tourDate} at ${tourTime}. Please choose another time slot.`
      );
      err.statusCode = 409;
      throw err;
    }

    const tour: TourRecord = {
      id: `tour_${uuidv4().substring(0, 8)}`,
      propertyId,
      userId,
      tourDate,
      tourTime,
      tourType: tourType || 'IN_PERSON',
      notes: notes || '',
      status: 'SCHEDULED',
      createdAt: new Date().toISOString()
    };

    this.store.tours.push(tour);
    return tour;
  }

  getUserTours(userId: string): any[] {
    return this.store.tours
      .filter(t => t.userId === userId)
      .map(t => ({
        ...t,
        property: this.store.findProperty(t.propertyId)
      }));
  }
}
