import { TestBed } from '@angular/core/testing';
import { DEMO_CONTENT_PACKAGES } from '../data/demo-content-packages';
import { ContentPackage } from '../models/content-package.model';
import { GameSessionService } from './game-session.service';

describe('GameSessionService', () => {
  let service: GameSessionService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [GameSessionService] });
    service = TestBed.inject(GameSessionService);
  });

  it('tracks attempts and awards 60 percent of points for a correct second attempt', () => {
    const contentPackage = DEMO_CONTENT_PACKAGES[0];
    service.start(contentPackage);

    service.submitAnswer('povrće');
    expect(service.attempts()).toBe(1);
    expect(service.feedback()?.kind).toBe('retry');

    service.submitAnswer('voće');
    expect(service.correctAnswers()).toBe(1);
    expect(service.totalPoints()).toBe(6);
    expect(service.currentStreak()).toBe(1);
  });

  it('tracks replays and applies a configured non-negative replay penalty', () => {
    const basePackage = DEMO_CONTENT_PACKAGES[0];
    const contentPackage: ContentPackage = {
      ...basePackage,
      scoring: { ...basePackage.scoring, replayPenalty: 3 },
    };
    service.start(contentPackage);
    service.submitAnswer('voće');
    service.registerReplay();

    expect(service.replays()).toBe(1);
    expect(service.totalPoints()).toBe(7);
  });
});
