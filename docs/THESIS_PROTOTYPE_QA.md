# Thesis Prototype QA

Verification date: 2026-08-04

## Result

The mentor-aligned localhost thesis prototype passed the consolidated automated gate and the live
desktop/mobile verification. The result applies only to fictional profiles and fictional or
adult-generated test recordings. It is not a production-security, clinical, or pronunciation
validation.

## Repeatable quality gate

Run from the repository root:

```bash
npm run prototype:check
git diff --check
```

The verified gate covered:

| Area                                                        | Result                      |
| ----------------------------------------------------------- | --------------------------- |
| Angular production build and frontend tests                 | Passed: 22 files, 110 tests |
| Express build, API, database, and integrated workflow tests | Passed: 3 files, 25 tests   |
| FastAPI transcription tests                                 | Passed: 5 tests             |
| Prettier and whitespace validation                          | Passed                      |

The integrated server workflow signs in as both demo roles, creates a fictional child session,
preserves multiple attempts, completes transcription, streams authenticated audio, saves a
therapist review, exposes it to the parent, and verifies cascade deletion of metadata and files.

## Mentor-feedback acceptance matrix

| Requirement                                    | Verification                                                                      |
| ---------------------------------------------- | --------------------------------------------------------------------------------- |
| Four distinct game categories                  | Catalog and content tests plus live desktop/mobile checks passed                  |
| Content matches the declared sound or pair     | Content validation covers sound occurrences, pairs, modes, and every demo package |
| No recording in recognition games              | Component and live recognition-game checks passed                                 |
| Recording only in sound/word pronunciation     | Player and session tests plus live pronunciation checks passed                    |
| Two meaningful answers for binary recognition  | Validation and live `Uhvati glas` checks passed                                   |
| Detection versus discrimination filter         | Catalog tests and live `Vrsta vježbe` filter check passed                         |
| Theme removed where it is not meaningful       | Live category-aware filter checks passed                                          |
| Parent progress split into two sections        | Component, keyboard, and live desktop/mobile checks passed                        |
| Therapist review remains visible to the parent | API, workflow, component, and live checks passed                                  |
| Historical attempts remain available           | Migration/API tests and live child-progress data check passed                     |

## Failure-path and boundary verification

| Scenario                                               | Verification                                         |
| ------------------------------------------------------ | ---------------------------------------------------- |
| Unavailable or failed transcription worker             | Live unavailable-health check and server tests       |
| Denied or unsupported microphone and safe continuation | Frontend service, component, and session tests       |
| Failed recording upload with retry/delete support      | Frontend component and service tests                 |
| Empty, unsupported, oversized, or overlong audio       | Server and worker tests                              |
| Expired login and parent/therapist role restrictions   | API, auth-service, route-guard, and live role checks |
| Session/profile deletion and physical-file cleanup     | API and integrated workflow tests                    |
| Upgrade of pre-pronunciation SQLite data               | Server migration test                                |
| Text matching affects only pronunciation-game points   | Session and proportional-scoring tests               |

## Live browser verification

Environment:

- Angular: `http://localhost:4200`;
- desktop viewport: 1440 × 1000;
- mobile viewport: 390 × 844;
- local demo accounts and fictional profiles only.

Verified interactions:

- `/igre`: all four accessible type toggles select and clear correctly; each type exposes only its
  relevant filters; the information popover opens and closes; 34 packages render with local
  artwork.
- Recognition gameplay: `Uhvati glas R` renders only `Čujem glas R` and `Ne čujem glas R`, enables
  them after `Poslušaj`, and renders no recording control.
- Pronunciation gameplay: recording is disabled until the example is played; the question screen
  has no answer controls, transcript, or percentage; after a recording, the accessible result
  dialog labels the percentage only as `Podudarnost teksta` and never as pronunciation quality.
- `/napredak`: `Napredak djeteta` is the default section; `Feedback terapeuta` shows only saved
  therapist reviews while historical attempts remain in child progress.
- `/pregled-terapeuta`: therapist login, demo-child switching, completed sessions, all attempts,
  authenticated playback controls, text-match data, and saved review states are visible.
- Parent access to the therapist route is rejected.

No framework error overlay, horizontal overflow, or browser-console warning/error was observed on
the checked routes.

## Visual comparison

The catalog, pronunciation, parent-feedback, and therapist screens were compared with their
approved references in `docs/design/`.

- Catalog: preserves the four colored type toggles, soft-toy artwork, rounded depth, accessible
  information controls, and responsive single-column cards.
- Pronunciation: preserves the listen-first hierarchy and prominent recording panel.
- Parent progress: preserves the two-section adult-facing hierarchy and readable review cards.
- Therapist review: preserves the calm master-detail desktop layout and stacked mobile layout.

Intentional differences from generated concepts:

- production copy and demo data remain code-native Croatian rather than image-rendered sample text;
- navigation and decoration remain restrained for accessibility and responsive space;
- the child question screen does not show a transcript or percentage; the separate result dialog
  uses encouraging copy with explicit text-match terminology and no automated pronunciation
  conclusion.

## Milestone 24 result and completion QA

- Component tests cover pending, completed, unavailable, retry, continuation, dialog focus,
  completion focus, result metrics, and the three completion actions.
- Session tests confirm average best text match and verify that a lower retry cannot reduce a
  previous best percentage or points.
- Parent progress calculates recognition accuracy without pronunciation sessions and summarizes
  pronunciation sessions using the best completed text match per question.
- Rendered QA at 1440 × 1000 and 390 × 844 confirmed a centered celebration-style completion,
  responsive metric/action stacking, no horizontal overflow, and a clear console.
- The global warning banner and visible `demo`, `prototip`, `paket`, and `testne snimke` product
  wording were removed. One concise adult-facing local-storage and deletion notice remains on the
  parent progress page.

## Milestone 25 integrated regression QA

The live regression used only the predefined fictional profile and one short local adult-environment
recording. Before the test, runtime contained 19 sessions, 21 recording attempts, 10 therapist
reviews, and 21 recording files totaling 841,110 bytes.

- Parent flow: sign-in, Luka selection, syllable `LA`, listen-first recording unlock, microphone
  start/stop, upload, pending dialog, completed `Podudarnost teksta` result, backend completion,
  parent progress, and authenticated playback passed.
- Persistence: the exact new session and recording attempt remained after restarting Angular,
  Express through `server:dev`, and FastAPI without running `prototype:reset`.
- Therapist flow: role guard, completed-session selection, authenticated playback, saving
  `Vježbati ponovno` with a full comment, and parent visibility of that comment passed.
- Worker failure: stopping FastAPI changed the Express health response to `UNAVAILABLE`; restarting
  FastAPI restored `AVAILABLE`.
- Responsive checks: catalog, parent progress, and therapist review passed at 1440 × 1000 and with a
  390 × 844 viewport override. The mobile document client width was 375 pixels and matched its
  scroll width, so no horizontal overflow was present.
- Browser health: after restarting one stale Angular development process, all checked routes were
  free of framework overlays and console warnings/errors.
- Cleanup: both exact QA sessions, the QA attempt, its therapist review, physical audio file, and
  four QA-created login sessions were removed. Runtime returned to the same 19 sessions, 21
  attempts, 10 reviews, 21 files, and 14 login sessions recorded before QA.

Focused automated tests remain the evidence for incompatible/stale API responses, failed or timed
out transcription, denied microphone access, invalid audio, expired authentication, and best-retry
scoring. The live run did not manufacture those error states by altering existing runtime data.

## Remaining human-device checks

These checks require the target browser, microphone, speakers, keyboard, or assistive technology:

1. explicitly deny real microphone permission and confirm the safe-continuation copy;
2. confirm that prompt Speech Synthesis and authenticated recording playback are audible;
3. assess the installed Croatian `hr-HR` voice quality;
4. complete a physical keyboard-only and screen-reader pass.

Only fictional or adult-generated test recordings may be used.

## Known non-blocking warnings

- The production build reports existing component-style budget warnings for progress and therapist
  pages; neither reaches the configured build error threshold.
- Python tests report a Starlette/httpx test-client deprecation warning.
- The first real `faster-whisper` transcription can take several minutes while the model downloads
  and loads on a CPU-only machine.

## Local operation

Use `docs/INTELLIJ_RUN_CONFIGURATIONS.md` to start Angular, Express, and FastAPI together. Reset all
Git-ignored runtime data and reseed the two demo accounts plus Luka and Mia with:

```bash
npm run prototype:reset
```
