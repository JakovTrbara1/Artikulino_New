import Database from 'better-sqlite3';
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
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

class FakeTranscriptionClient implements TranscriptionClient {
  readonly requests: TranscriptionRequest[] = [];
  transcript = 'kruška';
  shouldFail = false;

  async health() {
    return {
      status: 'AVAILABLE' as const,
      model: 'fake-small',
      language: 'hr',
      device: 'cpu',
      computeType: 'int8',
      modelLoaded: false,
    };
  }

  async transcribe(request: TranscriptionRequest): Promise<string> {
    this.requests.push(request);
    if (this.shouldFail) {
      throw new Error('fictional worker failure');
    }
    return this.transcript;
  }
}

describe('prototype API', () => {
  let directory: string;
  let database: PrototypeDatabase;
  let app: ReturnType<typeof createPrototypeApp>['app'];
  let recordingsDirectory: string;
  let transcriptionClient: FakeTranscriptionClient;
  let transcriptionQueue: SerialTranscriptionQueue;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'artikulino-server-'));
    recordingsDirectory = join(directory, 'recordings');
    transcriptionClient = new FakeTranscriptionClient();
    const prototype = createPrototypeApp({
      databaseFile: join(directory, 'test.sqlite'),
      recordingsDirectory,
      transcriptionClient,
    });
    app = prototype.app;
    database = prototype.database;
    transcriptionQueue = prototype.transcriptionQueue;
  });

  afterEach(async () => {
    await transcriptionQueue.waitForIdle();
    database.close();
    rmSync(directory, { recursive: true, force: true });
  });

  function login(email = 'parent@artikulino.test', password = 'ParentDemo123!') {
    return request(app).post('/api/auth/login').send({ email, password });
  }

  async function parentAuthorization(): Promise<{ Authorization: string }> {
    const token = (await login()).body.token as string;
    return { Authorization: `Bearer ${token}` };
  }

  async function therapistAuthorization(): Promise<{ Authorization: string }> {
    const token = (await login('therapist@artikulino.test', 'TherapistDemo123!')).body
      .token as string;
    return { Authorization: `Bearer ${token}` };
  }

  function createGameSession(
    authorization: { Authorization: string },
    childId = 'demo-child-luka',
  ) {
    return request(app).post('/api/sessions').set(authorization).send({
      childId,
      packageId: 'slusaj-hrana-s-lagano',
      packageName: 'Što jedemo?',
      gameType: 'listen-and-decide',
      targetSound: 'S',
      theme: 'Hrana',
      difficulty: 'EASY',
      questionCount: 4,
    });
  }

  function uploadAttempt(
    authorization: { Authorization: string },
    sessionId: string,
    overrides: {
      readonly contentType?: string;
      readonly durationMs?: number;
      readonly attemptNumber?: number;
      readonly buffer?: Buffer;
    } = {},
  ) {
    return request(app)
      .post(`/api/sessions/${sessionId}/attempts`)
      .set(authorization)
      .field('questionId', 'food-1')
      .field('attemptNumber', String(overrides.attemptNumber ?? 1))
      .field('expectedText', 'kruška')
      .field('durationMs', String(overrides.durationMs ?? 1_500))
      .attach('audio', overrides.buffer ?? Buffer.from('fictional adult test recording'), {
        filename: 'attempt.webm',
        contentType: overrides.contentType ?? 'audio/webm',
      });
  }

  it('reports local prototype health', async () => {
    const response = await request(app).get('/api/health').expect(200);
    expect(response.body).toEqual({
      status: 'ok',
      apiContractVersion: 2,
      supportedGameTypes: [
        'listen-and-decide',
        'catch-the-sound',
        'sound-position',
        'pronunciation-practice',
      ],
      mode: 'LOCAL_THESIS_PROTOTYPE',
      transcription: {
        status: 'AVAILABLE',
        model: 'fake-small',
        language: 'hr',
        device: 'cpu',
        computeType: 'int8',
        modelLoaded: false,
      },
    });
  });

  it('authenticates seeded users without storing plaintext passwords', async () => {
    const response = await login().expect(200);
    expect(response.body.user).toMatchObject({
      email: 'parent@artikulino.test',
      role: 'PARENT',
    });
    expect(response.body.token).toEqual(expect.any(String));
    expect(database.getStoredPasswordHash('parent@artikulino.test')).not.toContain(
      'ParentDemo123!',
    );
    await login('parent@artikulino.test', 'wrong').expect(401);
  });

  it('requires a valid bearer session and supports logout', async () => {
    await request(app).get('/api/children').expect(401);
    const token = (await login()).body.token as string;
    await request(app).get('/api/children').set('Authorization', `Bearer ${token}`).expect(200);
    await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${token}`).expect(204);
    await request(app).get('/api/children').set('Authorization', `Bearer ${token}`).expect(401);
  });

  it('expires sessions', async () => {
    database.close();
    const expired = createPrototypeApp({
      databaseFile: join(directory, 'expired.sqlite'),
      sessionTtlMs: -1,
      transcriptionClient,
    });
    database = expired.database;
    app = expired.app;
    transcriptionQueue = expired.transcriptionQueue;
    const token = (await login()).body.token as string;
    await request(app).get('/api/children').set('Authorization', `Bearer ${token}`).expect(401);
  });

  it('allows the parent to list, create, and delete fictional child profiles', async () => {
    const token = (await login()).body.token as string;
    const authorization = { Authorization: `Bearer ${token}` };
    const initial = await request(app).get('/api/children').set(authorization).expect(200);
    expect(initial.body.children).toHaveLength(2);

    const created = await request(app)
      .post('/api/children')
      .set(authorization)
      .send({ displayName: '  Niko  ' })
      .expect(201);
    expect(created.body.child.displayName).toBe('Niko');

    await request(app)
      .delete(`/api/children/${created.body.child.id}`)
      .set(authorization)
      .expect(204);
    const final = await request(app).get('/api/children').set(authorization).expect(200);
    expect(final.body.children).toHaveLength(2);
  });

  it('gives therapists read-only access to all fictional profiles', async () => {
    const token = (await login('therapist@artikulino.test', 'TherapistDemo123!')).body
      .token as string;
    const authorization = { Authorization: `Bearer ${token}` };
    const response = await request(app).get('/api/children').set(authorization).expect(200);
    expect(
      response.body.children.map((child: { displayName: string }) => child.displayName),
    ).toEqual(['Luka', 'Mia']);
    await request(app)
      .post('/api/children')
      .set(authorization)
      .send({ displayName: 'Nije dopušteno' })
      .expect(403);
    await request(app).delete('/api/children/demo-child-luka').set(authorization).expect(403);
  });

  it('clears prototype changes and reseeds demo data', async () => {
    const parent = database.findUserByEmail('parent@artikulino.test');
    database.createChild(parent!.id, 'Privremeni profil');
    database.resetAndReseed();
    expect(database.listChildren(parent!)).toHaveLength(2);
  });

  it('persists completed game sessions under the selected fictional child', async () => {
    const authorization = await parentAuthorization();
    const created = await createGameSession(authorization).expect(201);

    const completed = await request(app)
      .post(`/api/sessions/${created.body.session.id}/complete`)
      .set(authorization)
      .send({
        correctAnswers: 4,
        attempts: 5,
        replays: 1,
        longestStreak: 4,
        totalPoints: 55,
        durationSeconds: 45,
      })
      .expect(200);
    expect(completed.body.session).toMatchObject({
      childId: 'demo-child-luka',
      correctAnswers: 4,
      totalPoints: 55,
    });
    expect(completed.body.session.completedAt).toEqual(expect.any(String));

    const listed = await request(app)
      .get('/api/sessions?childId=demo-child-luka')
      .set(authorization)
      .expect(200);
    expect(listed.body.sessions).toHaveLength(1);
    expect(listed.body.sessions[0].packageName).toBe('Što jedemo?');
  });

  it('accepts listening sessions without misleading target-sound metadata', async () => {
    const authorization = await parentAuthorization();
    const response = await request(app)
      .post('/api/sessions')
      .set(authorization)
      .send({
        childId: 'demo-child-luka',
        packageId: 'slusaj-hrana-lagano',
        packageName: 'Što jedemo?',
        gameType: 'listen-and-decide',
        theme: 'Hrana',
        difficulty: 'EASY',
        questionCount: 4,
      })
      .expect(201);

    expect(response.body.session.targetSound).toBe('');
  });

  it('accepts pronunciation sessions for persisted recording attempts', async () => {
    const authorization = await parentAuthorization();
    const response = await request(app)
      .post('/api/sessions')
      .set(authorization)
      .send({
        childId: 'demo-child-luka',
        packageId: 'izgovor-rijeci-s',
        packageName: 'Izgovori riječi s glasom S',
        gameType: 'pronunciation-practice',
        targetSound: 'S',
        theme: 'Priroda',
        difficulty: 'MEDIUM',
        questionCount: 4,
      })
      .expect(201);

    expect(response.body.session).toMatchObject({
      gameType: 'pronunciation-practice',
      targetSound: 'S',
    });
  });

  it('upgrades an existing game-session table before saving pronunciation sessions', () => {
    const legacyFile = join(directory, 'legacy.sqlite');
    const legacy = new Database(legacyFile);
    legacy.exec(`
      CREATE TABLE game_sessions (
        id TEXT PRIMARY KEY,
        child_id TEXT NOT NULL,
        package_id TEXT NOT NULL,
        package_name TEXT NOT NULL,
        game_type TEXT NOT NULL CHECK (
          game_type IN ('listen-and-decide', 'catch-the-sound', 'sound-position')
        ),
        target_sound TEXT NOT NULL,
        theme TEXT NOT NULL,
        difficulty TEXT NOT NULL CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
        question_count INTEGER NOT NULL CHECK (question_count > 0),
        correct_answers INTEGER NOT NULL DEFAULT 0,
        attempts INTEGER NOT NULL DEFAULT 0,
        replays INTEGER NOT NULL DEFAULT 0,
        longest_streak INTEGER NOT NULL DEFAULT 0,
        total_points INTEGER NOT NULL DEFAULT 0,
        duration_seconds INTEGER NOT NULL DEFAULT 0,
        started_at INTEGER NOT NULL,
        completed_at INTEGER
      );
    `);
    legacy.close();

    const upgraded = new PrototypeDatabase(legacyFile);
    const parent = upgraded.findUserByEmail('parent@artikulino.test');
    expect(parent).toBeDefined();
    const session = upgraded.createGameSession(parent!.id, {
      childId: 'demo-child-luka',
      packageId: 'izgovor-glas-r',
      packageName: 'Izgovori glas R',
      gameType: 'pronunciation-practice',
      targetSound: 'R',
      theme: 'Igračke',
      difficulty: 'EASY',
      questionCount: 4,
    });
    upgraded.close();

    expect(session).toMatchObject({
      gameType: 'pronunciation-practice',
      packageId: 'izgovor-glas-r',
    });
  });

  it('lists completed sessions and their attempts only for the demo therapist', async () => {
    const parent = await parentAuthorization();
    const completedId = (await createGameSession(parent)).body.session.id as string;
    const incompleteId = (await createGameSession(parent, 'demo-child-mia')).body.session
      .id as string;
    const attempt = await uploadAttempt(parent, completedId).expect(201);
    await request(app)
      .post(`/api/sessions/${completedId}/complete`)
      .set(parent)
      .send({
        correctAnswers: 4,
        attempts: 4,
        replays: 0,
        longestStreak: 4,
        totalPoints: 50,
        durationSeconds: 30,
      })
      .expect(200);

    const therapist = await therapistAuthorization();
    const listed = await request(app).get('/api/therapist/sessions').set(therapist).expect(200);
    expect(listed.body.sessions).toEqual([
      expect.objectContaining({
        id: completedId,
        childDisplayName: 'Luka',
        recordingAttemptCount: 1,
      }),
    ]);
    expect(listed.body.sessions).not.toContainEqual(expect.objectContaining({ id: incompleteId }));

    const detail = await request(app)
      .get(`/api/therapist/sessions/${completedId}`)
      .set(therapist)
      .expect(200);
    expect(detail.body.session).toMatchObject({
      id: completedId,
      childDisplayName: 'Luka',
      recordingAttempts: [expect.objectContaining({ id: attempt.body.attempt.id })],
    });
    expect(detail.body.session.recordingAttempts[0]).not.toHaveProperty('storageName');

    await request(app).get('/api/therapist/sessions').set(parent).expect(403);
    await request(app).get(`/api/therapist/sessions/${completedId}`).set(parent).expect(403);
  });

  it('saves validated therapist reviews and exposes them to the demo parent', async () => {
    const parent = await parentAuthorization();
    const sessionId = (await createGameSession(parent)).body.session.id as string;
    const attemptId = (await uploadAttempt(parent, sessionId)).body.attempt.id as string;
    await request(app)
      .post(`/api/sessions/${sessionId}/complete`)
      .set(parent)
      .send({
        correctAnswers: 4,
        attempts: 4,
        replays: 0,
        longestStreak: 4,
        totalPoints: 50,
        durationSeconds: 30,
      })
      .expect(200);
    const therapist = await therapistAuthorization();

    const saved = await request(app)
      .put(`/api/attempts/${attemptId}/review`)
      .set(therapist)
      .send({ status: 'PRACTICE_AGAIN', comment: '  Ponoviti testni primjer.  ' })
      .expect(200);
    expect(saved.body.attempt.therapistReview).toMatchObject({
      status: 'PRACTICE_AGAIN',
      comment: 'Ponoviti testni primjer.',
      reviewedAt: expect.any(String),
    });

    const parentProgress = await request(app)
      .get('/api/sessions?childId=demo-child-luka')
      .set(parent)
      .expect(200);
    expect(parentProgress.body.sessions[0].recordingAttempts[0].therapistReview).toMatchObject({
      status: 'PRACTICE_AGAIN',
      comment: 'Ponoviti testni primjer.',
    });

    await request(app)
      .put(`/api/attempts/${attemptId}/review`)
      .set(parent)
      .send({ status: 'LOOKS_GOOD', comment: '' })
      .expect(403);
    await request(app)
      .put(`/api/attempts/${attemptId}/review`)
      .set(therapist)
      .send({ status: 'UNKNOWN', comment: '' })
      .expect(400);
    await request(app)
      .put(`/api/attempts/${attemptId}/review`)
      .set(therapist)
      .send({ status: 'LOOKS_GOOD', comment: 'x'.repeat(401) })
      .expect(400);
    await request(app)
      .put('/api/attempts/missing/review')
      .set(therapist)
      .send({ status: 'NOT_REVIEWED', comment: '' })
      .expect(404);
  });

  it('preserves multiple recording attempts without exposing physical paths', async () => {
    const authorization = await parentAuthorization();
    const sessionId = (await createGameSession(authorization)).body.session.id as string;

    const first = await uploadAttempt(authorization, sessionId).expect(201);
    const second = await uploadAttempt(authorization, sessionId, { attemptNumber: 2 }).expect(201);
    expect(first.body.attempt.id).not.toBe(second.body.attempt.id);
    expect(first.body.attempt.therapistReview).toEqual({
      status: 'NOT_REVIEWED',
      comment: '',
    });
    expect(first.body.attempt).not.toHaveProperty('storageName');
    expect(first.body.attempt).not.toHaveProperty('path');
    expect(readdirSync(recordingsDirectory)).toHaveLength(2);

    const listed = await request(app)
      .get('/api/sessions?childId=demo-child-luka')
      .set(authorization)
      .expect(200);
    expect(listed.body.sessions[0].recordingAttempts).toHaveLength(2);

    const audio = await request(app)
      .get(`/api/attempts/${first.body.attempt.id}/audio`)
      .set(authorization)
      .expect(200);
    expect(audio.headers['content-type']).toContain('audio/webm');
  });

  it('requires authentication for audio and permits therapist playback', async () => {
    const authorization = await parentAuthorization();
    const sessionId = (await createGameSession(authorization)).body.session.id as string;
    const attemptId = (await uploadAttempt(authorization, sessionId)).body.attempt.id as string;

    await request(app).get(`/api/attempts/${attemptId}/audio`).expect(401);

    const therapistToken = (await login('therapist@artikulino.test', 'TherapistDemo123!')).body
      .token as string;
    const response = await request(app)
      .get(`/api/attempts/${attemptId}/audio`)
      .set('Authorization', `Bearer ${therapistToken}`)
      .expect(200);
    expect(response.headers['content-type']).toContain('audio/webm');
  });

  it('lets only the owning parent poll one recording attempt without exposing storage details', async () => {
    const authorization = await parentAuthorization();
    const sessionId = (await createGameSession(authorization)).body.session.id as string;
    const uploaded = await uploadAttempt(authorization, sessionId).expect(201);
    const attemptId = uploaded.body.attempt.id as string;
    await transcriptionQueue.waitForIdle();

    const response = await request(app)
      .get(`/api/attempts/${attemptId}`)
      .set(authorization)
      .expect(200);
    expect(response.body.attempt).toMatchObject({
      id: attemptId,
      transcriptionStatus: 'COMPLETED',
      transcript: 'kruška',
      textMatch: 100,
    });
    expect(response.body.attempt).not.toHaveProperty('storageName');
    expect(response.body.attempt).not.toHaveProperty('path');

    await request(app).get(`/api/attempts/${attemptId}`).expect(401);
    await request(app)
      .get(`/api/attempts/${attemptId}`)
      .set(await therapistAuthorization())
      .expect(403);
    await request(app).get('/api/attempts/missing').set(authorization).expect(404);
  });

  it('stores Croatian transcripts and text match after queued processing', async () => {
    const authorization = await parentAuthorization();
    const sessionId = (await createGameSession(authorization)).body.session.id as string;

    const uploaded = await uploadAttempt(authorization, sessionId).expect(201);
    expect(uploaded.body.attempt).toMatchObject({
      expectedText: 'kruška',
      transcriptionStatus: 'PENDING',
    });
    expect(uploaded.body.attempt).not.toHaveProperty('transcript');
    await transcriptionQueue.waitForIdle();

    const listed = await request(app)
      .get('/api/sessions?childId=demo-child-luka')
      .set(authorization)
      .expect(200);
    expect(listed.body.sessions[0].recordingAttempts[0]).toMatchObject({
      transcriptionStatus: 'COMPLETED',
      transcript: 'kruška',
      textMatch: 100,
    });
    expect(transcriptionClient.requests).toEqual([
      expect.objectContaining({
        mimeType: 'audio/webm',
      }),
    ]);
    expect(transcriptionClient.requests[0]).not.toHaveProperty('expectedText');
  });

  it('keeps audio and marks the attempt failed when the worker is unavailable', async () => {
    transcriptionClient.shouldFail = true;
    const authorization = await parentAuthorization();
    const sessionId = (await createGameSession(authorization)).body.session.id as string;
    const uploaded = await uploadAttempt(authorization, sessionId).expect(201);
    await transcriptionQueue.waitForIdle();

    const listed = await request(app)
      .get('/api/sessions?childId=demo-child-luka')
      .set(authorization)
      .expect(200);
    expect(listed.body.sessions[0].recordingAttempts[0]).toMatchObject({
      id: uploaded.body.attempt.id,
      transcriptionStatus: 'FAILED',
    });
    expect(listed.body.sessions[0].recordingAttempts[0]).not.toHaveProperty('transcript');
    expect(readdirSync(recordingsDirectory)).toHaveLength(1);
  });

  it('rejects unsupported, empty, oversized, and overlong recordings clearly', async () => {
    const authorization = await parentAuthorization();
    const sessionId = (await createGameSession(authorization)).body.session.id as string;

    await uploadAttempt(authorization, sessionId, { contentType: 'audio/aac' })
      .expect(415)
      .expect(({ body }) => expect(body.message).toContain('Format'));
    await uploadAttempt(authorization, sessionId, { durationMs: 15_001 })
      .expect(400)
      .expect(({ body }) => expect(body.message).toContain('15 sekundi'));
    await uploadAttempt(authorization, sessionId, { buffer: Buffer.alloc(0) })
      .expect(400)
      .expect(({ body }) => expect(body.message).toContain('prazna'));
    await uploadAttempt(authorization, sessionId, {
      buffer: Buffer.alloc(10 * 1024 * 1024 + 1),
    })
      .expect(413)
      .expect(({ body }) => expect(body.message).toContain('10 MB'));
    expect(existsSync(recordingsDirectory) ? readdirSync(recordingsDirectory) : []).toHaveLength(0);
  });

  it('deletes attempt, session, and profile audio from disk with their database records', async () => {
    const authorization = await parentAuthorization();
    const firstSessionId = (await createGameSession(authorization)).body.session.id as string;
    const firstAttempt = await uploadAttempt(authorization, firstSessionId).expect(201);
    await request(app)
      .delete(`/api/attempts/${firstAttempt.body.attempt.id}`)
      .set(authorization)
      .expect(204);
    expect(readdirSync(recordingsDirectory)).toHaveLength(0);

    const secondAttempt = await uploadAttempt(authorization, firstSessionId).expect(201);
    await request(app).delete(`/api/sessions/${firstSessionId}`).set(authorization).expect(204);
    expect(existsSync(recordingsDirectory) ? readdirSync(recordingsDirectory) : []).toHaveLength(0);
    await request(app)
      .get(`/api/attempts/${secondAttempt.body.attempt.id}/audio`)
      .set(authorization)
      .expect(404);

    const secondSessionId = (await createGameSession(authorization, 'demo-child-mia')).body.session
      .id as string;
    await uploadAttempt(authorization, secondSessionId).expect(201);
    await request(app).delete('/api/children/demo-child-mia').set(authorization).expect(204);
    expect(existsSync(recordingsDirectory) ? readdirSync(recordingsDirectory) : []).toHaveLength(0);
    await request(app).get('/api/sessions?childId=demo-child-mia').set(authorization).expect(404);
  });

  it('restricts session and recording mutations to the owning demo parent', async () => {
    const therapistToken = (await login('therapist@artikulino.test', 'TherapistDemo123!')).body
      .token as string;
    const therapistAuthorization = { Authorization: `Bearer ${therapistToken}` };
    await createGameSession(therapistAuthorization).expect(403);
    await request(app)
      .get('/api/sessions?childId=demo-child-luka')
      .set(therapistAuthorization)
      .expect(403);

    const parent = database.findUserByEmail('parent@artikulino.test')!;
    const otherChild = database.createChild(parent.id, 'Privremeni');
    expect(
      database.createGameSession('drugi-roditelj', {
        childId: otherChild.id,
        packageId: 'x',
        packageName: 'x',
        gameType: 'catch-the-sound',
        targetSound: 'R',
        theme: 'Kuća',
        difficulty: 'EASY',
        questionCount: 1,
      }),
    ).toBeUndefined();
  });
});
