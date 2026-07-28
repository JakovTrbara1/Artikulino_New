import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createPrototypeApp } from '../src/app.js';
import { PrototypeDatabase } from '../src/database.js';
import {
  SerialTranscriptionQueue,
  TranscriptionClient,
  TranscriptionRequest,
} from '../src/transcription.js';

class WorkflowTranscriptionClient implements TranscriptionClient {
  readonly requests: TranscriptionRequest[] = [];

  async health() {
    return {
      status: 'AVAILABLE' as const,
      model: 'workflow-fixture',
      language: 'hr',
      device: 'cpu',
      computeType: 'int8',
      modelLoaded: true,
    };
  }

  async transcribe(input: TranscriptionRequest): Promise<string> {
    this.requests.push(input);
    return 'kruška';
  }
}

describe('integrated thesis prototype workflow', () => {
  let directory: string;
  let recordingsDirectory: string;
  let database: PrototypeDatabase;
  let app: ReturnType<typeof createPrototypeApp>['app'];
  let transcriptionQueue: SerialTranscriptionQueue;
  let transcriptionClient: WorkflowTranscriptionClient;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'artikulino-workflow-'));
    recordingsDirectory = join(directory, 'recordings');
    transcriptionClient = new WorkflowTranscriptionClient();
    const prototype = createPrototypeApp({
      databaseFile: join(directory, 'workflow.sqlite'),
      recordingsDirectory,
      transcriptionClient,
    });
    database = prototype.database;
    app = prototype.app;
    transcriptionQueue = prototype.transcriptionQueue;
  });

  afterEach(async () => {
    await transcriptionQueue.waitForIdle();
    database.close();
    rmSync(directory, { recursive: true, force: true });
  });

  it('connects parent recordings, Croatian transcription, therapist review, and parent visibility', async () => {
    const parent = await login('parent@artikulino.test', 'ParentDemo123!');
    const parentAuthorization = authorization(parent.body.token as string);
    const children = await request(app).get('/api/children').set(parentAuthorization).expect(200);
    expect(children.body.children).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'demo-child-luka' })]),
    );

    const created = await request(app)
      .post('/api/sessions')
      .set(parentAuthorization)
      .send({
        childId: 'demo-child-luka',
        packageId: 'slusaj-hrana-s-lagano',
        packageName: 'Što jedemo?',
        gameType: 'listen-and-decide',
        targetSound: 'S',
        theme: 'Hrana',
        difficulty: 'EASY',
        questionCount: 4,
      })
      .expect(201);
    const sessionId = created.body.session.id as string;

    const firstAttempt = await uploadAttempt(parentAuthorization, sessionId, 1);
    const secondAttempt = await uploadAttempt(parentAuthorization, sessionId, 2);
    await transcriptionQueue.waitForIdle();

    await request(app)
      .post(`/api/sessions/${sessionId}/complete`)
      .set(parentAuthorization)
      .send({
        correctAnswers: 4,
        attempts: 4,
        replays: 1,
        longestStreak: 4,
        totalPoints: 55,
        durationSeconds: 45,
      })
      .expect(200);

    const parentProgress = await request(app)
      .get('/api/sessions?childId=demo-child-luka')
      .set(parentAuthorization)
      .expect(200);
    expect(parentProgress.body.sessions[0]).toMatchObject({
      id: sessionId,
      completedAt: expect.any(String),
      recordingAttempts: [
        expect.objectContaining({
          id: firstAttempt.body.attempt.id,
          transcriptionStatus: 'COMPLETED',
          transcript: 'kruška',
          textMatch: 100,
        }),
        expect.objectContaining({
          id: secondAttempt.body.attempt.id,
          transcriptionStatus: 'COMPLETED',
          transcript: 'kruška',
          textMatch: 100,
        }),
      ],
    });
    expect(transcriptionClient.requests).toHaveLength(2);

    const therapist = await login('therapist@artikulino.test', 'TherapistDemo123!');
    const therapistAuthorization = authorization(therapist.body.token as string);
    const therapistSessions = await request(app)
      .get('/api/therapist/sessions')
      .set(therapistAuthorization)
      .expect(200);
    expect(therapistSessions.body.sessions).toEqual([
      expect.objectContaining({
        id: sessionId,
        childDisplayName: 'Luka',
        recordingAttemptCount: 2,
      }),
    ]);

    const therapistDetail = await request(app)
      .get(`/api/therapist/sessions/${sessionId}`)
      .set(therapistAuthorization)
      .expect(200);
    expect(therapistDetail.body.session.recordingAttempts).toHaveLength(2);

    await request(app)
      .get(`/api/attempts/${firstAttempt.body.attempt.id}/audio`)
      .set(therapistAuthorization)
      .expect(200)
      .expect('Content-Type', /audio\/webm/);

    await request(app)
      .put(`/api/attempts/${secondAttempt.body.attempt.id}/review`)
      .set(therapistAuthorization)
      .send({
        status: 'PRACTICE_AGAIN',
        comment: 'Ponoviti izmišljeni testni primjer.',
      })
      .expect(200);

    const reviewedProgress = await request(app)
      .get('/api/sessions?childId=demo-child-luka')
      .set(parentAuthorization)
      .expect(200);
    expect(reviewedProgress.body.sessions[0].recordingAttempts[1].therapistReview).toMatchObject({
      status: 'PRACTICE_AGAIN',
      comment: 'Ponoviti izmišljeni testni primjer.',
      reviewedAt: expect.any(String),
    });

    await request(app).delete(`/api/sessions/${sessionId}`).set(parentAuthorization).expect(204);
    expect(readdirSync(recordingsDirectory)).toHaveLength(0);
  });

  function login(email: string, password: string) {
    return request(app).post('/api/auth/login').send({ email, password }).expect(200);
  }

  function authorization(token: string): { Authorization: string } {
    return { Authorization: `Bearer ${token}` };
  }

  function uploadAttempt(
    auth: { Authorization: string },
    sessionId: string,
    attemptNumber: number,
  ) {
    return request(app)
      .post(`/api/sessions/${sessionId}/attempts`)
      .set(auth)
      .field('questionId', 'food-1')
      .field('attemptNumber', String(attemptNumber))
      .field('expectedText', 'kruška')
      .field('durationMs', '1500')
      .attach('audio', Buffer.from(`fictional adult test recording ${attemptNumber}`), {
        filename: `attempt-${attemptNumber}.webm`,
        contentType: 'audio/webm',
      })
      .expect(201);
  }
});
