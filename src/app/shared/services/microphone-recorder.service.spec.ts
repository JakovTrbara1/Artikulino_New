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
    vi.unstubAllGlobals();
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

  it('makes a stopped local recording available and then removes it', async () => {
    const stopTrack = vi.fn();
    const getUserMedia = vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: stopTrack }],
    });
    const createObjectURL = vi.fn().mockReturnValue('blob:local-recording');
    const revokeObjectURL = vi.fn();
    useSupportedRecorder(getUserMedia);
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    const service = new MicrophoneRecorderService();

    await service.start();
    expect(service.status()).toBe('recording');

    service.stop();

    expect(service.status()).toBe('ready');
    expect(service.audioUrl()).toBe('blob:local-recording');
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(stopTrack).toHaveBeenCalledOnce();

    service.clearRecording();

    expect(service.status()).toBe('idle');
    expect(service.audioUrl()).toBeNull();
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
});
