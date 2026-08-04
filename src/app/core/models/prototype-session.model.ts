import {
  Difficulty,
  GameSessionResult,
  GameType,
} from '../../features/games/models/content-package.model';

export type TranscriptionStatus = 'PENDING' | 'COMPLETED' | 'FAILED';
export type TherapistReviewStatus = 'NOT_REVIEWED' | 'LOOKS_GOOD' | 'PRACTICE_AGAIN';

export interface PrototypeApiHealth {
  readonly status: 'ok';
  readonly apiContractVersion: number;
  readonly supportedGameTypes: readonly GameType[];
}

export interface TherapistReview {
  readonly status: TherapistReviewStatus;
  readonly comment: string;
  readonly reviewedAt?: string;
}

export interface PrototypeRecordingAttempt {
  readonly id: string;
  readonly questionId: string;
  readonly attemptNumber: number;
  readonly expectedText: string;
  readonly mimeType: string;
  readonly durationMs: number;
  readonly fileSize: number;
  readonly createdAt: string;
  readonly transcriptionStatus: TranscriptionStatus;
  readonly transcript?: string;
  readonly textMatch?: number;
  readonly therapistReview: TherapistReview;
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

export interface TherapistSessionSummary {
  readonly id: string;
  readonly childId: string;
  readonly childDisplayName: string;
  readonly packageName: string;
  readonly gameType: GameType;
  readonly targetSound: string;
  readonly theme: string;
  readonly difficulty: Difficulty;
  readonly completedAt: string;
  readonly recordingAttemptCount: number;
}

export interface TherapistGameSession extends PrototypeGameSession {
  readonly childDisplayName: string;
}

export type PrototypeGameCompletion = Pick<
  GameSessionResult,
  'correctAnswers' | 'attempts' | 'replays' | 'longestStreak' | 'totalPoints' | 'durationSeconds'
>;
