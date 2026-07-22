import { ScoringService } from './scoring.service';

const rules = {
  basePoints: 20,
  secondAttemptMultiplier: 0.6,
  streakLength: 3,
  streakBonus: 5,
  replayPenalty: 0,
  maxAttempts: 2,
} as const;

describe('ScoringService', () => {
  const service = new ScoringService();

  it('awards base points for the first attempt', () => {
    expect(service.calculate(rules, 1, 1)).toBe(20);
  });

  it('awards 60 percent on the second attempt', () => {
    expect(service.calculate(rules, 2, 1)).toBe(12);
  });

  it('adds a configured streak bonus and never returns negative points', () => {
    expect(service.calculate(rules, 1, 3)).toBe(25);
    expect(service.calculate(rules, 3, 4)).toBe(0);
  });

  it('applies a configurable replay penalty without producing negative points', () => {
    expect(service.applyReplayPenalty({ ...rules, replayPenalty: 3 }, 20)).toBe(17);
    expect(service.applyReplayPenalty({ ...rules, replayPenalty: 30 }, 20)).toBe(0);
  });
});
