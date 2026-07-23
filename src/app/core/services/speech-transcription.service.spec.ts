import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SPEECH_TRANSCRIPTION } from './speech-transcription.service';

describe('SPEECH_TRANSCRIPTION', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
  });

  it('stays disabled and does not transfer audio by default', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const audio = new Blob(['lokalna snimka'], { type: 'audio/webm' });
    const transcription = TestBed.inject(SPEECH_TRANSCRIPTION);

    const result = await transcription.transcribe({
      audio,
      locale: 'hr-HR',
    });

    expect(transcription.availability).toBe('not-configured');
    expect(result).toEqual({
      status: 'unavailable',
      reason: 'not-configured',
    });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(audio.size).toBeGreaterThan(0);
  });
});
