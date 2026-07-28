import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { hashBearerToken, hashPassword } from './security.js';

export type DemoRole = 'PARENT' | 'THERAPIST';
export type PrototypeGameType = 'listen-and-decide' | 'catch-the-sound' | 'sound-position';
export type PrototypeDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type TranscriptionStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface DemoUserRow {
  readonly id: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly role: DemoRole;
}

export interface AuthenticatedUser {
  readonly id: string;
  readonly email: string;
  readonly role: DemoRole;
}

export interface DemoChildRow {
  readonly id: string;
  readonly displayName: string;
}

export interface CreateGameSessionInput {
  readonly childId: string;
  readonly packageId: string;
  readonly packageName: string;
  readonly gameType: PrototypeGameType;
  readonly targetSound: string;
  readonly theme: string;
  readonly difficulty: PrototypeDifficulty;
  readonly questionCount: number;
}

export interface CompleteGameSessionInput {
  readonly correctAnswers: number;
  readonly attempts: number;
  readonly replays: number;
  readonly longestStreak: number;
  readonly totalPoints: number;
  readonly durationSeconds: number;
}

export interface CreateRecordingAttemptInput {
  readonly sessionId: string;
  readonly questionId: string;
  readonly attemptNumber: number;
  readonly expectedText: string;
  readonly mimeType: string;
  readonly durationMs: number;
  readonly fileSize: number;
  readonly storageName: string;
}

export interface PrototypeRecordingAttempt {
  readonly id: string;
  readonly questionId: string;
  readonly attemptNumber: number;
  readonly expectedText: string;
  readonly mimeType: string;
  readonly durationMs: number;
  readonly fileSize: number;
  readonly createdAt: string;
  readonly transcriptionStatus: TranscriptionStatus;
  readonly transcript?: string;
  readonly textMatch?: number;
}

export interface PendingTranscriptionJob {
  readonly attemptId: string;
  readonly storageName: string;
  readonly mimeType: string;
  readonly expectedText: string;
}

export interface PrototypeGameSession {
  readonly id: string;
  readonly childId: string;
  readonly packageId: string;
  readonly packageName: string;
  readonly gameType: PrototypeGameType;
  readonly targetSound: string;
  readonly theme: string;
  readonly difficulty: PrototypeDifficulty;
  readonly questionCount: number;
  readonly correctAnswers: number;
  readonly attempts: number;
  readonly replays: number;
  readonly longestStreak: number;
  readonly totalPoints: number;
  readonly durationSeconds: number;
  readonly startedAt: string;
  readonly completedAt?: string;
  readonly recordingAttempts: readonly PrototypeRecordingAttempt[];
}

interface UserDatabaseRow {
  readonly id: string;
  readonly email: string;
  readonly password_hash: string;
  readonly role: DemoRole;
}

interface ChildDatabaseRow {
  readonly id: string;
  readonly display_name: string;
}

interface SessionUserDatabaseRow {
  readonly id: string;
  readonly email: string;
  readonly role: DemoRole;
  readonly expires_at: number;
}

interface GameSessionDatabaseRow {
  readonly id: string;
  readonly child_id: string;
  readonly package_id: string;
  readonly package_name: string;
  readonly game_type: PrototypeGameType;
  readonly target_sound: string;
  readonly theme: string;
  readonly difficulty: PrototypeDifficulty;
  readonly question_count: number;
  readonly correct_answers: number;
  readonly attempts: number;
  readonly replays: number;
  readonly longest_streak: number;
  readonly total_points: number;
  readonly duration_seconds: number;
  readonly started_at: number;
  readonly completed_at: number | null;
}

interface RecordingAttemptDatabaseRow {
  readonly id: string;
  readonly session_id: string;
  readonly question_id: string;
  readonly attempt_number: number;
  readonly expected_text: string;
  readonly mime_type: string;
  readonly duration_ms: number;
  readonly file_size: number;
  readonly storage_name: string;
  readonly created_at: number;
  readonly transcription_status: TranscriptionStatus;
  readonly transcript: string | null;
  readonly text_match: number | null;
}

const PARENT_ID = 'demo-parent';
const THERAPIST_ID = 'demo-therapist';

export class PrototypeDatabase {
  private readonly sqlite: Database.Database;

  constructor(readonly filename: string) {
    if (filename !== ':memory:') {
      mkdirSync(dirname(filename), { recursive: true });
    }
    this.sqlite = new Database(filename);
    this.sqlite.pragma('foreign_keys = ON');
    this.migrate();
    this.seedDemoData();
  }

  close(): void {
    this.sqlite.close();
  }

  findUserByEmail(email: string): DemoUserRow | undefined {
    const row = this.sqlite
      .prepare('SELECT id, email, password_hash, role FROM users WHERE email = ?')
      .get(email.toLowerCase()) as UserDatabaseRow | undefined;
    return row
      ? {
          id: row.id,
          email: row.email,
          passwordHash: row.password_hash,
          role: row.role,
        }
      : undefined;
  }

  getStoredPasswordHash(email: string): string | undefined {
    return this.findUserByEmail(email)?.passwordHash;
  }

  createAuthSession(userId: string, rawToken: string, expiresAt: number): void {
    this.sqlite
      .prepare(
        `INSERT INTO auth_sessions (id, user_id, token_hash, expires_at, created_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(randomUUID(), userId, hashBearerToken(rawToken), expiresAt, Date.now());
  }

  authenticate(rawToken: string, now = Date.now()): AuthenticatedUser | undefined {
    const row = this.sqlite
      .prepare(
        `SELECT users.id, users.email, users.role, auth_sessions.expires_at
         FROM auth_sessions
         JOIN users ON users.id = auth_sessions.user_id
         WHERE auth_sessions.token_hash = ?`,
      )
      .get(hashBearerToken(rawToken)) as SessionUserDatabaseRow | undefined;

    if (!row || row.expires_at <= now) {
      if (row) {
        this.deleteAuthSession(rawToken);
      }
      return undefined;
    }

    return { id: row.id, email: row.email, role: row.role };
  }

  deleteAuthSession(rawToken: string): void {
    this.sqlite
      .prepare('DELETE FROM auth_sessions WHERE token_hash = ?')
      .run(hashBearerToken(rawToken));
  }

  listChildren(user: AuthenticatedUser): readonly DemoChildRow[] {
    const query =
      user.role === 'THERAPIST'
        ? 'SELECT id, display_name FROM demo_children ORDER BY display_name'
        : 'SELECT id, display_name FROM demo_children WHERE owner_user_id = ? ORDER BY display_name';
    const rows =
      user.role === 'THERAPIST'
        ? (this.sqlite.prepare(query).all() as ChildDatabaseRow[])
        : (this.sqlite.prepare(query).all(user.id) as ChildDatabaseRow[]);
    return rows.map((row) => ({ id: row.id, displayName: row.display_name }));
  }

  createChild(ownerUserId: string, displayName: string): DemoChildRow {
    const child = { id: randomUUID(), displayName };
    this.sqlite
      .prepare(
        `INSERT INTO demo_children (id, display_name, owner_user_id, created_at)
         VALUES (?, ?, ?, ?)`,
      )
      .run(child.id, child.displayName, ownerUserId, Date.now());
    return child;
  }

  ownsChild(ownerUserId: string, childId: string): boolean {
    return Boolean(
      this.sqlite
        .prepare('SELECT 1 FROM demo_children WHERE id = ? AND owner_user_id = ?')
        .get(childId, ownerUserId),
    );
  }

  listChildStorageNames(ownerUserId: string, childId: string): readonly string[] | undefined {
    if (!this.ownsChild(ownerUserId, childId)) {
      return undefined;
    }
    const rows = this.sqlite
      .prepare(
        `SELECT recording_attempts.storage_name
         FROM recording_attempts
         JOIN game_sessions ON game_sessions.id = recording_attempts.session_id
         WHERE game_sessions.child_id = ?`,
      )
      .all(childId) as { storage_name: string }[];
    return rows.map((row) => row.storage_name);
  }

  deleteChild(ownerUserId: string, childId: string): boolean {
    return (
      this.sqlite
        .prepare('DELETE FROM demo_children WHERE id = ? AND owner_user_id = ?')
        .run(childId, ownerUserId).changes > 0
    );
  }

  createGameSession(
    ownerUserId: string,
    input: CreateGameSessionInput,
  ): PrototypeGameSession | undefined {
    if (!this.ownsChild(ownerUserId, input.childId)) {
      return undefined;
    }
    const id = randomUUID();
    const startedAt = Date.now();
    this.sqlite
      .prepare(
        `INSERT INTO game_sessions (
          id, child_id, package_id, package_name, game_type, target_sound, theme, difficulty,
          question_count, started_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        input.childId,
        input.packageId,
        input.packageName,
        input.gameType,
        input.targetSound,
        input.theme,
        input.difficulty,
        input.questionCount,
        startedAt,
      );
    return this.getGameSession(ownerUserId, id);
  }

  listGameSessions(
    ownerUserId: string,
    childId: string,
  ): readonly PrototypeGameSession[] | undefined {
    if (!this.ownsChild(ownerUserId, childId)) {
      return undefined;
    }
    const rows = this.sqlite
      .prepare(
        `SELECT * FROM game_sessions
         WHERE child_id = ?
         ORDER BY COALESCE(completed_at, started_at) DESC`,
      )
      .all(childId) as GameSessionDatabaseRow[];
    return rows.map((row) => this.mapGameSession(row));
  }

  getGameSession(ownerUserId: string, sessionId: string): PrototypeGameSession | undefined {
    const row = this.sqlite
      .prepare(
        `SELECT game_sessions.*
         FROM game_sessions
         JOIN demo_children ON demo_children.id = game_sessions.child_id
         WHERE game_sessions.id = ? AND demo_children.owner_user_id = ?`,
      )
      .get(sessionId, ownerUserId) as GameSessionDatabaseRow | undefined;
    return row ? this.mapGameSession(row) : undefined;
  }

  completeGameSession(
    ownerUserId: string,
    sessionId: string,
    input: CompleteGameSessionInput,
  ): PrototypeGameSession | undefined {
    const completedAt = Date.now();
    const result = this.sqlite
      .prepare(
        `UPDATE game_sessions SET
          correct_answers = ?, attempts = ?, replays = ?, longest_streak = ?,
          total_points = ?, duration_seconds = ?, completed_at = ?
         WHERE id = ? AND child_id IN (
           SELECT id FROM demo_children WHERE owner_user_id = ?
         )`,
      )
      .run(
        input.correctAnswers,
        input.attempts,
        input.replays,
        input.longestStreak,
        input.totalPoints,
        input.durationSeconds,
        completedAt,
        sessionId,
        ownerUserId,
      );
    return result.changes ? this.getGameSession(ownerUserId, sessionId) : undefined;
  }

  listSessionStorageNames(ownerUserId: string, sessionId: string): readonly string[] | undefined {
    if (!this.getGameSession(ownerUserId, sessionId)) {
      return undefined;
    }
    const rows = this.sqlite
      .prepare('SELECT storage_name FROM recording_attempts WHERE session_id = ?')
      .all(sessionId) as { storage_name: string }[];
    return rows.map((row) => row.storage_name);
  }

  deleteGameSession(ownerUserId: string, sessionId: string): boolean {
    return (
      this.sqlite
        .prepare(
          `DELETE FROM game_sessions
           WHERE id = ? AND child_id IN (
             SELECT id FROM demo_children WHERE owner_user_id = ?
           )`,
        )
        .run(sessionId, ownerUserId).changes > 0
    );
  }

  createRecordingAttempt(
    ownerUserId: string,
    input: CreateRecordingAttemptInput,
  ): PrototypeRecordingAttempt | undefined {
    if (!this.getGameSession(ownerUserId, input.sessionId)) {
      return undefined;
    }
    const id = randomUUID();
    this.sqlite
      .prepare(
        `INSERT INTO recording_attempts (
          id, session_id, question_id, attempt_number, expected_text, mime_type,
          duration_ms, file_size, storage_name, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        input.sessionId,
        input.questionId,
        input.attemptNumber,
        input.expectedText,
        input.mimeType,
        input.durationMs,
        input.fileSize,
        input.storageName,
        Date.now(),
      );
    return this.mapRecordingAttempt(
      this.sqlite
        .prepare('SELECT * FROM recording_attempts WHERE id = ?')
        .get(id) as RecordingAttemptDatabaseRow,
    );
  }

  listPendingTranscriptionJobs(): readonly PendingTranscriptionJob[] {
    const rows = this.sqlite
      .prepare(
        `SELECT id AS attemptId, storage_name AS storageName, mime_type AS mimeType,
                expected_text AS expectedText
         FROM recording_attempts
         WHERE transcription_status = 'PENDING'
         ORDER BY created_at`,
      )
      .all() as PendingTranscriptionJob[];
    return rows;
  }

  completeTranscription(attemptId: string, transcript: string, textMatch: number): boolean {
    return (
      this.sqlite
        .prepare(
          `UPDATE recording_attempts
           SET transcription_status = 'COMPLETED', transcript = ?, text_match = ?
           WHERE id = ?`,
        )
        .run(transcript, textMatch, attemptId).changes > 0
    );
  }

  failTranscription(attemptId: string): boolean {
    return (
      this.sqlite
        .prepare(
          `UPDATE recording_attempts
           SET transcription_status = 'FAILED', transcript = NULL, text_match = NULL
           WHERE id = ?`,
        )
        .run(attemptId).changes > 0
    );
  }

  getRecordingStorage(
    user: AuthenticatedUser,
    attemptId: string,
  ): { readonly storageName: string; readonly mimeType: string } | undefined {
    const ownership = user.role === 'THERAPIST' ? '' : 'AND demo_children.owner_user_id = @userId';
    return this.sqlite
      .prepare(
        `SELECT recording_attempts.storage_name AS storageName,
                recording_attempts.mime_type AS mimeType
         FROM recording_attempts
         JOIN game_sessions ON game_sessions.id = recording_attempts.session_id
         JOIN demo_children ON demo_children.id = game_sessions.child_id
         WHERE recording_attempts.id = @attemptId ${ownership}`,
      )
      .get({ attemptId, userId: user.id }) as
      { readonly storageName: string; readonly mimeType: string } | undefined;
  }

  getAttemptStorageName(ownerUserId: string, attemptId: string): string | undefined {
    const row = this.sqlite
      .prepare(
        `SELECT recording_attempts.storage_name
         FROM recording_attempts
         JOIN game_sessions ON game_sessions.id = recording_attempts.session_id
         JOIN demo_children ON demo_children.id = game_sessions.child_id
         WHERE recording_attempts.id = ? AND demo_children.owner_user_id = ?`,
      )
      .get(attemptId, ownerUserId) as { storage_name: string } | undefined;
    return row?.storage_name;
  }

  deleteRecordingAttempt(ownerUserId: string, attemptId: string): boolean {
    return (
      this.sqlite
        .prepare(
          `DELETE FROM recording_attempts
           WHERE id = ? AND session_id IN (
             SELECT game_sessions.id
             FROM game_sessions
             JOIN demo_children ON demo_children.id = game_sessions.child_id
             WHERE demo_children.owner_user_id = ?
           )`,
        )
        .run(attemptId, ownerUserId).changes > 0
    );
  }

  resetAndReseed(): void {
    this.sqlite.transaction(() => {
      this.sqlite.prepare('DELETE FROM auth_sessions').run();
      this.sqlite.prepare('DELETE FROM demo_children').run();
      this.sqlite.prepare('DELETE FROM users').run();
      this.seedDemoData();
    })();
  }

  private mapGameSession(row: GameSessionDatabaseRow): PrototypeGameSession {
    const attempts = this.sqlite
      .prepare('SELECT * FROM recording_attempts WHERE session_id = ? ORDER BY created_at')
      .all(row.id) as RecordingAttemptDatabaseRow[];
    return {
      id: row.id,
      childId: row.child_id,
      packageId: row.package_id,
      packageName: row.package_name,
      gameType: row.game_type,
      targetSound: row.target_sound,
      theme: row.theme,
      difficulty: row.difficulty,
      questionCount: row.question_count,
      correctAnswers: row.correct_answers,
      attempts: row.attempts,
      replays: row.replays,
      longestStreak: row.longest_streak,
      totalPoints: row.total_points,
      durationSeconds: row.duration_seconds,
      startedAt: new Date(row.started_at).toISOString(),
      ...(row.completed_at ? { completedAt: new Date(row.completed_at).toISOString() } : {}),
      recordingAttempts: attempts.map((attempt) => this.mapRecordingAttempt(attempt)),
    };
  }

  private mapRecordingAttempt(row: RecordingAttemptDatabaseRow): PrototypeRecordingAttempt {
    return {
      id: row.id,
      questionId: row.question_id,
      attemptNumber: row.attempt_number,
      expectedText: row.expected_text,
      mimeType: row.mime_type,
      durationMs: row.duration_ms,
      fileSize: row.file_size,
      createdAt: new Date(row.created_at).toISOString(),
      transcriptionStatus: row.transcription_status,
      ...(row.transcript !== null ? { transcript: row.transcript } : {}),
      ...(row.text_match !== null ? { textMatch: row.text_match } : {}),
    };
  }

  private migrate(): void {
    this.sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('PARENT', 'THERAPIST'))
      );

      CREATE TABLE IF NOT EXISTS auth_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS demo_children (
        id TEXT PRIMARY KEY,
        display_name TEXT NOT NULL,
        owner_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS game_sessions (
        id TEXT PRIMARY KEY,
        child_id TEXT NOT NULL REFERENCES demo_children(id) ON DELETE CASCADE,
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

      CREATE TABLE IF NOT EXISTS recording_attempts (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
        question_id TEXT NOT NULL,
        attempt_number INTEGER NOT NULL CHECK (attempt_number > 0),
        expected_text TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        duration_ms INTEGER NOT NULL CHECK (duration_ms > 0),
        file_size INTEGER NOT NULL CHECK (file_size > 0),
        storage_name TEXT NOT NULL UNIQUE,
        created_at INTEGER NOT NULL,
        transcription_status TEXT NOT NULL DEFAULT 'PENDING'
          CHECK (transcription_status IN ('PENDING', 'COMPLETED', 'FAILED')),
        transcript TEXT,
        text_match INTEGER CHECK (text_match BETWEEN 0 AND 100)
      );

      CREATE TABLE IF NOT EXISTS therapist_reviews (
        attempt_id TEXT PRIMARY KEY REFERENCES recording_attempts(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'NOT_REVIEWED'
          CHECK (status IN ('NOT_REVIEWED', 'LOOKS_GOOD', 'PRACTICE_AGAIN')),
        comment TEXT NOT NULL DEFAULT '',
        reviewer_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        reviewed_at INTEGER
      );

      CREATE INDEX IF NOT EXISTS idx_game_sessions_child
        ON game_sessions(child_id, completed_at DESC);
      CREATE INDEX IF NOT EXISTS idx_recording_attempts_session
        ON recording_attempts(session_id, created_at);
    `);
    this.ensureRecordingAttemptColumn('transcription_status', "TEXT NOT NULL DEFAULT 'PENDING'");
    this.ensureRecordingAttemptColumn('transcript', 'TEXT');
    this.ensureRecordingAttemptColumn('text_match', 'INTEGER');
  }

  private ensureRecordingAttemptColumn(name: string, definition: string): void {
    const columns = this.sqlite.pragma('table_info(recording_attempts)') as {
      readonly name: string;
    }[];
    if (!columns.some((column) => column.name === name)) {
      this.sqlite.exec(`ALTER TABLE recording_attempts ADD COLUMN ${name} ${definition}`);
    }
  }

  private seedDemoData(): void {
    const count = this.sqlite.prepare('SELECT COUNT(*) AS count FROM users').get() as {
      count: number;
    };
    if (count.count > 0) {
      return;
    }

    const insertUser = this.sqlite.prepare(
      'INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)',
    );
    const insertChild = this.sqlite.prepare(
      `INSERT INTO demo_children (id, display_name, owner_user_id, created_at)
       VALUES (?, ?, ?, ?)`,
    );

    this.sqlite.transaction(() => {
      insertUser.run(PARENT_ID, 'parent@artikulino.test', hashPassword('ParentDemo123!'), 'PARENT');
      insertUser.run(
        THERAPIST_ID,
        'therapist@artikulino.test',
        hashPassword('TherapistDemo123!'),
        'THERAPIST',
      );
      insertChild.run('demo-child-luka', 'Luka', PARENT_ID, Date.now());
      insertChild.run('demo-child-mia', 'Mia', PARENT_ID, Date.now());
    })();
  }
}
