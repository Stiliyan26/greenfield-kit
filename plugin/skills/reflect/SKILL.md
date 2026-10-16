---
name: reflect
description: Spawn three parallel review subagents over the active transcript (or several transcripts of one build), surface learnings, and route each to a concrete edit on an existing skill. Use when the user says reflect or asks why a build was slow or what to improve.
disable-model-invocation: true
---

# Reflect

Mine the conversation for durable learnings. Route each one into a skill
edit. Skip the run when the conversation is trivial or off-topic, or when
an existing skill that the parent followed correctly already covers it. A
one-off is not a learning.

If the user asks a focus question ("why was X slow", "what went wrong with
Y"), pass it to every reviewer as an extra focus line. It changes what they
prioritize. It does not change the output format.

## Steps

```text
Reflect progress:
- [ ] 1 Transcript located
- [ ] 2 Three reviewers returned
- [ ] 3 Synthesizer returned
- [ ] 4 Accepted list checked for mechanisms
- [ ] 5 User approved, edits applied
- [ ] 6 Summary given
```

### 1. Locate the transcript

1. Find the transcript file before you fan out. Claude Code keeps them at
   `~/.claude/projects/<project-dir>/<session-id>.jsonl`. Subagent
   transcripts are in `<session-id>/subagents/*.jsonl`.
2. Use only the current workspace's directory. Do not search other projects.
   That crosses workspace limits and reads private chats.
3. List the candidates: `ls -t ~/.claude/projects/<project-dir>/*.jsonl | head -10`.
4. Read the first user line of each. Take the one that matches the opening
   prompt of this conversation.
5. If the current session's file is nearly empty because the question is about
   earlier work, pick the sessions the question is about. Check first and last
   timestamps and first user messages. Pass all of them.
6. Tell reviewers to extract with python or jq (user messages, assistant text,
   Skill and Agent calls, tool durations from timestamps). Transcripts can be
   tens of MB. Reviewers must not read whole files.
7. If no path resolves, write a tight digest of the session. Pass it instead.

Done when you hold one or more transcript paths, or a digest.

### 2. Spawn three reviewers in parallel

1. Send one message with three `Agent` calls. Set `subagent_type:
   general-purpose`. Reviewers need MCP access for context lookups (tickets,
   chat threads, traces the transcript references).
2. Set `model` as in the table. If the Agent tool rejects a value, use the
   session's default model. Say so.

| Lens | `model` | Prompt template |
| --- | --- | --- |
| Judgment | `opus` | [judgment-reviewer.md](references/judgment-reviewer.md) |
| Tooling | `sonnet` | [tooling-reviewer.md](references/tooling-reviewer.md) |
| Divergent | `opus` | [divergent-reviewer.md](references/divergent-reviewer.md) |

3. Build each prompt from [reviewer-common.md](references/reviewer-common.md)
   and the lens template. Pass both verbatim. Substitute the transcript path
   or digest where marked. Add any focus line and a note that the transcript
   is Claude Code JSONL and where skills live.
4. If inlining is impractical, write: "read the template files at <paths>
   and follow them exactly".

Reviewers return findings in the `Agent` result.

Done when all three reviewers have returned.

### 3. Synthesize

Send one `Agent` call. Set `subagent_type: general-purpose` and `model:
opus`. The synthesizer spot-checks citations, which can need MCP access. Use
[synthesizer.md](references/synthesizer.md) verbatim. Inline each reviewer's
full output where marked. The synthesizer returns an Accepted / Rejected /
Backlog list.

Done when the list is back.

### 4. Check for mechanisms

For each Accepted item that a lint rule, script, metadata flag or runtime
check would enforce more reliably, move it to Backlog.

Done when no Accepted item has a cheap mechanism.

### 5. Apply

1. Show the user the synthesizer's full Accepted / Rejected / Backlog output.
   Wait for explicit approval. The user picks the subset to apply and may
   redirect routings. Never auto-apply. A skill change affects every future
   agent.
2. File Backlog items in the project's backlog (issue tracker, `docs/`, a
   notes file). They do not wait for approval.
3. For each approved Accepted item, follow its Routing field exactly:
   - Trivial edit (a one-line bullet, a tightened sentence, a stale fact):
     make it directly.
   - Substantive edit (a new section, a new table, more than about 10 lines):
     draft it. Re-read the whole skill afterwards. Check that it still reads as
     one piece.
   - `tune description: <skill path>` (the skill did not trigger when it
     should have): rewrite the `description` so it names the missed trigger.
   - `new skill: <kebab-name>`: write `plugin/skills/<kebab-name>/SKILL.md`
     in the shape of an existing skill in this plugin.
4. Run the project's SKILL.md validator on every touched skill, if it has
   one. If a check fails, return to step 3 of this section.
5. In a plugin repo, bump the plugin version when skill files change.

Reason for the bump: the plugin manager serves the cached copy otherwise.

Done when every approved item is applied and each touched skill validates.

### 6. Summarize for the user

Write a short list with no preamble:

- Edits applied: `<skill path>`. One line on what changed.
- New skills created: `<skill path>`. One line each (rare).
- Backlog filed: `<title>` (`<tags>`). One line each.
- Dropped: one line per rejected finding, with the synthesizer's reason.

Done when the list is shown.
