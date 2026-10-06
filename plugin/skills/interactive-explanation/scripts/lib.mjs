import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  EXPLAINERS_DIR,
  ID_PATTERN,
  LOCAL_ENV_FILE,
  ROOT,
  USER_ENV_FILE,
  VERIFICATION_DIR,
} from './constants.mjs';

const ENV_LINE_PATTERN = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/;
const MAX_BUFFER_BYTES = 64 * 1024 * 1024;

export function explainerDir(slug) {
  if (!ID_PATTERN.test(slug)) {
    throw new Error(`Slug "${slug}" must be lowercase letters, digits and dashes.`);
  }

  return path.join(EXPLAINERS_DIR, slug);
}

export function isMain(metaUrl) {
  const entry = process.argv[1];

  return entry !== undefined && path.resolve(entry) === fileURLToPath(metaUrl);
}

export function readJson(file, fallback) {
  if (!existsSync(file)) return fallback;

  return JSON.parse(readFileSync(file, 'utf8'));
}

export function writeJson(file, value) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

export function sha1(text) {
  return createHash('sha1').update(text).digest('hex');
}

export function run(command, args, options = {}) {
  const { cwd = ROOT, env = process.env, quiet = false } = options;
  const result = spawnSync(command, args, {
    cwd,
    env,
    stdio: stdioFor(quiet),
    encoding: 'utf8',
    maxBuffer: MAX_BUFFER_BYTES,
  });

  if (result.error) throw result.error;

  if (result.status !== 0) {
    const detail = quiet ? `\n${result.stderr}` : '';
    throw new Error(`${command} ${args.join(' ')} failed (exit ${result.status})${detail}`);
  }

  return result.stdout ?? '';
}

export function probeSeconds(file) {
  const output = run(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file],
    { quiet: true },
  );
  const seconds = Number.parseFloat(output.trim());

  if (!Number.isFinite(seconds)) {
    throw new Error(`ffprobe could not read the duration of ${file}`);
  }

  return seconds;
}

// Reads the project's voice env file, then the user's (KEY=VALUE lines). The
// real environment wins, then the project file, then the user file.
export function loadLocalEnv() {
  for (const file of [LOCAL_ENV_FILE, USER_ENV_FILE]) {
    if (!existsSync(file)) continue;

    const lines = readFileSync(file, 'utf8').split('\n');
    const entries = lines.map(parseEnvLine).filter(Boolean);

    for (const [key, value] of entries) {
      process.env[key] ||= value;
    }
  }
}

export function newestClipsDir() {
  const candidates = listClipsDirs();
  if (candidates.length === 0) return null;

  const [newest] = candidates.sort((a, b) => b.modifiedAt - a.modifiedAt);

  return newest.dir;
}

// flags maps each allowed option name to 'boolean' or 'string'.
export function parseArgs(argv, flags) {
  const options = {};
  const positional = [];
  const queue = [...argv];

  while (queue.length > 0) {
    const arg = queue.shift();

    if (!arg.startsWith('--')) {
      positional.push(arg);
      continue;
    }

    const name = arg.slice(2);
    assertKnownFlag(name, flags);
    options[name] = readFlagValue(flags[name], queue);
  }

  return { options, positional };
}

function stdioFor(quiet) {
  if (quiet) return ['ignore', 'pipe', 'pipe'];

  return 'inherit';
}

function parseEnvLine(line) {
  if (line.trim().startsWith('#')) return null;

  const match = ENV_LINE_PATTERN.exec(line);
  if (!match) return null;

  const [, key, rawValue] = match;

  return [key, rawValue.replace(/^(['"])(.*)\1$/, '$2')];
}

function listClipsDirs() {
  return driveDirs()
    .map((dir) => path.join(dir, 'clips'))
    .filter((dir) => existsSync(dir))
    .map((dir) => ({ dir, modifiedAt: statSync(dir).mtimeMs }));
}

// The journey drive folders under the project's evidence folder (`journey.evidence`).
export function driveDirs() {
  if (!VERIFICATION_DIR || !existsSync(VERIFICATION_DIR)) return [];

  return subdirectories(VERIFICATION_DIR)
    .flatMap(subdirectories)
    .filter((dir) => path.basename(dir).startsWith('drive-'));
}

function subdirectories(dir) {
  return readdirSync(dir)
    .map((name) => path.join(dir, name))
    .filter((child) => statSync(child).isDirectory());
}

function assertKnownFlag(name, flags) {
  if (name in flags) return;

  throw new Error(`Unknown option --${name}`);
}

function readFlagValue(kind, queue) {
  if (kind === 'boolean') return true;

  return queue.shift();
}

// Where each component sits on a screenshot: `<step>.components.json` next to `<step>.png`.
export function componentBoxesFile(png) {
  return png.replace(/\.png$/, '.components.json');
}
