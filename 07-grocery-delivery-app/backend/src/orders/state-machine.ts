export type OrderStatus = 'PLACED' | 'PICKING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';

export class OrderStateMachine {
  private static transitions: Record<OrderStatus, OrderStatus[]> = {
    PLACED: ['PICKING', 'CANCELLED'],
    PICKING: ['OUT_FOR_DELIVERY', 'CANCELLED'],
    OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
    DELIVERED: [],
    CANCELLED: []
  };

  static canTransition(current: OrderStatus, next: OrderStatus): boolean {
    return this.transitions[current]?.includes(next) ?? false;
  }

  static validate(current: OrderStatus, next: OrderStatus): void {
    if (!this.canTransition(current, next)) {
      throw new Error(`Invalid order transition from ${current} to ${next}`);
    }
  }
}
