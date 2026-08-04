# Artikulino Development Plan

## 1. Current project understanding

- Angular 21 standalone application with lazy routes, content-driven games, shared session/scoring
  services, and backend-backed local prototype progress.
- Milestones 0–19 are complete and merged into `main`.
- The consolidated Angular, Express, Python, and formatting gate passes through
  `npm run prototype:check`.
- The frontend-only MVP has no confirmed technical blocker, but real-device accessibility,
  microphone, and Croatian voice checks remain documented in `docs/MVP_READINESS.md`.
- The next phase improves the existing local master’s-thesis prototype with reliable persistence,
  varied pronunciation rounds, child-facing text-match rewards, unique catalog artwork, and clearer
  product wording under the boundaries below.

## 2. Main development goal

Continue the localhost-only thesis prototype with two coordinated tracks:

1. make pronunciation practice, persistence, and recording feedback dependable and motivating;
2. finish the approved soft-toy 3D direction with unique artwork and cleaner adult/child wording.

`Podudarnost` measures normalized expected-text versus recognized-text similarity. It is not
pronunciation quality, a clinical score, a diagnosis, or a therapist conclusion. In pronunciation
games only, it may drive proportional game points as a playful text-recognition reward.

## 3. Approved design references

The following concepts define visual direction, hierarchy, component treatment, and responsive
behavior. Visible production copy remains code-native Croatian and sample data in the concepts is
not authoritative.

- `docs/design/catalog-soft-toy-desktop.png`
- `docs/design/catalog-soft-toy-mobile.png`
- `docs/design/gameplay-recording-desktop.png`
- `docs/design/gameplay-recording-mobile.png`
- `docs/design/therapist-review-desktop.png`
- `docs/design/mentor-catalog-desktop.png`
- `docs/design/mentor-catalog-mobile.png`
- `docs/design/mentor-pronunciation-desktop.png`
- `docs/design/mentor-pronunciation-mobile.png`
- `docs/design/mentor-parent-feedback-desktop.png`
- `docs/design/mentor-parent-feedback-mobile.png`
- `docs/design/observation-improvements-concept.png`

The mentor concepts control layout and visual direction only. The pronunciation screen must use
the code-native heading `Poslušaj i izgovori riječ.` or `Poslušaj i izgovori glas.`; sample image
copy and sample content are not authoritative.

## 4. Prioritized roadmap

1. Completed: repository quality gate, content validation, accessibility pass, MVP readiness, and
   microphone state coverage.
2. Completed: revised roadmap, approved design references, soft-toy assets, catalog redesign,
   recording UX, backend foundation, demo login, and demo child profiles.
3. Completed: persist sessions and recording attempts.
4. Completed: local Croatian transcription and text matching.
5. Completed: expand parent progress with transcription and therapist-review details.
6. Completed: add therapist recording review.
7. Completed: run integrated thesis-prototype QA and document the demonstration workflow.
8. Completed: align the game taxonomy and content contract with mentor feedback.
9. Completed: simplify recognition games and add category-aware filters.
10. Completed: add dedicated pronunciation practice.
11. Completed: split parent progress into child activity and therapist feedback.
12. Completed: repeat integrated mentor-feedback QA and publish its evidence.
13. Lock the observation-driven persistence, pronunciation, and visual roadmap.
14. Repair persistence and prevent stale API/frontend contract mismatches.
15. Add varied syllable rounds and proportional pronunciation-game points.
16. Replace repeated catalog artwork and enlarge decorative background elements.
17. Add the approved child-facing result celebration and redesigned completion screen.
18. Run integrated persistence, recording, accessibility, and responsive QA.

## 5. Milestones

### Milestone 5 — Lock the revised roadmap

- Branch: `codex/revise-thesis-prototype-plan`
- Replace the outdated post-MVP roadmap.
- Update `AI_HANDOFF.md` and `README.md` with the thesis-prototype boundary.
- Preserve the five approved concepts in `docs/design/`.
- State explicitly that only fictional/test profiles and recordings may be used.
- Validate with:

```bash
npx prettier DEVELOPMENT_PLAN.md AI_HANDOFF.md README.md --check
git diff --check
```

### Milestone 6 — Soft-toy visual asset pack

- Branch: `codex/soft-toy-theme-assets`
- Generate optimized transparent WebP artwork for food, home, nature, animals, transport, clothing,
  school, and toys.
- Add four restrained decorative edge assets for catalog and gameplay backgrounds.
- Hide or simplify decorative assets on narrow screens.
- Update `docs/MEDIA_PROVENANCE.md`.
- Do not add packaged spoken audio.
- Validate asset dimensions, transparency, file size, narrow-screen behavior, Prettier, and
  `git diff --check`.

### Milestone 7 — Catalog filtering and game-tile redesign

- Branch: `codex/catalog-game-tile-redesign`
- Convert the three game-type introductions into accessible toggle buttons with `aria-pressed`.
- Clicking the selected type again clears the filter.
- Remove the `Igra` select and retain `Glas`, `Tema`, and `Razina`.
- Use consistent type colors:
  - `listen-and-decide`: warm yellow/coral;
  - `catch-the-sound`: mint;
  - `sound-position`: sky blue.
- Give tiles rounded edges, restrained 3D depth, hover/focus lift, pressed state, and
  reduced-motion support.
- Keep only theme artwork, title, and subtitle in the tile body.
- Make the tile body the start-game link.
- Add a separate top-right information button. Click, tap, or keyboard activation opens one
  popover containing target sound/pair, difficulty, and the game-type explanation. Escape, outside
  click, or a second activation closes it.
- Add optional `catalogImage` to `ContentPackage`; update validation and demo packages.
- Add focused tests for toggle filtering, clearing, popover accessibility, card links, and empty
  results.
- Validate at desktop and 390 px widths plus `npm run check` and `git diff --check`.

### Milestone 8 — Recording UX and per-question reset

- Branch: `codex/game-recording-ux`
- Replace the collapsed microphone disclosure with the approved visible recording panel.
- Place it after the prompt/media and before the answers in mobile reading order.
- Keep recording optional and independent from game scoring or progression.
- Pass a required question/reset identifier to the microphone component.
- Clear the current local recording and return to idle whenever the question changes.
- Support idle, permission request, recording, stopped, replay, delete, saving, saved, and retry
  states.
- Emit a typed `RecordedAttempt` containing the blob, MIME type, duration, question ID, and attempt
  number for later backend integration.
- Never show transcript or `podudarnost` on the child gameplay screen.
- Validate component states, question reset, cleanup, keyboard/touch behavior, responsive layout,
  `npm run check`, and `git diff --check`.

### Milestone 9 — Local backend, demo login, and child profiles

- Branch: `codex/prototype-backend-foundation`
- Add a separate TypeScript Node/Express service under `server/` using SQLite.
- Store the database and recordings under ignored `server/runtime/`.
- Seed these fictional demo accounts:
  - `parent@artikulino.test` / `ParentDemo123!`;
  - `therapist@artikulino.test` / `TherapistDemo123!`.
- Hash seeded passwords and issue random eight-hour bearer sessions stored in SQLite. Store the
  browser token in `sessionStorage`.
- Keep home and catalog public. Starting a game requires the parent login and a selected demo
  child. Therapist pages require the therapist role.
- Demo child profiles contain only an ID and display name.
- Therapist accounts may view all demo profiles in this local prototype.
- Add an always-visible notice that the system is a non-production thesis prototype for fictional
  test data only.
- Provide a reset-and-reseed command.
- Validate authentication, roles, profile CRUD, expiry, reset behavior, build, server tests, and
  `git diff --check`.

### Milestone 10 — Session and recording persistence

- Branch: `codex/prototype-session-recordings`
- Add SQLite tables for users, authentication sessions, demo children, game sessions, recording
  attempts, and therapist reviews.
- Save game sessions under the selected demo child.
- Upload every stopped recording as multipart audio; preserve multiple attempts per question.
- Limit recordings to 15 seconds and 10 MB. Reject empty or unsupported files with Croatian error
  text.
- Store audio on local disk and metadata in SQLite.
- Keep uploads asynchronous and independent from points or question progression.
- If upload fails, retain the local recording long enough to retry or delete it.
- Deleting a session or profile must cascade through database records and physical audio files.
- The reset command clears runtime data and reseeds demo accounts.
- Do not migrate existing `localStorage` progress. Authenticated progress reads the backend; its
  delete action also clears the old local key.
- Validate upload limits, multiple attempts, failure/retry, deletion, filesystem cleanup, and role
  restrictions.

### Milestone 11 — Local Croatian transcription and podudarnost

- Branch: `codex/local-croatian-transcription`
- Add a local Python FastAPI worker under `transcription/`.
- Use `faster-whisper` with model `small`, language `hr`, CPU device, and `int8` compute. Permit an
  environment override.
- Document Python 3.11/3.12, FFmpeg, virtual-environment setup, and initial model download.
- The browser never calls the worker directly. Express submits stored demo audio to localhost.
- Process one transcription at a time on the CPU-only development machine.
- Track attempts as `PENDING`, `COMPLETED`, or `FAILED`. Failure must not remove audio or invalidate
  the game session.
- Calculate integer `podudarnost` using normalized Levenshtein similarity:
  - lowercase;
  - trim and collapse whitespace;
  - remove punctuation;
  - preserve Croatian diacritics;
  - exact match is 100;
  - an empty transcript is 0.
- Store expected text, transcript, percentage, and transcription status.
- Label the value `Podudarnost teksta`, never an error or pronunciation score.
- Validate normalization, similarity, queue behavior, worker failures, model-health reporting, and
  a fictional adult-generated Croatian smoke sample.

### Milestone 12 — Parent progress and privacy update

- Branch: `codex/parent-prototype-progress`
- Load progress for the active demo child from the backend.
- Show sessions and attempts with expected text, transcript, `podudarnost`, transcription state,
  playback, therapist review state, and the full therapist comment.
- Keep automated results adult-facing.
- Replace the MVP privacy strip with concise prototype wording:
  - results and recordings are stored on the local demonstration server;
  - only fictional test data may be used;
  - data can be deleted.
- Provide session deletion and profile/data deletion with confirmation.
- Validate empty, loading, success, partial transcription, error, feedback, and deletion states.

### Milestone 13 — Therapist review interface

- Branch: `codex/therapist-recording-review`
- Add `/pregled-terapeuta`, guarded by therapist role.
- Implement the approved calm master-detail view for demo children, completed sessions, and all
  attempts.
- Stream audio through an authenticated endpoint without exposing filesystem paths.
- Support `NOT_REVIEWED`, `LOOKS_GOOD`, and `PRACTICE_AGAIN`.
- Allow an optional therapist comment up to 400 characters and store reviewer/timestamp.
- Show the complete saved review to the parent.
- Do not add exports, downloads, settings, age data, analytics, or clinical conclusions.
- Validate authorization, playback, all review states, comment limits, persistence, parent
  visibility, responsive layout, and accessibility.

### Milestone 14 — Integrated thesis-prototype QA

- Branch: `codex/thesis-prototype-qa`
- Add one repeatable quality command covering Angular, Express, and Python tests.
- Verify the complete parent flow:
  login → child profile → game → multiple recordings → completion → progress.
- Verify the complete therapist flow:
  login → session → playback → transcript/match → rating/comment → parent visibility.
- Verify unavailable ASR, failed ASR, denied microphone, invalid audio, deletion, expired login,
  and role restrictions.
- Perform visual fidelity checks against the approved concepts at 1440 × 1000 and 390 × 844.
- Use fictional adult-generated Croatian recordings only.
- Document IntelliJ run configurations for Angular, Express, and the Python worker.
- Update the handoff with credentials, reset procedure, limitations, and final validation results.

### Milestone 15 — Mentor-aligned content model

- Branch: `codex/mentor-content-model`
- Add `pronunciation-practice` as the fourth game type.
- Add explicit `DETECT`/`DISCRIMINATE` recognition modes and `SOUND`/`WORD` pronunciation modes.
- Allow packages that do not practise a sound to omit target-sound metadata.
- Validate binary answer counts, detection answers, discrimination pairs, pronunciation prompts,
  sound occurrences, and professional-review status.
- Remove misleading sound metadata from listening packages and minimally migrate demo content so
  the stricter contract passes.
- Preserve the approved mentor-feedback concepts in `docs/design/`.
- Validate with `npm run prototype:check` and `git diff --check`.

### Milestone 16 — Recognition-game cleanup and dynamic filters

- Branch: `codex/mentor-recognition-cleanup`
- Remove recording controls from the three recognition categories.
- Keep binary games to two meaningful answers; retain three positions only where required.
- Add category-aware catalog filters and a `Vrsta vježbe` filter for detection versus
  discrimination.
- Validate gameplay, filtering, accessibility, and responsive layouts.

### Milestone 17 — Dedicated pronunciation practice

- Branch: `codex/pronunciation-practice-games`
- Status: complete and merged through pull request #24.
- Add data-driven sound and whole-word practice for R, L, S, Z, Š, Ž, C, Č, and Ć.
- Require one local recording per round while providing a safe exit after microphone failure.
- Keep isolated-sound feedback to recording/replay success; use non-numeric text-recognition
  feedback for whole words.
- Add compatible backend persistence and transcription states without clinical claims.

### Milestone 18 — Parent progress sections

- Branch: `codex/parent-progress-sections`
- Status: complete and merged through pull request #25.
- Split `/napredak` into `Napredak djeteta` and `Feedback terapeuta`.
- Show only attempts with saved therapist feedback in the therapist-feedback section.
- Preserve historical recordings created before the recognition-game cleanup.

### Milestone 19 — Mentor-feedback integrated QA

- Branch: `codex/mentor-feedback-qa`
- Status: complete and merged through pull request #26.
- Verify the corrected content matrix, all four game types, recording boundaries, failure states,
  parent views, therapist visibility, migrations, accessibility, and responsive layouts.
- Update README, IntelliJ instructions, QA evidence, and this handoff.

### Milestone 20 — Lock the observation-driven roadmap

- Branch: `codex/observation-improvement-roadmap`
- Update this roadmap and `AI_HANDOFF.md`.
- Preserve the approved result, completion, and catalog concept in `docs/design/`.
- Record that `Podudarnost teksta` may produce proportional points only in pronunciation games
  without becoming a pronunciation or clinical score.
- Keep this milestone documentation-only.
- Validate with:

```bash
npx prettier DEVELOPMENT_PLAN.md AI_HANDOFF.md --check
git diff --check
```

### Milestone 21 — Persistence recovery and API compatibility

- Branch: `codex/persistence-contract-guard`
- Status: merged through pull request #28.
- Restart Express in watch mode without resetting or deleting runtime data.
- Add an API contract version and supported game types to `GET /api/health`.
- Add parent-owned `GET /api/attempts/:id` status polling without exposing storage paths.
- Detect stale or incompatible API processes in Angular and show an actionable Croatian restart
  message.
- Verify a new pronunciation session, recording, completion, and progress entry.
- Update local and IntelliJ instructions to use `npm run server:dev` during development.
- Validate with `npm --prefix server test`, `npm run test:ci`, `npm run prototype:check`, and
  `git diff --check`.

### Milestone 22 — Varied pronunciation rounds and proportional scoring

- Branch: `codex/pronunciation-round-scoring`
- Status: implemented and validated on the milestone branch; review is pending.
- Replace repeated isolated sounds with four syllables using A/E/I/O:
  - R: RA, RE, RI, RO;
  - L: LA, LE, LI, LO;
  - S, Z, Š, Ž, C, Č, and Ć follow the same pattern.
- Keep whole-word pronunciation games unchanged.
- Poll a saved attempt once per second for up to 30 seconds.
- Calculate points with `round(basePoints × textMatch / 100)`.
- Preserve every retry, count only the best attempt per question, and never reduce earned points.
- Let the child retry or continue with zero points when transcription fails or times out.
- Add a typed `PracticeRoundResult` for attempt status, percentage, and round/best points.
- Validate focused content/session tests, `npm run prototype:check`, and `git diff --check`.

### Milestone 23 — Unique artwork and larger decorations

- Branch: `codex/unique-game-artwork`
- Generate one distinct optimized WebP illustration for every game.
- Assign artwork by package rather than sharing one image per theme.
- Replace the pronunciation category symbol with an unmistakable code-native lips SVG.
- Increase desktop side decorations by about 50 percent while keeping them behind content.
- Hide or simplify decorations on narrow screens.
- Update media provenance and test unique image paths, alt text, and missing assets.
- Validate with `npm run check`, focused image/content tests, desktop/mobile visual review, and
  `git diff --check`.

### Milestone 24 — Pronunciation celebration and completion UX

- Branch: `codex/pronunciation-celebration-ui`
- Show an accessible centered modal while transcription is pending and after every result.
- Show `Podudarnost teksta`, percentage, best round points, encouraging copy, retry, and continue.
- Preserve recordings and allow continuation when the result is unavailable.
- Use brief confetti and character reactions without sound and with reduced-motion support.
- Redesign completion around total points, average best match, recording count, and the existing
  navigation actions.
- Remove visible `demo`, `prototip`, `paket`, and `testne snimke` product wording and the global
  warning banner.
- Retain one concise adult-only local-storage/privacy notice and non-clinical explanations.
- Keep internal model names such as `ContentPackage` and `DemoUser`.
- Exclude pronunciation sessions from recognition accuracy summaries.
- Validate component/accessibility tests, `npm run prototype:check`, 1440 × 1000 and 390 × 844
  browser checks, and `git diff --check`.

### Milestone 25 — Observation-driven integrated QA

- Branch: `codex/observation-improvement-qa`
- Verify login → child → pronunciation → retry → score → completion → progress.
- Confirm new sessions and recordings remain after service restarts without resetting runtime data.
- Recheck therapist playback and review, stale API detection, unavailable/failed transcription,
  denied microphone, deletion, retry scoring, and mobile layouts.
- Use only fictional profiles and fictional/adult-generated Croatian recordings.
- Update README, QA evidence, and this handoff.
- Validate with `npm run prototype:check`, `git diff --check`, and documented live browser and
  microphone checks.

## 6. Interfaces and API

Frontend contracts should include:

- `DemoUser`;
- `DemoChildProfile`;
- `PrototypeGameSession`;
- `RecordedAttempt`;
- `RecordingAttempt`;
- `TranscriptionStatus`;
- `TherapistReviewStatus`;
- `TherapistReview`.

Minimum local API:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET|POST|DELETE /api/children`
- `GET|POST|DELETE /api/sessions`
- `POST /api/sessions/:id/complete`
- `POST /api/sessions/:id/attempts`
- `GET /api/attempts/:id`
- `DELETE /api/attempts/:id`
- `GET /api/attempts/:id/audio`
- `GET /api/therapist/sessions`
- `GET /api/therapist/sessions/:id`
- `PUT /api/attempts/:id/review`
- `GET /api/health`

Recording upload receives question ID, attempt number, expected text, MIME type, and audio. API
responses must never expose physical audio paths.

## 7. Validation strategy

The complete prototype gate is:

```bash
npm run prototype:check
git diff --check
```

Detailed automated, integrated, visual, and remaining human-device checks are recorded in
`docs/THESIS_PROTOTYPE_QA.md`.

## 8. Explicit boundaries

- Localhost demonstration only; no public deployment or production-security claim.
- Use only fictional profiles and fictional/adult-generated recordings.
- No diagnosis, phoneme-level error detection, clinical scoring, or automated therapist conclusion.
- `Podudarnost` may affect only pronunciation-game points through the documented proportional
  formula. It must never be presented as pronunciation quality or a clinical result.
- No external ASR provider or cloud storage.
- No packaged WAV prompts, analytics, email, password recovery, exports, downloads, medical data,
  or account administration.
- Runtime databases, session tokens, models, and recordings remain Git-ignored.
- Preserve Angular standalone components, lazy routes, content packages, and shared game
  session/scoring services.

## 9. Risks

- Python 3.11 is installed and the isolated worker environment is verified. Standalone FFmpeg is
  not installed; bundled PyAV/FFmpeg libraries handle supported prototype audio while standalone
  FFmpeg remains useful for diagnostics.
- CPU-only `small` Whisper inference may be slow; recordings remain short and transcription is
  serialized.
- Short Croatian syllables may be less reliable than whole words in Whisper. The child flow must
  time out safely and allow continuation without a score.
- Long-lived non-watch Express processes can become incompatible with a hot-reloaded frontend.
  Contract-version checks must make that mismatch explicit.
- Generated visual assets need consistent art direction, transparency validation, optimization,
  and provenance.
- A transcript match does not establish articulation quality.
- Prototype credentials and local storage are intentionally unsuitable for production.

## 10. Things to avoid

- Do not merge `codex/priority-food-audio`.
- Do not use real children’s names, profiles, or recordings.
- Do not send recordings outside localhost.
- Do not expose database paths, recording paths, passwords, or session tokens in UI or logs.
- Do not let recording, transcription, or therapist feedback change recognition-game scoring.
- Do not let therapist feedback change any game score.
- Do not begin a later milestone before its dependency is merged and validated.
