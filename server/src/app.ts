import express, { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import multer from 'multer';
import {
  AuthenticatedUser,
  CompleteGameSessionInput,
  CreateGameSessionInput,
  PrototypeDatabase,
  PrototypeDifficulty,
  PrototypeGameType,
  TherapistReviewStatus,
} from './database.js';
import { DEFAULT_DATABASE_FILE, DEFAULT_RECORDINGS_DIRECTORY } from './runtime-path.js';
import { createBearerToken, verifyPassword } from './security.js';
import {
  LocalTranscriptionClient,
  SerialTranscriptionQueue,
  TranscriptionClient,
  TranscriptionJob,
  textMatchPercentage,
} from './transcription.js';

const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;
const MAX_RECORDING_BYTES = 10 * 1024 * 1024;
const MAX_RECORDING_DURATION_MS = 15_000;
const SUPPORTED_MIME_TYPES = new Map([
  ['audio/webm', 'webm'],
  ['audio/ogg', 'ogg'],
  ['audio/mp4', 'm4a'],
  ['audio/wav', 'wav'],
  ['audio/x-wav', 'wav'],
]);
const GAME_TYPES = new Set<PrototypeGameType>([
  'listen-and-decide',
  'catch-the-sound',
  'sound-position',
  'pronunciation-practice',
]);
const DIFFICULTIES = new Set<PrototypeDifficulty>(['EASY', 'MEDIUM', 'HARD']);
const REVIEW_STATUSES = new Set<TherapistReviewStatus>([
  'NOT_REVIEWED',
  'LOOKS_GOOD',
  'PRACTICE_AGAIN',
]);

export interface PrototypeAppOptions {
  readonly databaseFile?: string;
  readonly recordingsDirectory?: string;
  readonly sessionTtlMs?: number;
  readonly transcriptionClient?: TranscriptionClient;
}

function bearerToken(request: Request): string | undefined {
  const authorization = request.header('authorization');
  return authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : undefined;
}

function routeParameter(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

function textField(value: unknown, maxLength: number): string {
  return typeof value === 'string' && value.trim().length <= maxLength ? value.trim() : '';
}

function integerField(
  value: unknown,
  minimum = 0,
  maximum = Number.MAX_SAFE_INTEGER,
): number | null {
  const parsed =
    typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  return Number.isInteger(parsed) && parsed >= minimum && parsed <= maximum ? parsed : null;
}

function normalizedMimeType(value: string): string {
  return value.split(';', 1)[0]?.trim().toLowerCase() ?? '';
}

export function createPrototypeApp(options: PrototypeAppOptions = {}) {
  const databaseFile = options.databaseFile ?? DEFAULT_DATABASE_FILE;
  const recordingsDirectory = options.recordingsDirectory ?? DEFAULT_RECORDINGS_DIRECTORY;
  const sessionTtlMs = options.sessionTtlMs ?? EIGHT_HOURS_MS;
  const database = new PrototypeDatabase(databaseFile);
  const transcriptionClient = options.transcriptionClient ?? new LocalTranscriptionClient();
  const transcriptionQueue = new SerialTranscriptionQueue();
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_RECORDING_BYTES, files: 1, fields: 5 },
  });
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '32kb' }));
  app.use((request, response, next) => {
    const origin = request.header('origin');
    if (origin === 'http://localhost:4200' || origin === 'http://127.0.0.1:4200') {
      response.header('Access-Control-Allow-Origin', origin);
      response.header('Vary', 'Origin');
      response.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
      response.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    }
    if (request.method === 'OPTIONS') {
      response.sendStatus(204);
      return;
    }
    next();
  });

  const requireAuth = (request: Request, response: Response, next: NextFunction): void => {
    const token = bearerToken(request);
    const user = token ? database.authenticate(token) : undefined;
    if (!user) {
      response.status(401).json({ message: 'Prijava je istekla ili nije valjana.' });
      return;
    }
    response.locals['user'] = user;
    response.locals['token'] = token;
    next();
  };

  const requireParent = (_request: Request, response: Response, next: NextFunction): void => {
    if (currentUser(response).role !== 'PARENT') {
      response.status(403).json({ message: 'Ova radnja dostupna je samo demo roditelju.' });
      return;
    }
    next();
  };

  const requireTherapist = (_request: Request, response: Response, next: NextFunction): void => {
    if (currentUser(response).role !== 'THERAPIST') {
      response.status(403).json({ message: 'Ova radnja dostupna je samo demo terapeutu.' });
      return;
    }
    next();
  };

  const currentUser = (response: Response): AuthenticatedUser =>
    response.locals['user'] as AuthenticatedUser;

  const removeStoredRecordings = async (storageNames: readonly string[]): Promise<void> => {
    await Promise.all(
      storageNames.map(async (storageName) => {
        try {
          await unlink(join(recordingsDirectory, storageName));
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            throw error;
          }
        }
      }),
    );
  };

  const enqueueTranscription = (job: TranscriptionJob): void => {
    transcriptionQueue.enqueue(async () => {
      try {
        const transcript = await transcriptionClient.transcribe({
          audioPath: job.audioPath,
          mimeType: job.mimeType,
        });
        database.completeTranscription(
          job.attemptId,
          transcript,
          textMatchPercentage(job.expectedText, transcript),
        );
      } catch {
        database.failTranscription(job.attemptId);
      }
    });
  };

  for (const pending of database.listPendingTranscriptionJobs()) {
    enqueueTranscription({
      attemptId: pending.attemptId,
      audioPath: join(recordingsDirectory, pending.storageName),
      mimeType: pending.mimeType,
      expectedText: pending.expectedText,
    });
  }

  app.get('/api/health', async (_request, response) => {
    response.json({
      status: 'ok',
      mode: 'LOCAL_THESIS_PROTOTYPE',
      transcription: await transcriptionClient.health(),
    });
  });

  app.post('/api/auth/login', (request, response) => {
    const email =
      typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : '';
    const password = typeof request.body?.password === 'string' ? request.body.password : '';
    const user = email ? database.findUserByEmail(email) : undefined;

    if (!user || !verifyPassword(password, user.passwordHash)) {
      response.status(401).json({ message: 'E-pošta ili lozinka nisu točni.' });
      return;
    }

    const token = createBearerToken();
    const expiresAt = Date.now() + sessionTtlMs;
    database.createAuthSession(user.id, token, expiresAt);
    response.json({
      token,
      expiresAt,
      user: { id: user.id, email: user.email, role: user.role },
    });
  });

  app.get('/api/auth/me', requireAuth, (_request, response) => {
    response.json({ user: currentUser(response) });
  });

  app.post('/api/auth/logout', requireAuth, (_request, response) => {
    database.deleteAuthSession(response.locals['token'] as string);
    response.sendStatus(204);
  });

  app.get('/api/children', requireAuth, (_request, response) => {
    response.json({ children: database.listChildren(currentUser(response)) });
  });

  app.post('/api/children', requireAuth, requireParent, (request, response) => {
    const displayName = textField(request.body?.displayName, 50);
    if (!displayName) {
      response.status(400).json({ message: 'Prikazno ime mora sadržavati između 1 i 50 znakova.' });
      return;
    }

    response
      .status(201)
      .json({ child: database.createChild(currentUser(response).id, displayName) });
  });

  app.delete('/api/children/:childId', requireAuth, requireParent, async (request, response) => {
    const user = currentUser(response);
    const childId = routeParameter(request.params['childId']);
    const storageNames = database.listChildStorageNames(user.id, childId);
    if (!storageNames) {
      response.status(404).json({ message: 'Demo profil nije pronađen.' });
      return;
    }
    await removeStoredRecordings(storageNames);
    database.deleteChild(user.id, childId);
    response.sendStatus(204);
  });

  app.get('/api/sessions', requireAuth, requireParent, (request, response) => {
    const childId = textField(request.query['childId'], 100);
    if (!childId) {
      response.status(400).json({ message: 'Odaberite demo profil.' });
      return;
    }
    const sessions = database.listGameSessions(currentUser(response).id, childId);
    if (!sessions) {
      response.status(404).json({ message: 'Demo profil nije pronađen.' });
      return;
    }
    response.json({ sessions });
  });

  app.get('/api/therapist/sessions', requireAuth, requireTherapist, (_request, response) => {
    response.json({ sessions: database.listTherapistSessions() });
  });

  app.get(
    '/api/therapist/sessions/:sessionId',
    requireAuth,
    requireTherapist,
    (request, response) => {
      const session = database.getTherapistSession(routeParameter(request.params['sessionId']));
      if (!session) {
        response.status(404).json({ message: 'Dovršena sesija nije pronađena.' });
        return;
      }
      response.json({ session });
    },
  );

  app.post('/api/sessions', requireAuth, requireParent, (request, response) => {
    const input = parseGameSession(request.body);
    if (!input) {
      response.status(400).json({ message: 'Podaci o igri nisu potpuni ili nisu valjani.' });
      return;
    }
    const session = database.createGameSession(currentUser(response).id, input);
    if (!session) {
      response.status(404).json({ message: 'Demo profil nije pronađen.' });
      return;
    }
    response.status(201).json({ session });
  });

  app.post('/api/sessions/:sessionId/complete', requireAuth, requireParent, (request, response) => {
    const input = parseCompletedSession(request.body);
    if (!input) {
      response.status(400).json({ message: 'Rezultat igre nije valjan.' });
      return;
    }
    const session = database.completeGameSession(
      currentUser(response).id,
      routeParameter(request.params['sessionId']),
      input,
    );
    if (!session) {
      response.status(404).json({ message: 'Sesija igre nije pronađena.' });
      return;
    }
    response.json({ session });
  });

  app.delete('/api/sessions/:sessionId', requireAuth, requireParent, async (request, response) => {
    const user = currentUser(response);
    const sessionId = routeParameter(request.params['sessionId']);
    const storageNames = database.listSessionStorageNames(user.id, sessionId);
    if (!storageNames) {
      response.status(404).json({ message: 'Sesija igre nije pronađena.' });
      return;
    }
    await removeStoredRecordings(storageNames);
    database.deleteGameSession(user.id, sessionId);
    response.sendStatus(204);
  });

  app.post(
    '/api/sessions/:sessionId/attempts',
    requireAuth,
    requireParent,
    upload.single('audio'),
    async (request, response) => {
      const user = currentUser(response);
      const sessionId = routeParameter(request.params['sessionId']);
      if (!database.getGameSession(user.id, sessionId)) {
        response.status(404).json({ message: 'Sesija igre nije pronađena.' });
        return;
      }
      if (!request.file?.buffer.length) {
        response.status(400).json({ message: 'Snimka je prazna ili nije priložena.' });
        return;
      }

      const mimeType = normalizedMimeType(request.file.mimetype);
      const extension = SUPPORTED_MIME_TYPES.get(mimeType);
      const questionId = textField(request.body?.questionId, 100);
      const expectedText = textField(request.body?.expectedText, 250);
      const attemptNumber = integerField(request.body?.attemptNumber, 1, 1_000);
      const durationMs = integerField(request.body?.durationMs, 1, MAX_RECORDING_DURATION_MS);
      if (!extension) {
        response.status(415).json({ message: 'Format ove audiosnimke nije podržan.' });
        return;
      }
      if (!questionId || !expectedText || attemptNumber === null || durationMs === null) {
        response.status(400).json({
          message: `Snimka mora imati valjano pitanje, tekst i trajanje do ${MAX_RECORDING_DURATION_MS / 1000} sekundi.`,
        });
        return;
      }

      await mkdir(recordingsDirectory, { recursive: true });
      const storageName = `${randomUUID()}.${extension}`;
      const filePath = join(recordingsDirectory, storageName);
      await writeFile(filePath, request.file.buffer, { flag: 'wx' });
      try {
        const attempt = database.createRecordingAttempt(user.id, {
          sessionId,
          questionId,
          expectedText,
          attemptNumber,
          mimeType,
          durationMs,
          fileSize: request.file.size,
          storageName,
        });
        if (!attempt) {
          await unlink(filePath);
          response.status(404).json({ message: 'Sesija igre nije pronađena.' });
          return;
        }
        enqueueTranscription({
          attemptId: attempt.id,
          audioPath: filePath,
          mimeType,
          expectedText,
        });
        response.status(201).json({ attempt });
      } catch (error) {
        await unlink(filePath).catch(() => undefined);
        throw error;
      }
    },
  );

  app.get('/api/attempts/:attemptId/audio', requireAuth, async (request, response) => {
    const recording = database.getRecordingStorage(
      currentUser(response),
      routeParameter(request.params['attemptId']),
    );
    if (!recording) {
      response.status(404).json({ message: 'Snimka nije pronađena.' });
      return;
    }
    response.type(recording.mimeType);
    response.sendFile(join(recordingsDirectory, recording.storageName));
  });

  app.put('/api/attempts/:attemptId/review', requireAuth, requireTherapist, (request, response) => {
    const status = request.body?.status;
    const comment = typeof request.body?.comment === 'string' ? request.body.comment.trim() : null;
    if (
      typeof status !== 'string' ||
      !REVIEW_STATUSES.has(status as TherapistReviewStatus) ||
      comment === null ||
      comment.length > 400
    ) {
      response.status(400).json({
        message: 'Odaberite valjani status i komentar do 400 znakova.',
      });
      return;
    }
    const attempt = database.saveTherapistReview(
      currentUser(response).id,
      routeParameter(request.params['attemptId']),
      status as TherapistReviewStatus,
      comment,
    );
    if (!attempt) {
      response.status(404).json({ message: 'Pokušaj snimanja nije pronađen.' });
      return;
    }
    response.json({ attempt });
  });

  app.delete('/api/attempts/:attemptId', requireAuth, requireParent, async (request, response) => {
    const user = currentUser(response);
    const attemptId = routeParameter(request.params['attemptId']);
    const storageName = database.getAttemptStorageName(user.id, attemptId);
    if (!storageName) {
      response.status(404).json({ message: 'Snimka nije pronađena.' });
      return;
    }
    await removeStoredRecordings([storageName]);
    database.deleteRecordingAttempt(user.id, attemptId);
    response.sendStatus(204);
  });

  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction): void => {
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      response.status(413).json({ message: 'Snimka ne smije biti veća od 10 MB.' });
      return;
    }
    console.error('Prototype server error', error);
    response.status(500).json({ message: 'Lokalni prototip trenutačno nije dostupan.' });
  });

  return { app, database, transcriptionQueue };
}

function parseGameSession(body: unknown): CreateGameSessionInput | undefined {
  const value = body as Record<string, unknown> | null;
  const childId = textField(value?.['childId'], 100);
  const packageId = textField(value?.['packageId'], 100);
  const packageName = textField(value?.['packageName'], 100);
  const gameType = value?.['gameType'];
  const targetSound = textField(value?.['targetSound'], 20) ?? '';
  const theme = textField(value?.['theme'], 50);
  const difficulty = value?.['difficulty'];
  const questionCount = integerField(value?.['questionCount'], 1, 1_000);
  if (
    !childId ||
    !packageId ||
    !packageName ||
    typeof gameType !== 'string' ||
    !GAME_TYPES.has(gameType as PrototypeGameType) ||
    !theme ||
    typeof difficulty !== 'string' ||
    !DIFFICULTIES.has(difficulty as PrototypeDifficulty) ||
    questionCount === null
  ) {
    return undefined;
  }
  return {
    childId,
    packageId,
    packageName,
    gameType: gameType as PrototypeGameType,
    targetSound,
    theme,
    difficulty: difficulty as PrototypeDifficulty,
    questionCount,
  };
}

function parseCompletedSession(body: unknown): CompleteGameSessionInput | undefined {
  const value = body as Record<string, unknown> | null;
  const correctAnswers = integerField(value?.['correctAnswers'], 0, 1_000);
  const attempts = integerField(value?.['attempts'], 0, 10_000);
  const replays = integerField(value?.['replays'], 0, 10_000);
  const longestStreak = integerField(value?.['longestStreak'], 0, 1_000);
  const totalPoints = integerField(value?.['totalPoints'], 0, 1_000_000);
  const durationSeconds = integerField(value?.['durationSeconds'], 0, 86_400);
  if (
    correctAnswers === null ||
    attempts === null ||
    replays === null ||
    longestStreak === null ||
    totalPoints === null ||
    durationSeconds === null
  ) {
    return undefined;
  }
  return { correctAnswers, attempts, replays, longestStreak, totalPoints, durationSeconds };
}
