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
npm run server:dev
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

- Current implementation branch: `codex/pronunciation-celebration-ui`
- Remote: `origin` -> `https://github.com/JakovTrbara1/Artikulino_New.git`
- Base: `origin/main` at merge commit `7049f20`.
- Milestone 23 is merged through pull request #30.
- Milestone 24 adds accessible pronunciation-result dialogs, a child-friendly completion screen,
  best-match summaries, recognition-only accuracy, and cleaner visible terminology.
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
  - `pronunciation-practice`: listen, record, replay, retry, and continue through syllable or
    whole-word rounds with non-clinical text-match points.
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
- Thirty-four optimized transparent soft-toy catalog illustrations mapped one-to-one to games
  through `catalogImage`, plus four enlarged catalog/gameplay edge decorations.
- Rounded game cards use consistent type colors, theme artwork, gentle hover/focus depth, and a
  separate accessible information popover.
- Provider-neutral `SPEECH_TRANSCRIPTION` browser boundary with a default disabled adapter and no
  network transfer; the approved scoring path uses only the localhost Express/FastAPI pipeline.
- Local Express/SQLite prototype foundation with hashed demo passwords, hashed eight-hour bearer
  sessions, parent/therapist roles, and fictional display-name-only child profiles.
- Backend game sessions are stored under the active demo child. Multiple multipart recording
  attempts per question are retained as SQLite metadata plus local files, limited to 15 seconds
  and 10 MB.
- Express queues stored recording attempts one at a time for the localhost FastAPI worker. Attempts
  retain `PENDING`, `COMPLETED`, or `FAILED` state plus an optional transcript and integer
  `Podudarnost teksta`.
- `GET /api/health` exposes API contract version 2 and all supported game types. Angular checks
  those capabilities before session creation and gives an explicit `npm run server:dev` restart
  instruction when an old or unavailable API process is detected.
- Parents can poll one owned recording through `GET /api/attempts/:attemptId`; the response exposes
  transcription metadata but never a storage name or physical path.
- The worker lazily loads `faster-whisper` `small` by default with Croatian language, CPU, and
  `int8`; `ARTIKULINO_WHISPER_MODEL` can select a lighter local development model.
- Transcript matching lowercases, removes punctuation, collapses whitespace, preserves Croatian
  diacritics, and uses normalized Levenshtein similarity. It affects only proportional
  pronunciation-game points and never appears as a pronunciation or clinical score.
- Recording upload failures retain the browser-local recording for retry or deletion. A completed
  local transcription awards proportional points; failure or timeout permits continuation with
  zero new points.
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
- `public/assets/games/catalog/`: 34 unique transparent catalog illustrations, one per game.
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
- `docs/design/observation-improvements-concept.png`: approved child-facing pronunciation result,
  completion-screen, unique catalog-art, and larger-decoration direction for Milestones 20–25.

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
  not be presented as pronunciation quality, an error score, or a clinical result. The current
  implementation uses it only for proportional pronunciation-game points, with the best attempt
  counted once per question.
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

## Milestone 21 Validation

- `npm --prefix server run check` passed: TypeScript build and 25 API/database tests.
- `npm run test:ci` passed: 20 frontend files and 96 tests.
- The API was changed from the non-watch process started on 28 July to `npm run server:dev` without
  resetting runtime data.
- Counts before and after restart and verification were unchanged: 2 users, 2 profiles, 19 game
  sessions, 21 recording attempts, 10 therapist reviews, and 21 recording files totalling 841,110
  bytes.
- A disposable live pronunciation flow created a `pronunciation-practice` session, uploaded an
  existing fictional/adult test recording, reached `COMPLETED`, returned status without a storage
  path, completed the session, and appeared in the parent session list. Its session and copied
  recording were then deleted, returning every runtime count to the original value.

## Milestone 22 Validation

- `npm run prototype:check` passed: 20 frontend files / 103 tests, 3 server files / 25 tests, and
  5 Python worker tests (133 tests total), plus the production builds and Prettier.
- `git diff --check` passed.
- Content tests verify four unique A/E/I/O syllables for every supported target sound and confirm
  that whole-word prompts remain unchanged.
- Polling tests cover one-second intervals, completion, and the configured timeout. Session tests
  cover proportional points, lower and higher retries, best-attempt-only totals, and unavailable
  transcription.
- Rendered Browser QA verified the `LA` first round, points/recordings toolbar, listen-to-record
  transition, non-clinical text-match copy, and a clear browser console.
- The two empty unfinished sessions created by Browser reloads were identified by exact ID and
  deleted; no recordings or existing completed sessions were changed.
- Real microphone capture and audible Croatian syllable quality remain target-device checks.

## Milestone 23 Validation

- `npm run assets:check` passed for 34 unique WebP paths and hashes, valid containers, referenced
  files, and size limits. The optimized set totals 1.205 MB and its largest file is 74.5 KB.
- `npm run prototype:check` passed: the Angular build, 20 frontend files/104 tests, three Express
  files/25 tests, five Python tests, the asset gate, and repository-wide Prettier checks all pass.
- The build reports only the previously documented progress-page and therapist-page CSS budget
  warnings; the changed catalog and gameplay styles remain within their component budgets.
- Reusable validation rejects a catalog image path shared by two games. Demo-content tests require
  one meaningful alt description and one `/assets/games/catalog/` path for each of all 34 games.
- Contact-sheet review confirmed distinct compositions for all listening, sound-recognition,
  sound-position, isolated-sound, and whole-word games.
- In-app Browser review at 1280 × 720 and responsive Chrome checks at 1440 × 1000 and 390 × 844
  confirmed all 34 images load at their native 512 × 512 size, category toggles retain unique
  artwork, the lips icon is clear, desktop decorations are enlarged, narrow-screen decorations are
  hidden, and neither layout has horizontal overflow or console errors.
- Gameplay checks confirmed the enlarged desktop decorations remain pointer-free at the content
  edges and disappear at the mobile breakpoint. The temporary empty QA session was deleted by its
  exact ID; existing runtime data was not reset or changed.

## Milestone 24 Validation

- `npm run prototype:check` passed after formatting: the Angular build, 22 frontend files/110
  tests, three Express files/25 tests, five Python tests, the asset gate, and repository-wide
  Prettier checks all pass.
- Focused tests cover pending, completed, failed, retry, focus, reduced-state, completion-summary,
  best-per-question percentage, and microphone retry-numbering behavior.
- The centered result dialog keeps the game surface inert, labels the value only as
  `Podudarnost teksta`, shows best points, and offers retry or continuation without a hard failure
  threshold.
- The finish screen uses `Bravo, završio/la si vježbu!`, three result metrics, and the existing
  replay/catalog/progress actions. Pronunciation summaries show average best text match, while
  parent accuracy excludes pronunciation sessions.
- In-app Browser checks at 1440 × 1000 and 390 × 844 confirmed the completion hierarchy, responsive
  stacking, focused result heading, no horizontal overflow, and no console warning/error.
- The two temporary sessions created for rendered QA were deleted individually. Runtime returned to
  19 sessions and 21 recording attempts; no reset or existing recording deletion occurred.

## Known Bugs, Risks, and Unfinished Work

- Local recording persistence, Croatian transcription, expanded parent progress, therapist review,
  and integrated cross-service/failure-path QA are implemented.
- The stale non-watch Express process that rejected new pronunciation sessions was replaced without
  data loss. Contract-version and supported-game-type checks now identify this mismatch before
  session creation. Development instructions use `server:dev`.
- Isolated-sound pronunciation packages now use four different A/E/I/O syllables while whole-word
  packages remain unchanged.
- Catalog cards now use one separately generated image per game. The asset check prevents shared
  paths, duplicate file bytes, missing references, invalid WebP containers, and size regressions.
- Child pronunciation gameplay shows bounded pending and completed states in an accessible
  celebration dialog. The main question screen remains free of transcripts and percentages.
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

1. Review and merge Milestone 24.
2. Implement Milestone 25 only after Milestone 24 is merged and validated.
3. Perform the remaining human microphone, audible playback, Croatian voice, keyboard, and
   screen-reader checks on the target device during Milestone 25.

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
- Recognition games never use recording. Pronunciation games use recording for replay and
  non-clinical proportional text-match points.
- Adding a new sound, sound pair, theme, level, audio file, image, or question should be possible by adding or editing content packages.
- Scoring must remain configurable and never produce negative points.
- Pronunciation text-match scoring must use the package base points, count only the best attempt per
  question, and allow continuation without points when transcription is unavailable.
- Replay does not reduce points by default.
- Positive, non-punitive feedback is required.
- Multiple correct answers are supported by the model when explicitly needed.

## Environment and Setup Requirements

- Node.js 20.19+ or newer LTS.
- npm.
- A second terminal for the Express service during integrated local development.
- For microphone use: supported browser and secure context (`localhost` or HTTPS).
- No environment variables are required at this time.
