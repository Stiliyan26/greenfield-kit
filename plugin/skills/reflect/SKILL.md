---
name: reflect
description: Spawn three parallel review subagents over the active transcript (or several transcripts of one build), surface learnings, and route each to a concrete edit on an existing skill. Use when the user says reflect or asks why a build was slow or what to improve.
disable-model-invocation: true
---

# Reflect

Mine the conversation for durable learnings, then route them into skill edits.

## When to invoke

Invoke when the user says "reflect" or "/reflect". Skip when the conversation is trivial, off-topic, or already covered by an existing skill the parent followed correctly. One-offs are not learnings.

If the user asks a focus question ("why was X slow", "what went wrong with Y"), pass it to every reviewer as an extra focus line. It changes what they prioritize, not the output format.

## Process

### 1. Locate the transcript

The parent finds the transcript file before fanning out. Claude Code keeps them at `~/.claude/projects/<project-dir>/<session-id>.jsonl`, with subagent transcripts in `<session-id>/subagents/*.jsonl`. Cursor keeps them under the workspace's `agent-transcripts/` directory (the system prompt names it). Use only the current workspace's directory. Do not glob across other projects. That crosses workspace boundaries and reads private chats from unrelated projects.

```bash
ls -t ~/.claude/projects/<project-dir>/*.jsonl | head -10
```

For each candidate, read the first user line and check it matches the conversation's opening prompt. Take the matching path. The current session's file is often nearly empty when the user asks about earlier work: then pick the sessions the question is about (check first and last timestamps and first user messages), and pass all of them.

Transcripts can be tens of MB. Tell reviewers to extract with python or jq (user messages, assistant text, Skill and Agent calls, tool durations from timestamps), not to read whole files.

If no path resolves, write a tight digest of the session and pass that instead.

### 2. Spawn three reviewers in parallel

One message, three `Agent` calls, `subagent_type: general-purpose`, with `model` set as below. Reviewers need MCP access for context lookups (tickets, chat threads, observability traces referenced in the transcript).

Set `model` as in the table. If the Agent tool rejects a value, use the session's default model and say so.

| Lens      | `model`  | Prompt template                    |
| --------- | -------- | ---------------------------------- |
| Judgment  | `opus`   | `references/judgment-reviewer.md`  |
| Tooling   | `sonnet` | `references/tooling-reviewer.md`   |
| Divergent | `opus`   | `references/divergent-reviewer.md` |

Pass each template verbatim, substituting the transcript path or digest where marked, and adding any focus line and the transcript-format note (Claude Code JSONL, where skills live). A prompt that says "read the template file at <path> and follow it exactly" works when inlining is impractical. Reviewers return findings in the `Agent` result.

### 3. Synthesize

One `Agent` call, `subagent_type: general-purpose`, with `model: opus`. The synthesizer's quality check includes spot-verifying citations, which can require MCP access. Use `references/synthesizer.md` verbatim, with each reviewer's full output inlined where marked. The synthesizer returns a structured Accepted / Rejected / Backlog list.

### 4. Structural enforcement check

Sanity-check the synthesizer's Accepted list. For any item that would be enforced more reliably by a lint rule, script, metadata flag, or runtime check, move it from Accepted to Backlog.

### 5. Apply

Before applying any Accepted edit, present the synthesizer's full Accepted/Rejected/Backlog output to the user and wait for explicit approval. The user picks which subset to apply and may redirect routings. Skill changes affect every future agent. Do not auto-apply.

Backlog items go to whatever backlog the project uses (issue tracker, `docs/`, a TODO file). Only the Accepted list waits for approval.

For each approved Accepted item, follow the Routing field exactly:

- Trivial existing-skill edit (a one-line bullet, a tightened sentence, a stale fact corrected): parent does directly.
- Substantive existing-skill edit (a new section, a new pattern table, more than ~10 lines): parent drafts it, re-reads the whole skill afterwards and checks it still reads as one piece.
- `tune description: <skill path>` (the skill exists but didn't trigger when it should have): parent rewrites the `description` line so it names the trigger that was missed.
- `new skill: <kebab-name>`: write `plugin/skills/<kebab-name>/SKILL.md` in the shape of an existing skill in this plugin. Do not invent the shape ad hoc.

If the project ships a SKILL.md validator, run it on every touched skill before declaring done. In a plugin repo, bump the plugin version when skill files change: the plugin manager serves the cached copy otherwise.

### 6. Summarize for the user

Short list, no preamble:

- Edits applied: `<skill path>`. What changed, one line each.
- New skills created: `<skill path>`. One line each (rare).
- Backlog filed: `<title>` (`<tags>`). One line each.
- Dropped: one line per rejected finding + reason from the synthesizer.
