import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  PrototypeGameSession,
  PrototypeRecordingAttempt,
  TherapistReviewStatus,
  TranscriptionStatus,
} from '../../../core/models/prototype-session.model';
import { ProgressService } from '../../../core/services/progress.service';
import { PrototypeAuthService } from '../../../core/services/prototype-auth.service';
import { PrototypeSessionService } from '../../../core/services/prototype-session.service';
import { DIFFICULTY_LABELS, GAME_TYPE_LABELS } from '../../games/models/content-package.model';

const TRANSCRIPTION_LABELS: Record<TranscriptionStatus, string> = {
  PENDING: 'Prijepis u tijeku',
  COMPLETED: 'Prijepis dovršen',
  FAILED: 'Prijepis nije uspio',
};

const REVIEW_LABELS: Record<TherapistReviewStatus, string> = {
  NOT_REVIEWED: 'Još nije pregledano',
  LOOKS_GOOD: 'Izgleda dobro',
  PRACTICE_AGAIN: 'Vježbati ponovno',
};

@Component({
  selector: 'app-progress-page',
  imports: [RouterLink, DatePipe],
  templateUrl: './progress.page.html',
  styleUrl: './progress.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressPage implements OnInit, OnDestroy {
  private readonly prototypeSessions = inject(PrototypeSessionService);
  private readonly legacyProgress = inject(ProgressService);
  private readonly router = inject(Router);

  protected readonly auth = inject(PrototypeAuthService);
  protected readonly difficultyLabels = DIFFICULTY_LABELS;
  protected readonly gameTypeLabels = GAME_TYPE_LABELS;
  protected readonly sessions = signal<readonly PrototypeGameSession[]>([]);
  protected readonly loading = signal(true);
  protected readonly deletingId = signal<string | null>(null);
  protected readonly deletingProfile = signal(false);
  protected readonly loadingAudioId = signal<string | null>(null);
  protected readonly audioUrls = signal<Readonly<Record<string, string>>>({});
  protected readonly audioErrors = signal<Readonly<Record<string, string>>>({});
  protected readonly errorMessage = signal('');
  protected readonly transcriptionLabels = TRANSCRIPTION_LABELS;
  protected readonly reviewLabels = REVIEW_LABELS;
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

  ngOnDestroy(): void {
    this.revokeAllAudioUrls();
  }

  protected async refreshSessions(): Promise<void> {
    await this.loadSessions();
  }

  protected async loadAttemptAudio(attempt: PrototypeRecordingAttempt): Promise<void> {
    if (this.audioUrls()[attempt.id] || this.loadingAudioId() === attempt.id) {
      return;
    }
    this.loadingAudioId.set(attempt.id);
    this.audioErrors.update((errors) => {
      const { [attempt.id]: _removed, ...remaining } = errors;
      return remaining;
    });
    try {
      const blob = await this.prototypeSessions.loadAttemptAudio(attempt.id);
      const url = URL.createObjectURL(blob);
      this.audioUrls.update((urls) => ({ ...urls, [attempt.id]: url }));
    } catch (error) {
      this.audioErrors.update((errors) => ({
        ...errors,
        [attempt.id]: error instanceof Error ? error.message : 'Snimka trenutačno nije dostupna.',
      }));
    } finally {
      this.loadingAudioId.set(null);
    }
  }

  protected async deleteSession(session: PrototypeGameSession): Promise<void> {
    if (!confirm(`Izbrisati sesiju „${session.packageName}” i sve povezane testne audiosnimke?`)) {
      return;
    }
    this.deletingId.set(session.id);
    this.errorMessage.set('');
    try {
      await this.prototypeSessions.deleteSession(session.id);
      this.revokeAttemptAudioUrls(session.recordingAttempts);
      this.sessions.update((sessions) => sessions.filter((item) => item.id !== session.id));
      this.legacyProgress.clear();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Sesija nije izbrisana.');
    } finally {
      this.deletingId.set(null);
    }
  }

  protected async deleteActiveProfile(): Promise<void> {
    const child = this.auth.activeChild();
    if (
      !child ||
      !confirm(
        `Trajno izbrisati demo profil „${child.displayName}”, sve sesije, prijepise i testne audiosnimke?`,
      )
    ) {
      return;
    }
    this.deletingProfile.set(true);
    this.errorMessage.set('');
    try {
      await this.auth.deleteChild(child.id);
      this.legacyProgress.clear();
      this.revokeAllAudioUrls();
      this.sessions.set([]);
      await this.router.navigate(['/profili']);
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Profil nije izbrisan.');
    } finally {
      this.deletingProfile.set(false);
    }
  }

  protected formatDuration(durationMs: number): string {
    return `${Math.max(0.1, Math.round(durationMs / 100) / 10)} s`;
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

  private revokeAttemptAudioUrls(attempts: readonly PrototypeRecordingAttempt[]): void {
    const current = { ...this.audioUrls() };
    for (const attempt of attempts) {
      const url = current[attempt.id];
      if (url) {
        URL.revokeObjectURL(url);
        delete current[attempt.id];
      }
    }
    this.audioUrls.set(current);
  }

  private revokeAllAudioUrls(): void {
    for (const url of Object.values(this.audioUrls())) {
      URL.revokeObjectURL(url);
    }
    this.audioUrls.set({});
  }
}
