// Builds props.json (script + narration lengths + clip lengths) and renders the videos with Remotion.
import { existsSync, renameSync, statSync } from 'node:fs';
import path from 'node:path';

import { BRAND, FPS, GITHUB_MEDIA_LIMIT_BYTES, REMOTION_DIR, ROOT, SceneKind, VIDEOS, videosIn } from './constants.mjs';
import { explainerDir, isMain, parseArgs, readJson, run, writeJson } from './lib.mjs';
import { readScript } from './script.mjs';

const PAD_SECONDS = 0.9;
const AUDIO_KBPS = 96;
const UPLOAD_MARGIN = 0.92;
const CLIP_TAIL_SECONDS = 0.4;
const DEFAULT_MIN_SECONDS = 3;
const MIN_SECONDS = { [SceneKind.Title]: 3.5 };

// Scenes are laid out at 1280x720. Final renders at 1.5x so text and clips stay sharp.
const QUALITY_ARGS = {
  draft: ['--scale=0.5', '--crf=30'],
  final: ['--scale=1.5', '--crf=18'],
};

const COMPOSITION = { width: 1280, height: 720 };

function buildProps(slug, { only } = {}) {
  const script = readScript(slug);
  const dir = explainerDir(slug);
  const sources = {
    dir,
    timing: readJson(path.join(dir, 'timing.json'), { scenes: {} }),
    clips: readJson(path.join(dir, 'clips', 'manifest.json'), {}),
  };
  const videos = videosIn(script).filter((video) => !only || video === only);
  const built = videos.map((video) => ({ video, ...buildVideo(script, video, sources) }));
  const missing = built.flatMap((entry) => entry.missing);

  if (missing.length > 0) {
    throw new Error(`Cannot render yet:\n- ${missing.join('\n- ')}`);
  }

  const fresh = Object.fromEntries(built.map((entry) => [entry.video, entry.props]));
  // The other video's props from an earlier run stay, so the page can still list both.
  const merged = { ...readJson(path.join(dir, 'props.json'), {}), ...fresh };

  writeJson(path.join(dir, 'props.json'), merged);

  return merged;
}

export function render(slug, { only, quality = 'final' } = {}) {
  assertKnown('--only', only, VIDEOS);
  assertKnown('--quality', quality, Object.keys(QUALITY_ARGS));

  const props = buildProps(slug, { only });
  const dir = explainerDir(slug);
  const videos = videosIn(readScript(slug)).filter((video) => !only || video === only);

  ensureRemotionInstalled();

  for (const video of videos) {
    renderVideo(video, props[video], dir, quality);
  }

  return props;
}

function buildVideo(script, video, sources) {
  const missing = [];
  let startFrame = 0;

  const scenes = script[video].scenes.map((scene, index) => {
    const timed = timeScene(scene, sources);
    const sceneStart = startFrame;

    missing.push(...timed.missing);
    startFrame += timed.durationInFrames;

    return { ...scene, index, ...timed.timing, startFrame: sceneStart };
  });

  const totalFrames = startFrame;
  const props = {
    brand: BRAND,
    title: script.title,
    subtitle: script.subtitle ?? '',
    video,
    fps: FPS,
    ...COMPOSITION,
    scenes,
    totalFrames,
  };

  return { props, missing };
}

function timeScene(scene, { dir, timing, clips }) {
  const missing = [
    ...missingNarration(scene, dir, timing),
    ...missingClip(scene, dir, clips),
  ];
  const audioSeconds = timing.scenes[scene.id]?.seconds ?? 0;
  const clipSeconds = clipSecondsFor(scene, clips);
  const seconds = Math.max(
    MIN_SECONDS[scene.kind] ?? DEFAULT_MIN_SECONDS,
    audioSeconds + PAD_SECONDS,
    clipSeconds + CLIP_TAIL_SECONDS,
  );
  const durationInFrames = Math.ceil(seconds * FPS);
  const clipFrames = Math.ceil(clipSeconds * FPS);

  return {
    missing,
    durationInFrames,
    timing: { audioSeconds, clipFrames, durationInFrames },
  };
}

function missingNarration(scene, dir, timing) {
  const hasAudio = timing.scenes[scene.id] && existsSync(path.join(dir, 'audio', `${scene.id}.mp3`));

  if (hasAudio) return [];

  return [`narration for ${scene.id} (run tts)`];
}

function missingClip(scene, dir, clips) {
  if (scene.kind !== SceneKind.Clip) return [];

  const hasClip = clips[scene.clip] && existsSync(path.join(dir, 'clips', `${scene.clip}.mp4`));

  if (hasClip) return [];

  return [`clip "${scene.clip}" for ${scene.id} (record it, then run clips)`];
}

function clipSecondsFor(scene, clips) {
  if (scene.kind !== SceneKind.Clip) return 0;

  return clips[scene.clip]?.seconds ?? 0;
}

function renderVideo(video, props, dir, quality) {
  const propsFile = path.join(dir, `props.${video}.json`);
  const output = path.join(dir, `${video}.mp4`);
  const seconds = Math.round(props.totalFrames / FPS);
  const started = Date.now();

  writeJson(propsFile, props);
  console.log(`render: ${video} (${seconds}s, ${props.scenes.length} scenes) -> ${path.relative(ROOT, output)}`);

  // Remotion prints one progress line per frame when stdout is not a terminal.
  run('npx', remotionArgs(video, output, propsFile, dir, quality), {
    cwd: REMOTION_DIR,
    quiet: !process.stdout.isTTY,
  });
  fitUploadLimit(output, props.totalFrames / FPS);
  console.log(`render: ${video} done in ${Math.round((Date.now() - started) / 1000)}s`);
}

// GitHub takes videos up to 10 MB on the Free plan. Re-encode a larger render
// at the bitrate that fits, with a margin for the container.
function fitUploadLimit(mp4, seconds) {
  if (statSync(mp4).size <= GITHUB_MEDIA_LIMIT_BYTES) return;

  const totalKbps = Math.floor((GITHUB_MEDIA_LIMIT_BYTES * 8 * UPLOAD_MARGIN) / seconds / 1000);
  const videoKbps = totalKbps - AUDIO_KBPS;
  const shrunk = mp4.replace(/\.mp4$/, '.fit.mp4');

  run('ffmpeg', [
    '-y', '-loglevel', 'error', '-i', mp4,
    '-c:v', 'libx264', '-preset', 'slow', '-b:v', `${videoKbps}k`, '-maxrate', `${videoKbps}k`, '-bufsize', `${videoKbps * 2}k`,
    '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', `${AUDIO_KBPS}k`, '-movflags', '+faststart',
    shrunk,
  ], { quiet: true });
  renameSync(shrunk, mp4);
  console.log(`render: ${path.basename(mp4)} re-encoded to ${(statSync(mp4).size / 1e6).toFixed(1)} MB for GitHub`);
}

function remotionArgs(video, output, propsFile, publicDir, quality) {
  return [
    'remotion', 'render', 'src/index.ts', video, output,
    `--props=${propsFile}`,
    `--public-dir=${publicDir}`,
    '--log=warn',
    '--overwrite',
    '--codec=h264',
    ...QUALITY_ARGS[quality],
  ];
}

export function ensureRemotionInstalled() {
  if (existsSync(path.join(REMOTION_DIR, 'node_modules', 'remotion'))) return;

  const command = existsSync(path.join(REMOTION_DIR, 'package-lock.json')) ? 'ci' : 'install';

  console.log('render: installing Remotion (first run only)...');
  run('npm', [command, '--no-audit', '--no-fund'], { cwd: REMOTION_DIR });
}

function assertKnown(flag, value, allowed) {
  if (value === undefined || allowed.includes(value)) return;

  throw new Error(`${flag} must be ${allowed.join(' or ')}`);
}

if (isMain(import.meta.url)) {
  const { options, positional } = parseArgs(process.argv.slice(2), {
    only: 'string',
    quality: 'string',
  });

  if (positional.length !== 1) {
    throw new Error('Usage: node render.mjs <slug> [--only journey|architecture] [--quality draft|final]');
  }

  render(positional[0], { only: options.only, quality: options.quality });
}
