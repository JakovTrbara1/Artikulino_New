# Codex Agent Rules

These rules apply to future Codex sessions working in this repository.

- Read `AI_HANDOFF.md` first, then this file, then `README.md` and relevant config files before editing.
- Inspect the relevant source files before making changes. Do not rely only on prior chat context.
- Keep changes small, focused, and reviewable.
- Preserve the current architecture: Angular standalone components, lazy routes, content packages, shared game session/scoring services, and local progress storage.
- Do not rewrite the app architecture unless the user explicitly asks for that scope.
- Preserve naming conventions and the existing folder structure under `src/app/core`, `src/app/shared`, and `src/app/features`.
- Avoid new dependencies unless they are clearly justified by the task. Document the reason when adding one.
- Do not hard-code games to a single sound, pair, theme, or fixed question set.
- Do not add backend persistence, cloud ASR, accounts, analytics, or external data transfer without explicit user approval.
- Keep UI copy in Croatian unless the user requests otherwise.
- Avoid clinical claims. The app is a practice aid, not a diagnostic tool.
- Run relevant lightweight checks when possible, usually `npm run build`, `npm test`, and `npx prettier . --check` when formatting may be affected.
- Update `AI_HANDOFF.md` after major architecture, setup, workflow, or product-scope changes.
- Document important decisions in docs or the handoff instead of leaving them only in chat.
- Keep final responses concise and focused on changed files, verification, risks, and next steps.
