import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProgressService } from '../../../core/services/progress.service';
import { DIFFICULTY_LABELS, GAME_TYPE_LABELS } from '../../games/models/content-package.model';

@Component({
  selector: 'app-progress-page',
  imports: [RouterLink, DatePipe],
  templateUrl: './progress.page.html',
  styleUrl: './progress.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressPage {
  protected readonly difficultyLabels = DIFFICULTY_LABELS;
  protected readonly gameTypeLabels = GAME_TYPE_LABELS;
  protected readonly accuracy = computed(() =>
    this.progress.totalQuestions()
      ? Math.round((this.progress.totalCorrect() / this.progress.totalQuestions()) * 100)
      : 0,
  );
  protected readonly minutes = computed(() =>
    Math.max(0, Math.round(this.progress.totalSeconds() / 60)),
  );

  constructor(protected readonly progress: ProgressService) {}
}
