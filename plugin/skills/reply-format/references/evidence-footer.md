# Evidence footer

Put this footer last in each reply that did work.

```
**Skills used:** <skill names, or "none">
**Evidence:**
- `<command or check I ran>` → <actual result, e.g. "12 passed", "HTTP 200", "0 errors">
- Not verified: <what I could not check, and why>
```

## Rules

- List only the checks that you ran in this session.
- Copy the real result from the output. Do not round it up.
- Name each check that failed or did not run.
- If you ran no check, write "Evidence: not verified" and name the check that would verify it.

Reason: the reader needs proof, not confidence.

## Good and bad lines

| Bad | Good |
|---|---|
| Tests pass | `<test command>` → 41 passed, 0 failed |
| Should work now | Not verified: no API key, so the live call did not run |
| Validated the skill | `validate_skill.py` → 0 errors, 1 note (WF1) |
