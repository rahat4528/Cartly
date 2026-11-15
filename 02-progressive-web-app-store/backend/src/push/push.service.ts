import { PwaStore } from '../database/store.js';
import { v4 as uuidv4 } from 'uuid';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
}

export class PushService {
  private store = PwaStore.getInstance();

  subscribe(userId: string, data: PushSubscriptionData) {
    if (!data.endpoint || !data.keys?.p256dh || !data.keys?.auth) {
      throw new Error('Invalid push subscription payload');
    }

    // Upsert by endpoint
    const existingIndex = this.store.deviceSubscriptions.findIndex(s => s.endpoint === data.endpoint);
    const subRecord = {
      id: `sub_${uuidv4().substring(0, 8)}`,
      userId,
      endpoint: data.endpoint,
      p256dh: data.keys.p256dh,
      authKey: data.keys.auth,
      userAgent: data.userAgent || 'PWA Client',
      createdAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      this.store.deviceSubscriptions[existingIndex] = subRecord;
    } else {
      this.store.deviceSubscriptions.push(subRecord);
    }

    return {
      success: true,
      subscriptionId: subRecord.id
    };
  }

  unsubscribe(endpoint: string) {
    this.store.deviceSubscriptions = this.store.deviceSubscriptions.filter(s => s.endpoint !== endpoint);
    return { success: true };
  }

  getSubscriptions(userId?: string) {
    if (userId) {
      return this.store.deviceSubscriptions.filter(s => s.userId === userId);
    }
    return this.store.deviceSubscriptions;
  }

  broadcast(message: { title: string; body: string; url?: string }) {
    const deliveredCount = this.store.deviceSubscriptions.length;
    return {
      success: true,
      deliveredCount,
      timestamp: new Date().toISOString()
    };
  }
}
