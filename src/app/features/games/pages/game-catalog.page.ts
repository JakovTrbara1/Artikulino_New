import { ChangeDetectionStrategy, Component, computed, HostListener, signal } from '@angular/core';
import { CatalogGameCard } from '../components/catalog-game-card/catalog-game-card';
import { GameTypeFilter } from '../components/game-type-filter/game-type-filter';
import {
  DIFFICULTY_LABELS,
  Difficulty,
  GameType,
  PronunciationPracticeMode,
  RecognitionMode,
} from '../models/content-package.model';
import { ContentPackagesService } from '../services/content-packages.service';

@Component({
  selector: 'app-game-catalog-page',
  imports: [CatalogGameCard, GameTypeFilter],
  templateUrl: './game-catalog.page.html',
  styleUrl: './game-catalog.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameCatalogPage {
  protected readonly difficultyLabels = DIFFICULTY_LABELS;
  protected readonly difficulties: readonly Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];
  protected readonly gameType = signal<GameType | ''>('');
  protected readonly difficulty = signal<Difficulty | ''>('');
  protected readonly theme = signal('');
  protected readonly sound = signal('');
  protected readonly recognitionMode = signal<RecognitionMode | ''>('');
  protected readonly practiceMode = signal<PronunciationPracticeMode | ''>('');
  protected readonly openInfoId = signal<string | null>(null);
  protected readonly activeFilterCount = computed(() =>
    ['listen-and-decide', 'sound-position'].includes(this.gameType()) ? 2 : 3,
  );
  protected readonly packages = computed(() =>
    this.content.filter({
      gameType: this.gameType() || undefined,
      difficulty: this.difficulty() || undefined,
      theme: this.theme() || undefined,
      sound: this.sound() || undefined,
      recognitionMode: this.recognitionMode() || undefined,
      practiceMode: this.practiceMode() || undefined,
    }),
  );

  constructor(protected readonly content: ContentPackagesService) {}

  @HostListener('document:click')
  protected closePackageInfo(): void {
    this.openInfoId.set(null);
  }

  @HostListener('document:keydown.escape')
  protected closePackageInfoWithEscape(): void {
    this.closePackageInfo();
  }

  protected toggleGameType(type: GameType): void {
    const nextType = this.gameType() === type ? '' : type;
    this.gameType.set(nextType);
    this.clearIncompatibleFilters(nextType);
    this.closePackageInfo();
  }

  protected setDifficulty(event: Event): void {
    const value = event.target instanceof HTMLSelectElement ? event.target.value : '';
    this.difficulty.set(value as Difficulty | '');
    this.closePackageInfo();
  }

  protected setTextFilter(filter: 'theme' | 'sound', event: Event): void {
    const value = event.target instanceof HTMLSelectElement ? event.target.value : '';
    filter === 'theme' ? this.theme.set(value) : this.sound.set(value);
    this.closePackageInfo();
  }

  protected setRecognitionMode(event: Event): void {
    const value = event.target instanceof HTMLSelectElement ? event.target.value : '';
    this.recognitionMode.set(value as RecognitionMode | '');
    this.closePackageInfo();
  }

  protected setPracticeMode(event: Event): void {
    const value = event.target instanceof HTMLSelectElement ? event.target.value : '';
    this.practiceMode.set(value as PronunciationPracticeMode | '');
    this.closePackageInfo();
  }

  protected resetFilters(): void {
    this.gameType.set('');
    this.difficulty.set('');
    this.theme.set('');
    this.sound.set('');
    this.recognitionMode.set('');
    this.practiceMode.set('');
    this.closePackageInfo();
  }

  protected togglePackageInfo(packageId: string): void {
    this.openInfoId.update((current) => (current === packageId ? null : packageId));
  }

  private clearIncompatibleFilters(gameType: GameType | ''): void {
    if (gameType === 'listen-and-decide') {
      this.sound.set('');
      this.recognitionMode.set('');
      this.practiceMode.set('');
      return;
    }

    if (gameType === 'catch-the-sound') {
      this.theme.set('');
      this.practiceMode.set('');
      return;
    }

    if (gameType === 'sound-position') {
      this.theme.set('');
      this.recognitionMode.set('');
      this.practiceMode.set('');
      return;
    }

    if (gameType === 'pronunciation-practice') {
      this.theme.set('');
      this.recognitionMode.set('');
      return;
    }

    this.recognitionMode.set('');
    this.practiceMode.set('');
  }
}
