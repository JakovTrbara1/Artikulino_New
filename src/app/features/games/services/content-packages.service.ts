import { computed, Injectable, signal } from '@angular/core';
import { DEMO_CONTENT_PACKAGES } from '../data/demo-content-packages';
import {
  ContentPackage,
  Difficulty,
  GameType,
  SUPPORTED_TARGET_SOUNDS,
} from '../models/content-package.model';

@Injectable({ providedIn: 'root' })
export class ContentPackagesService {
  private readonly packageState = signal<readonly ContentPackage[]>(DEMO_CONTENT_PACKAGES);

  readonly packages = this.packageState.asReadonly();
  readonly themes = computed(() => [...new Set(this.packages().map((item) => item.theme))].sort());
  readonly sounds = computed(() =>
    [
      ...new Set([
        ...SUPPORTED_TARGET_SOUNDS,
        ...this.packages().flatMap(
          (item) => [item.targetSound, item.contrastSound].filter(Boolean) as string[],
        ),
      ]),
    ].sort((a, b) => a.localeCompare(b, 'hr-HR')),
  );

  findById(id: string | null): ContentPackage | undefined {
    return this.packages().find((item) => item.id === id);
  }

  filter(filters: {
    gameType?: GameType;
    difficulty?: Difficulty;
    theme?: string;
    sound?: string;
  }): readonly ContentPackage[] {
    return this.packages().filter(
      (item) =>
        (!filters.gameType || item.gameType === filters.gameType) &&
        (!filters.difficulty || item.difficulty === filters.difficulty) &&
        (!filters.theme || item.theme === filters.theme) &&
        (!filters.sound ||
          item.targetSound === filters.sound ||
          item.contrastSound === filters.sound),
    );
  }
}
