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
  readonly recordedAttempt = output<RecordedAttempt>();
  readonly recordingDeleted = output<void>();

  protected readonly recorder: MicrophoneRecorderService;
  protected readonly deliveryStatus = signal<AttemptDeliveryStatus>('idle');
  private currentQuestionId?: string;
  private attemptNumber = 0;
  private handledRecording?: Blob;
  private latestAttempt?: RecordedAttempt;

  constructor(recorder: MicrophoneRecorderService) {
    this.recorder = recorder;

    effect(() => {
      const questionId = this.questionId();
      if (this.currentQuestionId !== questionId) {
        this.currentQuestionId = questionId;
        this.resetForQuestion();
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
    this.deliveryStatus.set('idle');
    this.latestAttempt = undefined;
    this.handledRecording = undefined;
    await this.recorder.start();
  }

  protected stopRecording(): void {
    this.recorder.stop();
  }

  protected clearRecording(): void {
    this.recorder.clearRecording();
    this.deliveryStatus.set('idle');
    this.latestAttempt = undefined;
    this.handledRecording = undefined;
    this.recordingDeleted.emit();
  }

  protected retryDelivery(): void {
    this.deliverAttempt();
  }

  protected formatDuration(durationMs: number): string {
    const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  private deliverAttempt(): void {
    if (!this.latestAttempt) {
      return;
    }

    this.deliveryStatus.set('saving');
    try {
      this.recordedAttempt.emit(this.latestAttempt);
      queueMicrotask(() => {
        if (this.recorder.recording()?.blob === this.latestAttempt?.blob) {
          this.deliveryStatus.set('saved');
        }
      });
    } catch {
      this.deliveryStatus.set('retry');
    }
  }

  private resetForQuestion(): void {
    this.recorder.clearRecording();
    this.deliveryStatus.set('idle');
    this.attemptNumber = 0;
    this.handledRecording = undefined;
    this.latestAttempt = undefined;
  }
}
