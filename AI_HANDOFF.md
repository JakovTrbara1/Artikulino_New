# AI Handoff

## Project Purpose

Artikulino is an Angular MVP for kid-friendly speech and articulation practice for preschool and school-age children. It supports children through gamified exercises, while giving parents and speech therapists a simple local view of progress. The app is a practice aid only; it does not diagnose, clinically evaluate speech, or replace a speech therapist.

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
- Speech Synthesis fallback when an audio file is missing or fails.
- Demo content packages for required sounds, pairs, themes, and difficulty levels.
- Reusable test-time content validation with stable issue codes, paths, and Croatian messages.
- Explicit professional-review metadata; all current demo packages are marked `NOT_REVIEWED`.
- Accessible answer groups and selected states, semantic progress reporting, and focus transitions
  between questions and the result screen.
- Responsive train visual assets for the sound-position game.

## Important Folders and Files

- `src/app/app.routes.ts`: top-level lazy routes.
- `src/app/core/layout/`: shared app layout/header.
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
- `docs/design/artikulino-game-concept.png`: visual concept reference.

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
- Use browser Speech Synthesis as a fallback, not as the primary content quality source.
- Use the microphone only for child self-listening practice in the MVP.
- Do not make clinical claims or automatic pronunciation judgments.
- Keep progress local until privacy, accounts, consent, and backend requirements are defined.
- Prefer small, explicit services over a global state library.
- Preserve Croatian UI/content wording.
- Keep the interface visually friendly for children while the progress page remains clearer and calmer for adults.

## Known Bugs, Risks, and Unfinished Work

- No backend, authentication, user profiles, or device sync.
- No ASR or automatic articulation error detection yet.
- No consent flow, data retention policy, or role model for real parent/therapist accounts.
- Demo content is explicitly marked `NOT_REVIEWED` and has not been professionally reviewed by a
  Croatian speech therapist.
- Speech Synthesis voice quality varies by browser and OS.
- MediaRecorder availability and output format vary by browser.
- Audio and image fields are supported, but most demo packages use fallback/generated or simple visual content.
- ESLint is not configured; the agreed MVP quality gate is build, tests, and Prettier.
- README text may display mojibake in some terminal code pages, although the source should be treated as UTF-8 Croatian text.

## Exact Next Recommended Tasks

1. Have a Croatian speech therapist review priority demo packages, then record the reviewer and
   date before changing their status to `PROFESSIONALLY_REVIEWED`.
2. Replace emoji/demo imagery with curated image assets through `image.src`.
3. Add real audio files for priority packages and keep Speech Synthesis as fallback.
4. Design the future ASR boundary as a separate service interface before adding any cloud API.
5. Define privacy, consent, retention, and account model before storing child data outside the browser.

## Do Not Change Without Asking

- Do not rewrite the content-package-first architecture.
- Do not hard-code game logic to a single sound, pair, theme, or fixed question list.
- Do not add backend persistence, accounts, analytics, or cloud ASR without explicit approval.
- Do not add dependencies unless the benefit is clear and documented.
- Do not replace standalone components or lazy-loaded feature pages with a different structure.
- Do not remove Croatian text/content or change the app's target audience without direction.
- Do not make clinical or diagnostic claims in UI copy.

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
