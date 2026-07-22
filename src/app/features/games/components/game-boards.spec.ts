import { Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContentQuestion } from '../models/content-package.model';
import { CatchSoundBoard } from './catch-sound-board/catch-sound-board';
import { ListenDecideBoard } from './listen-decide-board/listen-decide-board';
import { SoundPositionBoard } from './sound-position-board/sound-position-board';

const question: ContentQuestion = {
  id: 'test',
  taskText: 'Poslušaj.',
  spokenText: 'sir',
  displayText: 'sir',
  answers: [
    { id: 'start', label: 'Početak' },
    { id: 'middle', label: 'Sredina' },
    { id: 'end', label: 'Kraj' },
  ],
  correctAnswerIds: ['start'],
  explanation: 'Glas je na početku.',
};

async function setup<T>(component: Type<T>): Promise<ComponentFixture<T>> {
  await TestBed.configureTestingModule({ imports: [component] }).compileComponents();
  const fixture = TestBed.createComponent(component);
  fixture.componentRef.setInput('question', question);
  fixture.detectChanges();
  return fixture;
}

describe('configurable game boards', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('emits a category answer from Slušaj i odluči', async () => {
    const fixture = await setup(ListenDecideBoard);
    const emitted: string[] = [];
    fixture.componentInstance.answer.subscribe((value) => emitted.push(value));

    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();

    expect(emitted).toEqual(['start']);
  });

  it('emits a sound answer from Uhvati glas', async () => {
    const fixture = await setup(CatchSoundBoard);
    const emitted: string[] = [];
    fixture.componentInstance.answer.subscribe((value) => emitted.push(value));

    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();

    expect(emitted).toEqual(['start']);
  });

  it('emits a train-position answer from Gdje je glas', async () => {
    const fixture = await setup(SoundPositionBoard);
    const emitted: string[] = [];
    fixture.componentInstance.answer.subscribe((value) => emitted.push(value));

    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();

    expect(emitted).toEqual(['start']);
  });
});
