import { existsSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// The skill lives in the plugin, not in the project, so the project root is
// where the build runs: the current folder, or EXPLAIN_ROOT when set.
const SCRIPTS_DIR = path.dirname(fileURLToPath(import.meta.url));

const SKILL_DIR = path.resolve(SCRIPTS_DIR, '..');
export const ROOT = path.resolve(process.env.EXPLAIN_ROOT ?? process.cwd());
const CONFIG_FILE = path.join(ROOT, '.agents', 'explain.config.json');

// Everything specific to a project lives in .agents/explain.config.json; the skill runs without it.
export const CONFIG = existsSync(CONFIG_FILE) ? JSON.parse(readFileSync(CONFIG_FILE, 'utf8')) : {};

export const BRAND = CONFIG.brand ?? path.basename(ROOT);
export const EXPLAINERS_DIR = path.join(ROOT, 'temp', 'explainers');
export const VERIFICATION_DIR = CONFIG.journey?.evidence ? path.join(ROOT, CONFIG.journey.evidence) : null;
export const REMOTION_DIR = path.join(SKILL_DIR, 'remotion');
// The voice key is read from, in order: the shell, the project's file, the
// user's file. The user's file is set once and serves every project.
export const LOCAL_ENV_FILE = path.join(ROOT, CONFIG.voiceEnv ?? path.join('.agents', 'local', 'explain.env'));
export const USER_ENV_FILE = path.join(os.homedir(), '.agents', 'explain.env');

export const ID_PATTERN = /^[a-z0-9-]+$/;

export const Video = {
  Journey: 'journey',
  Architecture: 'architecture',
};

export const VIDEOS = Object.values(Video);

// The videos a script actually has. Both are optional for a task; a PR needs at least one.
export function videosIn(script) {
  return VIDEOS.filter((video) => script[video]);
}

// "pr": the full page plus the PR description. "task": the short page an agent writes
// after it finishes a piece of work, so the user can see what changed.
export const Mode = {
  Pr: 'pr',
  Task: 'task',
};

export const MODES = Object.values(Mode);

export const SceneKind = {
  Title: 'title',
  BeforeAfter: 'before-after',
  Clip: 'clip',
  Files: 'files',
  Diagram: 'diagram',
  Code: 'code',
  Bullets: 'bullets',
};

export const SCENE_KINDS = Object.values(SceneKind);

export const FPS = 30;

// "How it works" diagrams. The type says what the diagram answers; the source is Mermaid.
export const DiagramType = {
  Flowchart: 'flowchart',
  Er: 'er',
  Sequence: 'sequence',
  Component: 'component',
  State: 'state',
};

export const DIAGRAM_TYPES = Object.values(DiagramType);

// Summary sketches: the smallest text view of the change. Each kind answers one question.
export const SketchKind = {
  Files: 'files',
  Components: 'components',
  Calls: 'calls',
  Pseudo: 'pseudo',
  Code: 'code',
};

export const SKETCH_KINDS = Object.values(SketchKind);

// Merge danger: a two-way door is cheap to walk back; a one-way door is not.
export const Door = {
  OneWay: 'one-way',
  TwoWay: 'two-way',
};

export const DOORS = Object.values(Door);

// GitHub's upload limit for one image or video (video on the Free plan). The
// PR body attaches the media with `gh pr edit --attach`, so every file must fit.
export const GITHUB_MEDIA_LIMIT_BYTES = 10_000_000;

export const MERMAID_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/mermaid/11.15.0/mermaid.min.js';

// Reading budget for the page, videos excluded.
export const READING = {
  wordsPerMinute: 200,
  secondsPerDiagram: 15,
  secondsPerScreen: 5,
  secondsPerSketch: 10,
  maxMinutes: { pr: 5, task: 3 },
};
