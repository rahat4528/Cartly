export type ReservationStatus =
  | 'CONFIRMED'
  | 'SEATED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'WAITLIST'
  | 'PROMOTED';

export class ReservationStateMachine {
  private static readonly transitions: Record<ReservationStatus, ReservationStatus[]> = {
    CONFIRMED: ['SEATED', 'CANCELLED', 'NO_SHOW'],
    SEATED: ['COMPLETED'],
    COMPLETED: [],
    CANCELLED: [],
    NO_SHOW: [],
    WAITLIST: ['PROMOTED', 'CANCELLED'],
    PROMOTED: ['CONFIRMED', 'CANCELLED']
  };

  static canTransition(from: ReservationStatus, to: ReservationStatus): boolean {
    const allowed = this.transitions[from] || [];
    return allowed.includes(to);
  }

  static validate(from: ReservationStatus, to: ReservationStatus): void {
    if (!this.canTransition(from, to)) {
      throw new Error(`Invalid dining reservation status transition: cannot transition from ${from} to ${to}`);
    }
  }

  static isTerminal(status: ReservationStatus): boolean {
    return (this.transitions[status] || []).length === 0;
  }
}
