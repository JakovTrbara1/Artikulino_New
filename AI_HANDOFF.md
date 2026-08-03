# AI Handoff

## Project Purpose

Artikulino is an Angular application for kid-friendly speech and articulation practice for
preschool and school-age children. The completed frontend-only MVP supports gamified exercises and
the current localhost thesis prototype adds fictional profiles, retained sessions, recordings, and
backend progress. The approved next phase continues this master’s-thesis prototype using
fictional profiles and recordings. The app remains a practice and research prototype only; it does
not diagnose, clinically evaluate speech, or replace a speech therapist.

## Current Tech Stack

- Angular 21.2 with standalone components
- Angular Router with lazy-loaded feature routes
- TypeScript 5.9, strict Angular project defaults
- CSS in component styles plus shared global tokens in `src/main.css`
- Vitest through Angular unit-test builder
- Browser APIs: Speech Synthesis, MediaRecorder, `localStorage`
- Separate TypeScript Express 5 service under `server/`
- SQLite through `better-sqlite3`; password hashing and bearer-token generation through Node crypto
- Python 3.11 FastAPI worker with `faster-whisper` 1.2, local Croatian transcription, CPU, and
  `int8`
- npm, Node.js 20.19+ or newer LTS

## Install, Run, Build, Test

```bash
npm install
npm --prefix server install
py -3.11 -m venv transcription/.venv
.\transcription\.venv\Scripts\python.exe -m pip install -r transcription/requirements-dev.txt
npm run transcription:start
npm run server:start
npm start
npm run build
npm test
npm run test:ci
npm run check
npm --prefix server run check
npm run transcription:test
npm run prototype:check
npm run prototype:reset
```

The Angular dev server is expected at `http://localhost:4200`; its `/api` requests proxy to the
local prototype server at `http://localhost:3000`. Express calls the local transcription worker at
`http://127.0.0.1:8000`. Run all three services in separate terminals.

`npm run prototype:check` is the complete thesis-prototype quality gate. It runs the Angular
production build and tests, Prettier, the Express build and tests, and the Python worker tests.
`npm run check` remains the frontend-only gate. `npm test` remains available for development,
while `npm run test:ci` always runs once and exits.

ESLint is intentionally deferred for the MVP. The current quality gate uses the Angular compiler,
Vitest, and Prettier without adding another dependency. Prettier can also be run directly with:

```bash
npx prettier . --check
```

## Current Repository State

- Current implementation branch: `codex/mentor-feedback-qa`
- Remote: `origin` -> `https://github.com/JakovTrbara1/Artikulino_New.git`
- Base: `origin/main` at merge commit `e31b920`
- Milestone 18 is merged through pull request #25.
- No `.env` or example environment config files were present.

## Main Implemented Features

- Home page at `/` with a short path into exercises.
- Game catalog at `/igre` with accessible game-type toggles and category-aware filters:
  - all games: sound, theme, and difficulty;
  - `listen-and-decide`: theme and difficulty;
  - `catch-the-sound`: sound, detection/discrimination mode, and difficulty;
  - `sound-position`: sound and difficulty;
  - `pronunciation-practice`: sound, isolated-sound/whole-word mode, and difficulty.
- Game player at `/igre/:packageId`.
- Parent/progress page at `/napredak`, split into child-progress and therapist-feedback sections.
- Therapist review page at `/pregled-terapeuta`, protected by the therapist role.
- Shared header with logo and navigation.
- Four currently playable configurable games:
  - `listen-and-decide`: category decision from heard word/sentence.
  - `catch-the-sound`: detect whether a word contains a target sound.
  - `sound-position`: identify beginning, middle, or end of a word using a train UI.
  - `pronunciation-practice`: listen, record, replay, retry, and continue through isolated-sound or
    whole-word rounds without child-facing automated scores.
- Pronunciation content includes `SOUND` and `WORD` packages for R, L, S, Z, Š, Ž, C, Č, and Ć.
- `catch-the-sound` packages explicitly declare `DETECT` or `DISCRIMINATE`; listening packages no
  longer claim a target sound that they do not practise.
- Shared game session flow: play/listen, replay, answer, feedback, scoring, next question, final result.
- Configurable scoring per content package.
- Backend-backed progress for the active fictional demo profile. The legacy local progress service
  remains only to clear the old non-migrated browser key during deletion.
- The `Napredak djeteta` section keeps every historical backend session and recording attempt,
  including expected text, transcript state, `Podudarnost teksta`, authenticated playback, and
  therapist-review state/comment. `Feedback terapeuta` groups only attempts from completed sessions
  with a saved therapist review. Automated details never appear in child gameplay.
- Therapist review lists completed sessions for fictional demo profiles, streams recordings
  through the authenticated API, and stores one of three review states plus an optional
  400-character comment, reviewer, and timestamp.
- The three recognition categories do not show recording controls. The dedicated pronunciation
  board requires listening before recording, resets for each question, preserves typed
  `RecordedAttempt` uploads, and provides a safe continuation only after microphone failure.
- Browser Speech Synthesis as the supported MVP path for spoken prompts when no approved local
  recording is available.
- Demo content packages for required sounds, pairs, themes, and difficulty levels.
- Reusable test-time content validation with stable issue codes, paths, and Croatian messages.
- Explicit professional-review metadata; all current demo packages are marked `NOT_REVIEWED`.
- Four optimized local food illustrations in the priority “Što jedemo?” package, with retained
  emoji fallbacks and documented provenance.
- Eight optimized transparent soft-toy theme illustrations mapped to demo packages through
  `catalogImage`, plus four restrained catalog/gameplay edge decorations.
- Rounded game cards use consistent type colors, theme artwork, gentle hover/focus depth, and a
  separate accessible information popover.
- Provider-neutral `SPEECH_TRANSCRIPTION` boundary with a default disabled adapter, no network
  transfer, and no pronunciation scoring.
- Local Express/SQLite prototype foundation with hashed demo passwords, hashed eight-hour bearer
  sessions, parent/therapist roles, and fictional display-name-only child profiles.
- Backend game sessions are stored under the active demo child. Multiple multipart recording
  attempts per question are retained as SQLite metadata plus local files, limited to 15 seconds
  and 10 MB.
- Express queues stored recording attempts one at a time for the localhost FastAPI worker. Attempts
  retain `PENDING`, `COMPLETED`, or `FAILED` state plus an optional transcript and integer
  `Podudarnost teksta`.
- The worker lazily loads `faster-whisper` `small` by default with Croatian language, CPU, and
  `int8`; `ARTIKULINO_WHISPER_MODEL` can select a lighter local development model.
- Transcript matching lowercases, removes punctuation, collapses whitespace, preserves Croatian
  diacritics, and uses normalized Levenshtein similarity. It never affects points or appears as a
  pronunciation or clinical score.
- Recording upload failures retain the browser-local recording for retry or deletion. Uploading
  never changes points or blocks question progression.
- Parent session, attempt, and profile deletion cascades through SQLite and physical audio files.
  Progress provides confirmed session deletion and confirmed active-profile/data deletion; both
  also clear the legacy browser key. The reset command removes runtime recordings before reseeding.
- Demo login at `/prijava` and profile selection at `/profili`. Home and catalog remain public;
  entering a game requires the parent role and an active demo child.
- The Angular client stores the demo bearer token and selected fictional profile in
  `sessionStorage`; logout and expired API responses clear both.
- A global notice labels every page as a non-production thesis prototype for fictional test data
  only.
- Documented privacy, consent, retention, account, vendor, and security requirements that must be
  approved before any external speech processing.
- Accessible answer groups and selected states, semantic progress reporting, and focus transitions
  between questions and the result screen.
- Responsive train visual assets for the sound-position game.

## Important Folders and Files

- `src/app/app.routes.ts`: top-level lazy routes.
- `src/app/core/layout/`: shared app layout/header.
- `src/app/core/services/speech-transcription.service.ts`: disabled-by-default future ASR boundary.
- `src/app/core/services/prototype-auth.service.ts`: demo auth/profile API client and
  `sessionStorage` boundary.
- `src/app/core/guards/prototype-auth.guards.ts`: authenticated, parent-game, and therapist role
  guards.
- `src/app/shared/`: shared components and services.
- `src/app/features/home/`: home page.
- `src/app/features/games/games.routes.ts`: lazy game routes.
- `src/app/features/games/models/content-package.model.ts`: content package contract.
- `src/app/features/games/models/content-package.validation.ts`: pure content validation utility.
- `src/app/features/games/data/demo-content-packages.ts`: demo packages.
- `src/app/features/games/services/game-session.service.ts`: shared session state and game flow.
- `src/app/features/games/services/scoring.service.ts`: scoring rules.
- `src/app/features/games/pages/`: catalog and player pages.
- `src/app/features/games/components/`: game board renderers plus catalog card and type-filter
  components.
- `src/app/features/progress/`: backend-backed parent session view with child-progress and
  therapist-feedback sections.
- `src/app/features/therapist/`: therapist-only completed-session and recording-review interface.
- `src/main.css`: global styles, tokens, colors, typography, reset.
- `server/`: separate Express/SQLite service, API tests, seed/reset workflow, and ignored runtime
  database.
- `docs/PROTOTYPE_BACKEND.md`: local service setup, API, storage, and security boundaries.
- `public/assets/games/`: generated game assets.
- `public/assets/games/themes/`: transparent soft-toy artwork for all eight supported themes.
- `public/assets/games/decorations/`: decorative catalog/gameplay edge artwork.
- `docs/CONTENT_PACKAGES.md`: guide for adding new packages.
- `docs/MEDIA_PROVENANCE.md`: source and processing log for project media.
- `docs/ASR_BOUNDARY.md`: privacy and architecture gates for any future ASR adapter.
- `docs/PRIVACY_AND_CONSENT.md`: data inventory, required decisions, and ASR release checklist.
- `docs/MVP_READINESS.md`: dated MVP smoke-test results and remaining human-device checks.
- `docs/INTELLIJ_RUN_CONFIGURATIONS.md`: exact three-service IntelliJ IDEA setup.
- `docs/THESIS_PROTOTYPE_QA.md`: final automated, integrated, responsive, and human-check record.
- `DEVELOPMENT_PLAN.md`: approved thesis-prototype roadmap and milestone boundaries.
- `docs/design/artikulino-game-concept.png`: visual concept reference.
- `docs/design/catalog-soft-toy-desktop.png`: approved desktop catalog direction.
- `docs/design/catalog-soft-toy-mobile.png`: approved mobile catalog direction.
- `docs/design/gameplay-recording-desktop.png`: approved desktop gameplay/recording direction.
- `docs/design/gameplay-recording-mobile.png`: approved mobile gameplay/recording direction.
- `docs/design/therapist-review-desktop.png`: approved therapist-review direction.
- `docs/design/mentor-catalog-desktop.png` and `mentor-catalog-mobile.png`: four-category catalog
  direction.
- `docs/design/mentor-pronunciation-desktop.png` and `mentor-pronunciation-mobile.png`: dedicated
  listen-record-retry direction. Sample copy is non-authoritative; production headings are
  `Poslušaj i izgovori riječ.` or `Poslušaj i izgovori glas.`
- `docs/design/mentor-parent-feedback-desktop.png` and `mentor-parent-feedback-mobile.png`: split
  parent progress and therapist-feedback direction.

## Architecture Overview

The game engine is content-driven. Games should not be hard-coded for one sound, one theme, or one fixed question set. A `ContentPackage` defines the game type, target sound, optional contrast sound, sound pair, theme, difficulty, optional catalog artwork, questions, media, answer options, correct answers, explanation, and scoring.

`GamePlayerPage` selects a package by route id and delegates answer UI to the correct board
component. Shared services handle session state, scoring, replay counts, attempts, streaks, and
completion. The page starts and completes a backend session without blocking game progression;
authenticated parent progress reads those sessions for the active fictional profile.

`validateContentPackages` provides a pure content-authoring and test gate for identifiers, required
fields, answers, sounds, sound pairs, scoring, image descriptions, target-sound occurrences, and
professional-review metadata. It reports all issues without mutating packages or changing runtime
game behavior.

Pages are standalone and lazy-loaded. Component-specific visual rules stay with components, while common design tokens and app-wide defaults stay in `src/main.css`.

## Key Design Decisions

- Keep the app frontend-only for the MVP.
- Keep all exercises configurable through content packages.
- Use browser Speech Synthesis for MVP spoken prompts. Packaged recordings remain optional and are
  deferred until their distribution rights and Croatian pronunciation are confirmed.
- Use the microphone only for child self-listening practice in the MVP.
- Do not make clinical claims or automatic pronunciation judgments.
- Keep progress local until privacy, accounts, consent, and backend requirements are defined.
- Keep recordings outside ASR by default; a provider adapter may be injected only after privacy and
  consent requirements are approved.
- For the approved thesis-prototype phase only, a local Express/SQLite service and local
  faster-whisper worker may process fictional/adult-generated recordings on localhost.
- Label normalized expected-text versus transcript similarity only as `Podudarnost teksta`. It must
  not affect points or be presented as pronunciation quality, an error score, or a clinical result.
- The thesis prototype may use predefined demo parent/therapist credentials and fictional child
  display names. It must not claim production security or accept real children’s data.
- Demo passwords are hashed with scrypt. Random bearer tokens last eight hours, are hashed in
  SQLite, and are stored by Angular only in `sessionStorage`.
- Prefer small, explicit services over a global state library.
- Preserve Croatian UI/content wording.
- Keep the interface visually friendly for children while the progress page remains clearer and calmer for adults.

## Milestone 13 Validation

- `npm run check`: production build, 20 frontend test files / 75 tests, and Prettier passed.
- `npm --prefix server run check`: TypeScript build and 20 API/database tests passed.
- `npm run transcription:test`: 5 Python worker tests passed.
- Live localhost verification covered therapist login, completed-session selection, authenticated
  audio loading, saving `LOOKS_GOOD` with a full comment, and parent visibility of that review.
- The therapist view matched the approved calm master-detail direction at 1440×1000 and remained
  usable without horizontal overflow at 390×844. No browser console warnings or errors were
  observed.

## Milestone 14 Validation

- `npm run prototype:check` passed: 20 frontend files / 75 tests, 3 server files / 21 tests, and
  5 Python worker tests (101 tests total), plus the production build and Prettier.
- A new integrated API workflow covers both demo roles, a completed session, multiple attempts,
  transcription, text matching, protected playback, therapist feedback, parent visibility, and
  database/filesystem deletion.
- Live Angular verification covered parent login, child selection, a complete 4/4 game, saved
  progress, therapist review and comment, and parent visibility of the saved review.
- Catalog, gameplay, and therapist layouts were checked at 1440×1000 and 390×844 without
  horizontal overflow. Detailed evidence and remaining physical-device checks are in
  `docs/THESIS_PROTOTYPE_QA.md`.

## Milestone 15 Validation

- `npm run prototype:check` passed: 20 frontend files / 82 tests, 3 server files / 22 tests, and
  5 Python worker tests (109 tests total), plus the production build and Prettier.
- Reusable validation now covers game-specific modes, binary answer counts, detection answers,
  discrimination pairs, pronunciation contracts, target occurrences, and professional-review
  metadata.
- Listening packages no longer expose unrelated target sounds; the local API accepts those
  sessions without inventing sound metadata.

## Milestone 16 Validation

- `npm run prototype:check` passed: 20 frontend files / 84 tests, 3 server files / 22 tests, and
  5 Python worker tests (111 tests total), plus the production build and Prettier.
- `git diff --check` passed.
- Recognition gameplay tests confirm that listening, sound-recognition, and sound-position
  packages no longer render the microphone practice component.
- Catalog tests cover category-specific filter visibility and both recognition modes.
- They also cover clearing incompatible filters when the category changes.
- Live browser QA passed at 1440×1000 and 390×844: the catalog toggles and dynamic filters work,
  all 16 packages return after deselection, the mobile layout has no horizontal overflow, and
  the browser console remains clear.
- Visual comparison against the approved catalog concepts found no material Milestone 16
  mismatch. The fourth pronunciation category is intentionally deferred until Milestone 17 has
  playable packages.

## Milestone 17 Validation

- `npm run prototype:check` passed: 20 frontend files / 90 tests, 3 server files / 24 tests, and
  5 Python worker tests (119 tests total), plus the production builds and Prettier.
- Frontend tests cover all 18 pronunciation packages, catalog filtering, no-points session
  behavior, the listen-before-recording gate, per-question recording reset, and safe continuation
  after microphone denial.
- The local API accepts `pronunciation-practice` sessions and keeps their recording attempts
  compatible with the existing persistence and transcription pipeline. A migration test verifies
  that the pre-Milestone-17 SQLite game-session table is upgraded without resetting runtime data.
- Live Browser QA passed at 1440×1000 and 390×844 with no horizontal overflow, framework overlay,
  or console warning/error. The fourth catalog toggle returns 18 packages and the pronunciation
  player disables recording until the example is played.
- The isolated-sound and whole-word screens use the required code-native Croatian headings and do
  not render answer controls, points, accuracy, or child-facing automated percentages.
- Actual microphone permission, recording, replay, retry, and audible Croatian prompt quality
  remain human checks on the target device because browser permission was not granted during
  automated QA.

## Milestone 18 Validation

- `npm run prototype:check` passed: 20 frontend files / 93 tests, 3 server files / 24 tests, and
  5 Python worker tests (122 tests total), plus the production builds and Prettier.
- `git diff --check` passed.
- Focused parent-progress tests cover section selection, arrow-key tab navigation, saved-review
  filtering, and retention of historical attempts in the child-progress section.
- The therapist-feedback section is read-only and reuses authenticated playback without changing
  the session, recording, transcription, or review persistence contracts.
- Live Browser QA passed at 1440×1000 and 390×844 with no horizontal overflow or browser-console
  warning/error. The local demo data confirmed that only six reviewed attempts appeared in
  `Feedback terapeuta`, while older recognition-game recordings remained available in the
  child-progress section.
- Visual comparison against the approved parent-feedback concepts found no material Milestone 18
  mismatch. The existing prototype notice/header and additional adult-facing transcript metadata
  are intentional retained elements.

## Milestone 19 Validation

- `npm run prototype:check` passed: 20 frontend files / 93 tests, 3 server files / 24 tests, and
  5 Python worker tests (122 tests total), plus the production builds and Prettier.
- `git diff --check` passed.
- The final acceptance matrix covers the corrected content contract, all four game categories,
  category-aware filters, recognition/pronunciation recording boundaries, failure states,
  migrations, parent sections, therapist visibility, and role restrictions.
- Live Browser QA passed at 1440×1000 and 390×844 without horizontal overflow, framework overlay,
  or browser-console warning/error.
- Recognition gameplay exposes two meaningful answers and no recording control. Pronunciation
  unlocks recording only after listening and does not show child-facing transcript, percentage,
  points, or automated pronunciation quality.
- Visual comparison against the approved catalog, pronunciation, parent-feedback, and therapist
  concepts found no material mismatch. Automated praise and text-match results from the generated
  pronunciation concept remain intentionally excluded from child gameplay.
- Full evidence and the remaining real-device checks are documented in
  `docs/THESIS_PROTOTYPE_QA.md`.

## Known Bugs, Risks, and Unfinished Work

- Local recording persistence, Croatian transcription, expanded parent progress, therapist review,
  and integrated cross-service/failure-path QA are implemented.
- No external ASR provider or automatic articulation error detection is implemented. The original
  browser transcription port remains disabled; Express alone calls the localhost worker.
- No approved controller, legal basis, guardian verification, ASR provider, exact provider
  retention, or consent flow. Requirements are documented, but all release gates remain open.
- Demo content is explicitly marked `NOT_REVIEWED` and has not been professionally reviewed by a
  Croatian speech therapist.
- Speech Synthesis voice quality varies by browser and OS.
- The MVP readiness pass found no confirmed technical blocker. Real keyboard activation,
  microphone permission/recording, Croatian voice quality, and screen-reader behavior still need
  human verification on target devices.
- The experimental `codex/priority-food-audio` branch contains unreviewed Windows OneCore-generated
  WAV files and must not be merged. Packaged audio is deferred and does not block the MVP.
- MediaRecorder availability and output format vary by browser. Permission and recording still
  require a supported browser and a human check on the target device.
- Python 3.11.2 is installed at `C:\Python311\python.exe` and available through `py -3.11`; the
  `python` Windows Store alias is unreliable. The isolated `transcription/.venv` is Git-ignored.
- Standalone FFmpeg is not installed. `faster-whisper` uses bundled PyAV/FFmpeg libraries for
  supported audio, while standalone FFmpeg remains recommended for diagnostics.
- The first real transcription downloads the configured Whisper model and can take several minutes
  on the CPU-only development machine.
- The catalog information control uses an in-page popover rather than a dialog. Escape, outside
  activation, and a second activation close it; only one popover is open at a time.
- ESLint is not configured; the agreed MVP quality gate is build, tests, and Prettier.
- README text may display mojibake in some terminal code pages, although the source should be treated as UTF-8 Croatian text.

## Exact Next Recommended Tasks

1. Review the Milestone 19 mentor-feedback integrated-QA pull request.
2. Perform the remaining human microphone, audible playback, Croatian voice, keyboard, and
   screen-reader checks on the target device.
3. Record any thesis demonstration observations without expanding this prototype into production
   or clinical scope.

## Do Not Change Without Asking

- Do not rewrite the content-package-first architecture.
- Do not hard-code game logic to a single sound, pair, theme, or fixed question list.
- Do not add production accounts, analytics, cloud ASR, public hosting, or external data transfer.
  The only approved backend/account scope is the localhost thesis prototype in
  `DEVELOPMENT_PLAN.md`.
- Do not add dependencies unless the benefit is clear and documented.
- Do not replace standalone components or lazy-loaded feature pages with a different structure.
- Do not remove Croatian text/content or change the app's target audience without direction.
- Do not make clinical or diagnostic claims in UI copy.
- Do not use real children’s profiles or recordings in the thesis prototype.

## Assumptions to Preserve

- Target users are preschool and school-age children, with parents and speech therapists as supporting adult users.
- MVP uses microphone recording only for replay/self-monitoring.
- Adding a new sound, sound pair, theme, level, audio file, image, or question should be possible by adding or editing content packages.
- Scoring must remain configurable and never produce negative points.
- Replay does not reduce points by default.
- Positive, non-punitive feedback is required.
- Multiple correct answers are supported by the model when explicitly needed.

## Environment and Setup Requirements

- Node.js 20.19+ or newer LTS.
- npm.
- A second terminal for the Express service during integrated local development.
- For microphone use: supported browser and secure context (`localhost` or HTTPS).
- No environment variables are required at this time.
