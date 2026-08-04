import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DEMO_CONTENT_PACKAGES } from '../../data/demo-content-packages';
import { GameCompletion } from './game-completion';

describe('GameCompletion', () => {
  let fixture: ComponentFixture<GameCompletion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameCompletion],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(GameCompletion);
    fixture.componentRef.setInput(
      'contentPackage',
      DEMO_CONTENT_PACKAGES.find((item) => item.id === 'izgovor-glas-l'),
    );
    fixture.componentRef.setInput('totalPoints', 34);
    fixture.componentRef.setInput('averageTextMatch', 82);
    fixture.componentRef.setInput('recordingCount', 5);
    fixture.componentRef.setInput('correctAnswers', 0);
    fixture.componentRef.setInput('longestStreak', 0);
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
  });

  it('focuses the heading and summarizes pronunciation results', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const heading = fixture.nativeElement.querySelector('h1') as HTMLHeadingElement;
    expect(document.activeElement).toBe(heading);
    expect(heading.textContent).toContain('Bravo, završio/la si vježbu!');
    expect(fixture.nativeElement.textContent).toContain('34');
    expect(fixture.nativeElement.textContent).toContain('82%');
    expect(fixture.nativeElement.textContent).toContain('5');
    expect(fixture.nativeElement.querySelectorAll('.result-actions > *')).toHaveLength(3);
  });
});
