import { Injectable, signal } from '@angular/core';

export type RecorderStatus =
  'idle' | 'requesting' | 'recording' | 'ready' | 'denied' | 'unsupported' | 'error';

@Injectable()
export class MicrophoneRecorderService {
  private recorder?: MediaRecorder;
  private stream?: MediaStream;
  private chunks: Blob[] = [];
  private currentUrl?: string;
  private discardNextRecording = false;

  private readonly statusState = signal<RecorderStatus>('idle');
  private readonly audioUrlState = signal<string | null>(null);

  readonly status = this.statusState.asReadonly();
  readonly audioUrl = this.audioUrlState.asReadonly();

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
          if (this.discardNextRecording) {
            this.discardNextRecording = false;
            this.chunks = [];
            this.recorder = undefined;
            this.releaseStream();
            return;
          }
          const blob = new Blob(this.chunks, { type: this.recorder?.mimeType || 'audio/webm' });
          this.currentUrl = URL.createObjectURL(blob);
          this.audioUrlState.set(this.currentUrl);
          this.releaseStream();
          this.recorder = undefined;
          this.statusState.set('ready');
        },
        { once: true },
      );
      this.recorder.start();
      this.statusState.set('recording');
    } catch (error) {
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
    this.chunks = [];
    this.statusState.set('idle');
  }

  private releaseStream(): void {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = undefined;
  }
}
