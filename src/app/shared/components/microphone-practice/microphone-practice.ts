import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { MicrophoneRecorderService } from '../../services/microphone-recorder.service';

@Component({
  selector: 'app-microphone-practice',
  templateUrl: './microphone-practice.html',
  styleUrl: './microphone-practice.css',
  providers: [MicrophoneRecorderService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MicrophonePractice implements OnDestroy {
  protected readonly recorder: MicrophoneRecorderService;

  constructor(recorder: MicrophoneRecorderService) {
    this.recorder = recorder;
  }

  ngOnDestroy(): void {
    this.recorder.clearRecording();
  }
}
