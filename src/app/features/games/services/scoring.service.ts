import { Injectable } from '@angular/core';
import { ScoringRules } from '../models/content-package.model';

@Injectable({ providedIn: 'root' })
export class ScoringService {
  calculate(rules: ScoringRules, attempt: number, streakAfterAnswer: number): number {
    if (attempt < 1 || attempt > rules.maxAttempts) {
      return 0;
    }

    const attemptPoints =
      attempt === 1
        ? rules.basePoints
        : attempt === 2
          ? Math.round(rules.basePoints * rules.secondAttemptMultiplier)
          : 0;
    const streakBonus =
      rules.streakLength > 0 && streakAfterAnswer % rules.streakLength === 0
        ? rules.streakBonus
        : 0;

    return Math.max(0, attemptPoints + streakBonus);
  }

  applyReplayPenalty(rules: ScoringRules, currentPoints: number): number {
    return Math.max(0, currentPoints - Math.max(0, rules.replayPenalty));
  }

  calculatePracticePoints(rules: ScoringRules, textMatch: number): number {
    const percentage = Math.min(100, Math.max(0, Math.round(textMatch)));
    return Math.max(0, Math.round((rules.basePoints * percentage) / 100));
  }
}
