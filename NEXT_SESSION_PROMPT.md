# Next Session Prompt

Use this prompt in a fresh Codex chat:

```text
We are continuing the Artikulino project.

Please pull or inspect this GitHub repository:
https://github.com/JakovTrbara1/Artikulino_New

Before editing code:
1. Read AI_HANDOFF.md first.
2. Read AGENTS.md second.
3. Read README.md, package.json, angular.json, and relevant config files third.
4. Inspect only the source files relevant to the task.
5. Summarize your understanding of the current architecture and repository state.
6. Verify the setup commands that are relevant to the requested work.
7. Identify the next logical task and any risks.

Preserve the current architecture and decisions:
- Angular 21 standalone components.
- Lazy-loaded routes.
- Content-package-driven games.
- Shared game session and scoring services.
- Local-only progress storage.
- Microphone recording only for practice replay in the MVP.
- No clinical/diagnostic claims.

Do not make large architectural changes, add backend/cloud ASR/accounts, or introduce new dependencies without confirmation.

After the summary, wait for my confirmation before making large changes. For small scoped fixes or documentation updates, proceed normally after stating the plan.
```
