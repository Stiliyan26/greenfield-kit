// Converts the clips a drive recorded (clips/<id>.webm) into mp4 plus a last-frame still
// under temp/explainers/<slug>/clips/, with clips/manifest.json holding their lengths.
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';

import { ROOT } from './constants.mjs';
import {
  explainerDir,
  isMain,
  newestClipsDir,
  parseArgs,
  probeSeconds,
  readJson,
  run,
  writeJson,
} from './lib.mjs';

const CLIP_FPS = 30;
const LAST_FRAME_OFFSET = '-0.2';

export function importClips(slug, { from } = {}) {
  const source = findSourceDir(from);
  const webms = listWebms(source);
  const target = path.join(explainerDir(slug), 'clips');
  const manifestFile = path.join(target, 'manifest.json');
  const manifest = readJson(manifestFile, {});

  mkdirSync(target, { recursive: true });
  console.log(`clips: importing ${webms.length} clip(s) from ${path.relative(ROOT, source)}`);

  for (const name of webms) {
    const id = path.basename(name, '.webm');

    manifest[id] = convertClip(path.join(source, name), target, id);
    console.log(`  ${id}: ${manifest[id].seconds.toFixed(1)}s`);
  }

  writeJson(manifestFile, manifest);

  return manifest;
}

function findSourceDir(from) {
  const source = from ? path.resolve(ROOT, from) : newestClipsDir();

  if (source && existsSync(source)) return source;

  throw new Error('No recorded clips found. Record the journey recipe first (journey.drive in .claude/explain.config.json), or pass --clips <dir>.');
}

function listWebms(source) {
  const webms = readdirSync(source).filter((name) => name.endsWith('.webm')).sort();

  if (webms.length > 0) return webms;

  throw new Error(`${path.relative(ROOT, source)} has no .webm clips.`);
}

function convertClip(input, targetDir, id) {
  const mp4 = path.join(targetDir, `${id}.mp4`);
  const still = path.join(targetDir, `${id}.last.png`);

  run('ffmpeg', mp4Args(input, mp4), { quiet: true });
  run('ffmpeg', lastFrameArgs(mp4, still), { quiet: true });

  return { seconds: probeSeconds(mp4), source: path.relative(ROOT, input) };
}

function mp4Args(input, mp4) {
  return [
    '-y', '-loglevel', 'error', '-i', input,
    '-vf', `scale=trunc(iw/2)*2:trunc(ih/2)*2,fps=${CLIP_FPS}`,
    '-an',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    mp4,
  ];
}

function lastFrameArgs(mp4, still) {
  return ['-y', '-loglevel', 'error', '-sseof', LAST_FRAME_OFFSET, '-i', mp4, '-update', '1', '-frames:v', '1', still];
}

if (isMain(import.meta.url)) {
  const { options, positional } = parseArgs(process.argv.slice(2), { from: 'string' });

  if (positional.length !== 1) {
    throw new Error('Usage: node clips.mjs <slug> [--from <clips dir>]');
  }

  importClips(positional[0], { from: options.from });
}
