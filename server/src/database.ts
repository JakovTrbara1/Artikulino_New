import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { hashBearerToken, hashPassword } from './security.js';

export type DemoRole = 'PARENT' | 'THERAPIST';

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

  deleteChild(ownerUserId: string, childId: string): boolean {
    return (
      this.sqlite
        .prepare('DELETE FROM demo_children WHERE id = ? AND owner_user_id = ?')
        .run(childId, ownerUserId).changes > 0
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
    `);
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
