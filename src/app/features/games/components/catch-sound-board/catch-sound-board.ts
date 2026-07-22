import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ContentQuestion } from '../../models/content-package.model';

@Component({
  selector: 'app-catch-sound-board',
  templateUrl: './catch-sound-board.html',
  styleUrl: './catch-sound-board.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatchSoundBoard {
  readonly question = input.required<ContentQuestion>();
  readonly disabled = input(false);
  readonly selectedId = input<string | null>(null);
  readonly answer = output<string>();
}
