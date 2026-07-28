import {
  Difficulty,
  GameSessionResult,
  GameType,
} from '../../features/games/models/content-package.model';

export interface PrototypeRecordingAttempt {
  readonly id: string;
  readonly questionId: string;
  readonly attemptNumber: number;
  readonly expectedText: string;
  readonly mimeType: string;
  readonly durationMs: number;
  readonly fileSize: number;
  readonly createdAt: string;
}

export interface PrototypeGameSession {
  readonly id: string;
  readonly childId: string;
  readonly packageId: string;
  readonly packageName: string;
  readonly gameType: GameType;
  readonly targetSound: string;
  readonly theme: string;
  readonly difficulty: Difficulty;
  readonly questionCount: number;
  readonly correctAnswers: number;
  readonly attempts: number;
  readonly replays: number;
  readonly longestStreak: number;
  readonly totalPoints: number;
  readonly durationSeconds: number;
  readonly startedAt: string;
  readonly completedAt?: string;
  readonly recordingAttempts: readonly PrototypeRecordingAttempt[];
}

export type PrototypeGameCompletion = Pick<
  GameSessionResult,
  'correctAnswers' | 'attempts' | 'replays' | 'longestStreak' | 'totalPoints' | 'durationSeconds'
>;
