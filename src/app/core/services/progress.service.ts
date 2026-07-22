import { isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { GameSessionResult } from '../../features/games/models/content-package.model';

const STORAGE_KEY = 'artikulino.session-results.v1';

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly resultState = signal<readonly GameSessionResult[]>(this.load());

  readonly results = this.resultState.asReadonly();
  readonly totalSessions = computed(() => this.results().length);
  readonly totalPoints = computed(() =>
    this.results().reduce((sum, result) => sum + result.totalPoints, 0),
  );
  readonly totalQuestions = computed(() =>
    this.results().reduce((sum, result) => sum + result.questionCount, 0),
  );
  readonly totalCorrect = computed(() =>
    this.results().reduce((sum, result) => sum + result.correctAnswers, 0),
  );
  readonly totalSeconds = computed(() =>
    this.results().reduce((sum, result) => sum + result.durationSeconds, 0),
  );

  addResult(result: GameSessionResult): void {
    const next = [result, ...this.results()].slice(0, 100);
    this.resultState.set(next);
    this.persist(next);
  }

  clear(): void {
    this.resultState.set([]);
    if (this.isBrowser) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  private load(): readonly GameSessionResult[] {
    if (!this.isBrowser) {
      return [];
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as GameSessionResult[]) : [];
    } catch {
      return [];
    }
  }

  private persist(results: readonly GameSessionResult[]): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
    } catch {
      // Nedostupna pohrana ne smije prekinuti igru.
    }
  }
}
