#!/usr/bin/env node
// Pick the review specialists for a change from its changed file paths.
//
//   node triage.mjs <files.txt> [--project <root>]
//
// <files.txt> holds one changed path per line (git diff --name-only).
// Prints JSON: { reviewers, reasons, chunks, changedLines? }.
// A project adds rules in <root>/.agents/review/triage.json:
//   { "rules": [{ "reviewer": "review-access", "paths": ["^src/billing/"] }],
//     "always": ["review-scope"], "never": ["review-ui"], "chunkBy": 1, "maxChunks": 4 }
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ALWAYS = ['review-correctness', 'review-fit', 'review-scope'];

const RULES = [
  {
    reviewer: 'review-access',
    why: 'touches routes, guards, auth or queries',
    paths: [
      /controller/i, /\.guard\./i, /guards?\//i, /auth/i, /polic(y|ies)/i, /permission/i, /access/i,
      /roles?\./i, /middleware/i, /\.service\./i, /repositor(y|ies)/i, /routes?\//i, /resolver/i,
    ],
  },
  {
    reviewer: 'review-contract',
    why: 'touches an API shape',
    paths: [/\.dto\./i, /dto\//i, /contract/i, /openapi|swagger/i, /api\/paths?\//i, /schemas?\//i, /\.enums?\./i],
  },
  {
    reviewer: 'review-data',
    why: 'touches the database or a list',
    paths: [/\.entity\./i, /migrations?\//i, /repositor(y|ies)/i, /\.sql$/i, /prisma/i, /seeds?\//i, /paginat/i],
  },
  {
    reviewer: 'review-ui',
    why: 'touches screens or styles',
    paths: [/\.(tsx|jsx|vue|svelte)$/i, /\.(s?css|less)$/i, /tokens/i, /DESIGN\.md$/],
  },
];

const TEST = /(\.|\/)(spec|test)s?(\.|\/)|__tests__|(^|\/)e2e\//i;
const SOURCE = /\.(ts|tsx|js|jsx|mjs|cjs|vue|svelte|py|go|rb|java|kt|cs|php)$/i;
const DOCS = /\.(md|mdx|txt)$/i;

main();

function main() {
  const [filesArg, ...rest] = process.argv.slice(2);

  if (!filesArg) {
    console.error('Usage: node triage.mjs <files.txt> [--project <root>]');
    process.exit(2);
  }

  const flag = rest.indexOf('--project');
  const root = resolve(flag >= 0 ? rest[flag + 1] : '.');
  const files = readFileSync(filesArg, 'utf8').split('\n').map((line) => line.trim()).filter(Boolean);
  const project = readProjectRules(root);

  console.log(JSON.stringify(triage(files, project), null, 2));
}

export function triage(files, project = {}) {
  const reasons = {};
  const add = (reviewer, why) => {
    reasons[reviewer] ??= why;
  };

  for (const reviewer of [...ALWAYS, ...(project.always ?? [])]) {
    add(reviewer, 'runs on every review');
  }

  const code = files.filter((file) => !DOCS.test(file) || /DESIGN\.md$/.test(file));

  for (const rule of [...RULES, ...projectRules(project)]) {
    const hit = code.find((file) => rule.paths.some((pattern) => pattern.test(file)));

    if (hit) {
      add(rule.reviewer, `${rule.why} (${hit})`);
    }
  }

  const tops = new Set(files.map(topFolder));
  const sourceChanged = files.filter((file) => SOURCE.test(file) && !TEST.test(file));

  if (tops.size > 1 && sourceChanged.some((file) => /client|web|frontend|app\//i.test(file)) && sourceChanged.some((file) => /server|api|backend/i.test(file))) {
    add('review-contract', 'frontend and backend changed together');
  }

  if (sourceChanged.length > 0 || files.some((file) => TEST.test(file))) {
    add('review-tests', 'source or tests changed');
  }

  if (files.every((file) => DOCS.test(file))) {
    for (const reviewer of Object.keys(reasons)) {
      if (reviewer !== 'review-scope') {
        delete reasons[reviewer];
      }
    }
  }

  for (const reviewer of project.never ?? []) {
    delete reasons[reviewer];
  }

  const groups = chunks(files, project.chunkBy ?? 1);

  return { reviewers: Object.keys(reasons), reasons, chunks: pack(groups, project.maxChunks ?? 4) };
}

function projectRules(project) {
  return (project.rules ?? []).map((rule) => ({
    reviewer: rule.reviewer,
    why: rule.why ?? 'project rule',
    paths: rule.paths.map((pattern) => new RegExp(pattern, 'i')),
  }));
}

// Group files by their first <depth> folders, so a big diff can be reviewed in parts.
function chunks(files, depth) {
  const groups = {};

  for (const file of files) {
    const key = file.split('/').slice(0, depth).join('/') || '.';

    (groups[key] ??= []).push(file);
  }

  return Object.entries(groups).map(([name, list]) => ({ name, files: list }));
}

// Pack folder groups into at most <max> chunks of similar size, keeping each
// folder whole, so a big diff costs max × reviewers agents, not one per folder.
function pack(groups, max) {
  if (groups.length <= max) {
    return groups;
  }

  const bins = Array.from({ length: max }, () => ({ names: [], files: [] }));
  const bySize = [...groups].sort((a, b) => b.files.length - a.files.length);

  for (const group of bySize) {
    const smallest = bins.reduce((min, bin) => (bin.files.length < min.files.length ? bin : min));

    smallest.names.push(group.name);
    smallest.files.push(...group.files);
  }

  return bins.map((bin) => ({ name: bin.names.sort().join(', '), files: bin.files.sort() }));
}

function topFolder(file) {
  return file.includes('/') ? file.split('/')[0] : '.';
}

function readProjectRules(root) {
  const path = resolve(root, '.agents/review/triage.json');

  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {};
}
