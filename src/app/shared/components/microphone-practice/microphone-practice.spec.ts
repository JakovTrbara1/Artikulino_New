import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecordedAttempt } from '../../models/recorded-attempt.model';
import { MicrophoneRecorderService } from '../../services/microphone-recorder.service';
import { MicrophonePractice } from './microphone-practice';

class MockMediaRecorder extends EventTarget {
  readonly mimeType = 'audio/webm';
  state: RecordingState = 'inactive';

  start(): void {
    this.state = 'recording';
  }

  stop(): void {
    this.state = 'inactive';
    const dataEvent = new Event('dataavailable');
    Object.defineProperty(dataEvent, 'data', {
      value: new Blob(['testna snimka'], { type: this.mimeType }),
    });
    this.dispatchEvent(dataEvent);
    this.dispatchEvent(new Event('stop'));
  }
}

describe('MicrophonePractice', () => {
  let fixture: ComponentFixture<MicrophonePractice>;
  let recorder: MicrophoneRecorderService;
  let now: ReturnType<typeof vi.spyOn>;
  const getUserMedia = vi.fn();
  const revokeObjectURL = vi.fn();

  beforeEach(async () => {
    getUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    });
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
    vi.stubGlobal('MediaRecorder', MockMediaRecorder);
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn().mockReturnValue('blob:test-recording'),
      revokeObjectURL,
    });
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
    now = vi.spyOn(Date, 'now').mockReturnValue(1_000);

    await TestBed.configureTestingModule({
      imports: [MicrophonePractice],
    }).compileComponents();

    fixture = TestBed.createComponent(MicrophonePractice);
    fixture.componentRef.setInput('questionId', 'question-1');
    recorder = fixture.debugElement.injector.get(MicrophoneRecorderService);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('records, emits a typed attempt, replays, and deletes the local recording', async () => {
    const emitted: RecordedAttempt[] = [];
    fixture.componentInstance.recordedAttempt.subscribe((attempt) => emitted.push(attempt));

    requireButton('Započni snimanje').click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(recorder.status()).toBe('recording');
    expect(requireButton('Zaustavi snimanje')).toBeTruthy();

    now.mockReturnValue(2_600);
    requireButton('Zaustavi snimanje').click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(recorder.status()).toBe('stopped');
    expect(emitted).toHaveLength(1);
    expect(emitted[0]).toMatchObject({
      mimeType: 'audio/webm',
      durationMs: 1_600,
      questionId: 'question-1',
      attemptNumber: 1,
    });
    expect(emitted[0].blob).toBeInstanceOf(Blob);
    expect(fixture.nativeElement.textContent).toContain('Snimka spremljena');
    expect(requireButton('Poslušaj svoju snimku')).toBeTruthy();

    const audio = fixture.nativeElement.querySelector('audio') as HTMLAudioElement;
    const play = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(audio, 'paused', { configurable: true, value: true });
    Object.defineProperty(audio, 'play', { configurable: true, value: play });

    requireButton('Poslušaj svoju snimku').click();
    await fixture.whenStable();
    expect(play).toHaveBeenCalledOnce();

    requireButton('Izbriši').click();
    fixture.detectChanges();

    expect(recorder.status()).toBe('idle');
    expect(recorder.recording()).toBeNull();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test-recording');
  });

  it('clears the current recording and resets attempt numbering when the question changes', async () => {
    const emitted: RecordedAttempt[] = [];
    fixture.componentInstance.recordedAttempt.subscribe((attempt) => emitted.push(attempt));

    await recordAttempt(2_000);
    expect(emitted[0].attemptNumber).toBe(1);

    fixture.componentRef.setInput('questionId', 'question-2');
    fixture.detectChanges();

    expect(recorder.status()).toBe('idle');
    expect(recorder.recording()).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Snimka spremljena');

    await recordAttempt(4_000);
    expect(emitted[1]).toMatchObject({
      questionId: 'question-2',
      attemptNumber: 1,
    });
  });

  it('clears the current recording for a retry without resetting attempt numbering', async () => {
    const emitted: RecordedAttempt[] = [];
    fixture.componentInstance.recordedAttempt.subscribe((attempt) => emitted.push(attempt));

    await recordAttempt(2_000);
    expect(emitted[0].attemptNumber).toBe(1);

    fixture.componentRef.setInput('resetId', 1);
    fixture.detectChanges();

    expect(recorder.status()).toBe('idle');
    expect(recorder.recording()).toBeNull();

    await recordAttempt(4_000);
    expect(emitted[1]).toMatchObject({
      questionId: 'question-1',
      attemptNumber: 2,
    });
  });

  it('keeps denied microphone access optional and offers a retry action', async () => {
    getUserMedia.mockRejectedValueOnce(new DOMException('Denied', 'NotAllowedError'));

    requireButton('Započni snimanje').click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(recorder.status()).toBe('denied');
    expect(fixture.nativeElement.textContent).toContain('Mikrofon nije dopušten');
    expect(requireButton('Započni snimanje')).toBeTruthy();
  });

  it('offers a safe exit after denied access when recording is required', async () => {
    const skipped = vi.fn();
    fixture.componentRef.setInput('required', true);
    fixture.componentInstance.skipRequested.subscribe(skipped);
    getUserMedia.mockRejectedValueOnce(new DOMException('Denied', 'NotAllowedError'));

    requireButton('Započni snimanje').click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Snimi najmanje jedan pokušaj do 15 sekundi za nastavak.',
    );
    requireButton('Nastavi bez snimanja').click();
    expect(skipped).toHaveBeenCalledOnce();
  });

  it('retains a failed local recording for retry and deletes a saved server attempt', async () => {
    const saveAttempt = vi
      .fn()
      .mockRejectedValueOnce(new Error('Server unavailable'))
      .mockResolvedValueOnce({ id: 'attempt-1' });
    const deleteSavedAttempt = vi.fn().mockResolvedValue(undefined);
    fixture.componentRef.setInput('saveAttempt', saveAttempt);
    fixture.componentRef.setInput('deleteSavedAttempt', deleteSavedAttempt);

    await recordAttempt(2_500);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(recorder.recording()).not.toBeNull();
    expect(requireButton('Pokušaj spremiti ponovno')).toBeTruthy();

    requireButton('Pokušaj spremiti ponovno').click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(saveAttempt).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.textContent).toContain('Snimka spremljena');

    requireButton('Izbriši').click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(deleteSavedAttempt).toHaveBeenCalledWith('attempt-1');
    expect(recorder.recording()).toBeNull();
  });

  it('deletes the server attempt when local deletion occurs during a pending upload', async () => {
    let finishUpload: ((value: { readonly id: string }) => void) | undefined;
    const saveAttempt = vi.fn(
      () =>
        new Promise<{ readonly id: string }>((resolve) => {
          finishUpload = resolve;
        }),
    );
    const deleteSavedAttempt = vi.fn().mockResolvedValue(undefined);
    fixture.componentRef.setInput('saveAttempt', saveAttempt);
    fixture.componentRef.setInput('deleteSavedAttempt', deleteSavedAttempt);

    await recordAttempt(2_500);
    expect(fixture.nativeElement.textContent).toContain('Spremanje…');

    requireButton('Izbriši').click();
    finishUpload?.({ id: 'pending-attempt' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(deleteSavedAttempt).toHaveBeenCalledWith('pending-attempt');
    expect(recorder.recording()).toBeNull();
  });

  async function recordAttempt(stopTime: number): Promise<void> {
    requireButton('Započni snimanje').click();
    await fixture.whenStable();
    fixture.detectChanges();
    now.mockReturnValue(stopTime);
    requireButton('Zaustavi snimanje').click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function requireButton(accessibleName: string): HTMLButtonElement {
    const button = [...fixture.nativeElement.querySelectorAll('button')].find(
      (candidate) =>
        candidate.getAttribute('aria-label') === accessibleName ||
        candidate.textContent?.trim() === accessibleName,
    ) as HTMLButtonElement | undefined;
    if (!button) {
      throw new Error(`Gumb "${accessibleName}" nije pronađen.`);
    }
    return button;
  }
});
