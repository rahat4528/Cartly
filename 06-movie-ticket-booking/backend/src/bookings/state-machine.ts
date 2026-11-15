export type BookingStatus =
  | 'HELD'
  | 'CONFIRMED'
  | 'ADMITTED'
  | 'CANCELLED'
  | 'EXPIRED';

export class BookingStateMachine {
  private static readonly transitions: Record<BookingStatus, BookingStatus[]> = {
    HELD: ['CONFIRMED', 'EXPIRED', 'CANCELLED'],
    CONFIRMED: ['ADMITTED', 'CANCELLED'],
    ADMITTED: [],
    CANCELLED: [],
    EXPIRED: []
  };

  static canTransition(from: BookingStatus, to: BookingStatus): boolean {
    const allowed = this.transitions[from] || [];
    return allowed.includes(to);
  }

  static validate(from: BookingStatus, to: BookingStatus): void {
    if (!this.canTransition(from, to)) {
      throw new Error(`Invalid cinema booking status transition: cannot transition from ${from} to ${to}`);
    }
  }

  static isTerminal(status: BookingStatus): boolean {
    return (this.transitions[status] || []).length === 0;
  }
}
