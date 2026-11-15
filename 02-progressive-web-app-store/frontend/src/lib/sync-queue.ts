export interface QueuedAction {
  idempotencyKey: string;
  actionType: 'ADD_TO_CART' | 'UPDATE_CART_QUANTITY' | 'REMOVE_CART_ITEM' | 'TOGGLE_WISHLIST';
  payload: any;
  clientTimestamp: number;
}

const STORAGE_KEY = 'cartly_pwa_pending_actions';

export class SyncQueue {
  static getQueue(): QueuedAction[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static enqueue(actionType: QueuedAction['actionType'], payload: any): QueuedAction {
    const queue = this.getQueue();
    const action: QueuedAction = {
      idempotencyKey: `idem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      actionType,
      payload,
      clientTimestamp: Date.now()
    };
    queue.push(action);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    return action;
  }

  static clearQueue(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  }

  static removeAction(idempotencyKey: string): void {
    const queue = this.getQueue().filter(a => a.idempotencyKey !== idempotencyKey);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  }
}
