#!/usr/bin/env node
// Collect what to review and plan at most 5 agents: up to 4 area reviewers
// (each checks every lens its files need) plus the judge.
//
//   node triage.mjs --out <dir> --base <ref>        committed changes on this branch since <ref>
//   node triage.mjs --out <dir> --uncommitted       staged, unstaged and new files
//   node triage.mjs --out <dir> --range <a>..<b>    a commit range; one commit is <sha>^..<sha>
//   node triage.mjs --out <dir> --app               the whole app, not a diff
//
// Options: --quick (correctness and fit only), --only <regex> (review only
// matching paths), --project <root> (default: the current folder).
// Writes <dir>/files.txt ("<lines>\t<path>"), <dir>/diff.patch (not for --app)
// and <dir>/plan.json, and prints the plan.
// A project may add rules in <root>/.agents/review/triage.json (optional).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, relative, resolve } from 'node:path';

const MAX_AGENTS = 5;
const DEFAULT_LINES_PER_AGENT = { diff: 3000, app: 8000 };

const FULL_LENSES = ['correctness', 'fit', 'scope'];
const QUICK_LENSES = ['correctness', 'fit'];
const LENS_ORDER = ['correctness', 'access', 'data', 'contract', 'ui', 'tests', 'fit', 'scope', 'blind-spot'];

const RULES = [
  {
    lens: 'access',
    why: 'touches routes, guards, auth or queries',
    risk: 3,
    paths: [
      /controller/i, /\.guard\./i, /guards?\//i, /auth/i, /polic(y|ies)/i, /permission/i, /access/i,
      /roles?\./i, /middleware/i, /\.service\./i, /repositor(y|ies)/i, /routes?\//i, /resolver/i,
    ],
  },
  {
    lens: 'data',
    why: 'touches the database or a list',
    risk: 3,
    paths: [/\.entity\./i, /migrations?\//i, /repositor(y|ies)/i, /\.sql$/i, /prisma/i, /seeds?\//i, /paginat/i],
  },
  {
    lens: 'contract',
    why: 'touches an API shape',
    risk: 2,
    paths: [/\.dto\./i, /dto\//i, /contract/i, /openapi|swagger/i, /api\/paths?\//i, /schemas?\//i, /\.enums?\./i],
  },
  {
    lens: 'ui',
    why: 'touches screens or styles',
    risk: 1,
    paths: [/\.(tsx|jsx|vue|svelte)$/i, /\.(s?css|less)$/i, /tokens/i, /DESIGN\.md$/],
  },
];

const TEST = /(\.|\/)(spec|test)s?(\.|\/)|__tests__|(^|\/)e2e\//i;
const SOURCE = /\.(ts|tsx|js|jsx|mjs|cjs|vue|svelte|py|go|rb|java|kt|cs|php|sql|prisma|s?css|less)$/i;
const DOCS = /\.(md|mdx|txt)$/i;
const SKIP = [
  [/(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?|poetry\.lock|Cargo\.lock)$/i, 'lock file'],
  [/\.min\.(js|css)$|\.map$|\.snap$|(^|\/)(dist|build|coverage|generated|__generated__)\//i, 'generated'],
  [/\.(png|jpe?g|gif|webp|avif|ico|pdf|woff2?|ttf|otf|eot|zip|gz|mp4|mov)$/i, 'binary'],
];
const FRONTEND = /client|web|frontend|app\//i;
const BACKEND = /server|api|backend/i;

main();

function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = resolve(args.project ?? '.');
  const project = readProjectRules(root);
  const outDir = relative(root, resolve(args.out));
  const isOutput = (path) => /^temp\//.test(path) || (!outDir.startsWith('..') && path.startsWith(`${outDir}/`));
  const collected = collect(args, root, isOutput);

  collected.files = collected.files.filter((file) => !isOutput(file.path));
  mkdirSync(args.out, { recursive: true });
  writeFileSync(join(args.out, 'files.txt'), collected.files.map((f) => `${f.lines}\t${f.path}`).join('\n') + '\n');

  if (collected.patch !== undefined) {
    writeFileSync(join(args.out, 'diff.patch'), collected.patch);
  }

  const result = plan(collected.files, {
    kind: collected.kind,
    quick: args.quick,
    only: args.only ? new RegExp(args.only, 'i') : undefined,
    project,
  });

  result.target = collected.target;
  writeFileSync(join(args.out, 'plan.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
}

function parseArgs(argv) {
  const args = { quick: false };

  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];

    if (flag === '--uncommitted' || flag === '--app' || flag === '--quick') {
      args[flag.slice(2)] = true;
    } else if (['--out', '--base', '--range', '--only', '--project'].includes(flag)) {
      args[flag.slice(2)] = argv[(i += 1)];
    } else {
      fail(`Unknown argument: ${flag}`);
    }
  }

  const targets = ['base', 'uncommitted', 'range', 'app'].filter((key) => args[key]);

  if (!args.out || targets.length !== 1) {
    fail('Usage: node triage.mjs --out <dir> (--base <ref> | --uncommitted | --range <a>..<b> | --app) [--quick] [--only <regex>] [--project <root>]');
  }

  return args;
}

// Review and test output (temp/, the --out folder) is never part of what gets reviewed.
function collect(args, root, isOutput) {
  if (args.app) {
    const files = git(root, ['ls-files']).split('\n').filter(Boolean)
      .filter((path) => !isOutput(path) && (SOURCE.test(path) || /DESIGN\.md$/.test(path)))
      .map((path) => ({ path, lines: countLines(join(root, path)) }));

    return { kind: 'app', target: 'whole app', files };
  }

  if (args.uncommitted) {
    const files = numstat(git(root, ['diff', '--numstat', 'HEAD']));
    let patch = git(root, ['diff', 'HEAD']);

    const untracked = git(root, ['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean);

    for (const path of untracked.filter((file) => !isOutput(file))) {
      files.push({ path, lines: countLines(join(root, path)) });
      patch += git(root, ['diff', '--no-index', '--', '/dev/null', path], [0, 1]);
    }

    return { kind: 'diff', target: 'uncommitted changes', files, patch };
  }

  const spec = args.base ? `${args.base}...HEAD` : args.range;

  return {
    kind: 'diff',
    target: args.base ? `branch vs ${args.base}` : `range ${args.range}`,
    files: numstat(git(root, ['diff', '--numstat', spec])),
    patch: git(root, ['diff', spec]),
  };
}

export function plan(files, { kind = 'diff', quick = false, only, project = {} } = {}) {
  const skipped = [];
  const review = [];

  for (const file of files) {
    const skip = SKIP.find(([pattern]) => pattern.test(file.path));
    const ignored = (project.ignore ?? []).some((pattern) => new RegExp(pattern, 'i').test(file.path));

    if (skip || ignored) {
      skipped.push({ path: file.path, why: skip ? skip[1] : 'project ignore rule' });
    } else if (!only || only.test(file.path)) {
      review.push(file);
    }
  }

  const perAgent = { ...DEFAULT_LINES_PER_AGENT, ...project.linesPerAgent }[kind];
  const maxAreas = Math.min(project.maxAgents ?? MAX_AGENTS, MAX_AGENTS) - 1;
  const bothSides = hasBothSides(review);
  const groups = split(review, 1, perAgent).map((group) => ({ ...group, risk: risk(group.files, project) }));
  const totalLines = sum(review);
  const bins = [];
  const notReviewed = [];

  if (totalLines <= perAgent) {
    bins.push({ names: ['all changed files'], files: review });
  } else {
    groups.sort((a, b) => b.risk - a.risk || b.lines - a.lines);

    for (const group of groups) {
      const bin = bins.find((candidate) => sum(candidate.files) + group.lines <= perAgent);

      if (bin) {
        bin.names.push(group.name);
        bin.files.push(...group.files);
      } else if (bins.length < maxAreas) {
        bins.push({ names: [group.name], files: [...group.files] });
      } else {
        notReviewed.push({ area: group.name, files: group.files.length, lines: group.lines, why: `over the ${maxAreas + 1}-agent cap` });
      }
    }
  }

  const areas = bins.filter((bin) => bin.files.length > 0).map((bin) => {
    const lenses = pickLenses(bin.files, { quick, bothSides, project });

    return {
      name: kind === 'app' && bin.names[0] === 'all changed files' ? 'whole app' : bin.names.sort().join(', '),
      lines: sum(bin.files),
      files: bin.files.map((file) => file.path).sort(),
      lenses: Object.keys(lenses).sort((a, b) => LENS_ORDER.indexOf(a) - LENS_ORDER.indexOf(b)),
      reasons: lenses,
    };
  });

  return {
    kind,
    mode: quick ? 'quick' : 'full',
    linesPerAgent: perAgent,
    totalLines,
    agents: areas.length + (areas.length > 0 ? 1 : 0),
    areas,
    notReviewed,
    skipped,
  };
}

function pickLenses(files, { quick, bothSides, project }) {
  const lenses = {};
  const add = (lens, why) => {
    lenses[lens] ??= why;
  };
  const code = files.filter((file) => !DOCS.test(file.path) || /DESIGN\.md$/.test(file.path));

  for (const lens of quick ? QUICK_LENSES : [...FULL_LENSES, ...(project.always ?? [])]) {
    add(lens, 'runs on every review');
  }

  if (!quick) {
    for (const rule of [...RULES, ...projectRules(project)]) {
      const hit = code.find((file) => rule.paths.some((pattern) => pattern.test(file.path)));

      if (hit) {
        add(rule.lens, `${rule.why} (${hit.path})`);
      }
    }

    const source = files.filter((file) => SOURCE.test(file.path) && !TEST.test(file.path));

    if (bothSides && source.some((file) => FRONTEND.test(file.path) || BACKEND.test(file.path))) {
      add('contract', 'frontend and backend changed together');
    }

    if (source.length > 0 || files.some((file) => TEST.test(file.path))) {
      add('tests', 'source or tests changed');
    }
  }

  if (files.every((file) => DOCS.test(file.path))) {
    for (const lens of Object.keys(lenses)) {
      if (lens !== 'scope') {
        delete lenses[lens];
      }
    }
  }

  for (const lens of project.never ?? []) {
    delete lenses[lens];
  }

  if (!quick && code.length > 0) {
    add('blind-spot', 'last pass: what the other lenses usually miss');
  }

  return lenses;
}

// Group files by folder, going one level deeper wherever a group is too big for one agent.
function split(files, depth, perAgent) {
  const groups = {};

  for (const file of files) {
    const parts = file.path.split('/');
    const key = parts.length > depth ? parts.slice(0, depth).join('/') : file.path;

    (groups[key] ??= []).push(file);
  }

  return Object.entries(groups).flatMap(([name, list]) => {
    const deeper = list.some((file) => file.path.split('/').length > depth + 1);

    if (sum(list) > perAgent && list.length > 1 && deeper) {
      return split(list, depth + 1, perAgent);
    }

    return [{ name, files: list, lines: sum(list) }];
  });
}

function risk(files, project) {
  const rules = [...RULES, ...projectRules(project).map((rule) => ({ ...rule, risk: 3 }))];

  return Math.max(0, ...files.map((file) => Math.max(
    SOURCE.test(file.path) ? 1 : 0,
    ...rules.filter((rule) => rule.paths.some((pattern) => pattern.test(file.path))).map((rule) => rule.risk),
  )));
}

function hasBothSides(files) {
  const source = files.filter((file) => SOURCE.test(file.path) && !TEST.test(file.path));
  const tops = new Set(files.map((file) => (file.path.includes('/') ? file.path.split('/')[0] : '.')));

  return tops.size > 1 && source.some((file) => FRONTEND.test(file.path)) && source.some((file) => BACKEND.test(file.path));
}

function projectRules(project) {
  return (project.rules ?? []).map((rule) => ({
    lens: rule.lens,
    why: rule.why ?? 'project rule',
    risk: 3,
    paths: rule.paths.map((pattern) => new RegExp(pattern, 'i')),
  }));
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

function readProjectRules(root) {
  const path = resolve(root, '.agents/review/triage.json');

  if (!existsSync(path)) {
    return {};
  }

  const project = JSON.parse(readFileSync(path, 'utf8'));
  const named = [...(project.always ?? []), ...(project.never ?? []), ...(project.rules ?? []).map((rule) => rule.lens)];
  const unknown = named.filter((lens) => !LENS_ORDER.includes(lens));

  if (unknown.length > 0) {
    const names = unknown.map((lens) => lens ?? 'a rule with no "lens"');

    fail(`${path}: unknown lens ${names.join(', ')}. Use one of: ${LENS_ORDER.join(', ')}.`);
  }

  return project;
}

function fail(message) {
  console.error(message);
  process.exit(2);
}
