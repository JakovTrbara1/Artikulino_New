import { Injectable, inject } from '@angular/core';
import {
  PrototypeRecordingAttempt,
  TherapistGameSession,
  TherapistReviewStatus,
  TherapistSessionSummary,
} from '../../../core/models/prototype-session.model';
import { PrototypeAuthService } from '../../../core/services/prototype-auth.service';

@Injectable({ providedIn: 'root' })
export class TherapistReviewService {
  private readonly auth = inject(PrototypeAuthService);

  async listSessions(): Promise<readonly TherapistSessionSummary[]> {
    const response = await this.auth.apiRequest<{
      sessions: readonly TherapistSessionSummary[];
    }>('/api/therapist/sessions');
    return response.sessions;
  }

  async getSession(sessionId: string): Promise<TherapistGameSession> {
    const response = await this.auth.apiRequest<{ session: TherapistGameSession }>(
      `/api/therapist/sessions/${encodeURIComponent(sessionId)}`,
    );
    return response.session;
  }

  async loadAttemptAudio(attemptId: string): Promise<Blob> {
    return this.auth.apiBlobRequest(`/api/attempts/${encodeURIComponent(attemptId)}/audio`);
  }

  async saveReview(
    attemptId: string,
    status: TherapistReviewStatus,
    comment: string,
  ): Promise<PrototypeRecordingAttempt> {
    const response = await this.auth.apiRequest<{ attempt: PrototypeRecordingAttempt }>(
      `/api/attempts/${encodeURIComponent(attemptId)}/review`,
      {
        method: 'PUT',
        body: JSON.stringify({ status, comment }),
      },
    );
    return response.attempt;
  }
}
