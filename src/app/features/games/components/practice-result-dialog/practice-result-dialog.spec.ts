import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PracticeResultDialog } from './practice-result-dialog';

describe('PracticeResultDialog', () => {
  let fixture: ComponentFixture<PracticeResultDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PracticeResultDialog] }).compileComponents();
    fixture = TestBed.createComponent(PracticeResultDialog);
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
  });

  it('shows a focused modal while transcription is pending', async () => {
    fixture.componentRef.setInput('pending', true);
    fixture.detectChanges();
    await fixture.whenStable();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog).toBe(document.activeElement);
    expect(dialog.textContent).toContain('Provjeravamo podudarnost teksta');
    expect(dialog.querySelector('button')).toBeNull();
  });

  it('shows completed text match, best points, and both actions', () => {
    const retry = vi.fn();
    const continueAction = vi.fn();
    fixture.componentInstance.retryRequested.subscribe(retry);
    fixture.componentInstance.continueRequested.subscribe(continueAction);
    fixture.componentRef.setInput('result', {
      attemptId: 'attempt-1',
      questionId: 'question-1',
      percentage: 82,
      roundPoints: 8,
      bestPoints: 8,
      status: 'COMPLETED',
    });
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('82%');
    expect(text).toContain('Podudarnost teksta');
    expect(text).toContain('8 bodova');
    expect(text).toContain('Pokušaj ponovno');
    expect(text).toContain('Nastavi');

    const buttons = fixture.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>;
    buttons[0].click();
    buttons[1].click();
    expect(retry).toHaveBeenCalledOnce();
    expect(continueAction).toHaveBeenCalledOnce();
  });

  it('offers retry and continuation when a result is unavailable', () => {
    fixture.componentRef.setInput('result', {
      attemptId: 'attempt-1',
      questionId: 'question-1',
      roundPoints: 0,
      bestPoints: 0,
      status: 'FAILED',
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Rezultat trenutačno nije dostupan');
    expect(fixture.nativeElement.querySelectorAll('button')).toHaveLength(2);
  });
});
