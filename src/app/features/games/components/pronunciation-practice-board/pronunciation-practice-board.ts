import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ContentQuestion } from '../../models/content-package.model';

@Component({
  selector: 'app-pronunciation-practice-board',
  templateUrl: './pronunciation-practice-board.html',
  styleUrl: './pronunciation-practice-board.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PronunciationPracticeBoard {
  readonly question = input.required<ContentQuestion>();
  readonly isPlaying = input(false);
  readonly listenLabel = input('Poslušaj');
  readonly listen = output<void>();
}
