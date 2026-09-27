# Review on every pull request

[review.yml](../assets/review.yml) runs this skill with
[claude-code-action](https://github.com/anthropics/claude-code-action) and
keeps one PR comment up to date.

1. Copy it to `.github/workflows/review.yml`.
2. Fill the angle brackets: the install command and the marketplace owner.
3. Add repository secrets:
   - `ANTHROPIC_API_KEY`, or use `claude_code_oauth_token` instead.
   - `GREENFIELD_KIT_TOKEN`: a fine-grained token with read access to the
     greenfield-kit repo, only if it's private.
4. Keep the tool gates in the project's normal CI job. That job blocks the
   merge; this one only comments.
5. Open a small test PR and check that exactly one comment appears, and that
   a second push edits it instead of adding another.

Notes:

- `--allowedTools` lets the run start sub-agents, read files, run the gate
  command and `git diff`, write under `temp/review/`, and comment. It can't
  edit code or push.
- The PR text and code are untrusted input. The prompt says to treat them as
  data; keep it that way when you edit the prompt.
- The skill sets each reviewer's model when it starts it (fast for scope,
  the session's model for the rest). `claude_args` can add `--model` to
  change the session's model.
- Cost grows with the number of reviewers triage picks and the diff size.
  `concurrency` cancels a run when a newer push arrives.
