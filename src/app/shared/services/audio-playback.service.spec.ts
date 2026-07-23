import { AudioPlaybackService } from './audio-playback.service';

class MockAudio {
  static shouldFail = false;
  static instances: MockAudio[] = [];

  readonly listeners = new Map<string, EventListenerOrEventListenerObject>();
  readonly pause = vi.fn();
  readonly play = vi.fn(() => {
    if (MockAudio.shouldFail) {
      return Promise.reject(new Error('Datoteka nije dostupna.'));
    }

    queueMicrotask(() => this.emit('ended'));
    return Promise.resolve();
  });
  currentTime = 0;

  constructor(readonly src: string) {
    MockAudio.instances.push(this);
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    this.listeners.set(type, listener);
  }

  private emit(type: string): void {
    const listener = this.listeners.get(type);
    const event = new Event(type);
    if (typeof listener === 'function') {
      listener(event);
    } else {
      listener?.handleEvent(event);
    }
  }
}

class MockSpeechSynthesisUtterance {
  lang = '';
  rate = 1;
  pitch = 1;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(readonly text: string) {}
}

describe('AudioPlaybackService', () => {
  let service: AudioPlaybackService;
  let speechSynthesisMock: {
    cancel: ReturnType<typeof vi.fn>;
    speak: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    MockAudio.shouldFail = false;
    MockAudio.instances = [];
    speechSynthesisMock = {
      cancel: vi.fn(),
      speak: vi.fn((utterance: MockSpeechSynthesisUtterance) => {
        utterance.onstart?.();
        utterance.onend?.();
      }),
    };

    vi.stubGlobal('Audio', MockAudio);
    vi.stubGlobal('SpeechSynthesisUtterance', MockSpeechSynthesisUtterance);
    vi.stubGlobal('speechSynthesis', speechSynthesisMock);
    service = new AudioPlaybackService();
  });

  afterEach(() => {
    service.stop();
    vi.unstubAllGlobals();
  });

  it('prefers a packaged audio file when playback succeeds', async () => {
    await service.play('Jabuka', '/assets/games/audio/food/jabuka.wav');

    expect(MockAudio.instances).toHaveLength(1);
    expect(MockAudio.instances[0].src).toBe('/assets/games/audio/food/jabuka.wav');
    expect(MockAudio.instances[0].play).toHaveBeenCalledOnce();
    expect(speechSynthesisMock.speak).not.toHaveBeenCalled();
    expect(service.isPlaying()).toBe(false);
  });

  it('falls back to Croatian Speech Synthesis when file playback fails', async () => {
    MockAudio.shouldFail = true;

    await service.play('Jabuka', '/assets/games/audio/food/missing.wav');

    expect(speechSynthesisMock.speak).toHaveBeenCalledOnce();
    const utterance = speechSynthesisMock.speak.mock.calls[0][0] as MockSpeechSynthesisUtterance;
    expect(utterance.text).toBe('Jabuka');
    expect(utterance.lang).toBe('hr-HR');
    expect(utterance.rate).toBe(0.82);
    expect(service.isPlaying()).toBe(false);
  });
});
