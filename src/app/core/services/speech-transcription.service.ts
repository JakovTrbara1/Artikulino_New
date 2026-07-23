import { InjectionToken } from '@angular/core';

export type SpeechTranscriptionLocale = 'hr-HR';
export type SpeechTranscriptionAvailability = 'not-configured' | 'available';
export type SpeechTranscriptionUnavailableReason =
  'not-configured' | 'consent-required' | 'unsupported-audio' | 'temporarily-unavailable';

export interface SpeechTranscriptionRequest {
  readonly audio: Blob;
  readonly locale: SpeechTranscriptionLocale;
}

export type SpeechTranscriptionResult =
  | {
      readonly status: 'completed';
      readonly transcript: string;
      readonly confidence?: number;
    }
  | {
      readonly status: 'unavailable';
      readonly reason: SpeechTranscriptionUnavailableReason;
    };

export interface SpeechTranscriptionPort {
  readonly availability: SpeechTranscriptionAvailability;
  transcribe(request: SpeechTranscriptionRequest): Promise<SpeechTranscriptionResult>;
}

class DisabledSpeechTranscriptionAdapter implements SpeechTranscriptionPort {
  readonly availability = 'not-configured' as const;

  async transcribe(_request: SpeechTranscriptionRequest): Promise<SpeechTranscriptionResult> {
    return {
      status: 'unavailable',
      reason: 'not-configured',
    };
  }
}

export const SPEECH_TRANSCRIPTION = new InjectionToken<SpeechTranscriptionPort>(
  'SpeechTranscriptionPort',
  {
    providedIn: 'root',
    factory: () => new DisabledSpeechTranscriptionAdapter(),
  },
);
