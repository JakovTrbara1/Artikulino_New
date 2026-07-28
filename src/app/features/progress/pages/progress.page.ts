import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { PrototypeGameSession } from '../../../core/models/prototype-session.model';
import { ProgressService } from '../../../core/services/progress.service';
import { PrototypeAuthService } from '../../../core/services/prototype-auth.service';
import { PrototypeSessionService } from '../../../core/services/prototype-session.service';
import { DIFFICULTY_LABELS, GAME_TYPE_LABELS } from '../../games/models/content-package.model';

@Component({
  selector: 'app-progress-page',
  imports: [RouterLink, DatePipe],
  templateUrl: './progress.page.html',
  styleUrl: './progress.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressPage implements OnInit {
  private readonly prototypeSessions = inject(PrototypeSessionService);
  private readonly legacyProgress = inject(ProgressService);

  protected readonly auth = inject(PrototypeAuthService);
  protected readonly difficultyLabels = DIFFICULTY_LABELS;
  protected readonly gameTypeLabels = GAME_TYPE_LABELS;
  protected readonly sessions = signal<readonly PrototypeGameSession[]>([]);
  protected readonly loading = signal(true);
  protected readonly deletingId = signal<string | null>(null);
  protected readonly errorMessage = signal('');
  protected readonly completedSessions = computed(() =>
    this.sessions().filter((session) => Boolean(session.completedAt)),
  );
  protected readonly totalPoints = computed(() =>
    this.completedSessions().reduce((sum, session) => sum + session.totalPoints, 0),
  );
  protected readonly accuracy = computed(() => {
    const questions = this.completedSessions().reduce(
      (sum, session) => sum + session.questionCount,
      0,
    );
    const correct = this.completedSessions().reduce(
      (sum, session) => sum + session.correctAnswers,
      0,
    );
    return questions ? Math.round((correct / questions) * 100) : 0;
  });
  protected readonly minutes = computed(() =>
    Math.max(
      0,
      Math.round(
        this.completedSessions().reduce((sum, session) => sum + session.durationSeconds, 0) / 60,
      ),
    ),
  );

  async ngOnInit(): Promise<void> {
    await this.loadSessions();
  }

  protected async deleteSession(session: PrototypeGameSession): Promise<void> {
    if (!confirm(`Izbrisati sesiju „${session.packageName}” i sve povezane testne audiosnimke?`)) {
      return;
    }
    this.deletingId.set(session.id);
    this.errorMessage.set('');
    try {
      await this.prototypeSessions.deleteSession(session.id);
      this.sessions.update((sessions) => sessions.filter((item) => item.id !== session.id));
      this.legacyProgress.clear();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Sesija nije izbrisana.');
    } finally {
      this.deletingId.set(null);
    }
  }

  private async loadSessions(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');
    try {
      this.sessions.set(await this.prototypeSessions.listForActiveChild());
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Napredak trenutačno nije dostupan.',
      );
    } finally {
      this.loading.set(false);
    }
  }
}
