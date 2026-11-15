export type ListingStatus = 'DRAFT' | 'PENDING_VERIFICATION' | 'PUBLISHED' | 'UNDER_CONTRACT' | 'SOLD' | 'DELISTED';

export class ListingStateMachine {
  private static transitions: Record<ListingStatus, ListingStatus[]> = {
    DRAFT: ['PENDING_VERIFICATION', 'DELISTED', 'PUBLISHED'],
    PENDING_VERIFICATION: ['PUBLISHED', 'DRAFT', 'DELISTED'],
    PUBLISHED: ['UNDER_CONTRACT', 'DELISTED'],
    UNDER_CONTRACT: ['SOLD', 'PUBLISHED', 'DELISTED'],
    SOLD: [],
    DELISTED: ['DRAFT', 'PUBLISHED']
  };

  static canTransition(current: ListingStatus, next: ListingStatus): boolean {
    return this.transitions[current]?.includes(next) ?? false;
  }

  static validate(current: ListingStatus, next: ListingStatus): void {
    if (!this.canTransition(current, next)) {
      throw new Error(`Invalid listing state transition from ${current} to ${next}`);
    }
  }
}
