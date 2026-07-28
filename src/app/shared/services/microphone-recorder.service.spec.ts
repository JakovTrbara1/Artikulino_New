import { afterEach, describe, expect, it, vi } from 'vitest';

import { MicrophoneRecorderService } from './microphone-recorder.service';

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
      value: new Blob(['lokalna snimka'], { type: this.mimeType }),
    });
    this.dispatchEvent(dataEvent);
    this.dispatchEvent(new Event('stop'));
  }
}

function useSupportedRecorder(getUserMedia: ReturnType<typeof vi.fn>): void {
  vi.stubGlobal('navigator', {
    mediaDevices: { getUserMedia },
  });
  vi.stubGlobal('MediaRecorder', MockMediaRecorder);
}

describe('MicrophoneRecorderService', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('reports unsupported recording without requesting microphone access', async () => {
    const getUserMedia = vi.fn();
    vi.stubGlobal('navigator', {});
    vi.stubGlobal('MediaRecorder', undefined);
    const service = new MicrophoneRecorderService();

    await service.start();

    expect(service.status()).toBe('unsupported');
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it('reports denied microphone permission', async () => {
    const getUserMedia = vi
      .fn()
      .mockRejectedValue(new DOMException('Permission denied', 'NotAllowedError'));
    useSupportedRecorder(getUserMedia);
    const service = new MicrophoneRecorderService();

    await service.start();

    expect(getUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(service.status()).toBe('denied');
    expect(service.audioUrl()).toBeNull();
  });

  it('makes a typed stopped local recording available and then removes it', async () => {
    const stopTrack = vi.fn();
    const getUserMedia = vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: stopTrack }],
    });
    const createObjectURL = vi.fn().mockReturnValue('blob:local-recording');
    const revokeObjectURL = vi.fn();
    useSupportedRecorder(getUserMedia);
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    let currentTime = 1_000;
    vi.spyOn(Date, 'now').mockImplementation(() => currentTime);
    const service = new MicrophoneRecorderService();

    await service.start();
    expect(service.status()).toBe('recording');

    currentTime = 2_750;
    service.stop();

    expect(service.status()).toBe('stopped');
    expect(service.audioUrl()).toBe('blob:local-recording');
    expect(service.recording()).toMatchObject({
      mimeType: 'audio/webm',
      durationMs: 1_750,
      audioUrl: 'blob:local-recording',
    });
    expect(service.recording()?.blob).toBeInstanceOf(Blob);
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(stopTrack).toHaveBeenCalledOnce();

    service.clearRecording();

    expect(service.status()).toBe('idle');
    expect(service.audioUrl()).toBeNull();
    expect(service.recording()).toBeNull();
    expect(service.durationMs()).toBe(0);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:local-recording');
  });

  it('discards an active recording during cleanup', async () => {
    const stopTrack = vi.fn();
    const getUserMedia = vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: stopTrack }],
    });
    const createObjectURL = vi.fn();
    useSupportedRecorder(getUserMedia);
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL: vi.fn() });
    const service = new MicrophoneRecorderService();

    await service.start();
    service.clearRecording();

    expect(service.status()).toBe('idle');
    expect(service.audioUrl()).toBeNull();
    expect(createObjectURL).not.toHaveBeenCalled();
    expect(stopTrack).toHaveBeenCalledOnce();
  });

  it('automatically stops a recording at the 15 second prototype limit', async () => {
    vi.useFakeTimers();
    const getUserMedia = vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    });
    useSupportedRecorder(getUserMedia);
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn().mockReturnValue('blob:limited-recording'),
      revokeObjectURL: vi.fn(),
    });
    const service = new MicrophoneRecorderService();

    await service.start();
    await vi.advanceTimersByTimeAsync(15_000);

    expect(service.status()).toBe('stopped');
    expect(service.recording()?.durationMs).toBe(15_000);
  });
});
