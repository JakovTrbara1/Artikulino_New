import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  OnDestroy,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { PrototypeGameSession } from '../../../core/models/prototype-session.model';
import { PrototypeSessionService } from '../../../core/services/prototype-session.service';
import { MicrophonePractice } from '../../../shared/components/microphone-practice/microphone-practice';
import { RecordedAttempt } from '../../../shared/models/recorded-attempt.model';
import { AudioPlaybackService } from '../../../shared/services/audio-playback.service';
import { CatchSoundBoard } from '../components/catch-sound-board/catch-sound-board';
import { ListenDecideBoard } from '../components/listen-decide-board/listen-decide-board';
import { PronunciationPracticeBoard } from '../components/pronunciation-practice-board/pronunciation-practice-board';
import { SoundPositionBoard } from '../components/sound-position-board/sound-position-board';
import {
  ContentPackage,
  DIFFICULTY_LABELS,
  GAME_TYPE_LABELS,
} from '../models/content-package.model';
import { ContentPackagesService } from '../services/content-packages.service';
import { GameSessionService } from '../services/game-session.service';

@Component({
  selector: 'app-game-player-page',
  imports: [
    RouterLink,
    ListenDecideBoard,
    CatchSoundBoard,
    SoundPositionBoard,
    PronunciationPracticeBoard,
    MicrophonePractice,
  ],
  templateUrl: './game-player.page.html',
  styleUrl: './game-player.page.css',
  providers: [GameSessionService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GamePlayerPage implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly injector = inject(Injector);
  private readonly packageId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('packageId'))),
    { initialValue: null },
  );
  private readonly gameTitle = viewChild<ElementRef<HTMLHeadingElement>>('gameTitle');
  private readonly resultTitle = viewChild<ElementRef<HTMLHeadingElement>>('resultTitle');
  private initializedPackageId?: string;
  private prototypeSessionPromise?: Promise<PrototypeGameSession>;
  private practicePollingSequence = 0;

  protected readonly difficultyLabels = DIFFICULTY_LABELS;
  protected readonly gameTypeLabels = GAME_TYPE_LABELS;
  protected readonly contentPackage = computed(() => this.packages.findById(this.packageId()));
  protected readonly hasListened = signal(false);
  protected readonly selectedAnswer = signal<string | null>(null);
  protected readonly audioMessage = signal('');
  protected readonly persistenceMessage = signal('');
  protected readonly practiceResultPending = signal(false);
  protected readonly listenLabel = computed(() =>
    this.hasListened() ? 'Poslušaj ponovno' : 'Poslušaj',
  );
  protected readonly taskTitle = computed(() => {
    const contentPackage = this.contentPackage();
    const question = this.session.currentQuestion();
    if (!contentPackage || !question) {
      return '';
    }

    const sound = question.targetSound ?? contentPackage.targetSound ?? '';
    if (contentPackage.gameType === 'sound-position') {
      return `Gdje čuješ glas ${sound}?`;
    }
    if (contentPackage.gameType === 'catch-the-sound') {
      return contentPackage.soundPair ? 'Koji glas čuješ?' : `Čuješ li glas ${sound}?`;
    }
    if (contentPackage.gameType === 'pronunciation-practice') {
      return contentPackage.practiceMode === 'SOUND'
        ? 'Poslušaj i izgovori glas.'
        : 'Poslušaj i izgovori riječ.';
    }
    return question.taskText;
  });

  protected readonly saveRecordedAttempt = async (
    attempt: RecordedAttempt,
  ): Promise<{ readonly id: string }> => {
    this.practiceResultPending.set(true);
    const contentPackage = this.contentPackage();
    const question = this.session.currentQuestion();
    if (!contentPackage || !question) {
      this.practiceResultPending.set(false);
      throw new Error('Pitanje za snimanje nije dostupno.');
    }
    try {
      const prototypeSession = await this.ensurePrototypeSession(contentPackage);
      const savedAttempt = await this.prototypeSessions.uploadAttempt(
        prototypeSession.id,
        attempt,
        question.spokenText,
      );
      const pollingSequence = this.practicePollingSequence;
      this.session.markPracticeAttemptPending(savedAttempt.id, question.id);
      void this.resolvePracticeAttempt(savedAttempt.id, question.id, pollingSequence);
      return savedAttempt;
    } catch (error) {
      this.practiceResultPending.set(false);
      throw error;
    }
  };

  protected readonly deleteRecordedAttempt = async (attemptId: string): Promise<void> => {
    await this.prototypeSessions.deleteAttempt(attemptId);
  };

  constructor(
    private readonly packages: ContentPackagesService,
    protected readonly session: GameSessionService,
    protected readonly audio: AudioPlaybackService,
    private readonly prototypeSessions: PrototypeSessionService,
  ) {
    effect(() => {
      const contentPackage = this.contentPackage();
      if (contentPackage && contentPackage.id !== this.initializedPackageId) {
        this.initializedPackageId = contentPackage.id;
        this.session.start(contentPackage);
        this.resetQuestionUi();
        this.startPrototypeSession(contentPackage);
      }
    });
  }

  ngOnDestroy(): void {
    this.practicePollingSequence += 1;
    this.audio.stop();
  }

  protected async playPrompt(): Promise<void> {
    const question = this.session.currentQuestion();
    if (!question || this.audio.isPlaying()) {
      return;
    }

    if (this.hasListened()) {
      this.session.registerReplay();
    }
    this.hasListened.set(true);
    this.audioMessage.set('');
    try {
      await this.audio.play(question.spokenText, question.audioSrc);
    } catch {
      this.audioMessage.set('Zvuk trenutačno nije dostupan. Riječ možeš pročitati na ekranu.');
    }
  }

  protected chooseAnswer(answerId: string): void {
    if (!this.hasListened() || this.session.isAnswered()) {
      return;
    }
    this.selectedAnswer.set(answerId);
    this.session.submitAnswer(answerId);
  }

  protected receiveRecordedAttempt(): void {
    this.practicePollingSequence += 1;
    this.practiceResultPending.set(true);
    this.session.registerPracticeAttempt();
  }

  protected clearRecordedAttempt(remainingAttempts: number): void {
    if (remainingAttempts === 0) {
      this.practicePollingSequence += 1;
      this.practiceResultPending.set(false);
      this.session.reopenPracticeRound();
    }
  }

  protected skipPronunciationRecording(): void {
    this.practicePollingSequence += 1;
    this.practiceResultPending.set(false);
    this.session.skipPracticeRound();
  }

  protected nextQuestion(): void {
    this.audio.stop();
    this.session.next();
    if (this.session.isComplete()) {
      void this.completePrototypeSession();
      this.focusHeadingAfterRender('result');
    } else {
      this.resetQuestionUi();
      this.focusHeadingAfterRender('game');
    }
  }

  protected restart(): void {
    const contentPackage = this.contentPackage();
    if (contentPackage) {
      this.session.start(contentPackage);
      this.resetQuestionUi();
      this.startPrototypeSession(contentPackage);
      this.focusHeadingAfterRender('game');
    }
  }

  private resetQuestionUi(): void {
    this.practicePollingSequence += 1;
    this.practiceResultPending.set(false);
    this.audio.stop();
    this.hasListened.set(false);
    this.selectedAnswer.set(null);
    this.audioMessage.set('');
  }

  private startPrototypeSession(contentPackage: ContentPackage): void {
    this.prototypeSessionPromise = undefined;
    this.persistenceMessage.set('');
    void this.ensurePrototypeSession(contentPackage).catch(() => undefined);
  }

  private ensurePrototypeSession(contentPackage: ContentPackage): Promise<PrototypeGameSession> {
    if (!this.prototypeSessionPromise) {
      this.prototypeSessionPromise = this.prototypeSessions
        .create(contentPackage)
        .catch((error) => {
          this.prototypeSessionPromise = undefined;
          this.persistenceMessage.set(
            error instanceof Error
              ? `Spremanje nije dostupno: ${error.message}`
              : 'Spremanje trenutačno nije dostupno.',
          );
          throw error;
        });
    }
    return this.prototypeSessionPromise;
  }

  private async completePrototypeSession(): Promise<void> {
    const contentPackage = this.contentPackage();
    const result = this.session.completedResult();
    if (!contentPackage || !result) {
      return;
    }
    this.persistenceMessage.set('Spremanje rezultata…');
    try {
      const prototypeSession = await this.ensurePrototypeSession(contentPackage);
      await this.prototypeSessions.complete(prototypeSession.id, result);
      this.persistenceMessage.set('Rezultat je spremljen u napredak demo profila.');
    } catch {
      // The game result remains visible and playable even when local persistence is unavailable.
    }
  }

  private async resolvePracticeAttempt(
    attemptId: string,
    questionId: string,
    pollingSequence: number,
  ): Promise<void> {
    try {
      const attempt = await this.prototypeSessions.waitForAttemptResult(attemptId);
      if (
        pollingSequence !== this.practicePollingSequence ||
        this.session.currentQuestion()?.id !== questionId
      ) {
        return;
      }

      this.practiceResultPending.set(false);
      if (!attempt) {
        this.session.resolvePracticeAttempt(attemptId, questionId, 'TIMED_OUT');
        return;
      }
      if (attempt.transcriptionStatus === 'COMPLETED') {
        this.session.resolvePracticeAttempt(attemptId, questionId, 'COMPLETED', attempt.textMatch);
        return;
      }
      this.session.resolvePracticeAttempt(attemptId, questionId, 'FAILED');
    } catch {
      if (
        pollingSequence === this.practicePollingSequence &&
        this.session.currentQuestion()?.id === questionId
      ) {
        this.practiceResultPending.set(false);
        this.session.resolvePracticeAttempt(attemptId, questionId, 'FAILED');
      }
    }
  }

  private focusHeadingAfterRender(target: 'game' | 'result'): void {
    afterNextRender(
      {
        write: () => {
          const heading = target === 'result' ? this.resultTitle() : this.gameTitle();
          heading?.nativeElement.focus();
        },
      },
      { injector: this.injector },
    );
  }
}
