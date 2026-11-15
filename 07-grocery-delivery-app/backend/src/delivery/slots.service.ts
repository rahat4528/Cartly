import { GroceryStore, DeliverySlotRecord } from '../database/store.js';

export class DeliverySlotsService {
  private store = GroceryStore.getInstance();
  private slotLock = false;

  getSlots(date?: string) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const slots = this.store.deliverySlots.filter(s => s.slotDate === targetDate);

    return slots.map(s => {
      const remaining = Math.max(0, s.maxCapacity - s.bookedCount);
      return {
        ...s,
        remainingCapacity: remaining,
        isSoldOut: remaining === 0,
        status: remaining === 0 ? 'SOLD_OUT' : 'AVAILABLE'
      };
    });
  }

  async reserveSlot(slotId: string): Promise<DeliverySlotRecord> {
    while (this.slotLock) {
      await new Promise(resolve => setTimeout(resolve, 5));
    }
    this.slotLock = true;

    try {
      const slot = this.store.findSlot(slotId);
      if (!slot) {
        throw new Error(`Delivery slot ${slotId} not found`);
      }

      if (slot.bookedCount >= slot.maxCapacity) {
        const err: any = new Error(
          `Delivery slot capacity full: The selected window (${slot.startTime}-${slot.endTime}) has reached its maximum quota of ${slot.maxCapacity} orders. Please choose another delivery time.`
        );
        err.statusCode = 409;
        throw err;
      }

      slot.bookedCount += 1;
      return slot;
    } finally {
      this.slotLock = false;
    }
  }

  releaseSlot(slotId: string): void {
    const slot = this.store.findSlot(slotId);
    if (slot && slot.bookedCount > 0) {
      slot.bookedCount -= 1;
    }
  }
}
