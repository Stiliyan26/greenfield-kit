#!/bin/bash
# Throwaway test of review/scripts/triage.mjs in a fake repo.
set -e
S="$(cd "$(dirname "$0")" && pwd)"
T=/Users/stiliyan26/projects/greenfield-kit/plugin/skills/review/scripts/triage.mjs
W="$S/app-$(date +%s)"
mkdir -p "$W" && cd "$W"
git init -q -b main && git config user.email t@t && git config user.name t

gen() { mkdir -p "$(dirname "$1")"; for i in $(seq 1 "$2"); do echo "const x$i = $i;"; done > "$1"; }
show() { node -e '
const p = JSON.parse(require("fs").readFileSync(0));
console.log(`${p.target} | ${p.mode} | agents ${p.agents} | lines ${p.totalLines} | per agent ${p.linesPerAgent}`);
for (const a of p.areas) console.log(`  AREA ${a.name} (${a.lines} lines, ${a.files.length} files): ${a.lenses.join(", ")}`);
for (const n of p.notReviewed) console.log(`  NOT REVIEWED ${n.area} (${n.lines} lines): ${n.why}`);
for (const s of p.skipped) console.log(`  SKIPPED ${s.path}: ${s.why}`);'; }

gen server/src/auth/auth.guard.ts 50
gen client/src/orders/OrderList.tsx 50
echo "# readme" > README.md
git add -A && git commit -qm init
git switch -q -c feature
gen server/src/invoices/invoice.service.ts 400
gen server/src/invoices/invoice.dto.ts 100
gen client/src/invoices/InvoicePage.tsx 300
gen server/src/migrations/001_invoices.sql 40
echo '{"lockfileVersion":3}' > package-lock.json
git add -A && git commit -qm feat

echo "=== A. branch vs main (small)"
node "$T" --out "$W/temp/review/run-a" --base main | show
echo "files written: $(ls "$W/temp/review/run-a" | tr '\n' ' ')"

echo "=== B. uncommitted: one edited file + one new file"
echo "const y = 1;" >> server/src/auth/auth.guard.ts
gen server/src/leave/leave.repository.ts 20
node "$T" --out "$W/temp/review/run-b" --uncommitted | show
echo "diffs in patch: $(grep -c '^diff --git' "$W/temp/review/run-b/diff.patch")"
git add -A && git commit -qm wip

echo "=== C. one commit as a range, quick"
node "$T" --out "$W/temp/review/run-c" --range HEAD^..HEAD --quick | show

echo "=== D. docs only"
echo more >> README.md
node "$T" --out "$W/temp/review/run-d" --uncommitted | show
git commit -qam docs

echo "=== E. big branch: 12 modules, ~2,000 lines each"
git switch -q -c big main
for m in auth invoices leave orders customers reports settings; do gen "server/src/$m/$m.service.ts" 2000; done
for m in orders customers reports dashboard calendar; do gen "client/src/$m/${m}Page.tsx" 2000; done
git add -A && git commit -qm big
node "$T" --out "$W/temp/review/run-e" --base main | show

echo "=== F. same, only the invoices and auth areas"
node "$T" --out "$W/temp/review/run-f" --base main --only 'server/src/(invoices|auth)/' | show

echo "=== G. whole app"
node "$T" --out "$W/temp/review/run-g" --app | show
echo "diff.patch for --app: $(ls "$W/temp/review/run-g/diff.patch" 2>/dev/null || echo none)"

echo "=== H. old-style project rules fail loudly"
mkdir -p .agents/review
echo '{"rules":[{"reviewer":"review-access","paths":["^server/"]}],"always":["review-scope"]}' > .agents/review/triage.json
node "$T" --out "$W/temp/review/run-h" --base main && echo "UNEXPECTED PASS" || echo "exit $? (expected 2)"

echo "=== I. project rule with a lens + lower cap"
echo '{"rules":[{"lens":"access","why":"billing is money","paths":["^client/src/reports/"]}],"maxAgents":3}' > .agents/review/triage.json
node "$T" --out "$W/temp/review/run-i" --base main | show

echo "=== J. bad usage"
node "$T" --out "$W/temp/review/run-j" 2>&1 || echo "exit $? (expected 2)"
