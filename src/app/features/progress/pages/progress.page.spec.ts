import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { PrototypeGameSession } from '../../../core/models/prototype-session.model';
import { ProgressService } from '../../../core/services/progress.service';
import { PrototypeAuthService } from '../../../core/services/prototype-auth.service';
import { PrototypeSessionService } from '../../../core/services/prototype-session.service';
import { ProgressPage } from './progress.page';

const SESSION: PrototypeGameSession = {
  id: 'session-1',
  childId: 'child-1',
  packageId: 'package-1',
  packageName: 'Što jedemo?',
  gameType: 'listen-and-decide',
  targetSound: 'S',
  theme: 'Hrana',
  difficulty: 'EASY',
  questionCount: 4,
  correctAnswers: 3,
  attempts: 5,
  replays: 1,
  longestStreak: 2,
  totalPoints: 35,
  durationSeconds: 60,
  startedAt: '2026-07-28T10:00:00.000Z',
  completedAt: '2026-07-28T10:01:00.000Z',
  recordingAttempts: [
    {
      id: 'attempt-completed',
      questionId: 'question-1',
      attemptNumber: 1,
      expectedText: 'kruška',
      mimeType: 'audio/webm',
      durationMs: 1_500,
      fileSize: 1_024,
      createdAt: '2026-07-28T10:00:10.000Z',
      transcriptionStatus: 'COMPLETED',
      transcript: 'kruška',
      textMatch: 100,
      therapistReview: {
        status: 'LOOKS_GOOD',
        comment: 'Jasan testni primjer. Nastavite istim tempom.',
        reviewedAt: '2026-07-28T11:00:00.000Z',
      },
    },
    {
      id: 'attempt-pending',
      questionId: 'question-2',
      attemptNumber: 1,
      expectedText: 'salata',
      mimeType: 'audio/webm',
      durationMs: 900,
      fileSize: 900,
      createdAt: '2026-07-28T10:00:20.000Z',
      transcriptionStatus: 'PENDING',
      therapistReview: { status: 'NOT_REVIEWED', comment: '' },
    },
    {
      id: 'attempt-failed',
      questionId: 'question-3',
      attemptNumber: 2,
      expectedText: 'sir',
      mimeType: 'audio/webm',
      durationMs: 800,
      fileSize: 800,
      createdAt: '2026-07-28T10:00:30.000Z',
      transcriptionStatus: 'FAILED',
      therapistReview: {
        status: 'PRACTICE_AGAIN',
        comment: 'Ponovite samo ako želite; rezultat nije klinička procjena.',
      },
    },
  ],
};

describe('ProgressPage', () => {
  let fixture: ComponentFixture<ProgressPage>;
  const listForActiveChild = vi.fn();
  const deleteSession = vi.fn();
  const loadAttemptAudio = vi.fn();
  const deleteChild = vi.fn();
  const clearLegacyProgress = vi.fn();
  const createObjectURL = vi.fn().mockReturnValue('blob:attempt-audio');
  const revokeObjectURL = vi.fn();

  async function createPage(
    sessions: readonly PrototypeGameSession[] = [SESSION],
    error?: Error,
  ): Promise<void> {
    if (error) {
      listForActiveChild.mockRejectedValue(error);
    } else {
      listForActiveChild.mockResolvedValue(sessions);
    }
    await TestBed.configureTestingModule({
      imports: [ProgressPage],
      providers: [
        provideRouter([]),
        {
          provide: PrototypeSessionService,
          useValue: { listForActiveChild, deleteSession, loadAttemptAudio },
        },
        {
          provide: PrototypeAuthService,
          useValue: {
            activeChild: () => ({ id: 'child-1', displayName: 'Luka' }),
            deleteChild,
          },
        },
        { provide: ProgressService, useValue: { clear: clearLegacyProgress } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ProgressPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(() => {
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });
    deleteSession.mockResolvedValue(undefined);
    deleteChild.mockResolvedValue(undefined);
    loadAttemptAudio.mockResolvedValue(new Blob(['fictional adult recording']));
  });

  afterEach(() => {
    fixture?.destroy();
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('shows completed, pending, failed and therapist-review attempt details', async () => {
    await createPage();
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Luka');
    expect(text).toContain('Očekivani tekst');
    expect(text).toContain('kruška');
    expect(text).toContain('100%');
    expect(text).toContain('Prijepis u tijeku');
    expect(text).toContain('Prijepis nije uspio');
    expect(text).toContain('Jasan testni primjer. Nastavite istim tempom.');
    expect(text).toContain('Nije ocjena izgovora ni klinički rezultat.');
  });

  it('keeps pronunciation results out of recognition accuracy and shows best text match', async () => {
    const pronunciationSession: PrototypeGameSession = {
      ...SESSION,
      id: 'session-pronunciation',
      packageName: 'Izgovori riječ',
      gameType: 'pronunciation-practice',
      correctAnswers: 4,
      recordingAttempts: [
        {
          ...SESSION.recordingAttempts[0],
          id: 'attempt-pronunciation-first',
          questionId: 'pronunciation-question',
          textMatch: 70,
        },
        {
          ...SESSION.recordingAttempts[0],
          id: 'attempt-pronunciation-best',
          questionId: 'pronunciation-question',
          attemptNumber: 2,
          textMatch: 90,
        },
      ],
    };

    await createPage([SESSION, pronunciationSession]);
    const text = fixture.nativeElement.textContent.replace(/\s+/g, ' ');

    expect(text).toMatch(/Točnost igara prepoznavanja\s*75%/);
    expect(text).toMatch(/Podudarnost\s*90%/);
  });

  it('splits parent progress into accessible child-progress and therapist-feedback tabs', async () => {
    await createPage();
    const childTab = fixture.nativeElement.querySelector(
      '#child-progress-tab',
    ) as HTMLButtonElement;
    const feedbackTab = fixture.nativeElement.querySelector(
      '#therapist-feedback-tab',
    ) as HTMLButtonElement;
    const childPanel = fixture.nativeElement.querySelector('#child-progress-panel') as HTMLElement;
    const feedbackPanel = fixture.nativeElement.querySelector(
      '#therapist-feedback-panel',
    ) as HTMLElement;

    expect(childTab.getAttribute('aria-selected')).toBe('true');
    expect(childPanel.hidden).toBe(false);
    expect(feedbackPanel.hidden).toBe(true);

    feedbackTab.click();
    fixture.detectChanges();

    expect(feedbackTab.getAttribute('aria-selected')).toBe('true');
    expect(childPanel.hidden).toBe(true);
    expect(feedbackPanel.hidden).toBe(false);
  });

  it('shows only saved therapist reviews while retaining historical attempts in child progress', async () => {
    await createPage();
    const childPanel = fixture.nativeElement.querySelector('#child-progress-panel') as HTMLElement;
    const feedbackTab = fixture.nativeElement.querySelector(
      '#therapist-feedback-tab',
    ) as HTMLButtonElement;
    const feedbackPanel = fixture.nativeElement.querySelector(
      '#therapist-feedback-panel',
    ) as HTMLElement;

    expect(childPanel.textContent).toContain('salata');

    feedbackTab.click();
    fixture.detectChanges();

    expect(feedbackPanel.textContent).toContain('2 pregledanih pokušaja');
    expect(feedbackPanel.textContent).toContain('kruška');
    expect(feedbackPanel.textContent).toContain('sir');
    expect(feedbackPanel.textContent).not.toContain('salata');
    expect(feedbackPanel.textContent).toContain('Jasan testni primjer. Nastavite istim tempom.');
  });

  it('supports arrow-key navigation between progress tabs', async () => {
    await createPage();
    const childTab = fixture.nativeElement.querySelector(
      '#child-progress-tab',
    ) as HTMLButtonElement;
    const feedbackTab = fixture.nativeElement.querySelector(
      '#therapist-feedback-tab',
    ) as HTMLButtonElement;

    childTab.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();

    expect(feedbackTab.getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(feedbackTab);
  });

  it('loads protected audio as a local object URL on demand', async () => {
    await createPage();
    const button = fixture.nativeElement.querySelector('.load-audio') as HTMLButtonElement;
    button.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(loadAttemptAudio).toHaveBeenCalledWith('attempt-completed');
    expect(createObjectURL).toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('audio')?.getAttribute('src')).toBe(
      'blob:attempt-audio',
    );
  });

  it('deletes a session and clears legacy browser progress after confirmation', async () => {
    await createPage();
    const button = fixture.nativeElement.querySelector('.delete-session') as HTMLButtonElement;
    button.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(deleteSession).toHaveBeenCalledWith('session-1');
    expect(clearLegacyProgress).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).not.toContain('Što jedemo?');
  });

  it('deletes the active profile data and returns to profile selection', async () => {
    await createPage();
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const button = fixture.nativeElement.querySelector(
      '.privacy-strip button',
    ) as HTMLButtonElement;
    button.click();
    await fixture.whenStable();

    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('sve sesije, prijepise i snimke'));
    expect(deleteChild).toHaveBeenCalledWith('child-1');
    expect(clearLegacyProgress).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/profili']);
  });

  it('renders an empty state when the active profile has no sessions', async () => {
    await createPage([]);

    expect(fixture.nativeElement.textContent).toContain('Prvi rezultat tek čeka');
  });

  it('keeps the privacy controls visible when loading progress fails', async () => {
    await createPage([], new Error('Poslužitelj nije dostupan.'));

    expect(fixture.nativeElement.textContent).toContain('Poslužitelj nije dostupan.');
    expect(fixture.nativeElement.textContent).toContain('Lokalna pohrana i brisanje');
  });
});
