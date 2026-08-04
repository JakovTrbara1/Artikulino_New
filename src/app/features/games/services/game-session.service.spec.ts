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

  it('awards proportional pronunciation points and counts only the best retry', () => {
    const contentPackage = DEMO_CONTENT_PACKAGES.find((item) => item.id === 'izgovor-rijeci-s');
    expect(contentPackage).toBeDefined();
    service.start(contentPackage!);

    service.registerReplay();
    service.registerPracticeAttempt();
    service.markPracticeAttemptPending('attempt-1', 'izgovor-s-sunce');
    const firstResult = service.resolvePracticeAttempt(
      'attempt-1',
      'izgovor-s-sunce',
      'COMPLETED',
      80,
    );

    expect(service.isAnswered()).toBe(true);
    expect(service.attempts()).toBe(1);
    expect(service.replays()).toBe(1);
    expect(service.correctAnswers()).toBe(0);
    expect(service.totalPoints()).toBe(12);
    expect(firstResult).toEqual({
      attemptId: 'attempt-1',
      questionId: 'izgovor-s-sunce',
      percentage: 80,
      roundPoints: 12,
      bestPoints: 12,
      status: 'COMPLETED',
    });

    service.registerPracticeAttempt();
    service.markPracticeAttemptPending('attempt-2', 'izgovor-s-sunce');
    const lowerRetry = service.resolvePracticeAttempt(
      'attempt-2',
      'izgovor-s-sunce',
      'COMPLETED',
      60,
    );

    expect(service.attempts()).toBe(2);
    expect(service.totalPoints()).toBe(12);
    expect(lowerRetry).toMatchObject({ roundPoints: 9, bestPoints: 12 });

    service.registerPracticeAttempt();
    service.markPracticeAttemptPending('attempt-3', 'izgovor-s-sunce');
    const betterRetry = service.resolvePracticeAttempt(
      'attempt-3',
      'izgovor-s-sunce',
      'COMPLETED',
      100,
    );

    expect(service.attempts()).toBe(3);
    expect(service.totalPoints()).toBe(15);
    expect(betterRetry).toMatchObject({ roundPoints: 15, bestPoints: 15 });
  });

  it('allows continuation with zero new points when transcription fails', () => {
    const contentPackage = DEMO_CONTENT_PACKAGES.find((item) => item.id === 'izgovor-glas-l');
    expect(contentPackage).toBeDefined();
    service.start(contentPackage!);

    service.registerPracticeAttempt();
    service.markPracticeAttemptPending('attempt-1', 'izgovor-l-slog-a');
    const result = service.resolvePracticeAttempt('attempt-1', 'izgovor-l-slog-a', 'FAILED');

    expect(service.isAnswered()).toBe(true);
    expect(service.totalPoints()).toBe(0);
    expect(result).toMatchObject({
      roundPoints: 0,
      bestPoints: 0,
      status: 'FAILED',
    });
    expect(service.feedback()?.message).toBe('Rezultat trenutačno nije dostupan.');
  });

  it('allows a safe pronunciation exit after microphone failure without a fake score', () => {
    const contentPackage = DEMO_CONTENT_PACKAGES.find((item) => item.id === 'izgovor-glas-r');
    expect(contentPackage).toBeDefined();
    service.start(contentPackage!);

    service.skipPracticeRound();

    expect(service.isAnswered()).toBe(true);
    expect(service.attempts()).toBe(0);
    expect(service.totalPoints()).toBe(0);
    expect(service.feedback()).toMatchObject({
      kind: 'reveal',
      message: 'Nastavljamo bez snimke.',
    });
  });
});
