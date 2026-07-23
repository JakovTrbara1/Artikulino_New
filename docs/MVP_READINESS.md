# MVP Readiness

Verification date: 2026-07-23

Initial branch: `codex/mvp-readiness-pass`

Device-check follow-up: `codex/mvp-device-checks`

## Result

The current frontend-only application has no confirmed technical blocker for an MVP review. The
production build, automated tests, formatting checks, core routes, all three game types, local
progress, responsive layouts, and the browser Speech Synthesis path pass.

This result does not mean that the Croatian exercise content is clinically or professionally
validated. All demo packages remain `NOT_REVIEWED`.

## Environment

- Local Angular development server at `http://localhost:4200`
- Codex in-app browser
- Desktop viewport: approximately 1265 × 708
- Narrow viewport: 390 × 844
- Automated baseline: 38 tests

## Verification record

| Area                 | Result  | Evidence                                                                                                                                                                                                                  |
| -------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                  | Pass    | Home page rendered with navigation and no console errors.                                                                                                                                                                 |
| `/igre`              | Pass    | Catalog rendered 16 packages, filters, and all three game types.                                                                                                                                                          |
| `listen-and-decide`  | Pass    | Completed `slusaj-hrana-s-lagano` with 4/4 correct answers.                                                                                                                                                               |
| `catch-the-sound`    | Pass    | Completed `uhvati-zivotinje-r-lagano` with 4/4 correct answers.                                                                                                                                                           |
| `sound-position`     | Pass    | Completed `pozicija-hrana-s-lagano` with 4/4 correct answers.                                                                                                                                                             |
| Invalid package      | Pass    | `/igre/ne-postoji` showed a friendly not-found message and return link.                                                                                                                                                   |
| `/napredak`          | Pass    | Three completed sessions produced three records and 135 total points.                                                                                                                                                     |
| Progress persistence | Pass    | Records remained after a browser reload.                                                                                                                                                                                  |
| Progress deletion    | Pass    | The local progress deletion action returned the page to its empty state.                                                                                                                                                  |
| Speech Synthesis     | Pass    | Answers stayed disabled until playback began and then became available. Replay became available after speech ended.                                                                                                       |
| Focus and semantics  | Pass    | Native answer buttons, `aria-pressed`, semantic progress, live feedback, and result-heading focus were present.                                                                                                           |
| Responsive layout    | Pass    | Desktop and 390 × 844 views rendered without horizontal overflow.                                                                                                                                                         |
| Mobile navigation    | Pass    | The menu opened and exposed the main navigation links.                                                                                                                                                                    |
| Microphone states    | Partial | Permission-request UI rendered. Automated tests cover unsupported, denied, recording, ready, removal, stream release, and active-recording cleanup states. A physical recording was not captured during automated review. |
| Browser console      | Pass    | No relevant errors or warnings appeared in the checked routes and flows.                                                                                                                                                  |

## Remaining human checks

These checks need a person using the target browser and hardware before a public pilot:

1. Complete one game using only Tab, Enter, and Space. Automation confirmed focus order and native
   button semantics but could not reliably dispatch native key activation in the in-app browser.
2. On a physical device, allow and deny microphone permission, record a short sample, replay it,
   remove it, and confirm it disappears after leaving the game. Automated state coverage passes,
   but it does not verify the device, permission prompt, encoded format, or audible playback.
3. Listen to the Croatian Speech Synthesis voice on each supported browser and device; voice quality
   depends on the operating system.
4. Complete a short screen-reader pass for navigation, feedback, progress, and the result screen.

## MVP boundaries

- Browser Speech Synthesis is the supported spoken-prompt path.
- Packaged WAV recordings remain deferred and the experimental
  `codex/priority-food-audio` branch must not be merged.
- Microphone recordings are for local self-listening only.
- No backend, accounts, analytics, cloud ASR, external data transfer, clinical scoring, or
  diagnostic claims are part of this MVP.
- Professional Croatian speech-therapy review and media licensing remain product-release work, not
  technical blockers for testing the MVP.
