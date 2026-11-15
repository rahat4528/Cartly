export type ReservationStatus =
  | 'HELD'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED';

export class ReservationStateMachine {
  private static readonly transitions: Record<ReservationStatus, ReservationStatus[]> = {
    HELD: ['CONFIRMED', 'EXPIRED', 'CANCELLED'],
    CONFIRMED: ['CHECKED_IN', 'CANCELLED'],
    CHECKED_IN: ['COMPLETED'],
    COMPLETED: [],
    CANCELLED: [],
    EXPIRED: []
  };

  static canTransition(from: ReservationStatus, to: ReservationStatus): boolean {
    const allowed = this.transitions[from] || [];
    return allowed.includes(to);
  }

  static validate(from: ReservationStatus, to: ReservationStatus): void {
    if (!this.canTransition(from, to)) {
      throw new Error(`Invalid reservation status transition: cannot transition from ${from} to ${to}`);
    }
  }

  static isTerminal(status: ReservationStatus): boolean {
    return (this.transitions[status] || []).length === 0;
  }
}
