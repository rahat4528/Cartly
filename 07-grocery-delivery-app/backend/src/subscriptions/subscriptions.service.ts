import { GroceryStore, SubscriptionRecord } from '../database/store.js';
import { v4 as uuidv4 } from 'uuid';

export interface CreateSubscriptionDto {
  frequency: 'WEEKLY' | 'BI_WEEKLY';
  preferredDay: string;
  preferredSlotTime: string;
  itemsSummary: string;
}

export class SubscriptionsService {
  private store = GroceryStore.getInstance();

  createSubscription(userId: string, dto: CreateSubscriptionDto): SubscriptionRecord {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + (dto.frequency === 'WEEKLY' ? 7 : 14));

    const sub: SubscriptionRecord = {
      id: `sub_${uuidv4().substring(0, 8)}`,
      userId,
      frequency: dto.frequency,
      preferredDay: dto.preferredDay,
      preferredSlotTime: dto.preferredSlotTime,
      itemsSummary: dto.itemsSummary,
      isActive: true,
      nextScheduledAt: nextDate.toISOString(),
      createdAt: new Date().toISOString()
    };

    this.store.subscriptions.push(sub);
    return sub;
  }

  getUserSubscriptions(userId: string): SubscriptionRecord[] {
    return this.store.subscriptions.filter(s => s.userId === userId);
  }
}
