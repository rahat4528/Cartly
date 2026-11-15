import { RealEstateStore, PropertyRecord, PriceHistoryRecord } from '../database/store.js';
import { SpatialService } from '../spatial/spatial.service.js';
import { ListingStateMachine, ListingStatus } from './state-machine.js';
import { v4 as uuidv4 } from 'uuid';

export interface PropertyQueryFilters {
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  minLat?: number;
  maxLat?: number;
  minLng?: number;
  maxLng?: number;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  includeAllStatus?: boolean;
}

export class PropertiesService {
  private store = RealEstateStore.getInstance();

  getProperties(filters: PropertyQueryFilters) {
    let list = this.store.properties;

    // Default status filter
    if (!filters.includeAllStatus) {
      list = list.filter(p => p.status === 'PUBLISHED');
    }

    if (filters.propertyType && filters.propertyType !== 'ALL') {
      list = list.filter(p => p.propertyType === filters.propertyType);
    }

    if (filters.minPrice !== undefined) {
      list = list.filter(p => p.price >= filters.minPrice!);
    }

    if (filters.maxPrice !== undefined) {
      list = list.filter(p => p.price <= filters.maxPrice!);
    }

    if (filters.bedrooms !== undefined) {
      list = list.filter(p => p.bedrooms >= filters.bedrooms!);
    }

    if (filters.bathrooms !== undefined) {
      list = list.filter(p => p.bathrooms >= filters.bathrooms!);
    }

    // Spatial Bounding Box Filter
    if (
      filters.minLat !== undefined &&
      filters.maxLat !== undefined &&
      filters.minLng !== undefined &&
      filters.maxLng !== undefined
    ) {
      list = list.filter(p =>
        SpatialService.isWithinBoundingBox(
          p.latitude,
          p.longitude,
          filters.minLat!,
          filters.maxLat!,
          filters.minLng!,
          filters.maxLng!
        )
      );
    }

    // Spatial Radius Proximity Filter (Haversine)
    if (filters.lat !== undefined && filters.lng !== undefined && filters.radiusKm !== undefined) {
      list = list
        .map(p => {
          const distKm = SpatialService.calculateDistanceKm(
            filters.lat!,
            filters.lng!,
            p.latitude,
            p.longitude
          );
          return { ...p, distanceKm: distKm };
        })
        .filter(p => p.distanceKm <= filters.radiusKm!)
        .sort((a, b) => a.distanceKm - b.distanceKm);
    }

    return list;
  }

  getPropertyById(idOrSlug: string) {
    const property = this.store.findProperty(idOrSlug);
    if (!property) return null;

    const agent = this.store.findUser(property.agentId);
    const { passwordHash: _, ...safeAgent } = agent || ({} as any);

    return {
      ...property,
      agent: safeAgent
    };
  }

  createProperty(agentId: string, data: any): PropertyRecord {
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const property: PropertyRecord = {
      id: `prop_${uuidv4().substring(0, 8)}`,
      title: data.title,
      slug,
      description: data.description || '',
      propertyType: data.propertyType || 'SINGLE_FAMILY',
      price: Number(data.price),
      bedrooms: Number(data.bedrooms),
      bathrooms: Number(data.bathrooms),
      sqft: Number(data.sqft),
      yearBuilt: Number(data.yearBuilt) || 2020,
      hoaFee: Number(data.hoaFee) || 0.0,
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
      images: data.images && data.images.length > 0 ? data.images : [
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'
      ],
      status: data.status || 'PUBLISHED',
      agentId,
      priceHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.store.properties.push(property);
    return property;
  }

  updateProperty(propertyId: string, agentId: string, role: string, updates: any): PropertyRecord {
    const property = this.store.findProperty(propertyId);
    if (!property) throw new Error(`Property ${propertyId} not found`);

    // Strict Agent Ownership check
    if (property.agentId !== agentId && role !== 'PLATFORM_ADMIN') {
      const err: any = new Error('Forbidden: You do not have ownership of this property listing.');
      err.statusCode = 403;
      throw err;
    }

    // Immutable Price History Ledger Logging
    if (updates.price !== undefined && Number(updates.price) !== property.price) {
      const oldPrice = property.price;
      const newPrice = Number(updates.price);
      const diff = newPrice - oldPrice;
      const pct = Math.round((diff / oldPrice) * 10000) / 100;

      const historyRecord: PriceHistoryRecord = {
        id: `ph_${uuidv4().substring(0, 8)}`,
        date: new Date().toISOString().split('T')[0],
        previousPrice: oldPrice,
        newPrice,
        priceChangeAmount: diff,
        priceChangePercent: pct,
        reason: updates.priceChangeReason || 'Market Price Adjustment'
      };

      property.priceHistory.unshift(historyRecord);
      property.price = newPrice;
    }

    if (updates.title) property.title = updates.title;
    if (updates.description) property.description = updates.description;
    if (updates.bedrooms) property.bedrooms = Number(updates.bedrooms);
    if (updates.bathrooms) property.bathrooms = Number(updates.bathrooms);
    if (updates.sqft) property.sqft = Number(updates.sqft);
    if (updates.images) property.images = updates.images;

    property.updatedAt = new Date().toISOString();
    return property;
  }

  updateStatus(propertyId: string, agentId: string, role: string, nextStatus: ListingStatus): PropertyRecord {
    const property = this.store.findProperty(propertyId);
    if (!property) throw new Error(`Property ${propertyId} not found`);

    if (property.agentId !== agentId && role !== 'PLATFORM_ADMIN') {
      const err: any = new Error('Forbidden: You do not have ownership of this property listing.');
      err.statusCode = 403;
      throw err;
    }

    ListingStateMachine.validate(property.status, nextStatus);
    property.status = nextStatus;
    property.updatedAt = new Date().toISOString();

    return property;
  }
}
