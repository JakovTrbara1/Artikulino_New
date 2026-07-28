import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createPrototypeApp } from '../src/app.js';
import { PrototypeDatabase } from '../src/database.js';

describe('prototype API', () => {
  let directory: string;
  let database: PrototypeDatabase;
  let app: ReturnType<typeof createPrototypeApp>['app'];

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'artikulino-server-'));
    const prototype = createPrototypeApp({ databaseFile: join(directory, 'test.sqlite') });
    app = prototype.app;
    database = prototype.database;
  });

  afterEach(() => {
    database.close();
    rmSync(directory, { recursive: true, force: true });
  });

  function login(email = 'parent@artikulino.test', password = 'ParentDemo123!') {
    return request(app).post('/api/auth/login').send({ email, password });
  }

  it('reports local prototype health', async () => {
    const response = await request(app).get('/api/health').expect(200);
    expect(response.body).toEqual({ status: 'ok', mode: 'LOCAL_THESIS_PROTOTYPE' });
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
    });
    database = expired.database;
    app = expired.app;
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
});
