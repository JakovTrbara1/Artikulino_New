import { TestBed } from '@angular/core/testing';
import { ProgressService } from './progress.service';

describe('ProgressService', () => {
  let service: ProgressService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProgressService);
  });

  it('aggregates and locally persists completed sessions', () => {
    service.addResult({
      id: 'result-1',
      packageId: 'package-1',
      packageName: 'Paket',
      gameType: 'listen-and-decide',
      targetSound: 'S',
      theme: 'hrana',
      difficulty: 'EASY',
      questionCount: 4,
      correctAnswers: 3,
      attempts: 5,
      replays: 2,
      currentStreak: 1,
      longestStreak: 2,
      totalPoints: 30,
      durationSeconds: 60,
      completedAt: '2026-07-22T12:00:00.000Z',
    });

    expect(service.totalSessions()).toBe(1);
    expect(service.totalCorrect()).toBe(3);
    expect(service.totalPoints()).toBe(30);
    expect(localStorage.length).toBe(1);
  });
});
