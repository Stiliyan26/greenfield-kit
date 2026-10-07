// The feature page: temp/explainers/<slug>/index.html. Read top to bottom in 2–5
// minutes: title, impact and merge danger chips, summary (with sketches), before →
// after, how it works (with the architecture video), data model, evidence (with
// the journey video and tests), outcome, merge danger and the review map.
import { copyFileSync, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { ROOT, videosIn } from './constants.mjs';
import { loadDatabase } from './database.mjs';
import { componentBoxesFile, driveDirs, explainerDir, isMain, readJson, run } from './lib.mjs';
import { renderPage } from './page/template.mjs';
import { buildReview } from './review.mjs';
import { readScript } from './script.mjs';
import { readingMinutes } from './ste.mjs';

const POSTER_SECOND = '1.5';

export function writePage(slug) {
  const dir = explainerDir(slug);
  const script = readScript(slug);
  const props = readJson(path.join(dir, 'props.json'), {});

  const videos = videosIn(script);

  assertRendered(props, videos);
  videos.forEach((video) => writePoster(dir, video));

  const screens = collectScreens(dir, script.screens);
  const context = {
    script,
    database: loadDatabase(script.database),
    review: buildReview(dir, script, screens),
    readMinutes: readingMinutes(script),
    videos: Object.fromEntries(videos.map((video) => [video, describeVideo(props[video])])),
  };
  const file = path.join(dir, 'index.html');

  writeFileSync(file, renderPage(context));
  console.log(`page: ${path.relative(ROOT, file)}`);

  return file;
}

function assertRendered(props, videos) {
  const missing = videos.filter((video) => !props[video]);

  if (missing.length === 0) return;

  throw new Error(`props.json is incomplete. Render ${missing.join(' and ')} first.`);
}

function describeVideo(videoProps) {
  const chapters = videoProps.scenes.map((scene) => describeChapter(scene, videoProps.fps));

  return { chapters, seconds: videoProps.totalFrames / videoProps.fps };
}

function describeChapter(scene, fps) {
  const start = scene.startFrame / fps;
  const end = (scene.startFrame + scene.durationInFrames) / fps;
  const label = scene.heading ?? scene.caption ?? scene.headline ?? scene.id;

  return { label, start, end, narration: scene.narration };
}

function writePoster(dir, video) {
  const mp4 = path.join(dir, `${video}.mp4`);
  if (!existsSync(mp4)) return;

  const poster = path.join(dir, `${video}.poster.jpg`);

  run('ffmpeg', ['-y', '-loglevel', 'error', '-ss', POSTER_SECOND, '-i', mp4, '-frames:v', '1', '-q:v', '3', poster], { quiet: true });
}

// --- Mermaid helpers, shared with pr.mjs so both draw the same diagrams.
// Flowcharts (before/after, component trees, impact) get status classes: tag a
// node with :::added, :::changed, :::removed or :::kept.
const FLOWCHART_START = /^\s*(?:flowchart|graph)\b/;

const CLASS_DEFS = [
  'classDef added fill:#e8f3ea,stroke:#2f7d4a,color:#1e1b15',
  'classDef changed fill:#fbf2e8,stroke:#5e4500,color:#1e1b15',
  'classDef removed fill:#fbeaea,stroke:#b42318,color:#1e1b15,stroke-dasharray:4 3',
  'classDef kept fill:#ffffff,stroke:#e6e1d6,color:#4d4638',
];

export const STATUS_LEGEND = [
  { status: 'added', label: 'New' },
  { status: 'changed', label: 'Changed' },
  { status: 'removed', label: 'Removed' },
  { status: 'kept', label: 'Unchanged' },
];

export function withStatusClasses(source) {
  const trimmed = source.trim();

  if (!FLOWCHART_START.test(trimmed)) return trimmed;

  return `${trimmed}\n  ${CLASS_DEFS.join('\n  ')}`;
}

export function usesStatusClasses(source) {
  return /:::(?:added|changed|removed|kept)\b/.test(source);
}

// --- Screens come from saveStep(page, '<feature>', '<step>') in the journey
// recipe: temp/verification/<run>/drive-*/steps/<feature>/<step>.png. The newest
// copy of each shot is copied next to the page, so it survives cleanup.
function collectScreens(dir, screens = []) {
  return screens.map((screen) => ({ ...screen, src: copyShot(dir, screen.shot) }));
}

// Where a screen is copied, next to the page; the review map reads it from there.
function shotSrc(shot) {
  return `./screens/${shot.replace('/', '-')}.png`;
}

function copyShot(dir, shot) {
  const source = newestShot(shot);
  const src = shotSrc(shot);
  const target = path.join(dir, src);

  mkdirSync(path.dirname(target), { recursive: true });
  copyFileSync(source, target);
  copyComponentBoxes(source, target);

  return src;
}

// `<step>.components.json` (where each component sits on the shot) feeds the review map.
function copyComponentBoxes(sourcePng, targetPng) {
  const source = componentBoxesFile(sourcePng);

  if (existsSync(source)) copyFileSync(source, componentBoxesFile(targetPng));
}

function newestShot(shot) {
  const candidates = driveDirs()
    .map((drive) => path.join(drive, 'steps', `${shot}.png`))
    .filter((file) => existsSync(file))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);

  if (candidates.length === 0) {
    throw new Error(
      `Cannot find screen "${shot}". Add saveStep(page, '${shot.split('/')[0]}', '${shot.split('/')[1]}') to the journey recipe and drive it again.`,
    );
  }

  return candidates[0];
}

if (isMain(import.meta.url)) {
  const slug = process.argv[2];

  if (!slug || process.argv.length > 3) {
    throw new Error('Usage: node page.mjs <slug>');
  }

  writePage(slug);
}
