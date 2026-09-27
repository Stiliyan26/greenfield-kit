// Dead code (knip) and copied code (jscpd) gate. Copied into a project by the
// greenfield-kit review skill (references/tools.md).
// Existing findings are frozen in scripts/gates/baseline.json. A new finding
// fails; a fixed one is reported so the baseline can shrink.
//
//   node scripts/gates/baseline.mjs            check
//   node scripts/gates/baseline.mjs --update   rewrite the baseline
//
// PACKAGES lists the folders that each have their own package.json with knip
// and jscpd installed. Use ['.'] for a single-package project.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '../../..');
const BASELINE = resolve(ROOT, 'scripts/gates/baseline.json');
const PACKAGES = ['client', 'server']; // edit for your project
const KNIP_TYPES = ['files', 'dependencies', 'devDependencies', 'unlisted', 'unresolved', 'exports', 'types', 'enumMembers', 'duplicates'];
const JSCPD_ARGS = ['src', '--min-lines', '10', '--min-tokens', '70', '--ignore', '**/*.spec.ts,**/database/migrations/**', '--silent'];

main();

function main() {
  const update = process.argv.includes('--update');
  const current = collect();

  if (update) {
    writeFileSync(BASELINE, `${JSON.stringify(current, null, 2)}\n`);
    console.log(`Baseline written: ${countAll(current)} known findings.`);

    return;
  }

  const known = readBaseline();
  const added = diff(current, known);
  const fixed = diff(known, current);

  report(added, fixed);
  process.exitCode = countAll(added) > 0 ? 1 : 0;
}

function collect() {
  const result = {};

  for (const pkg of PACKAGES) {
    result[pkg] = { dead: knipFindings(pkg), copied: jscpdFindings(pkg) };
  }

  return result;
}

function knipFindings(pkg) {
  const out = run(pkg, 'node_modules/.bin/knip', ['--reporter', 'json', '--no-exit-code']);
  const { issues } = JSON.parse(out);
  const keys = issues.flatMap((issue) => KNIP_TYPES.flatMap((type) => knipKeys(issue, type)));

  return [...new Set(keys)].sort();
}

function knipKeys(issue, type) {
  const entries = issue[type] ?? [];
  const list = Array.isArray(entries) ? entries : Object.values(entries).flat();

  if (type === 'files') {
    return list.map((entry) => `files ${nameOf(entry)}`);
  }

  return list.map((entry) => `${type} ${issue.file} ${nameOf(entry)}`);
}

function nameOf(entry) {
  if (Array.isArray(entry)) {
    return entry.map(nameOf).join('|');
  }

  return typeof entry === 'string' ? entry : entry.name;
}

function jscpdFindings(pkg) {
  const dir = mkdtempSync(join(tmpdir(), 'jscpd-'));

  try {
    run(pkg, 'node_modules/.bin/jscpd', [...JSCPD_ARGS, '--reporters', 'json', '--output', dir]);
    const { duplicates } = JSON.parse(readFileSync(join(dir, 'jscpd-report.json'), 'utf8'));
    const keys = duplicates.map(copyKey);

    return [...new Set(keys)].sort();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// Keyed by the two files and the copied text, so moving the block keeps the key.
function copyKey(duplicate) {
  const files = [duplicate.firstFile.name, duplicate.secondFile.name].sort().join(' <> ');
  const text = duplicate.fragment.replace(/\s+/g, ' ').trim();
  const hash = createHash('sha256').update(text).digest('hex').slice(0, 12);

  return `${files} #${hash}`;
}

function run(pkg, bin, args) {
  const result = spawnSync(resolve(ROOT, pkg, bin), args, { cwd: resolve(ROOT, pkg), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

  if (result.error || result.status !== 0) {
    throw new Error(`${pkg}: ${bin} failed\n${result.stderr || result.error?.message}`);
  }

  return result.stdout;
}

function readBaseline() {
  try {
    return JSON.parse(readFileSync(BASELINE, 'utf8'));
  } catch {
    return {};
  }
}

function diff(from, against) {
  const result = {};

  for (const pkg of PACKAGES) {
    for (const kind of ['dead', 'copied']) {
      const known = new Set(against[pkg]?.[kind] ?? []);
      const extra = (from[pkg]?.[kind] ?? []).filter((key) => !known.has(key));

      result[`${pkg} ${kind}`] = extra;
    }
  }

  return result;
}

function countAll(groups) {
  return Object.values(groups)
    .flatMap((value) => (Array.isArray(value) ? value : Object.values(value)))
    .flat().length;
}

function report(added, fixed) {
  for (const [group, keys] of Object.entries(added)) {
    for (const key of keys) {
      console.error(`NEW ${group}: ${key}`);
    }
  }

  const fixedCount = countAll(fixed);

  if (fixedCount > 0) {
    console.log(`${fixedCount} known findings are gone. Run with --update to shrink the baseline.`);
  }

  console.log(countAll(added) === 0 ? 'No new dead or copied code.' : 'New dead or copied code. Fix it, or run with --update if it is intended.');
}
