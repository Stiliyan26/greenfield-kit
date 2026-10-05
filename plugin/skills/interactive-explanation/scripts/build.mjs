// node build.mjs <slug> [--voice openrouter|say] [--clips <dir>] [--skip-clips]
//                           [--only journey|architecture] [--quality draft|final] [--force-tts]
//                           [--pr] [--pr-only]
// Runs: style check -> narration -> clip import -> Remotion render -> walkthrough page
// (-> PR body with --pr). --pr-only checks the script and writes only the PR body.
import path from 'node:path';

import { ROOT, SceneKind, videosIn } from './constants.mjs';
import { importClips } from './clips.mjs';
import { explainerDir, parseArgs } from './lib.mjs';
import { writePage } from './page.mjs';
import { writePrBody } from './pr.mjs';
import { render } from './render.mjs';
import { allScenes, readScript } from './script.mjs';
import { checkStyle, printStyleWarnings } from './ste.mjs';
import { synthesize } from './tts.mjs';

const USAGE = 'Usage: node build.mjs <slug> [--voice openrouter|say] [--clips <dir>] [--skip-clips] [--only journey|architecture] [--quality draft|final] [--force-tts] [--pr] [--pr-only]';

const FLAGS = {
  voice: 'string',
  clips: 'string',
  'skip-clips': 'boolean',
  only: 'string',
  quality: 'string',
  'force-tts': 'boolean',
  pr: 'boolean',
  'pr-only': 'boolean',
};

async function main() {
  const { options, positional } = parseArgs(process.argv.slice(2), FLAGS);

  if (positional.length !== 1) throw new Error(USAGE);

  const slug = positional[0];
  const script = readScript(slug);

  printStyleWarnings(checkStyle(script));

  if (options['pr-only']) {
    writePrBody(slug);

    return;
  }

  if (videosIn(script).length > 0) {
    await synthesize(slug, { voice: options.voice, force: options['force-tts'] });

    if (hasClipScenes(script) && !options['skip-clips']) {
      importClips(slug, { from: options.clips });
    }

    render(slug, { only: options.only, quality: options.quality });
  }

  const pageFile = writePage(slug);

  if (options.pr) writePrBody(slug);

  announce(slug, pageFile, videosIn(script));
}

function hasClipScenes(script) {
  return allScenes(script).some((scene) => scene.kind === SceneKind.Clip);
}

function announce(slug, pageFile, videos) {
  const dir = path.relative(ROOT, explainerDir(slug));

  console.log(`\nDone. Open it with:\n  open ${path.relative(ROOT, pageFile)}`);

  if (videos.length > 0) {
    console.log(`(or open ${videos.map((video) => `${dir}/${video}.mp4`).join(' and ')} directly)`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
