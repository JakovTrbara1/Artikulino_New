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
import { MicrophonePractice } from '../../../shared/components/microphone-practice/microphone-practice';
import { AudioPlaybackService } from '../../../shared/services/audio-playback.service';
import { CatchSoundBoard } from '../components/catch-sound-board/catch-sound-board';
import { ListenDecideBoard } from '../components/listen-decide-board/listen-decide-board';
import { SoundPositionBoard } from '../components/sound-position-board/sound-position-board';
import { DIFFICULTY_LABELS, GAME_TYPE_LABELS } from '../models/content-package.model';
import { ContentPackagesService } from '../services/content-packages.service';
import { GameSessionService } from '../services/game-session.service';

@Component({
  selector: 'app-game-player-page',
  imports: [RouterLink, ListenDecideBoard, CatchSoundBoard, SoundPositionBoard, MicrophonePractice],
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

  protected readonly difficultyLabels = DIFFICULTY_LABELS;
  protected readonly gameTypeLabels = GAME_TYPE_LABELS;
  protected readonly contentPackage = computed(() => this.packages.findById(this.packageId()));
  protected readonly hasListened = signal(false);
  protected readonly selectedAnswer = signal<string | null>(null);
  protected readonly audioMessage = signal('');
  protected readonly listenLabel = computed(() =>
    this.hasListened() ? 'Poslušaj ponovno' : 'Poslušaj',
  );
  protected readonly taskTitle = computed(() => {
    const contentPackage = this.contentPackage();
    const question = this.session.currentQuestion();
    if (!contentPackage || !question) {
      return '';
    }

    const sound = question.targetSound ?? contentPackage.targetSound;
    if (contentPackage.gameType === 'sound-position') {
      return `Gdje čuješ glas ${sound}?`;
    }
    if (contentPackage.gameType === 'catch-the-sound') {
      return contentPackage.soundPair ? 'Koji glas čuješ?' : `Čuješ li glas ${sound}?`;
    }
    return question.taskText;
  });

  constructor(
    private readonly packages: ContentPackagesService,
    protected readonly session: GameSessionService,
    protected readonly audio: AudioPlaybackService,
  ) {
    effect(() => {
      const contentPackage = this.contentPackage();
      if (contentPackage && contentPackage.id !== this.initializedPackageId) {
        this.initializedPackageId = contentPackage.id;
        this.session.start(contentPackage);
        this.resetQuestionUi();
      }
    });
  }

  ngOnDestroy(): void {
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

  protected nextQuestion(): void {
    this.audio.stop();
    this.session.next();
    if (this.session.isComplete()) {
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
      this.focusHeadingAfterRender('game');
    }
  }

  private resetQuestionUi(): void {
    this.audio.stop();
    this.hasListened.set(false);
    this.selectedAnswer.set(null);
    this.audioMessage.set('');
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
