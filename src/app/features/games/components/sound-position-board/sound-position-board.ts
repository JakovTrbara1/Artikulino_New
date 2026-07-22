import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ContentQuestion } from '../../models/content-package.model';

@Component({
  selector: 'app-sound-position-board',
  templateUrl: './sound-position-board.html',
  styleUrl: './sound-position-board.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SoundPositionBoard {
  readonly question = input.required<ContentQuestion>();
  readonly disabled = input(false);
  readonly selectedId = input<string | null>(null);
  readonly answer = output<string>();

  protected answerFor(position: string) {
    return this.question().answers.find((option) => option.id === position);
  }
}
