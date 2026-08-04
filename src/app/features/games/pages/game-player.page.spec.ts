import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { AudioPlaybackService } from '../../../shared/services/audio-playback.service';
import { PrototypeSessionService } from '../../../core/services/prototype-session.service';
import { GameSessionService } from '../services/game-session.service';
import { GamePlayerPage } from './game-player.page';

describe('GamePlayerPage accessibility', () => {
  let fixture: ComponentFixture<GamePlayerPage>;
  let session: GameSessionService;
  let routeParams: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  const prototypeSessions = {
    create: vi.fn().mockResolvedValue({ id: 'prototype-session-1' }),
    complete: vi.fn().mockResolvedValue({ id: 'prototype-session-1' }),
    uploadAttempt: vi.fn().mockResolvedValue({ id: 'attempt-1', transcriptionStatus: 'PENDING' }),
    waitForAttemptResult: vi
      .fn()
      .mockResolvedValue({ id: 'attempt-1', transcriptionStatus: 'COMPLETED', textMatch: 80 }),
    deleteAttempt: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    localStorage.clear();
    Object.values(prototypeSessions).forEach((method) => method.mockClear());
    routeParams = new BehaviorSubject(convertToParamMap({ packageId: 'slusaj-hrana-s-lagano' }));
    await TestBed.configureTestingModule({
      imports: [GamePlayerPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: routeParams,
          },
        },
        {
          provide: AudioPlaybackService,
          useValue: {
            isPlaying: signal(false).asReadonly(),
            play: vi.fn().mockResolvedValue(undefined),
            stop: vi.fn(),
          },
        },
        { provide: PrototypeSessionService, useValue: prototypeSessions },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GamePlayerPage);
    session = fixture.debugElement.injector.get(GameSessionService);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('exposes numeric and readable progress semantics', () => {
    const progress = fixture.nativeElement.querySelector('[role="progressbar"]') as HTMLElement;

    expect(progress.getAttribute('aria-valuemin')).toBe('0');
    expect(progress.getAttribute('aria-valuemax')).toBe('100');
    expect(progress.getAttribute('aria-valuenow')).toBe('0');
    expect(progress.getAttribute('aria-valuetext')).toBe('Pitanje 1 od 4');
  });

  it('does not render recording controls in any recognition game category', async () => {
    for (const packageId of [
      'slusaj-hrana-s-lagano',
      'uhvati-zivotinje-r-lagano',
      'pozicija-hrana-s-lagano',
    ]) {
      routeParams.next(convertToParamMap({ packageId }));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('app-microphone-practice')).toBeNull();
      expect(fixture.nativeElement.querySelector('[role="group"]')).not.toBeNull();
    }
  });

  it('requires listening and waits for a scored pronunciation result without answer controls', async () => {
    routeParams.next(convertToParamMap({ packageId: 'izgovor-rijeci-s' }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(
      (fixture.nativeElement.querySelector('#game-title') as HTMLElement).textContent,
    ).toContain('Poslušaj i izgovori riječ.');
    expect(fixture.nativeElement.querySelector('[role="group"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-microphone-practice')).not.toBeNull();
    expect(
      (fixture.nativeElement.querySelector('.microphone-button') as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(fixture.nativeElement.querySelector('.next-button')).toBeNull();

    (
      fixture.nativeElement.querySelector(
        '.pronunciation-board .listen-button',
      ) as HTMLButtonElement
    ).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(
      (fixture.nativeElement.querySelector('.microphone-button') as HTMLButtonElement).disabled,
    ).toBe(false);

    const page = fixture.componentInstance as unknown as {
      receiveRecordedAttempt(): void;
      saveRecordedAttempt(attempt: {
        blob: Blob;
        mimeType: string;
        durationMs: number;
        questionId: string;
        attemptNumber: number;
      }): Promise<{ readonly id: string }>;
    };
    page.receiveRecordedAttempt();
    await page.saveRecordedAttempt({
      blob: new Blob(['fictional adult recording'], { type: 'audio/webm' }),
      mimeType: 'audio/webm',
      durationMs: 1_500,
      questionId: 'izgovor-s-sunce',
      attemptNumber: 1,
    });
    await vi.waitFor(() => expect(session.isAnswered()).toBe(true));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.next-button')).not.toBeNull();
    expect(session.totalPoints()).toBe(12);
    expect(session.correctAnswers()).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('Podudarnost teksta: 80%');
  });

  it('moves focus to the next question heading after advancing', async () => {
    answerCurrentQuestion();
    await clickNextButton();

    const gameTitle = fixture.nativeElement.querySelector('#game-title') as HTMLHeadingElement;
    expect(document.activeElement).toBe(gameTitle);
    expect(gameTitle.textContent?.trim()).toBe('Poslušaj i odaberi odgovor.');
  });

  it('moves focus to the result heading after completion', async () => {
    const questionCount = session.contentPackage()?.questions.length ?? 0;
    for (let index = 0; index < questionCount - 1; index += 1) {
      answerCurrentQuestion();
      session.next();
    }
    fixture.detectChanges();

    answerCurrentQuestion();
    await clickNextButton();

    const resultTitle = fixture.nativeElement.querySelector('#result-title') as HTMLHeadingElement;
    expect(document.activeElement).toBe(resultTitle);
    expect(resultTitle.textContent?.trim()).toBe('Bravo, stigao/la si do cilja!');
    await fixture.whenStable();
    expect(prototypeSessions.complete).toHaveBeenCalledOnce();
  });

  function answerCurrentQuestion(): void {
    const answerId = session.currentQuestion()?.correctAnswerIds[0];
    if (!answerId) {
      throw new Error('Testno pitanje nema točan odgovor.');
    }
    session.submitAnswer(answerId);
    fixture.detectChanges();
  }

  async function clickNextButton(): Promise<void> {
    const nextButton = fixture.nativeElement.querySelector(
      '.next-button',
    ) as HTMLButtonElement | null;
    if (!nextButton) {
      throw new Error('Gumb za nastavak nije prikazan.');
    }

    nextButton.click();
    fixture.detectChanges();
    await fixture.whenRenderingDone();
    fixture.detectChanges();
  }
});
