import { Injectable, signal } from '@angular/core';

export type RecorderStatus =
  'idle' | 'requesting' | 'recording' | 'stopped' | 'denied' | 'unsupported' | 'error';

export interface LocalRecording {
  readonly blob: Blob;
  readonly mimeType: string;
  readonly durationMs: number;
  readonly audioUrl: string;
}

@Injectable()
export class MicrophoneRecorderService {
  private recorder?: MediaRecorder;
  private stream?: MediaStream;
  private chunks: Blob[] = [];
  private currentUrl?: string;
  private discardNextRecording = false;
  private recordingStartedAt?: number;
  private durationTimer?: ReturnType<typeof setInterval>;

  private readonly statusState = signal<RecorderStatus>('idle');
  private readonly audioUrlState = signal<string | null>(null);
  private readonly recordingState = signal<LocalRecording | null>(null);
  private readonly durationMsState = signal(0);

  readonly status = this.statusState.asReadonly();
  readonly audioUrl = this.audioUrlState.asReadonly();
  readonly recording = this.recordingState.asReadonly();
  readonly durationMs = this.durationMsState.asReadonly();

  async start(): Promise<void> {
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === 'undefined'
    ) {
      this.statusState.set('unsupported');
      return;
    }

    this.clearRecording();
    this.discardNextRecording = false;
    this.statusState.set('requesting');

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.recorder = new MediaRecorder(this.stream);
      this.chunks = [];
      this.recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
        }
      });
      this.recorder.addEventListener(
        'stop',
        () => {
          this.stopDurationClock();
          if (this.discardNextRecording) {
            this.discardNextRecording = false;
            this.chunks = [];
            this.recorder = undefined;
            this.releaseStream();
            return;
          }
          const mimeType = this.recorder?.mimeType || 'audio/webm';
          const blob = new Blob(this.chunks, { type: mimeType });
          this.currentUrl = URL.createObjectURL(blob);
          this.audioUrlState.set(this.currentUrl);
          this.recordingState.set({
            blob,
            mimeType,
            durationMs: this.durationMsState(),
            audioUrl: this.currentUrl,
          });
          this.releaseStream();
          this.recorder = undefined;
          this.statusState.set('stopped');
        },
        { once: true },
      );
      this.recorder.start();
      this.startDurationClock();
      this.statusState.set('recording');
    } catch (error) {
      this.stopDurationClock();
      this.releaseStream();
      const permissionDenied =
        error instanceof DOMException &&
        ['NotAllowedError', 'PermissionDeniedError'].includes(error.name);
      this.statusState.set(permissionDenied ? 'denied' : 'error');
    }
  }

  stop(): void {
    if (this.recorder?.state === 'recording') {
      this.recorder.stop();
    }
  }

  clearRecording(): void {
    this.stopDurationClock();
    if (this.recorder?.state === 'recording') {
      this.discardNextRecording = true;
      this.recorder.stop();
    } else {
      this.releaseStream();
      this.recorder = undefined;
    }
    if (this.currentUrl) {
      URL.revokeObjectURL(this.currentUrl);
      this.currentUrl = undefined;
    }
    this.audioUrlState.set(null);
    this.recordingState.set(null);
    this.durationMsState.set(0);
    this.chunks = [];
    this.statusState.set('idle');
  }

  private releaseStream(): void {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = undefined;
  }

  private startDurationClock(): void {
    this.recordingStartedAt = Date.now();
    this.durationMsState.set(0);
    this.durationTimer = setInterval(() => this.updateDuration(), 200);
  }

  private stopDurationClock(): void {
    if (this.recordingStartedAt !== undefined) {
      this.updateDuration();
    }
    if (this.durationTimer !== undefined) {
      clearInterval(this.durationTimer);
      this.durationTimer = undefined;
    }
    this.recordingStartedAt = undefined;
  }

  private updateDuration(): void {
    if (this.recordingStartedAt !== undefined) {
      this.durationMsState.set(Math.max(0, Date.now() - this.recordingStartedAt));
    }
  }
}
