import { existsSync } from 'node:fs';
import path from 'node:path';

import { ROOT, videosIn } from './constants.mjs';
import { explainerDir, readJson } from './lib.mjs';
import { validateScript } from './validate-script.mjs';

export function readScript(slug) {
  const file = path.join(explainerDir(slug), 'script.json');

  if (!existsSync(file)) {
    const relative = path.relative(ROOT, file);
    throw new Error(`No script at ${relative}. Write it first (see the interactive-explanation skill).`);
  }

  const script = readJson(file);
  validateScript(script, slug);

  return script;
}

export function allScenes(script) {
  return videosIn(script).flatMap((video) => script[video].scenes);
}
