#!/usr/bin/env node
// Collect what to review and group it by feature: one reviewer per feature.
//
//   node triage.mjs --out <dir> --base <ref>        committed changes on this branch since <ref>
//   node triage.mjs --out <dir> --uncommitted       staged, unstaged and new files
//   node triage.mjs --out <dir> --range <a>..<b>    a commit range; one commit is <sha>^..<sha>
//   node triage.mjs --out <dir> --app               the whole app, not a diff
//   node triage.mjs --out <dir> --plan <file>...    plan files, no diff; one feature "plan"
//
// Option: --project <root> (default: the current folder).
// Writes <dir>/files.txt ("<lines>\t<path>"), <dir>/diff.patch (not for --app or --plan)
// and <dir>/plan.json, and prints a short plan.
// A project may add {"ignore": ["<regex>", ...]} in <root>/.claude/review/triage.json (optional).
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, relative, resolve } from 'node:path';

const SPLIT_LINES = 5000; // a path-derived feature above this is split one folder deeper
const MIN_LINES = 800; // a path-derived feature below this merges into its parent folder's feature
const SOURCE = /\.(ts|tsx|js|jsx|mjs|cjs|vue|svelte|py|go|rb|java|kt|cs|php|sql|prisma|s?css|less)$/i;
const SKIP = [
  [/(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?|poetry\.lock|Cargo\.lock)$/i, 'lock file'],
  [/\.min\.(js|css)$|\.map$|\.snap$|(^|\/)(dist|build|coverage|generated|__generated__)\//i, 'generated'],
  [/\.(png|jpe?g|gif|webp|avif|ico|pdf|woff2?|ttf|otf|eot|zip|gz|mp4|mov)$/i, 'binary'],
];

main();

function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = resolve(args.project ?? '.');
  const ignore = readIgnore(root);
  const outDir = relative(root, resolve(args.out));
  const isOutput = (path) => /^temp\//.test(path) || (!outDir.startsWith('..') && path.startsWith(`${outDir}/`));
  const collected = collect(args, root, isOutput);

  const skipped = [];
  const files = [];

  for (const file of collected.files.filter((f) => !isOutput(f.path))) {
    const skip = SKIP.find(([pattern]) => pattern.test(file.path));
    const ignored = ignore.some((pattern) => pattern.test(file.path));
    const deleted = collected.patch !== undefined && !existsSync(join(root, file.path));

    if (skip || ignored || deleted) {
      skipped.push({ path: file.path, why: skip ? skip[1] : ignored ? 'project ignore rule' : 'deleted' });
    } else {
      files.push(file);
    }
  }

  mkdirSync(args.out, { recursive: true });
  writeFileSync(join(args.out, 'files.txt'), files.map((f) => `${f.lines}\t${f.path}`).join('\n') + '\n');

  if (collected.patch !== undefined) {
    writeFileSync(join(args.out, 'diff.patch'), collected.patch);
  }

  const features = args.plan
    ? [{ name: 'plan', source: 'path', files }]
    : group(files, readFeatureFiles(root));

  const result = {
    target: collected.target,
    totalLines: sum(files),
    features: features
      .map((f) => ({ name: f.name, source: f.source, lines: sum(f.files), files: f.files.sort((a, b) => a.path.localeCompare(b.path)) }))
      .sort((a, b) => b.lines - a.lines || a.name.localeCompare(b.name)),
    skipped,
  };

  writeFileSync(join(args.out, 'plan.json'), JSON.stringify(result, null, 2) + '\n');

  for (const f of result.features) {
    console.log(`${f.name}\t${f.lines} lines\t${f.files.length} files`);
  }

  console.log(`${result.features.length} features, ${result.totalLines} lines, ${skipped.length} skipped`);
}

function parseArgs(argv) {
  const args = {};

  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];

    if (flag === '--uncommitted' || flag === '--app') {
      args[flag.slice(2)] = true;
    } else if (['--out', '--base', '--range', '--project'].includes(flag)) {
      args[flag.slice(2)] = argv[(i += 1)];
    } else if (flag === '--plan') {
      args.plan = [];

      while (i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
        args.plan.push(argv[(i += 1)]);
      }
    } else {
      fail(`Unknown argument: ${flag}`);
    }
  }

  const targets = ['base', 'uncommitted', 'range', 'app', 'plan'].filter((key) => args[key]);

  if (!args.out || targets.length !== 1 || (args.plan && args.plan.length === 0)) {
    fail('Usage: node triage.mjs --out <dir> (--base <ref> | --uncommitted | --range <a>..<b> | --app | --plan <file>...) [--project <root>]');
  }

  return args;
}

// Review and test output (temp/, the --out folder) is never part of what gets reviewed.
function collect(args, root, isOutput) {
  if (args.plan) {
    const files = args.plan.map((file) => {
      const path = relative(root, resolve(root, file));

      return { path, lines: countLines(join(root, path)) };
    });

    return { target: { kind: 'plan' }, files };
  }

  if (args.app) {
    const files = git(root, ['ls-files']).split('\n').filter(Boolean)
      .filter((path) => !isOutput(path) && (SOURCE.test(path) || /DESIGN\.md$/.test(path)))
      .map((path) => ({ path, lines: countLines(join(root, path)) }));

    return { target: { kind: 'app' }, files };
  }

  if (args.uncommitted) {
    const files = numstat(git(root, ['diff', '--numstat', '--no-renames', 'HEAD']));
    let patch = git(root, ['diff', 'HEAD']);
    const untracked = git(root, ['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean);

    for (const path of untracked.filter((file) => !isOutput(file))) {
      files.push({ path, lines: countLines(join(root, path)) });
      patch += git(root, ['diff', '--no-index', '--', '/dev/null', path], [0, 1]);
    }

    return { target: { kind: 'uncommitted' }, files, patch };
  }

  const spec = args.base ? `${args.base}...HEAD` : args.range;

  return {
    target: args.base ? { kind: 'branch', base: args.base } : { kind: 'range', range: args.range },
    files: numstat(git(root, ['diff', '--numstat', '--no-renames', spec])),
    patch: git(root, ['diff', spec]),
  };
}

// 1. feature files' "Owns" globs, 2. a name derived from the path, 3. "other".
function group(files, featureFiles) {
  const byName = new Map();
  const add = (name, source, file) => {
    const entry = byName.get(name) ?? { name, source, files: [] };

    if (source !== 'path') {
      entry.source = source;
    }

    entry.files.push(file);
    byName.set(name, entry);
  };

  for (const file of files) {
    const owner = featureFiles.find((f) => f.globs.some((glob) => glob.test(file.path)));

    add(owner ? owner.name : deriveName(file.path), owner ? owner.source : 'path', file);
  }

  return mergeSmall([...byName.values()].flatMap((entry) => split(entry)));
}

// A path-derived feature over SPLIT_LINES that has subfolders is split one
// level deeper, so one reviewer never gets a whole package: "plugin" becomes
// "plugin/skills/review", "plugin/skills/shadcn", ... Feature-file features
// are never split; the plan drew them.
function split(entry, depth = 0) {
  if (entry.source !== 'path' || entry.name === 'other' || sum(entry.files) <= SPLIT_LINES || depth > 4) {
    return [entry];
  }

  const prefix = `${entry.name}/`;
  const byChild = new Map();

  for (const file of entry.files) {
    const rest = file.path.startsWith(prefix) ? file.path.slice(prefix.length) : file.path;
    const slash = rest.indexOf('/');
    const child = slash < 0 ? entry.name : `${entry.name}/${rest.slice(0, slash)}`;
    const list = byChild.get(child) ?? [];

    list.push(file);
    byChild.set(child, list);
  }

  if (byChild.size < 2) {
    return [entry];
  }

  return [...byChild].flatMap(([name, files]) => split({ name, source: 'path', files }, depth + 1));
}

function deriveName(path) {
  const parts = path.split('/');
  const dirs = parts.slice(0, -1);

  if (dirs.length === 0 || dirs[0].startsWith('.') || ['docs', 'scripts'].includes(dirs[0])) {
    return 'other';
  }

  const after = (index) => (index >= 0 && index + 1 < dirs.length ? dirs[index + 1] : undefined);
  const byFeatures = after(dirs.indexOf('features'));

  if (byFeatures) {
    return byFeatures;
  }

  const pkgEnd = ['apps', 'packages'].includes(dirs[0]) ? 2 : 1;

  if (dirs[pkgEnd] === 'src' && dirs.length > pkgEnd + 1) {
    return dirs[pkgEnd + 1];
  }

  return dirs[0];
}

// Small path-derived features (under MIN_LINES) merge into their parent
// folder's feature ("plugin/skills/bro" → "plugin/skills"), or into "other"
// when they have no parent, so a reviewer never gets a 7-line feature.
function depth(name) {
  return name.split('/').length;
}

// Deepest first, so a parent collects all its small children before it is
// judged itself.
function mergeSmall(features) {
  const byName = new Map(features.map((f) => [f.name, f]));

  for (;;) {
    const small = [...byName.values()]
      .filter((f) => f.source === 'path' && f.name !== 'other' && sum(f.files) < MIN_LINES)
      .sort((a, b) => depth(b.name) - depth(a.name) || sum(a.files) - sum(b.files))[0];

    if (!small) {
      break;
    }

    const slash = small.name.lastIndexOf('/');
    const target = slash < 0 ? 'other' : small.name.slice(0, slash);
    const into = byName.get(target) ?? { name: target, source: 'path', files: [] };

    into.files.push(...small.files);
    byName.delete(small.name);
    byName.set(target, into);
  }

  return [...byName.values()];
}

function readFeatureFiles(root) {
  const plans = join(root, 'docs/plans');
  const found = [];

  if (!existsSync(plans)) {
    return found;
  }

  for (const project of readdirSync(plans, { withFileTypes: true }).filter((d) => d.isDirectory())) {
    const dir = join(plans, project.name, 'features');

    if (!existsSync(dir)) {
      continue;
    }

    for (const name of readdirSync(dir).filter((n) => n.endsWith('.md')).sort()) {
      const globs = parseOwns(readFileSync(join(dir, name), 'utf8'));

      if (globs.length > 0) {
        found.push({ name: name.slice(0, -3), source: `docs/plans/${project.name}/features/${name}`, globs });
      }
    }
  }

  return found;
}

// Reads the "- Owns:" bullet (and its indented continuation lines); keeps path globs, drops endpoints and tables.
function parseOwns(text) {
  const lines = text.split('\n');
  const start = lines.findIndex((line) => /^\s*-\s*Owns:/i.test(line));

  if (start < 0) {
    return [];
  }

  let block = lines[start];

  for (let i = start + 1; i < lines.length && /^\s+\S/.test(lines[i]) && !/^\s*-\s/.test(lines[i]); i += 1) {
    block += ` ${lines[i]}`;
  }

  return [...block.matchAll(/`([^`]+)`/g)]
    .map((m) => m[1].trim())
    .filter((item) => !/\s/.test(item) && /[/*]/.test(item))
    .map(globToRegExp);
}

export function globToRegExp(glob) {
  let out = '';

  for (let i = 0; i < glob.length; i += 1) {
    const char = glob[i];

    if (char === '*' && glob[i + 1] === '*') {
      if (glob[i + 2] === '/') {
        out += '(?:.*/)?';
        i += 2;
      } else {
        out += '.*';
        i += 1;
      }
    } else if (char === '*') {
      out += '[^/]*';
    } else if (char === '?') {
      out += '[^/]';
    } else {
      out += char.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    }
  }

  return new RegExp(`^${out.replace(/^\.\//, '')}$`);
}

function numstat(text) {
  return text.split('\n').filter(Boolean).map((line) => {
    const [added, deleted, ...rest] = line.split('\t');
    const lines = added === '-' ? 0 : Number(added) + Number(deleted);

    return { path: rest.join('\t'), lines };
  });
}

function countLines(path) {
  try {
    const text = readFileSync(path, 'utf8');

    return text.split('\n').length - (text.endsWith('\n') ? 1 : 0);
  } catch {
    return 0;
  }
}

function sum(files) {
  return files.reduce((total, file) => total + file.lines, 0);
}

function git(root, args, okCodes = [0]) {
  const run = spawnSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 1 << 30 });

  if (!okCodes.includes(run.status)) {
    fail(`git ${args.join(' ')} failed:\n${run.stderr}`);
  }

  return run.stdout;
}

// Only "ignore" is read; any other key in the project file is ignored silently.
function readIgnore(root) {
  const path = resolve(root, '.claude/review/triage.json');

  if (!existsSync(path)) {
    return [];
  }

  const project = JSON.parse(readFileSync(path, 'utf8'));

  return (Array.isArray(project.ignore) ? project.ignore : []).map((pattern) => new RegExp(pattern, 'i'));
}

function fail(message) {
  console.error(message);
  process.exit(2);
}
