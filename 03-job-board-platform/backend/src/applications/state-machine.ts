export type ApplicationStatus = 
  | 'APPLIED'
  | 'REVIEWED'
  | 'SHORTLISTED'
  | 'INTERVIEW'
  | 'OFFERED'
  | 'REJECTED'
  | 'WITHDRAWN';

const ALLOWED_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  APPLIED: ['REVIEWED', 'WITHDRAWN', 'REJECTED'],
  REVIEWED: ['SHORTLISTED', 'REJECTED', 'WITHDRAWN'],
  SHORTLISTED: ['INTERVIEW', 'REJECTED', 'WITHDRAWN'],
  INTERVIEW: ['OFFERED', 'REJECTED', 'WITHDRAWN'],
  OFFERED: ['REJECTED', 'WITHDRAWN'],
  REJECTED: [],
  WITHDRAWN: []
};

export class ApplicationStateMachine {
  static canTransition(current: ApplicationStatus, next: ApplicationStatus): boolean {
    const validNextStates = ALLOWED_TRANSITIONS[current] || [];
    return validNextStates.includes(next);
  }

  static validate(current: ApplicationStatus, next: ApplicationStatus): void {
    if (!this.canTransition(current, next)) {
      throw new Error(`Invalid application transition from ${current} to ${next}`);
    }
  }
}
