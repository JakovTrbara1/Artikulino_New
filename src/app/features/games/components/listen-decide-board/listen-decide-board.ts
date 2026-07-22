import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ContentQuestion } from '../../models/content-package.model';

@Component({
  selector: 'app-listen-decide-board',
  templateUrl: './listen-decide-board.html',
  styleUrl: './listen-decide-board.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListenDecideBoard {
  readonly question = input.required<ContentQuestion>();
  readonly disabled = input(false);
  readonly selectedId = input<string | null>(null);
  readonly answer = output<string>();
}
