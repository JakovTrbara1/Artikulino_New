import { computed, Injectable, signal } from '@angular/core';
import { ContentPackage, GameSessionResult } from '../models/content-package.model';
import { ScoringService } from './scoring.service';

export interface GameFeedback {
  readonly kind: 'success' | 'retry' | 'reveal';
  readonly message: string;
  readonly explanation?: string;
  readonly earnedPoints?: number;
}

@Injectable()
export class GameSessionService {
  private readonly packageState = signal<ContentPackage | null>(null);
  private readonly indexState = signal(0);
  private readonly questionAttemptsState = signal(0);
  private readonly correctState = signal(0);
  private readonly attemptsState = signal(0);
  private readonly replaysState = signal(0);
  private readonly currentStreakState = signal(0);
  private readonly longestStreakState = signal(0);
  private readonly pointsState = signal(0);
  private readonly feedbackState = signal<GameFeedback | null>(null);
  private readonly answeredState = signal(false);
  private readonly completeState = signal(false);
  private readonly completedResultState = signal<GameSessionResult | null>(null);
  private startedAt = Date.now();

  readonly contentPackage = this.packageState.asReadonly();
  readonly currentIndex = this.indexState.asReadonly();
  readonly currentQuestion = computed(
    () => this.packageState()?.questions[this.indexState()] ?? null,
  );
  readonly questionAttempts = this.questionAttemptsState.asReadonly();
  readonly correctAnswers = this.correctState.asReadonly();
  readonly attempts = this.attemptsState.asReadonly();
  readonly replays = this.replaysState.asReadonly();
  readonly currentStreak = this.currentStreakState.asReadonly();
  readonly longestStreak = this.longestStreakState.asReadonly();
  readonly totalPoints = this.pointsState.asReadonly();
  readonly feedback = this.feedbackState.asReadonly();
  readonly isAnswered = this.answeredState.asReadonly();
  readonly isComplete = this.completeState.asReadonly();
  readonly completedResult = this.completedResultState.asReadonly();
  readonly progressPercent = computed(() => {
    const packageValue = this.packageState();
    return packageValue
      ? ((this.indexState() + (this.completeState() ? 1 : 0)) / packageValue.questions.length) * 100
      : 0;
  });

  constructor(private readonly scoring: ScoringService) {}

  start(contentPackage: ContentPackage): void {
    this.packageState.set(contentPackage);
    this.indexState.set(0);
    this.questionAttemptsState.set(0);
    this.correctState.set(0);
    this.attemptsState.set(0);
    this.replaysState.set(0);
    this.currentStreakState.set(0);
    this.longestStreakState.set(0);
    this.pointsState.set(0);
    this.feedbackState.set(null);
    this.answeredState.set(false);
    this.completeState.set(false);
    this.completedResultState.set(null);
    this.startedAt = Date.now();
  }

  registerReplay(): void {
    this.replaysState.update((count) => count + 1);
    const contentPackage = this.packageState();
    if (contentPackage) {
      this.pointsState.update((points) =>
        this.scoring.applyReplayPenalty(contentPackage.scoring, points),
      );
    }
  }

  submitAnswer(answerId: string): void {
    const contentPackage = this.packageState();
    const question = this.currentQuestion();
    if (!contentPackage || !question || this.answeredState() || this.completeState()) {
      return;
    }

    const nextAttempt = this.questionAttemptsState() + 1;
    this.questionAttemptsState.set(nextAttempt);
    this.attemptsState.update((count) => count + 1);

    if (question.correctAnswerIds.includes(answerId)) {
      const nextStreak = this.currentStreakState() + 1;
      const earnedPoints = this.scoring.calculate(contentPackage.scoring, nextAttempt, nextStreak);
      this.correctState.update((count) => count + 1);
      this.currentStreakState.set(nextStreak);
      this.longestStreakState.update((longest) => Math.max(longest, nextStreak));
      this.pointsState.update((points) => points + earnedPoints);
      this.answeredState.set(true);
      this.feedbackState.set({
        kind: 'success',
        message:
          nextStreak % 3 === 0
            ? 'Bravo! Tri točna zaredom!'
            : nextAttempt === 1
              ? 'Točno!'
              : 'Odlično si poslušao/la.',
        explanation: question.explanation,
        earnedPoints,
      });
      return;
    }

    this.currentStreakState.set(0);
    if (nextAttempt < contentPackage.scoring.maxAttempts) {
      this.feedbackState.set({
        kind: 'retry',
        message: nextAttempt === 1 ? 'Skoro! Poslušaj još jednom.' : 'Pokušaj ponovno.',
      });
      return;
    }

    this.answeredState.set(true);
    this.feedbackState.set({
      kind: 'reveal',
      message: 'Idemo zajedno dalje.',
      explanation: question.explanation,
      earnedPoints: 0,
    });
  }

  next(): void {
    const contentPackage = this.packageState();
    if (!contentPackage || !this.answeredState()) {
      return;
    }

    if (this.indexState() >= contentPackage.questions.length - 1) {
      this.finish(contentPackage);
      return;
    }

    this.indexState.update((index) => index + 1);
    this.questionAttemptsState.set(0);
    this.feedbackState.set(null);
    this.answeredState.set(false);
  }

  private finish(contentPackage: ContentPackage): void {
    this.completeState.set(true);
    const result: GameSessionResult = {
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${contentPackage.id}`,
      packageId: contentPackage.id,
      packageName: contentPackage.name,
      gameType: contentPackage.gameType,
      targetSound: contentPackage.targetSound ?? '',
      theme: contentPackage.theme,
      difficulty: contentPackage.difficulty,
      questionCount: contentPackage.questions.length,
      correctAnswers: this.correctState(),
      attempts: this.attemptsState(),
      replays: this.replaysState(),
      currentStreak: this.currentStreakState(),
      longestStreak: this.longestStreakState(),
      totalPoints: this.pointsState(),
      durationSeconds: Math.max(1, Math.round((Date.now() - this.startedAt) / 1000)),
      completedAt: new Date().toISOString(),
    };
    this.completedResultState.set(result);
  }
}
