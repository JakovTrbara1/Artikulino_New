# Artikulino Development Plan

## 1. Current project understanding

- Angular 21 standalone application with lazy routes, content-driven games, shared session/scoring
  services, and local-only progress.
- The repository is clean on `main`, synchronized with `origin/main`.
- The baseline production build, all 16 tests, and Prettier checks pass.
- Existing accessibility foundations include skip navigation, focus styling, ARIA status messages,
  and reduced-motion CSS.
- Content integrity is currently checked only through demo-data tests; there is no reusable
  validator.

## 2. Main development goal

Establish a reliable quality and content-validation foundation, then complete a focused
accessibility pass before expanding professionally reviewed content, audio, or imagery.

## 3. Prioritized roadmap

1. Standardize the repository quality command.
2. Add reusable content-package validation.
3. Improve game accessibility and keyboard focus flow.
4. Only afterward begin clinically reviewed content and licensed media work.

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

## 5. Risks and unknowns

- Structural validation cannot establish phonetic, age, or clinical correctness; a Croatian speech
  therapist remains required.
- Croatian Unicode must be read and written as UTF-8; terminal mojibake must not trigger bulk text
  replacement.
- Speech Synthesis and MediaRecorder behavior remains browser-dependent.
- Accessibility tests can prevent regressions but do not replace manual keyboard and screen-reader
  checks.
- Curated media requires confirmed licensing, target packages, and an asset-size policy.

## 6. Testing and validation strategy

Every milestone must pass its local validation before review. Before merging the phase, run:

```bash
npm run check
git diff --check
```

Manually smoke-test `/`, `/igre`, one package of each game type, an invalid package route,
`/napredak`, microphone denial, and audio fallback.

## 7. Recommended first implementation task

Implement Milestone 1 first. It creates the common quality gate used by every later branch without
changing application behavior.

## 8. Things to avoid

- No architecture rewrite, backend, accounts, analytics, cloud ASR, or external data transfer.
- No new dependencies during these milestones.
- No hard-coded sound, theme, pair, or question logic.
- No clinical claims or “validated” labels before documented professional review.
- No bulk audio or image replacement or progress-storage schema change yet.
- Do not commit generated build output.

## 9. Blocking questions

None. Media selection, licensing, and professional content review are intentionally deferred and do
not block the first three milestones.

## 10. Assumptions

- Croatian remains the UI and documentation language where user-facing copy is involved.
- Existing public content-package and progress interfaces remain compatible.
- The development-plan commit is delivered separately before application implementation begins.
