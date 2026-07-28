import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { LocalRecording } from '../../services/microphone-recorder.service';

@Component({
  selector: 'app-recording-preview',
  templateUrl: './recording-preview.html',
  styleUrl: './recording-preview.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecordingPreview implements OnDestroy {
  readonly recording = input.required<LocalRecording>();
  readonly deleteRequested = output<void>();

  protected readonly isReplaying = signal(false);
  private readonly audio = viewChild<ElementRef<HTMLAudioElement>>('audio');

  ngOnDestroy(): void {
    this.audio()?.nativeElement.pause();
  }

  protected async toggleReplay(): Promise<void> {
    const audio = this.audio()?.nativeElement;
    if (!audio) {
      return;
    }

    if (audio.paused) {
      try {
        await audio.play();
        this.isReplaying.set(true);
      } catch {
        this.isReplaying.set(false);
      }
    } else {
      audio.pause();
      this.isReplaying.set(false);
    }
  }

  protected replayEnded(): void {
    this.isReplaying.set(false);
  }

  protected formatDuration(durationMs: number): string {
    const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
