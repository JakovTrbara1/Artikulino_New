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

  it('completes pronunciation rounds after recording without awarding points', () => {
    const contentPackage = DEMO_CONTENT_PACKAGES.find((item) => item.id === 'izgovor-rijeci-s');
    expect(contentPackage).toBeDefined();
    service.start(contentPackage!);

    service.registerReplay();
    service.registerPracticeAttempt();
    service.completePracticeRound();

    expect(service.isAnswered()).toBe(true);
    expect(service.attempts()).toBe(1);
    expect(service.replays()).toBe(1);
    expect(service.correctAnswers()).toBe(0);
    expect(service.totalPoints()).toBe(0);
    expect(service.feedback()).toMatchObject({
      kind: 'success',
      message: 'Snimka je spremljena za tekstualno prepoznavanje.',
      explanation: 'Prepoznavanje teksta nije procjena kvalitete izgovora.',
    });

    service.reopenPracticeRound();
    expect(service.isAnswered()).toBe(false);
    expect(service.feedback()).toBeNull();
  });

  it('allows a safe pronunciation exit after microphone failure without a fake score', () => {
    const contentPackage = DEMO_CONTENT_PACKAGES.find((item) => item.id === 'izgovor-glas-r');
    expect(contentPackage).toBeDefined();
    service.start(contentPackage!);

    service.completePracticeRound(true);

    expect(service.isAnswered()).toBe(true);
    expect(service.attempts()).toBe(0);
    expect(service.totalPoints()).toBe(0);
    expect(service.feedback()).toMatchObject({
      kind: 'reveal',
      message: 'Nastavljamo bez snimke.',
    });
  });
});
