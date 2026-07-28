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
import { DemoChildProfile } from '../../../core/models/prototype-auth.model';
import {
  PrototypeRecordingAttempt,
  TherapistGameSession,
  TherapistReviewStatus,
  TherapistSessionSummary,
  TranscriptionStatus,
} from '../../../core/models/prototype-session.model';
import { PrototypeAuthService } from '../../../core/services/prototype-auth.service';
import { TherapistReviewService } from '../services/therapist-review.service';

interface ReviewDraft {
  readonly status: TherapistReviewStatus;
  readonly comment: string;
}

const REVIEW_LABELS: Record<TherapistReviewStatus, string> = {
  NOT_REVIEWED: 'Nije pregledano',
  LOOKS_GOOD: 'Izgleda dobro',
  PRACTICE_AGAIN: 'Vježbati ponovno',
};

const TRANSCRIPTION_LABELS: Record<TranscriptionStatus, string> = {
  PENDING: 'Prijepis u tijeku',
  COMPLETED: 'Prijepis dovršen',
  FAILED: 'Prijepis nije uspio',
};

@Component({
  selector: 'app-therapist-review-page',
  imports: [DatePipe],
  templateUrl: './therapist-review.page.html',
  styleUrl: './therapist-review.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TherapistReviewPage implements OnInit, OnDestroy {
  private readonly reviews = inject(TherapistReviewService);
  private readonly auth = inject(PrototypeAuthService);

  protected readonly children = signal<readonly DemoChildProfile[]>([]);
  protected readonly sessions = signal<readonly TherapistSessionSummary[]>([]);
  protected readonly selectedChildId = signal<string | null>(null);
  protected readonly selectedSessionId = signal<string | null>(null);
  protected readonly selectedSession = signal<TherapistGameSession | null>(null);
  protected readonly loading = signal(true);
  protected readonly detailLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly expandedAttemptId = signal<string | null>(null);
  protected readonly drafts = signal<Readonly<Record<string, ReviewDraft>>>({});
  protected readonly savingAttemptId = signal<string | null>(null);
  protected readonly savedAttemptId = signal<string | null>(null);
  protected readonly reviewError = signal('');
  protected readonly loadingAudioId = signal<string | null>(null);
  protected readonly audioUrls = signal<Readonly<Record<string, string>>>({});
  protected readonly audioErrors = signal<Readonly<Record<string, string>>>({});
  protected readonly reviewLabels = REVIEW_LABELS;
  protected readonly transcriptionLabels = TRANSCRIPTION_LABELS;
  protected readonly reviewStatuses: readonly TherapistReviewStatus[] = [
    'NOT_REVIEWED',
    'LOOKS_GOOD',
    'PRACTICE_AGAIN',
  ];
  protected readonly selectedChildSessions = computed(() =>
    this.sessions().filter((session) => session.childId === this.selectedChildId()),
  );
  protected readonly selectedChildName = computed(
    () =>
      this.children().find((child) => child.id === this.selectedChildId())?.displayName ??
      'Demo profil',
  );

  async ngOnInit(): Promise<void> {
    try {
      const [children, sessions] = await Promise.all([
        this.auth.loadChildren(),
        this.reviews.listSessions(),
      ]);
      this.children.set(children);
      this.sessions.set(sessions);
      const firstChild =
        children.find((child) => sessions.some((session) => session.childId === child.id)) ??
        children[0];
      if (firstChild) {
        await this.selectChild(firstChild);
      }
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Terapeutski pregled nije dostupan.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  ngOnDestroy(): void {
    this.revokeAudioUrls();
  }

  protected sessionCount(childId: string): number {
    return this.sessions().filter((session) => session.childId === childId).length;
  }

  protected async selectChild(child: DemoChildProfile): Promise<void> {
    this.selectedChildId.set(child.id);
    const firstSession = this.sessions().find((session) => session.childId === child.id);
    if (firstSession) {
      await this.selectSession(firstSession);
    } else {
      this.selectedSessionId.set(null);
      this.selectedSession.set(null);
      this.resetAttemptState();
    }
  }

  protected async selectSession(summary: TherapistSessionSummary): Promise<void> {
    this.selectedSessionId.set(summary.id);
    this.selectedSession.set(null);
    this.detailLoading.set(true);
    this.errorMessage.set('');
    this.resetAttemptState();
    try {
      const session = await this.reviews.getSession(summary.id);
      if (this.selectedSessionId() === summary.id) {
        this.selectedSession.set(session);
      }
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Detalji sesije nisu dostupni.',
      );
    } finally {
      if (this.selectedSessionId() === summary.id) {
        this.detailLoading.set(false);
      }
    }
  }

  protected toggleAttempt(attempt: PrototypeRecordingAttempt): void {
    if (this.expandedAttemptId() === attempt.id) {
      this.expandedAttemptId.set(null);
      return;
    }
    this.expandedAttemptId.set(attempt.id);
    this.savedAttemptId.set(null);
    this.reviewError.set('');
    this.drafts.update((drafts) => ({
      ...drafts,
      [attempt.id]: {
        status: attempt.therapistReview.status,
        comment: attempt.therapistReview.comment,
      },
    }));
  }

  protected draftFor(attempt: PrototypeRecordingAttempt): ReviewDraft {
    return (
      this.drafts()[attempt.id] ?? {
        status: attempt.therapistReview.status,
        comment: attempt.therapistReview.comment,
      }
    );
  }

  protected updateStatus(attempt: PrototypeRecordingAttempt, status: TherapistReviewStatus): void {
    this.updateDraft(attempt, { ...this.draftFor(attempt), status });
  }

  protected updateComment(attempt: PrototypeRecordingAttempt, comment: string): void {
    this.updateDraft(attempt, { ...this.draftFor(attempt), comment });
  }

  protected async saveReview(attempt: PrototypeRecordingAttempt): Promise<void> {
    const draft = this.draftFor(attempt);
    if (draft.comment.length > 400 || this.savingAttemptId()) {
      return;
    }
    this.savingAttemptId.set(attempt.id);
    this.savedAttemptId.set(null);
    this.reviewError.set('');
    try {
      const savedAttempt = await this.reviews.saveReview(attempt.id, draft.status, draft.comment);
      this.selectedSession.update((session) =>
        session
          ? {
              ...session,
              recordingAttempts: session.recordingAttempts.map((item) =>
                item.id === savedAttempt.id ? savedAttempt : item,
              ),
            }
          : session,
      );
      this.updateDraft(savedAttempt, {
        status: savedAttempt.therapistReview.status,
        comment: savedAttempt.therapistReview.comment,
      });
      this.savedAttemptId.set(attempt.id);
    } catch (error) {
      this.reviewError.set(error instanceof Error ? error.message : 'Osvrt nije spremljen.');
    } finally {
      this.savingAttemptId.set(null);
    }
  }

  protected async loadAudio(attempt: PrototypeRecordingAttempt): Promise<void> {
    if (this.audioUrls()[attempt.id] || this.loadingAudioId() === attempt.id) {
      return;
    }
    this.loadingAudioId.set(attempt.id);
    this.audioErrors.update((errors) => {
      const { [attempt.id]: _removed, ...remaining } = errors;
      return remaining;
    });
    try {
      const blob = await this.reviews.loadAttemptAudio(attempt.id);
      this.audioUrls.update((urls) => ({
        ...urls,
        [attempt.id]: URL.createObjectURL(blob),
      }));
    } catch (error) {
      this.audioErrors.update((errors) => ({
        ...errors,
        [attempt.id]: error instanceof Error ? error.message : 'Snimka nije dostupna.',
      }));
    } finally {
      this.loadingAudioId.set(null);
    }
  }

  protected formatDuration(durationMs: number): string {
    return `${Math.max(0.1, Math.round(durationMs / 100) / 10)} s`;
  }

  private updateDraft(attempt: PrototypeRecordingAttempt, draft: ReviewDraft): void {
    this.savedAttemptId.set(null);
    this.reviewError.set('');
    this.drafts.update((drafts) => ({ ...drafts, [attempt.id]: draft }));
  }

  private resetAttemptState(): void {
    this.expandedAttemptId.set(null);
    this.drafts.set({});
    this.savedAttemptId.set(null);
    this.reviewError.set('');
    this.revokeAudioUrls();
  }

  private revokeAudioUrls(): void {
    for (const url of Object.values(this.audioUrls())) {
      URL.revokeObjectURL(url);
    }
    this.audioUrls.set({});
  }
}
