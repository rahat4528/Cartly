export type RentalStatus = 'RESERVED' | 'ACTIVE_RENTAL' | 'RETURNED' | 'COMPLETED' | 'CANCELLED';

export class RentalStateMachine {
  private static transitions: Record<RentalStatus, RentalStatus[]> = {
    RESERVED: ['ACTIVE_RENTAL', 'CANCELLED'],
    ACTIVE_RENTAL: ['RETURNED'],
    RETURNED: ['COMPLETED'],
    COMPLETED: [],
    CANCELLED: []
  };

  static canTransition(current: RentalStatus, next: RentalStatus): boolean {
    return this.transitions[current]?.includes(next) ?? false;
  }

  static validate(current: RentalStatus, next: RentalStatus): void {
    if (!this.canTransition(current, next)) {
      throw new Error(`Invalid rental state transition from ${current} to ${next}`);
    }
  }
}
