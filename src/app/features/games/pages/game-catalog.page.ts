import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  DIFFICULTY_LABELS,
  Difficulty,
  GAME_TYPE_LABELS,
  GameType,
} from '../models/content-package.model';
import { ContentPackagesService } from '../services/content-packages.service';

@Component({
  selector: 'app-game-catalog-page',
  imports: [RouterLink],
  templateUrl: './game-catalog.page.html',
  styleUrl: './game-catalog.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameCatalogPage {
  protected readonly difficultyLabels = DIFFICULTY_LABELS;
  protected readonly gameTypeLabels = GAME_TYPE_LABELS;
  protected readonly gameTypes: readonly GameType[] = [
    'listen-and-decide',
    'catch-the-sound',
    'sound-position',
  ];
  protected readonly difficulties: readonly Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];
  protected readonly gameType = signal<GameType | ''>('');
  protected readonly difficulty = signal<Difficulty | ''>('');
  protected readonly theme = signal('');
  protected readonly sound = signal('');
  protected readonly packages = computed(() =>
    this.content.filter({
      gameType: this.gameType() || undefined,
      difficulty: this.difficulty() || undefined,
      theme: this.theme() || undefined,
      sound: this.sound() || undefined,
    }),
  );

  constructor(protected readonly content: ContentPackagesService) {}

  protected setGameType(value: string): void {
    this.gameType.set(value as GameType | '');
  }

  protected setDifficulty(value: string): void {
    this.difficulty.set(value as Difficulty | '');
  }

  protected setTextFilter(filter: 'theme' | 'sound', event: Event): void {
    const value = event.target instanceof HTMLSelectElement ? event.target.value : '';
    filter === 'theme' ? this.theme.set(value) : this.sound.set(value);
  }

  protected setTypedFilter(filter: 'gameType' | 'difficulty', event: Event): void {
    const value = event.target instanceof HTMLSelectElement ? event.target.value : '';
    filter === 'gameType' ? this.setGameType(value) : this.setDifficulty(value);
  }

  protected resetFilters(): void {
    this.gameType.set('');
    this.difficulty.set('');
    this.theme.set('');
    this.sound.set('');
  }
}
