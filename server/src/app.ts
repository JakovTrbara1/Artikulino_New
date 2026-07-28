import express, { NextFunction, Request, Response } from 'express';
import { AuthenticatedUser, PrototypeDatabase } from './database.js';
import { DEFAULT_DATABASE_FILE } from './runtime-path.js';
import { createBearerToken, verifyPassword } from './security.js';

const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;

export interface PrototypeAppOptions {
  readonly databaseFile?: string;
  readonly sessionTtlMs?: number;
}

function bearerToken(request: Request): string | undefined {
  const authorization = request.header('authorization');
  return authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : undefined;
}

export function createPrototypeApp(options: PrototypeAppOptions = {}) {
  const databaseFile = options.databaseFile ?? DEFAULT_DATABASE_FILE;
  const sessionTtlMs = options.sessionTtlMs ?? EIGHT_HOURS_MS;
  const database = new PrototypeDatabase(databaseFile);
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '32kb' }));
  app.use((request, response, next) => {
    const origin = request.header('origin');
    if (origin === 'http://localhost:4200' || origin === 'http://127.0.0.1:4200') {
      response.header('Access-Control-Allow-Origin', origin);
      response.header('Vary', 'Origin');
      response.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
      response.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
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

  const currentUser = (response: Response): AuthenticatedUser =>
    response.locals['user'] as AuthenticatedUser;

  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok', mode: 'LOCAL_THESIS_PROTOTYPE' });
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

  app.post('/api/children', requireAuth, (request, response) => {
    const user = currentUser(response);
    if (user.role !== 'PARENT') {
      response.status(403).json({ message: 'Samo demo roditelj može dodavati profile.' });
      return;
    }

    const displayName =
      typeof request.body?.displayName === 'string' ? request.body.displayName.trim() : '';
    if (!displayName || displayName.length > 50) {
      response.status(400).json({ message: 'Prikazno ime mora sadržavati između 1 i 50 znakova.' });
      return;
    }

    response.status(201).json({ child: database.createChild(user.id, displayName) });
  });

  app.delete('/api/children/:childId', requireAuth, (request, response) => {
    const user = currentUser(response);
    if (user.role !== 'PARENT') {
      response.status(403).json({ message: 'Samo demo roditelj može brisati profile.' });
      return;
    }

    const childId = request.params['childId'];
    if (
      !database.deleteChild(user.id, Array.isArray(childId) ? (childId[0] ?? '') : (childId ?? ''))
    ) {
      response.status(404).json({ message: 'Demo profil nije pronađen.' });
      return;
    }
    response.sendStatus(204);
  });

  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction): void => {
    console.error('Prototype server error', error);
    response.status(500).json({ message: 'Lokalni prototip trenutačno nije dostupan.' });
  });

  return { app, database };
}
