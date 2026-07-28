import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PrototypeAuthService } from '../../../core/services/prototype-auth.service';
import { PrototypeSessionService } from '../../../core/services/prototype-session.service';
import { ProgressPage } from './progress.page';

describe('ProgressPage', () => {
  let fixture: ComponentFixture<ProgressPage>;
  const deleteSession = vi.fn().mockResolvedValue(undefined);
  const listForActiveChild = vi.fn().mockResolvedValue([
    {
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
      recordingAttempts: [{ id: 'attempt-1' }, { id: 'attempt-2' }],
    },
  ]);

  beforeEach(async () => {
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
    await TestBed.configureTestingModule({
      imports: [ProgressPage],
      providers: [
        provideRouter([]),
        {
          provide: PrototypeSessionService,
          useValue: { listForActiveChild, deleteSession },
        },
        {
          provide: PrototypeAuthService,
          useValue: { activeChild: () => ({ id: 'child-1', displayName: 'Luka' }) },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ProgressPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('renders backend sessions and recording counts for the active demo child', () => {
    expect(fixture.nativeElement.textContent).toContain('Luka');
    expect(fixture.nativeElement.textContent).toContain('Što jedemo?');
    expect(fixture.nativeElement.textContent).toContain('35');
    expect(fixture.nativeElement.textContent).toContain('2');
  });

  it('deletes a session after confirmation', async () => {
    const button = fixture.nativeElement.querySelector('.delete-session') as HTMLButtonElement;
    button.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(deleteSession).toHaveBeenCalledWith('session-1');
    expect(fixture.nativeElement.textContent).not.toContain('Što jedemo?');
  });
});
