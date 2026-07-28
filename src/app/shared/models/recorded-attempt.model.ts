export interface RecordedAttempt {
  readonly blob: Blob;
  readonly mimeType: string;
  readonly durationMs: number;
  readonly questionId: string;
  readonly attemptNumber: number;
}
