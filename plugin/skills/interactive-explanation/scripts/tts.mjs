// Narration for every scene: temp/explainers/<slug>/audio/<scene id>.mp3 and timing.json.
// OpenRouter's /audio/speech when OPENROUTER_API_KEY is set, otherwise macOS `say`.
// Narration that has not changed is not synthesized again.
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import {
  explainerDir,
  isMain,
  loadLocalEnv,
  parseArgs,
  probeSeconds,
  readJson,
  run,
  sha1,
  writeJson,
} from './lib.mjs';
import { BRAND } from './constants.mjs';
import { allScenes, readScript } from './script.mjs';

const OPENROUTER_SPEECH_URL = 'https://openrouter.ai/api/v1/audio/speech';
const DEFAULT_PCM_RATE = '24000';
const DEFAULT_PCM_CHANNELS = '1';
const SAY_WORDS_PER_MINUTE = '175';
const MIN_AUDIO_BYTES = 1000;

const Backend = {
  OpenRouter: 'openrouter',
  Say: 'say',
};

// Gemini Flash Lite is about $0.06 per five minutes. Free option: deepgram/flux-tts:free.
const DEFAULTS = {
  model: 'google/gemini-3.8-flash-lite-tts',
  voice: 'Kore',
  sayVoice: 'Samantha',
};

export async function synthesize(slug, { voice, force = false } = {}) {
  loadLocalEnv();

  const config = voiceConfig(voice);
  const scenes = allScenes(readScript(slug));
  const dir = explainerDir(slug);
  const audioDir = path.join(dir, 'audio');
  const timing = { scenes: {} };
  let synthesizedCount = 0;

  console.log(describeVoice(config));
  mkdirSync(audioDir, { recursive: true });

  for (const scene of scenes) {
    const narration = await narrate(scene, config, audioDir, force);

    timing.scenes[scene.id] = {
      seconds: narration.seconds,
      characters: scene.narration.trim().length,
    };
    if (narration.synthesized) synthesizedCount += 1;
  }

  writeJson(path.join(dir, 'timing.json'), timing);
  console.log(`tts: ${synthesizedCount} of ${scenes.length} scene(s) synthesized.`);

  return timing;
}

function voiceConfig(requested) {
  const backend = requested ?? process.env.EXPLAIN_VOICE ?? defaultBackend();

  if (backend === Backend.Say) {
    return { backend, voice: process.env.EXPLAIN_SAY_VOICE ?? DEFAULTS.sayVoice };
  }

  if (backend !== Backend.OpenRouter) {
    throw new Error(`--voice must be ${Backend.OpenRouter} or ${Backend.Say}, not "${backend}"`);
  }

  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not set. Put it in ~/.claude/explain.env (once, for every project) or pass --voice say.');
  }

  return {
    backend,
    model: process.env.EXPLAIN_TTS_MODEL ?? DEFAULTS.model,
    voice: process.env.EXPLAIN_TTS_VOICE ?? DEFAULTS.voice,
  };
}

function defaultBackend() {
  if (process.env.OPENROUTER_API_KEY) return Backend.OpenRouter;

  return Backend.Say;
}

function describeVoice({ backend, model, voice }) {
  const modelLabel = model ? ` ${model}` : '';

  return `tts: ${backend}${modelLabel} voice=${voice}`;
}

async function narrate(scene, config, audioDir, force) {
  const text = scene.narration.trim();
  const hash = sha1(JSON.stringify([text, config]));
  const files = audioFiles(audioDir, scene.id);
  const cached = readJson(files.meta, null);

  if (!force && isCurrent(cached, hash, files.mp3)) {
    return { seconds: cached.seconds, synthesized: false };
  }

  await speak(text, config, files.mp3);

  const seconds = probeSeconds(files.mp3);
  writeJson(files.meta, { hash, seconds, ...config });
  console.log(`  ${scene.id}: ${seconds.toFixed(1)}s`);

  return { seconds, synthesized: true };
}

function audioFiles(audioDir, sceneId) {
  return {
    mp3: path.join(audioDir, `${sceneId}.mp3`),
    meta: path.join(audioDir, `${sceneId}.json`),
  };
}

function isCurrent(cached, hash, mp3) {
  return cached?.hash === hash && existsSync(mp3);
}

async function speak(text, config, mp3) {
  if (config.backend === Backend.Say) {
    speakWithSay(text, config, mp3);
    return;
  }

  await speakWithOpenRouter(text, config, mp3);
}

function speakWithSay(text, config, mp3) {
  const aiff = mp3.replace(/\.mp3$/, '.aiff');

  run('say', ['-v', config.voice, '-r', SAY_WORDS_PER_MINUTE, '-o', aiff, text], { quiet: true });
  run('ffmpeg', ['-y', '-loglevel', 'error', '-i', aiff, '-codec:a', 'libmp3lame', '-q:a', '4', mp3], { quiet: true });
  unlinkSync(aiff);
}

async function speakWithOpenRouter(text, config, mp3) {
  const { bytes, contentType } = await requestSpeech(text, config);

  if (/mpeg|mp3/.test(contentType)) {
    writeFileSync(mp3, bytes);
    return;
  }

  encodePcmAsMp3(bytes, contentType, mp3);
}

// Every model supports raw PCM and Gemini supports nothing else.
// The content type carries the format, e.g. "audio/pcm;rate=24000;channels=1".
async function requestSpeech(text, config) {
  const response = await fetch(OPENROUTER_SPEECH_URL, {
    method: 'POST',
    headers: openRouterHeaders(),
    body: JSON.stringify({
      model: config.model,
      input: text,
      voice: config.voice,
      response_format: 'pcm',
    }),
  });
  const contentType = response.headers.get('content-type') ?? '';

  if (!response.ok || !contentType.startsWith('audio/')) {
    const body = await response.text();
    throw new Error(`OpenRouter TTS failed: HTTP ${response.status} ${contentType}\n${body.slice(0, 800)}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());

  if (bytes.length < MIN_AUDIO_BYTES) {
    throw new Error(`OpenRouter TTS returned only ${bytes.length} bytes for "${text.slice(0, 40)}"`);
  }

  return { bytes, contentType };
}

function openRouterHeaders() {
  return {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
    'X-Title': `${BRAND} interactive-explanation`,
  };
}

function encodePcmAsMp3(bytes, contentType, mp3) {
  const rate = headerParameter(contentType, 'rate', DEFAULT_PCM_RATE);
  const channels = headerParameter(contentType, 'channels', DEFAULT_PCM_CHANNELS);
  const pcm = mp3.replace(/\.mp3$/, '.pcm');

  writeFileSync(pcm, bytes);
  run(
    'ffmpeg',
    ['-y', '-loglevel', 'error', '-f', 's16le', '-ar', rate, '-ac', channels, '-i', pcm, '-codec:a', 'libmp3lame', '-q:a', '3', mp3],
    { quiet: true },
  );
  unlinkSync(pcm);
}

function headerParameter(contentType, name, fallback) {
  return new RegExp(`${name}=(\\d+)`).exec(contentType)?.[1] ?? fallback;
}

if (isMain(import.meta.url)) {
  const { options, positional } = parseArgs(process.argv.slice(2), {
    voice: 'string',
    force: 'boolean',
  });

  if (positional.length !== 1) {
    throw new Error('Usage: node tts.mjs <slug> [--voice openrouter|say] [--force]');
  }

  await synthesize(positional[0], { voice: options.voice, force: options.force });
}
