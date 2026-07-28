# Local Thesis Prototype Backend

## Boundary

The service under `server/` is a localhost-only demonstration backend for fictional test data. It
is not a production identity system, a medical record, or a public deployment target. Do not enter
real children’s names, recordings, ages, health information, or credentials.

Milestone 9 stores only:

- two predefined demo users;
- hashed demo passwords;
- hashed eight-hour bearer sessions;
- fictional child profile IDs and display names.

Game sessions, recording files, transcription, and therapist reviews are not stored yet.

## Setup

```bash
npm install
npm --prefix server install
```

Run the API and Angular app in separate terminals:

```bash
npm run server:start
npm start
```

The API listens on `http://localhost:3000`. Angular listens on `http://localhost:4200` and proxies
`/api` requests through `proxy.conf.json`.

## Demo credentials

- Parent: `parent@artikulino.test` / `ParentDemo123!`
- Therapist: `therapist@artikulino.test` / `TherapistDemo123!`

Passwords are salted and hashed with Node’s scrypt implementation. Login returns a random bearer
token valid for eight hours; only its SHA-256 hash is stored in SQLite. Angular keeps the raw token
in `sessionStorage`, so closing the browser session removes the client copy.

## API in this milestone

- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/children`
- `POST /api/children` (parent only)
- `DELETE /api/children/:childId` (own parent profile only)

Therapists can read all fictional profiles but cannot create or delete them. Home and catalog are
public; the game-player route requires a parent session and an active demo child.

## Runtime and reset

The database is `server/runtime/artikulino.sqlite`. The entire `server/runtime/` directory is
Git-ignored. Reset the database and restore the two accounts plus the fictional Luka and Mia
profiles with:

```bash
npm run prototype:reset
```

Reset invalidates every existing bearer session.

## Validation

```bash
npm --prefix server run check
npm run check
git diff --check
```
