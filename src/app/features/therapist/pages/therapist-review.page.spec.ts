import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  PrototypeRecordingAttempt,
  TherapistGameSession,
  TherapistSessionSummary,
} from '../../../core/models/prototype-session.model';
import { PrototypeAuthService } from '../../../core/services/prototype-auth.service';
import { TherapistReviewService } from '../services/therapist-review.service';
import { TherapistReviewPage } from './therapist-review.page';

const ATTEMPTS: readonly PrototypeRecordingAttempt[] = [
  {
    id: 'attempt-1',
    questionId: 'food-1',
    attemptNumber: 1,
    expectedText: 'kruška',
    mimeType: 'audio/webm',
    durationMs: 1_500,
    fileSize: 1_024,
    createdAt: '2026-07-28T10:00:10.000Z',
    transcriptionStatus: 'COMPLETED',
    transcript: 'kruška',
    textMatch: 100,
    therapistReview: { status: 'NOT_REVIEWED', comment: '' },
  },
  {
    id: 'attempt-2',
    questionId: 'food-2',
    attemptNumber: 2,
    expectedText: 'salata',
    mimeType: 'audio/webm',
    durationMs: 900,
    fileSize: 900,
    createdAt: '2026-07-28T10:00:20.000Z',
    transcriptionStatus: 'PENDING',
    therapistReview: {
      status: 'LOOKS_GOOD',
      comment: 'Jasan testni primjer.',
      reviewedAt: '2026-07-28T11:00:00.000Z',
    },
  },
  {
    id: 'attempt-3',
    questionId: 'food-3',
    attemptNumber: 1,
    expectedText: 'sir',
    mimeType: 'audio/webm',
    durationMs: 800,
    fileSize: 800,
    createdAt: '2026-07-28T10:00:30.000Z',
    transcriptionStatus: 'FAILED',
    therapistReview: { status: 'PRACTICE_AGAIN', comment: 'Ponoviti testni primjer.' },
  },
];

const SUMMARY: TherapistSessionSummary = {
  id: 'session-1',
  childId: 'child-luka',
  childDisplayName: 'Luka',
  packageName: 'Što jedemo?',
  gameType: 'listen-and-decide',
  targetSound: 'S',
  theme: 'Hrana',
  difficulty: 'EASY',
  completedAt: '2026-07-28T10:01:00.000Z',
  recordingAttemptCount: 3,
};

const SESSION: TherapistGameSession = {
  ...SUMMARY,
  packageId: 'package-1',
  questionCount: 4,
  correctAnswers: 3,
  attempts: 5,
  replays: 1,
  longestStreak: 2,
  totalPoints: 35,
  durationSeconds: 60,
  startedAt: '2026-07-28T10:00:00.000Z',
  recordingAttempts: ATTEMPTS,
};

describe('TherapistReviewPage', () => {
  let fixture: ComponentFixture<TherapistReviewPage>;
  const loadChildren = vi.fn();
  const listSessions = vi.fn();
  const getSession = vi.fn();
  const loadAttemptAudio = vi.fn();
  const saveReview = vi.fn();
  const createObjectURL = vi.fn().mockReturnValue('blob:therapist-audio');
  const revokeObjectURL = vi.fn();

  async function createPage(error?: Error): Promise<void> {
    loadChildren.mockResolvedValue([
      { id: 'child-luka', displayName: 'Luka' },
      { id: 'child-mia', displayName: 'Mia' },
    ]);
    if (error) {
      listSessions.mockRejectedValue(error);
    } else {
      listSessions.mockResolvedValue([SUMMARY]);
    }
    getSession.mockResolvedValue(SESSION);
    loadAttemptAudio.mockResolvedValue(
      new Blob(['fictional adult recording'], { type: 'audio/webm' }),
    );
    saveReview.mockImplementation(async (attemptId: string, status: string, comment: string) => ({
      ...ATTEMPTS.find((attempt) => attempt.id === attemptId)!,
      therapistReview: {
        status,
        comment,
        reviewedAt: '2026-07-28T12:00:00.000Z',
      },
    }));

    await TestBed.configureTestingModule({
      imports: [TherapistReviewPage],
      providers: [
        {
          provide: PrototypeAuthService,
          useValue: { loadChildren },
        },
        {
          provide: TherapistReviewService,
          useValue: { listSessions, getSession, loadAttemptAudio, saveReview },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(TherapistReviewPage);
    fixture.detectChanges();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.loading-state')).toBeNull();
    });
  }

  beforeEach(() => {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectURL,
    });
  });

  afterEach(() => {
    if (fixture && !fixture.componentRef.hostView.destroyed) {
      fixture.destroy();
    }
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('renders the selected profile, completed session, and all attempt states', async () => {
    await createPage();
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Pregled snimki');
    expect(text).toContain('Luka');
    expect(text).toContain('Što jedemo?');
    expect(text).toContain('kruška');
    expect(text).toContain('100%');
    expect(text).toContain('Prijepis u tijeku');
    expect(text).toContain('Prijepis nije uspio');
    expect(text).toContain('Ne procjenjuje kvalitetu izgovora niti daje klinički zaključak.');
  });

  it('loads authenticated audio on demand and revokes the object URL on destroy', async () => {
    await createPage();
    const button = fixture.nativeElement.querySelector('.row-audio button') as HTMLButtonElement;
    button.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(loadAttemptAudio).toHaveBeenCalledWith('attempt-1');
    expect(fixture.nativeElement.querySelector('audio')?.getAttribute('src')).toBe(
      'blob:therapist-audio',
    );

    fixture.destroy();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:therapist-audio');
  });

  it('edits and saves a review with the complete optional comment', async () => {
    await createPage();
    const expand = fixture.nativeElement.querySelector('.expand-button') as HTMLButtonElement;
    expand.click();
    fixture.detectChanges();

    const practiceAgain = fixture.nativeElement.querySelector(
      'input[value="PRACTICE_AGAIN"]',
    ) as HTMLInputElement;
    practiceAgain.click();
    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    textarea.value = 'Ponoviti samo ako roditelj želi.';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(textarea.maxLength).toBe(400);

    const save = fixture.nativeElement.querySelector('.save-review') as HTMLButtonElement;
    save.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(saveReview).toHaveBeenCalledWith(
      'attempt-1',
      'PRACTICE_AGAIN',
      'Ponoviti samo ako roditelj želi.',
    );
    expect(fixture.nativeElement.textContent).toContain('Osvrt je spremljen.');
    expect((fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement).value).toBe(
      'Ponoviti samo ako roditelj želi.',
    );
  });

  it('shows an empty session state when another fictional profile is selected', async () => {
    await createPage();
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('.master-list button'),
    ) as HTMLButtonElement[];
    buttons.find((button) => button.textContent?.includes('Mia'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Ovaj profil još nema dovršenih igara.');
    expect(fixture.nativeElement.textContent).toContain(
      'Odaberite dovršenu igru za pregled snimki.',
    );
  });

  it('shows API errors without exposing review controls', async () => {
    await createPage(new Error('Terapeutski API nije dostupan.'));

    expect(fixture.nativeElement.textContent).toContain('Terapeutski API nije dostupan.');
    expect(fixture.nativeElement.querySelector('.save-review')).toBeNull();
  });
});
