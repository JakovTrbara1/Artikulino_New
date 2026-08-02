import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  ContentPackage,
  DIFFICULTY_LABELS,
  GAME_TYPE_DESCRIPTIONS,
} from '../../models/content-package.model';

@Component({
  selector: 'app-catalog-game-card',
  imports: [RouterLink],
  templateUrl: './catalog-game-card.html',
  styleUrl: './catalog-game-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogGameCard {
  readonly contentPackage = input.required<ContentPackage>();
  readonly infoOpen = input(false);
  readonly infoToggle = output<string>();

  protected readonly difficultyLabels = DIFFICULTY_LABELS;
  protected readonly gameTypeDescriptions = GAME_TYPE_DESCRIPTIONS;

  protected toggleInfo(event: MouseEvent): void {
    event.stopPropagation();
    this.infoToggle.emit(this.contentPackage().id);
  }

  protected keepInfoOpen(event: MouseEvent): void {
    event.stopPropagation();
  }

  protected practiceTarget(contentPackage: ContentPackage): string {
    return contentPackage.soundPair
      ? `${contentPackage.soundPair.primary} / ${contentPackage.soundPair.contrast}`
      : (contentPackage.targetSound ?? contentPackage.theme);
  }
}
