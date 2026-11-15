import { store, Property } from '../database/store';
import { v4 as uuidv4 } from 'uuid';

export interface PropertyFilters {
  propertyType?: string;
  minRent?: number;
  maxRent?: number;
  bedrooms?: number;
  petPolicy?: string;
  city?: string;
  status?: string;
}

export class PropertiesService {
  static getProperties(filters: PropertyFilters = {}): Property[] {
    return store.properties.filter(prop => {
      if (filters.status && prop.status !== filters.status) return false;
      if (filters.propertyType && prop.propertyType !== filters.propertyType) return false;
      if (filters.minRent && prop.monthlyRent < filters.minRent) return false;
      if (filters.maxRent && prop.monthlyRent > filters.maxRent) return false;
      if (filters.bedrooms && prop.bedrooms < filters.bedrooms) return false;
      if (filters.petPolicy && filters.petPolicy !== 'ALL') {
        if (filters.petPolicy === 'PETS_ALLOWED' && prop.petPolicy === 'NO_PETS') return false;
        if (filters.petPolicy === 'CATS_ONLY' && prop.petPolicy !== 'CATS_ONLY' && prop.petPolicy !== 'ALLOWED') return false;
      }
      if (filters.city && !prop.city.toLowerCase().includes(filters.city.toLowerCase())) return false;
      return true;
    });
  }

  static getPropertyById(id: string): Property | null {
    return store.properties.find(p => p.id === id) || null;
  }

  static createProperty(landlordId: string, data: Omit<Property, 'id' | 'landlordId' | 'createdAt'>): Property {
    const newProperty: Property = {
      ...data,
      id: `prop-${uuidv4().substring(0, 8)}`,
      landlordId,
      createdAt: new Date().toISOString()
    };
    store.properties.push(newProperty);
    return newProperty;
  }

  static updateProperty(id: string, landlordId: string, updates: Partial<Property>, isAdmin: boolean = false): Property {
    const property = store.properties.find(p => p.id === id);
    if (!property) throw new Error('Property not found');
    if (!isAdmin && property.landlordId !== landlordId) {
      const err = new Error('Forbidden: You do not own this rental property');
      (err as any).statusCode = 403;
      throw err;
    }

    Object.assign(property, updates);
    return property;
  }
}
