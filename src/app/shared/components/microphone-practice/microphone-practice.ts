import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { RecordedAttempt } from '../../models/recorded-attempt.model';
import { MicrophoneRecorderService } from '../../services/microphone-recorder.service';
import { RecordingPreview } from '../recording-preview/recording-preview';

type AttemptDeliveryStatus = 'idle' | 'saving' | 'saved' | 'retry';
type RetryAction = 'save' | 'delete';

@Component({
  selector: 'app-microphone-practice',
  imports: [RecordingPreview],
  templateUrl: './microphone-practice.html',
  styleUrl: './microphone-practice.css',
  providers: [MicrophoneRecorderService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MicrophonePractice implements OnDestroy {
  readonly questionId = input.required<string>();
  readonly resetId = input(0);
  readonly required = input(false);
  readonly promptKind = input<'sound' | 'word'>('word');
  readonly disabled = input(false);
  readonly saveAttempt = input<(attempt: RecordedAttempt) => Promise<{ readonly id: string }>>();
  readonly deleteSavedAttempt = input<(attemptId: string) => Promise<void>>();
  readonly recordedAttempt = output<RecordedAttempt>();
  readonly recordingDeleted = output<number>();
  readonly skipRequested = output<void>();

  protected readonly recorder: MicrophoneRecorderService;
  protected readonly deliveryStatus = signal<AttemptDeliveryStatus>('idle');
  private currentQuestionId?: string;
  private currentResetId?: number;
  private attemptNumber = 0;
  private handledRecording?: Blob;
  private latestAttempt?: RecordedAttempt;
  private savedAttemptId?: string;
  private pendingSave?: Promise<{ readonly id: string } | undefined>;
  private retryAction: RetryAction = 'save';
  private deliverySequence = 0;

  constructor(recorder: MicrophoneRecorderService) {
    this.recorder = recorder;

    effect(() => {
      const questionId = this.questionId();
      const resetId = this.resetId();
      if (this.currentQuestionId !== questionId) {
        this.currentQuestionId = questionId;
        this.currentResetId = resetId;
        this.resetForQuestion();
      } else if (this.currentResetId !== resetId) {
        this.currentResetId = resetId;
        this.resetForRetry();
      }
    });

    effect(() => {
      const recording = this.recorder.recording();
      if (!recording || recording.blob === this.handledRecording) {
        return;
      }

      this.handledRecording = recording.blob;
      this.attemptNumber += 1;
      this.latestAttempt = {
        blob: recording.blob,
        mimeType: recording.mimeType,
        durationMs: recording.durationMs,
        questionId: this.questionId(),
        attemptNumber: this.attemptNumber,
      };
      this.deliverAttempt();
    });
  }

  ngOnDestroy(): void {
    this.recorder.clearRecording();
  }

  protected async startRecording(): Promise<void> {
    if (this.disabled()) {
      return;
    }
    this.deliveryStatus.set('idle');
    this.latestAttempt = undefined;
    this.handledRecording = undefined;
    this.savedAttemptId = undefined;
    await this.recorder.start();
  }

  protected stopRecording(): void {
    this.recorder.stop();
  }

  protected async clearRecording(): Promise<void> {
    const pendingSave = this.pendingSave;
    let savedAttemptId = this.savedAttemptId;
    const deleteSavedAttempt = this.deleteSavedAttempt();
    this.deliverySequence += 1;
    if (!savedAttemptId && pendingSave) {
      this.deliveryStatus.set('saving');
      try {
        savedAttemptId = (await pendingSave)?.id;
      } catch {
        // A failed upload leaves no server recording to delete.
      }
    }
    if (savedAttemptId && deleteSavedAttempt) {
      this.deliveryStatus.set('saving');
      try {
        await deleteSavedAttempt(savedAttemptId);
      } catch {
        this.retryAction = 'delete';
        this.deliveryStatus.set('retry');
        return;
      }
    }
    this.recorder.clearRecording();
    this.deliveryStatus.set('idle');
    this.latestAttempt = undefined;
    this.handledRecording = undefined;
    this.savedAttemptId = undefined;
    this.recordingDeleted.emit(Math.max(0, this.attemptNumber - 1));
  }

  protected retryDelivery(): void {
    if (this.retryAction === 'delete') {
      void this.clearRecording();
    } else {
      void this.deliverAttempt();
    }
  }

  protected retryLabel(): string {
    return this.retryAction === 'delete' ? 'Pokušaj izbrisati ponovno' : 'Pokušaj spremiti ponovno';
  }

  protected formatDuration(durationMs: number): string {
    const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  protected promptNoun(): string {
    return this.promptKind() === 'sound' ? 'glas' : 'riječ';
  }

  private async deliverAttempt(): Promise<void> {
    if (!this.latestAttempt) {
      return;
    }

    const attempt = this.latestAttempt;
    const sequence = ++this.deliverySequence;
    this.retryAction = 'save';
    this.deliveryStatus.set('saving');
    const saveOperation = this.saveAttempt()?.(attempt) ?? Promise.resolve(undefined);
    this.pendingSave = saveOperation;
    try {
      this.recordedAttempt.emit(attempt);
      const saved = await saveOperation;
      if (sequence === this.deliverySequence && this.recorder.recording()?.blob === attempt.blob) {
        this.savedAttemptId = saved?.id;
        this.deliveryStatus.set('saved');
      }
    } catch {
      if (sequence === this.deliverySequence && this.recorder.recording()?.blob === attempt.blob) {
        this.deliveryStatus.set('retry');
      }
    } finally {
      if (this.pendingSave === saveOperation) {
        this.pendingSave = undefined;
      }
    }
  }

  private resetForQuestion(): void {
    this.resetRecordingState();
    this.attemptNumber = 0;
  }

  private resetForRetry(): void {
    this.resetRecordingState();
  }

  private resetRecordingState(): void {
    this.recorder.clearRecording();
    this.deliveryStatus.set('idle');
    this.handledRecording = undefined;
    this.latestAttempt = undefined;
    this.savedAttemptId = undefined;
    this.pendingSave = undefined;
    this.deliverySequence += 1;
  }
}
