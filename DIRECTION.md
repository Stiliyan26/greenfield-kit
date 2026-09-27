# Direction

Where greenfield-kit could go after the pipeline works end to end. Nothing here is built yet.

## Two halves of one pipeline

- `Business-Freedom-OS` (github.com/Stiliyan26/Business-Freedom-OS) turns a client into a spec:
  - `/process-call` turns a call recording into a transcript, screenshots and an analysis.
  - `/owner-note` turns meeting notes into an account file.
  - The results are `specification.md` and feature locks.
- greenfield-kit turns a spec into a proven app.

```
 Client call / notes ─► SPEC ─► DESIGN ─► COMPONENTS ─► PLAN ─► BUILD ─► PROVE ─► MAINTAIN
 (Business-Freedom-OS)  brief   studio    shadcn +      canvas   session   e2e +     gap log
                                approve   gallery       + Q&A    wall      review
        └──────── one project folder holds everything (files are the truth) ────────┘
```

## The Workbench app

A desktop app over Claude Code, Codex and Cursor. You work in it instead of in chat windows. It has five views:

1. **Inbox.** Drop in a call video or notes. It runs the Business-Freedom-OS skills. It files exact cases in a knowledge base you can search across clients.
2. **Studio.** The design studio this repo already has.
3. **Plan canvas.** The AI asks one question at a time. Your answers fill live diagrams you can edit: folder tree, database tables, API endpoints, screens and actions, tasks.
4. **Session wall.** Each tile is one agent session titled by its task. Its sidebar shows:
   - the brief
   - what's done
   - what it's trying now
   - live steps
   - which skills it used
   - when it finishes, the report and a diagram

   The sidebar comes from the agent's own events: its to-do list, tool calls and final report. Each tile works in its own git worktree.
5. **Memory.** It reads past sessions (`~/.claude/projects/*.jsonl`, Codex logs) and pulls out what worked and what failed. Those feed back into the skills.

The rule: the plugin stays the engine, and the app is a shell over it. Everything still works from plain Claude Code, Codex or Cursor.

## Order

1. Finish one full PartyFox run through chat.
2. v0: a read-only session wall that reads existing session logs.
3. v1: launch and steer sessions from the wall through the Claude Agent SDK, each in its own worktree.
4. v2: the plan canvas.
5. v3: Inbox and Memory.

## Selling it

- Later, and only after it has built real client apps.
- Keep the plugin free and open. Charge for the app.
- First buyers: solo engineers and small studios who build custom apps for clients.
- Test the idea first with `/mom-test` interviews.
