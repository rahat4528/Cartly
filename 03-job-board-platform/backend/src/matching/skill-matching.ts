export interface SkillMatchResult {
  matchScore: number; // 0 to 100 percentage
  matchedSkills: string[];
  missingSkills: string[];
  totalRequired: number;
  engineType: 'KEYWORD_MATCHING';
}

export class SkillMatchingEngine {
  static evaluate(candidateSkills: string[], requiredSkills: string[]): SkillMatchResult {
    if (!requiredSkills || requiredSkills.length === 0) {
      return {
        matchScore: 100,
        matchedSkills: [],
        missingSkills: [],
        totalRequired: 0,
        engineType: 'KEYWORD_MATCHING'
      };
    }

    const normalizedCandidate = candidateSkills.map(s => s.trim().toLowerCase());
    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];

    for (const req of requiredSkills) {
      const norm = req.trim().toLowerCase();
      if (normalizedCandidate.includes(norm)) {
        matchedSkills.push(req);
      } else {
        missingSkills.push(req);
      }
    }

    const matchScore = Math.round((matchedSkills.length / requiredSkills.length) * 100);

    return {
      matchScore,
      matchedSkills,
      missingSkills,
      totalRequired: requiredSkills.length,
      engineType: 'KEYWORD_MATCHING'
    };
  }
}
