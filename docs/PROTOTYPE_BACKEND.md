# Local Thesis Prototype Backend

## Boundary

The service under `server/` is a localhost-only demonstration backend for fictional test data. It
is not a production identity system, a medical record, or a public deployment target. Do not enter
real children’s names, recordings, ages, health information, or credentials.

The backend stores predefined demo users, hashed bearer sessions, fictional display-name-only child
profiles, game sessions, and recording attempts. It does not yet transcribe audio or provide
therapist review workflows.

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

## Runtime storage and limits

- SQLite database: `server/runtime/artikulino.sqlite`
- Recording files: `server/runtime/recordings/`
- Maximum recording duration: 15 seconds
- Maximum recording size: 10 MB
- Accepted formats: WebM, Ogg, MP4/M4A, WAV

The entire `server/runtime/` directory is Git-ignored. Database responses expose recording metadata
and authenticated audio endpoints, never physical filesystem paths. Multer is the only new runtime
dependency; it provides bounded multipart parsing for MediaRecorder uploads.

Every stopped recording is an independent attempt. Uploading is asynchronous and never changes
game scoring or progression. Session, attempt, and child-profile deletion removes both database
records and associated audio files.

## API

- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/children`
- `POST /api/children` (parent only)
- `DELETE /api/children/:childId` (own parent profile only)
- `GET /api/sessions?childId=:childId` (own parent profile only)
- `POST /api/sessions` (parent only)
- `POST /api/sessions/:sessionId/complete` (own parent session only)
- `DELETE /api/sessions/:sessionId` (own parent session only)
- `POST /api/sessions/:sessionId/attempts` (multipart, own parent session only)
- `GET /api/attempts/:attemptId/audio` (authenticated owner or therapist)
- `DELETE /api/attempts/:attemptId` (own parent attempt only)

Therapists can read fictional profiles and authenticated audio, but Milestone 13 will add their
session-review API and interface. They cannot mutate parent sessions or recordings.

## Reset

Reset the database, remove every runtime recording, invalidate bearer sessions, and restore the two
accounts plus fictional Luka and Mia profiles with:

```bash
npm run prototype:reset
```

## Validation

```bash
npm --prefix server run check
npm run check
git diff --check
```
