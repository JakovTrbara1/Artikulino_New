import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AudioPlaybackService {
  private activeAudio?: HTMLAudioElement;
  private readonly playingState = signal(false);

  readonly isPlaying = this.playingState.asReadonly();

  async play(spokenText: string, audioSrc?: string): Promise<void> {
    this.stop();

    if (audioSrc) {
      try {
        await this.playAudioFile(audioSrc);
        return;
      } catch {
        // Ako datoteka nije dostupna, isti se tekst sigurno čita lokalnim TTS-om.
      }
    }

    await this.speak(spokenText);
  }

  stop(): void {
    if (this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio.currentTime = 0;
      this.activeAudio = undefined;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.playingState.set(false);
  }

  private playAudioFile(src: string): Promise<void> {
    if (typeof Audio === 'undefined') {
      return Promise.reject(new Error('Audio reprodukcija nije podržana.'));
    }

    return new Promise((resolve, reject) => {
      const audio = new Audio(src);
      this.activeAudio = audio;
      this.playingState.set(true);
      audio.addEventListener(
        'ended',
        () => {
          this.activeAudio = undefined;
          this.playingState.set(false);
          resolve();
        },
        { once: true },
      );
      audio.addEventListener(
        'error',
        () => {
          this.activeAudio = undefined;
          this.playingState.set(false);
          reject(new Error('Audiozapis se ne može reproducirati.'));
        },
        { once: true },
      );
      void audio.play().catch((error: unknown) => {
        this.activeAudio = undefined;
        this.playingState.set(false);
        reject(error);
      });
    });
  }

  private speak(text: string): Promise<void> {
    if (
      typeof window === 'undefined' ||
      !('speechSynthesis' in window) ||
      typeof SpeechSynthesisUtterance === 'undefined'
    ) {
      this.playingState.set(false);
      return Promise.reject(new Error('Čitanje teksta nije podržano u ovom pregledniku.'));
    }

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'hr-HR';
      utterance.rate = 0.82;
      utterance.pitch = 1.03;
      utterance.onstart = () => this.playingState.set(true);
      utterance.onend = () => {
        this.playingState.set(false);
        resolve();
      };
      utterance.onerror = () => {
        this.playingState.set(false);
        reject(new Error('Tekst se trenutačno ne može pročitati.'));
      };
      window.speechSynthesis.speak(utterance);
    });
  }
}
