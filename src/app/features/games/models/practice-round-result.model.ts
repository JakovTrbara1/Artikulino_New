export type PracticeRoundResultStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'TIMED_OUT';

export interface PracticeRoundResult {
  readonly attemptId: string;
  readonly questionId: string;
  readonly percentage?: number;
  readonly roundPoints: number;
  readonly bestPoints: number;
  readonly status: PracticeRoundResultStatus;
}
