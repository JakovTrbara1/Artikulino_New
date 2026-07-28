# Thesis Prototype QA

Verification date: 2026-07-28

## Result

The localhost thesis prototype passed the consolidated automated gate and the integrated parent
and therapist workflows. This result applies only to fictional profiles and fictional or
adult-generated test recordings. It is not a production-security, clinical, or pronunciation
validation.

## Repeatable quality gate

Run from the repository root:

```bash
npm run prototype:check
git diff --check
```

The verified gate covered:

| Area                                                        | Result                     |
| ----------------------------------------------------------- | -------------------------- |
| Angular production build and frontend tests                 | Passed: 20 files, 75 tests |
| Express build, API, database, and integrated workflow tests | Passed: 3 files, 21 tests  |
| FastAPI transcription tests                                 | Passed: 5 tests            |
| Prettier and whitespace validation                          | Passed                     |

The integrated server workflow signs in as both demo roles, creates a fictional child session,
preserves two attempts for one question, completes transcription, streams authenticated audio,
saves a therapist review, exposes it to the parent, and verifies cascade deletion of metadata and
audio files.

## Integrated workflow verification

| Scenario                                                                | Verification                                          |
| ----------------------------------------------------------------------- | ----------------------------------------------------- |
| Parent login and fictional child selection                              | Passed in the running Angular application             |
| Complete four-question game and save progress                           | Passed; result was 4/4 and visible in parent progress |
| Multiple attempts and asynchronous persistence                          | Passed in the integrated API test                     |
| Therapist session, transcript, text match, playback request, and review | Passed in the running application and API test        |
| Full therapist comment visible to parent                                | Passed in the running application                     |
| Unavailable or failed transcription worker                              | Passed by server failure-path tests                   |
| Denied or unsupported microphone and failed upload retry                | Passed by frontend service/component tests            |
| Empty, unsupported, oversized, or overlong audio                        | Passed by server and worker tests                     |
| Session/profile deletion and physical-file cleanup                      | Passed by API and integrated workflow tests           |
| Expired login and parent/therapist role restrictions                    | Passed by API, auth-service, and route-guard tests    |

Browser Speech Synthesis successfully drove the live four-question parent flow. The in-app browser
confirmed the authenticated playback control and response state, but it cannot prove that sound
was audible through the physical output device.

## Visual and responsive verification

The catalog and gameplay screens were compared with the five references in `docs/design/` at
1440 × 1000 and 390 × 844. The therapist review was checked at the same desktop and mobile widths.
All checked pages remained usable without horizontal overflow.

- Catalog: preserves the three colored game-type toggles, soft-toy theme artwork, rounded depth,
  accessible information control, and responsive single-column layout.
- Gameplay: preserves the central activity card, restrained edge decorations, clear prompt/media,
  and the visible optional recording panel before the answers.
- Therapist review: preserves the calm master-detail hierarchy on desktop and stacks the profile,
  session, and attempt areas on narrow screens.
- Intentional differences from the generated concepts include code-native Croatian copy, real
  package data, simplified navigation, and accessible HTML controls instead of image-rendered UI.

No application console errors were observed during the live parent, catalog, gameplay, progress,
or therapist checks.

## Remaining human-device checks

These checks require the target browser, microphone, speakers, keyboard, or assistive technology:

1. allow and deny real microphone permission, record, replay, retry, delete, and confirm the
   per-question reset;
2. confirm that prompt Speech Synthesis and authenticated recording playback are audible;
3. assess the installed Croatian `hr-HR` voice quality;
4. complete a keyboard-only and screen-reader pass.

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
