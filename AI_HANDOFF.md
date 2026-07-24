# AI Handoff

## Project Purpose

Artikulino is an Angular application for kid-friendly speech and articulation practice for
preschool and school-age children. The completed frontend-only MVP supports gamified exercises and
a local progress view. The approved next phase is a localhost-only master’s-thesis prototype using
fictional profiles and recordings. The app remains a practice and research prototype only; it does
not diagnose, clinically evaluate speech, or replace a speech therapist.

## Current Tech Stack

- Angular 21.2 with standalone components
- Angular Router with lazy-loaded feature routes
- TypeScript 5.9, strict Angular project defaults
- CSS in component styles plus shared global tokens in `src/main.css`
- Vitest through Angular unit-test builder
- Browser APIs: Speech Synthesis, MediaRecorder, `localStorage`
- npm, Node.js 20.19+ or newer LTS

## Install, Run, Build, Test

```bash
npm install
npm start
npm run build
npm test
npm run test:ci
npm run check
```

The dev server is expected at `http://localhost:4200`.

`npm run check` is the standard repository quality gate. It runs the production build, the
single-run test suite, and the Prettier check. `npm test` remains available for development, while
`npm run test:ci` always runs once and exits.

ESLint is intentionally deferred for the MVP. The current quality gate uses the Angular compiler,
Vitest, and Prettier without adding another dependency. Prettier can also be run directly with:

```bash
npx prettier . --check
```

## Current Repository State

- Branch at handoff creation: `main`
- Remote: `origin` -> `https://github.com/JakovTrbara1/Artikulino_New.git`
- Last commit before this handoff: `5180a67 Document Angular MVP setup, game content model, privacy, and progress`
- Repository was clean before adding this handoff documentation.
- No `.env` or example environment config files were present.

## Main Implemented Features

- Home page at `/` with a short path into exercises.
- Game catalog at `/igre` with filters for packages.
- Game player at `/igre/:packageId`.
- Parent/progress page at `/napredak`.
- Shared header with logo and navigation.
- Three configurable games:
  - `listen-and-decide`: category decision from heard word/sentence.
  - `catch-the-sound`: detect whether a word contains a target sound.
  - `sound-position`: identify beginning, middle, or end of a word using a train UI.
- Shared game session flow: play/listen, replay, answer, feedback, scoring, next question, final result.
- Configurable scoring per content package.
- Local progress storage.
- Microphone recording for practice replay only, without upload or automatic speech scoring.
- Browser Speech Synthesis as the supported MVP path for spoken prompts when no approved local
  recording is available.
- Demo content packages for required sounds, pairs, themes, and difficulty levels.
- Reusable test-time content validation with stable issue codes, paths, and Croatian messages.
- Explicit professional-review metadata; all current demo packages are marked `NOT_REVIEWED`.
- Four optimized local food illustrations in the priority “Što jedemo?” package, with retained
  emoji fallbacks and documented provenance.
- Provider-neutral `SPEECH_TRANSCRIPTION` boundary with a default disabled adapter, no network
  transfer, and no pronunciation scoring.
- Documented privacy, consent, retention, account, vendor, and security requirements that must be
  approved before any external speech processing.
- Accessible answer groups and selected states, semantic progress reporting, and focus transitions
  between questions and the result screen.
- Responsive train visual assets for the sound-position game.

## Important Folders and Files

- `src/app/app.routes.ts`: top-level lazy routes.
- `src/app/core/layout/`: shared app layout/header.
- `src/app/core/services/speech-transcription.service.ts`: disabled-by-default future ASR boundary.
- `src/app/shared/`: shared components and services.
- `src/app/features/home/`: home page.
- `src/app/features/games/games.routes.ts`: lazy game routes.
- `src/app/features/games/models/content-package.model.ts`: content package contract.
- `src/app/features/games/models/content-package.validation.ts`: pure content validation utility.
- `src/app/features/games/data/demo-content-packages.ts`: demo packages.
- `src/app/features/games/services/game-session.service.ts`: shared session state and game flow.
- `src/app/features/games/services/scoring.service.ts`: scoring rules.
- `src/app/features/games/pages/`: catalog and player pages.
- `src/app/features/games/components/`: the three game board renderers.
- `src/app/features/progress/`: local parent/progress view.
- `src/main.css`: global styles, tokens, colors, typography, reset.
- `public/assets/games/`: generated game assets.
- `docs/CONTENT_PACKAGES.md`: guide for adding new packages.
- `docs/MEDIA_PROVENANCE.md`: source and processing log for project media.
- `docs/ASR_BOUNDARY.md`: privacy and architecture gates for any future ASR adapter.
- `docs/PRIVACY_AND_CONSENT.md`: data inventory, required decisions, and ASR release checklist.
- `docs/MVP_READINESS.md`: dated MVP smoke-test results and remaining human-device checks.
- `DEVELOPMENT_PLAN.md`: approved thesis-prototype roadmap and milestone boundaries.
- `docs/design/artikulino-game-concept.png`: visual concept reference.
- `docs/design/catalog-soft-toy-desktop.png`: approved desktop catalog direction.
- `docs/design/catalog-soft-toy-mobile.png`: approved mobile catalog direction.
- `docs/design/gameplay-recording-desktop.png`: approved desktop gameplay/recording direction.
- `docs/design/gameplay-recording-mobile.png`: approved mobile gameplay/recording direction.
- `docs/design/therapist-review-desktop.png`: approved therapist-review direction.

## Architecture Overview

The game engine is content-driven. Games should not be hard-coded for one sound, one theme, or one fixed question set. A `ContentPackage` defines the game type, target sound, optional contrast sound, sound pair, theme, difficulty, questions, media, answer options, correct answers, explanation, and scoring.

`GamePlayerPage` selects a package by route id and delegates answer UI to the correct board component. Shared services handle session state, scoring, replay counts, attempts, streaks, and completion. Progress is saved locally after completed sessions.

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
- Prefer small, explicit services over a global state library.
- Preserve Croatian UI/content wording.
- Keep the interface visually friendly for children while the progress page remains clearer and calmer for adults.

## Known Bugs, Risks, and Unfinished Work

- No backend, authentication, or demo profiles are implemented yet; they begin in Milestone 9.
- No ASR provider or automatic articulation error detection is implemented. The current service
  boundary remains disabled. A local, non-clinical transcript-matching worker is approved only for
  the later thesis-prototype milestone.
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
- MediaRecorder availability and output format vary by browser.
- Python is not installed on the current development machine. Local Whisper work requires
  documented Python 3.11/3.12 and FFmpeg setup.
- Audio and image fields are supported, but only the priority food package has curated local
  illustrations; most demo packages still use fallback/generated or simple visual content.
- ESLint is not configured; the agreed MVP quality gate is build, tests, and Prettier.
- README text may display mojibake in some terminal code pages, although the source should be treated as UTF-8 Croatian text.

## Exact Next Recommended Tasks

1. Merge the revised thesis-prototype roadmap and approved concepts.
2. Create the soft-toy theme/background asset pack with provenance.
3. Implement the catalog filter/tile redesign.
4. Implement the visible per-question recording panel and reset behavior.
5. Continue through backend, local transcription, parent progress, therapist review, and integrated
   QA exactly in the dependency order documented in `DEVELOPMENT_PLAN.md`.

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
- For microphone use: supported browser and secure context (`localhost` or HTTPS).
- No environment variables are required at this time.
