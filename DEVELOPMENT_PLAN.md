# Artikulino Development Plan

## 1. Current project understanding

- Angular 21 standalone application with lazy routes, content-driven games, shared session/scoring
  services, and local-only progress.
- Milestones 0–3, professional-review status tracking, priority food illustrations, the disabled
  ASR boundary, and privacy requirements are merged into `main`.
- The latest `main` baseline production build, all 34 tests, and Prettier checks pass.
- Accessibility coverage includes skip navigation, focus styling and transitions, answer-state
  semantics, progress semantics, live status messages, and reduced-motion CSS.
- Reusable content-package validation is enforced by the demo-data tests.

## 2. Main development goal

The quality, content-validation, and focused accessibility foundations are complete. The next goal
is to verify that the current frontend-only application is a coherent, functioning MVP before
expanding professionally reviewed content or licensed media.

## 3. Prioritized roadmap

1. Completed: standardize the repository quality command.
2. Completed: add reusable content-package validation.
3. Completed: improve game accessibility and keyboard focus flow.
4. Completed: run an MVP readiness pass and record the results.
5. Next: complete the remaining human-device checks, then expand professionally reviewed content
   and licensed media one package at a time.

## 4. Milestones and task breakdown

### Milestone 0 — Publish this plan

- Branch: `codex/development-plan`
- Create `DEVELOPMENT_PLAN.md` with this plan only.
- Validate with `npx prettier DEVELOPMENT_PLAN.md --check` and `git diff --check`.
- Commit as `Add development plan`.
- Push the new branch to `origin`; do not push directly to `main`.

### Milestone 1 — One repeatable quality gate

- Branch: `codex/quality-check-command`
- Add `test:ci` using `ng test --watch=false`.
- Add `check` running build, `test:ci`, and Prettier.
- Record that ESLint is intentionally deferred; do not add a dependency solely to create a lint
  script.
- Update setup and workflow documentation.
- Likely files: `package.json`, `README.md`, `AI_HANDOFF.md`.
- Validate with `npm run check` and `git diff --check`.

### Milestone 2 — Content-package validator

- Branch: `codex/content-package-validation`
- Add a pure validator adjacent to the content model:
  - `ContentValidationIssue` containing stable `code`, `path`, and Croatian `message`.
  - `validateContentPackages(packages)` returning all issues without mutating or throwing.
- Validate duplicate package, question, and answer IDs; required text and answers; missing or
  unknown correct answers; supported sounds and consistent sound pairs; finite nonnegative scoring
  with a positive base, positive integer attempt and streak limits, and a multiplier between 0 and
  1; meaningful image alternative text; and repeated or missing target positions in
  `sound-position`.
- Make the demo-content test require zero validation issues. Add focused invalid fixtures for every
  validation category.
- Keep validation as a test-time and content-authoring gate; do not change runtime game flow yet.
- Likely files: `content-package.validation.ts`, its spec, `demo-content-packages.spec.ts`, and
  `docs/CONTENT_PACKAGES.md`.
- Validate with `npm run test:ci`, `npm run build`, and `npx prettier . --check`.

### Milestone 3 — Focused accessibility pass

- Branch: `codex/game-accessibility-pass`
- Give answer collections group semantics and selected buttons `aria-pressed`.
- Expose game progress as a proper progress bar with current, minimum, and maximum values.
- Move focus to the new question heading after advancing and to the result heading after
  completion; do not steal focus when feedback is already announced by the live region.
- Add component tests for disabled and selected answer states and relevant ARIA attributes.
- Preserve the existing visual design and reduced-motion behavior.
- Likely files: game-player page files, the three board templates, and `game-boards.spec.ts`.
- Validate with `npm run check`, a keyboard-only play-through of all three games, manual checks at
  narrow and desktop widths, and confirmation that feedback, audio failure, and completion states
  are announced coherently.

### Milestone 4 — MVP readiness pass

- Branch: `codex/mvp-readiness-pass`
- Create `docs/MVP_READINESS.md` as a concise verification record.
- Run `npm run check` and `git diff --check`.
- Manually verify `/`, `/igre`, one package of each game type, an invalid package route, and
  `/napredak`.
- Verify keyboard-only game completion, narrow and desktop layouts, Speech Synthesis fallback,
  microphone success/denial/unsupported states where available, local progress persistence, and
  progress deletion.
- Record browser, viewport, result, and any reproducible blocker. Fix only confirmed MVP blockers;
  keep unrelated polish in later milestones.
- Do not add packaged WAV audio. Speech Synthesis is the supported MVP spoken-prompt path.
- Likely files: `docs/MVP_READINESS.md` and only source/test files required by confirmed blockers.
- Validate any fix with focused regression coverage plus `npm run check`.

## 5. Risks and unknowns

- Structural validation cannot establish phonetic, age, or clinical correctness; a Croatian speech
  therapist remains required.
- Croatian Unicode must be read and written as UTF-8; terminal mojibake must not trigger bulk text
  replacement.
- Speech Synthesis and MediaRecorder behavior remains browser-dependent.
- Accessibility tests can prevent regressions but do not replace manual keyboard and screen-reader
  checks.
- Curated media requires confirmed licensing and professional review. Packaged audio is deferred and
  does not block the technical MVP.

## 6. Testing and validation strategy

Every milestone must pass its local validation before review. Before merging the phase, run:

```bash
npm run check
git diff --check
```

Manually smoke-test `/`, `/igre`, one package of each game type, an invalid package route,
`/napredak`, microphone denial, and audio fallback.

## 7. Recommended first implementation task

Complete the human-device checks recorded in `docs/MVP_READINESS.md`, beginning with a real
keyboard-only play-through and microphone allow/deny/replay verification. Then obtain professional
review of the priority Croatian content before expanding content or infrastructure.

## 8. Things to avoid

- No architecture rewrite, backend, accounts, analytics, cloud ASR, or external data transfer.
- No new dependencies during these milestones.
- No hard-coded sound, theme, pair, or question logic.
- No clinical claims or “validated” labels before documented professional review.
- No packaged audio, bulk image replacement, or progress-storage schema change during the readiness
  pass.
- Do not commit generated build output.

## 9. Blocking questions

None. Media selection, licensing, and professional content review are intentionally deferred and do
not block the first three milestones.

## 10. Assumptions

- Croatian remains the UI and documentation language where user-facing copy is involved.
- Existing public content-package and progress interfaces remain compatible.
- The development-plan commit is delivered separately before application implementation begins.
