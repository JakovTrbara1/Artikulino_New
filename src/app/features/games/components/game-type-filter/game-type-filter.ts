import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import {
  GAME_TYPE_DESCRIPTIONS,
  GAME_TYPE_LABELS,
  GameType,
} from '../../models/content-package.model';

@Component({
  selector: 'app-game-type-filter',
  templateUrl: './game-type-filter.html',
  styleUrl: './game-type-filter.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameTypeFilter {
  readonly selectedType = input<GameType | ''>('');
  readonly selectedTypeChange = output<GameType>();

  protected readonly descriptions = GAME_TYPE_DESCRIPTIONS;
  protected readonly labels = GAME_TYPE_LABELS;
  protected readonly gameTypes: readonly GameType[] = [
    'listen-and-decide',
    'catch-the-sound',
    'sound-position',
  ];
}
