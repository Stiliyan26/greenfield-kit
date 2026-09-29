# Triage

`node scripts/triage.mjs --out <dir> <target> [--project <root>]` collects what to
review and groups it by feature. One reviewer per feature, no cap.

## Target (exactly one)
- `--base <ref>` committed changes on this branch since `<ref>`
- `--uncommitted` staged, unstaged and new files
- `--range <a>..<b>` a commit range (one commit is `<sha>^..<sha>`)
- `--app` every tracked source file
- `--plan <file>...` the given plan files, no diff, one feature named `plan`

`--project` is the project root (default: the current folder).
## Grouping, in this order
1. `docs/plans/*/features/*.md`: the backtick globs on each file's `- Owns:` line
   (`*`, `**`; endpoints and tables are ignored). A file matching a glob belongs to
   that feature, named after the md file.
2. Otherwise a name from the path: the segment after a `features/` directory, else
   the segment after `src/` under a package dir (`server/`, `client/`, `apps/x/`),
   else the top folder. Client and server groups with the same name merge.
3. `other`: root files, dot-folders (`.cursor`, `.github`, ...), `docs/` and `scripts/`.
   Never their own feature; `e2e/` stays one.
4. A path-derived feature over 5,000 lines with subfolders is split one folder
   deeper, again if still over (`plugin` → `plugin/skills/review`, ...). Then any
   path-derived feature under 800 lines merges into its parent folder's feature,
   or into `other`. Features from feature files are never split or merged; the
   plan drew them.

## Skipped
Lock files, generated output (`dist/`, `*.map`, `*.snap`, ...), binaries, `temp/`
and the `--out` folder. `--app` keeps only source files and `DESIGN.md`.

## Output in `<dir>`
- `files.txt`: `<lines>\t<path>` per reviewed file
- `diff.patch`: the diff (not for `--app` or `--plan`)
- `plan.json`:

```json
{
  "target": { "kind": "branch|uncommitted|range|app|plan", "base": "...", "range": "..." },
  "totalLines": 1234,
  "features": [
    { "name": "time-off", "source": "docs/plans/hrise/features/time-off.md | path", "lines": 3224,
      "files": [ { "path": "client/src/features/time-off/x.tsx", "lines": 120 } ] }
  ],
  "skipped": [ { "path": "package-lock.json", "why": "lock file" } ]
}
```

Features are sorted by lines, biggest first.

## Project file (optional)
`<root>/.agents/review/triage.json`: `{ "ignore": ["<regex>", ...] }`. Matching
paths are skipped ("project ignore rule"). Any other key is ignored.
