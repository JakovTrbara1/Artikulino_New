import { Injectable, inject } from '@angular/core';
import {
  ContentPackage,
  GameSessionResult,
} from '../../features/games/models/content-package.model';
import { RecordedAttempt } from '../../shared/models/recorded-attempt.model';
import {
  PrototypeApiHealth,
  PrototypeGameSession,
  PrototypeRecordingAttempt,
} from '../models/prototype-session.model';
import { PrototypeAuthService } from './prototype-auth.service';

const REQUIRED_API_CONTRACT_VERSION = 2;
const API_START_COMMAND = 'npm run server:dev';

@Injectable({ providedIn: 'root' })
export class PrototypeSessionService {
  private readonly auth = inject(PrototypeAuthService);

  async create(contentPackage: ContentPackage): Promise<PrototypeGameSession> {
    const child = this.auth.activeChild();
    if (!child) {
      throw new Error('Odaberite demo profil prije početka igre.');
    }
    await this.ensureCompatibleApi(contentPackage.gameType);
    const response = await this.auth.apiRequest<{ session: PrototypeGameSession }>(
      '/api/sessions',
      {
        method: 'POST',
        body: JSON.stringify({
          childId: child.id,
          packageId: contentPackage.id,
          packageName: contentPackage.name,
          gameType: contentPackage.gameType,
          targetSound: contentPackage.targetSound,
          theme: contentPackage.theme,
          difficulty: contentPackage.difficulty,
          questionCount: contentPackage.questions.length,
        }),
      },
    );
    return response.session;
  }

  async complete(sessionId: string, result: GameSessionResult): Promise<PrototypeGameSession> {
    const response = await this.auth.apiRequest<{ session: PrototypeGameSession }>(
      `/api/sessions/${encodeURIComponent(sessionId)}/complete`,
      {
        method: 'POST',
        body: JSON.stringify({
          correctAnswers: result.correctAnswers,
          attempts: result.attempts,
          replays: result.replays,
          longestStreak: result.longestStreak,
          totalPoints: result.totalPoints,
          durationSeconds: result.durationSeconds,
        }),
      },
    );
    return response.session;
  }

  async uploadAttempt(
    sessionId: string,
    attempt: RecordedAttempt,
    expectedText: string,
  ): Promise<PrototypeRecordingAttempt> {
    const body = new FormData();
    body.append('questionId', attempt.questionId);
    body.append('attemptNumber', String(attempt.attemptNumber));
    body.append('expectedText', expectedText);
    body.append('durationMs', String(attempt.durationMs));
    body.append(
      'audio',
      attempt.blob,
      `pokusaj-${attempt.attemptNumber}.${extension(attempt.mimeType)}`,
    );
    const response = await this.auth.apiRequest<{ attempt: PrototypeRecordingAttempt }>(
      `/api/sessions/${encodeURIComponent(sessionId)}/attempts`,
      { method: 'POST', body },
    );
    return response.attempt;
  }

  async getAttempt(attemptId: string): Promise<PrototypeRecordingAttempt> {
    const response = await this.auth.apiRequest<{ attempt: PrototypeRecordingAttempt }>(
      `/api/attempts/${encodeURIComponent(attemptId)}`,
    );
    return response.attempt;
  }

  async listForActiveChild(): Promise<readonly PrototypeGameSession[]> {
    const child = this.auth.activeChild();
    if (!child) {
      throw new Error('Odaberite demo profil za pregled napretka.');
    }
    const response = await this.auth.apiRequest<{
      sessions: readonly PrototypeGameSession[];
    }>(`/api/sessions?childId=${encodeURIComponent(child.id)}`);
    return response.sessions;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.auth.apiRequest<void>(`/api/sessions/${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
    });
  }

  async deleteAttempt(attemptId: string): Promise<void> {
    await this.auth.apiRequest<void>(`/api/attempts/${encodeURIComponent(attemptId)}`, {
      method: 'DELETE',
    });
  }

  async loadAttemptAudio(attemptId: string): Promise<Blob> {
    return this.auth.apiBlobRequest(`/api/attempts/${encodeURIComponent(attemptId)}/audio`);
  }

  private async ensureCompatibleApi(gameType: ContentPackage['gameType']): Promise<void> {
    let health: PrototypeApiHealth;
    try {
      health = await this.auth.apiRequest<PrototypeApiHealth>('/api/health', {}, false);
    } catch {
      throw new Error(
        `Lokalni API nije dostupan. Pokrenite ga naredbom "${API_START_COMMAND}" i pokušajte ponovno.`,
      );
    }

    if (
      !Number.isInteger(health.apiContractVersion) ||
      health.apiContractVersion < REQUIRED_API_CONTRACT_VERSION ||
      !Array.isArray(health.supportedGameTypes) ||
      !health.supportedGameTypes.includes(gameType)
    ) {
      throw new Error(
        `Lokalni API nije usklađen s ovom verzijom aplikacije. Ponovno ga pokrenite naredbom "${API_START_COMMAND}" i pokušajte ponovno.`,
      );
    }
  }
}

function extension(mimeType: string): string {
  const normalized = mimeType.split(';', 1)[0]?.toLowerCase();
  if (normalized === 'audio/ogg') {
    return 'ogg';
  }
  if (normalized === 'audio/mp4') {
    return 'm4a';
  }
  if (normalized === 'audio/wav' || normalized === 'audio/x-wav') {
    return 'wav';
  }
  return 'webm';
}
