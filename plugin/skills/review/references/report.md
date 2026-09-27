# Report shape

The judge writes this. The main agent posts it unchanged.

````markdown
# Review: <branch or PR title, or the app's name>

**Tools:** passed | failed: <check names>
**Act on:** <n> · **Consider:** <n> · **Noted:** <n> · **Dismissed:** <n>
**Target:** branch vs <base> | uncommitted changes | range <a>..<b> | whole app | plan <files>
**Mode:** full | quick | plan · **Agents:** <n> of 5
**Split:** ONE_PR | FE_AND_BE
**Areas:** <area> (<lenses>); … **Not reviewed:** <area (why)>, or "nothing".

## Act on

### 1. <plain-language title: what goes wrong, for whom>

- **Where:** `path/to/file.ts:88`
- **Rule:** `.agents/review/roles.md` → Invoices (or `write-code` → <section>, or "general")
- **Who notices:** <a person and what they see, in product words>
- **Found by:** <area> · <lens> · confidence: said | found the line | ran it

**Wrong**

```ts
// smallest snippet that shows it
```

**Right**

```ts
// smallest snippet of the fix
```

## Consider

### <title>

- **Where:** `path:line`
- **Why wait:** <what fixing costs and why it can wait>

<details><summary>Noted (n)</summary>

- <one line each>

</details>

<details><summary>Dismissed (n)</summary>

- <finding>: <one-line reason>

</details>

<details><summary>Already there before this change (n)</summary>

- `path:line`: <one line each>

</details>

## Not reviewed

- <area> (<lines> lines): over the cap. Cover it with `triage.mjs … --only '<regex>'`.

## Not checked

- <what, and the exact command or screenshot that would check it>
````

Rules:

- **Act on** is at most about 5. More means the judge isn't filtering hard enough.
- Split `FE_AND_BE` when there's at least one Act on or Consider item in both
  frontend and backend code; fixes then go in two PRs.
- No score, no praise, no summary of the diff.
- Empty sections are left out, except "Not checked", which says "nothing" when
  everything was checked.
- A whole-app review has no "Already there" section; everything is already
  there.
- When the user wasn't asked to confirm (CI, or they said to go ahead), put
  the plan from step 2 above the report.
