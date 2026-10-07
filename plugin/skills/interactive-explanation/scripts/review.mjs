// The review map: where each changed component sits on the screens. Boxes come
// from `<shot>.components.json` next to each screenshot (written by the project's
// evidence helper); a component is boxed when its file changed since the base
// branch. The shots are the only screenshots the page and the PR body show; the
// journey video already shows the plain screens. The PR's file list has the files.
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { REMOTION_DIR, ROOT } from './constants.mjs';
import { ensureRemotionInstalled } from './render.mjs';
import { componentBoxesFile, readJson, run, writeJson } from './lib.mjs';

const BASE_BRANCH = 'main';
const CROP_MARGIN_PX = 40;
// A component that covers more of the shot than this is the screen itself: not boxed.
const WHOLE_SCREEN_SHARE = 0.5;
const LABEL_HEIGHT_PX = 26;
const LABEL_CHAR_PX = 8.5;
const LABEL_PADDING_PX = 44;
// Boxes this close on every edge show the same area (a dialog and its overlay wrapper).
const SAME_AREA_PX = 6;
const EXPORTED_COMPONENT = /export\s+(?:default\s+)?(?:function\s+([A-Z]\w*)|const\s+([A-Z]\w*))/g;
const STATUS_BY_GIT_CODE = { A: 'added', C: 'added', M: 'changed', R: 'changed', D: 'removed' };

// Writes review/review.json and one annotated PNG per screen that shows a changed component.
// No such screen: no review map, and review.json holds null so no older map is read back.
export function buildReview(dir, script, screens) {
  const changes = changedFiles(baseBranch(script));

  if (changes.length === 0) return null;

  const statusByFile = new Map(changes.map((change) => [change.file, change.status]));
  const fileByComponent = exportedComponents(changes);
  const numberByFile = new Map();

  const shots = screens
    .map((screen) => boxShot(dir, screen, { fileByComponent, statusByFile, numberByFile }))
    .filter(Boolean);
  const review = shots.length > 0 ? { shots } : null;

  shots.forEach((shot) => renderShot(dir, shot));
  writeJson(path.join(dir, 'review', 'review.json'), review);

  return review;
}

export function readReview(dir) {
  return readJson(path.join(dir, 'review', 'review.json'), null);
}

// --- Boxes on one screenshot

function boxShot(dir, screen, { fileByComponent, statusByFile, numberByFile }) {
  const png = path.join(dir, screen.src);
  const boxesFile = componentBoxesFile(png);

  if (!existsSync(boxesFile)) return null;

  const { scale, components } = readJson(boxesFile);
  const image = pngSize(png);
  const shotArea = (image.width / scale) * (image.height / scale);
  const visible = components.filter((component) => component.isOnTop !== false);
  const numbered = boxesPerFile(visible, fileByComponent).map((box) => ({
    ...box,
    number: numberFor(numberByFile, box.file),
    status: statusByFile.get(box.file),
  }));
  const isWholeScreen = (box) => box.width * box.height > shotArea * WHOLE_SCREEN_SHARE;
  const boxes = mergeSameArea(numbered.filter((box) => !isWholeScreen(box)));

  if (numbered.length === 0) return null;

  const name = path.basename(png, '.png');

  return {
    shot: screen.shot,
    caption: screen.caption,
    source: screen.src.replace(/^\.\//, ''),
    image: `./review/${name}.png`,
    ...cropAround(boxes.length > 0 ? boxes : numbered, scale, image),
  };
}

// One box per changed file: the component named like the file wins, else the first one found.
function boxesPerFile(components, fileByComponent) {
  const boxByFile = new Map();

  for (const component of components) {
    const file = fileByComponent.get(component.name);
    const current = file ? boxByFile.get(file) : null;
    const isFileComponent = file ? path.parse(file).name === component.name : false;

    if (!file || (current && (current.isFileComponent || !isFileComponent))) continue;

    boxByFile.set(file, { ...component, file, isFileComponent });
  }

  return [...boxByFile.values()].sort((first, second) => first.y - second.y || first.x - second.x);
}

// The first box keeps the area; later boxes on the same area join its label.
function mergeSameArea(boxes) {
  const kept = [];
  const isSameArea = (first, second) => ['x', 'y', 'width', 'height']
    .every((edge) => Math.abs(first[edge] - second[edge]) <= SAME_AREA_PX);

  for (const box of boxes) {
    const twin = kept.find((candidate) => isSameArea(candidate, box));

    if (twin) {
      twin.name = `${twin.name} · ${box.number} ${box.name}`;
    } else {
      kept.push({ ...box });
    }
  }

  return kept;
}

function numberFor(numberByFile, file) {
  if (!numberByFile.has(file)) numberByFile.set(file, numberByFile.size + 1);

  return numberByFile.get(file);
}

// Crop to the boxes plus a margin, in image pixels; box positions become relative to the crop.
function cropAround(boxes, scale, image) {
  const left = Math.max(0, Math.min(...boxes.map((box) => box.x)) - CROP_MARGIN_PX);
  const top = Math.max(0, Math.min(...boxes.map((box) => box.y)) - CROP_MARGIN_PX);
  const right = Math.min(image.width / scale, Math.max(...boxes.map((box) => box.x + box.width)) + CROP_MARGIN_PX);
  const bottom = Math.min(image.height / scale, Math.max(...boxes.map((box) => box.y + box.height)) + CROP_MARGIN_PX);
  const toPixels = (value) => Math.round(value * scale);

  return {
    imageWidth: image.width,
    imageHeight: image.height,
    crop: { x: toPixels(left), y: toPixels(top), width: toPixels(right - left), height: toPixels(bottom - top) },
    boxes: placeLabels(boxes.map((box) => ({
      number: box.number,
      label: box.name,
      file: box.file,
      status: box.status,
      x: toPixels(box.x - left),
      y: toPixels(box.y - top),
      width: toPixels(box.width),
      height: toPixels(box.height),
    }))),
  };
}

// Each label tries: above the box on the left, inside on the left, above on the
// right, inside on the right; it takes the first spot no earlier label covers.
function placeLabels(boxes) {
  const placed = [];

  return boxes.map((box) => {
    const width = box.label.length * LABEL_CHAR_PX + LABEL_PADDING_PX;
    const spots = [
      { x: 0, y: -LABEL_HEIGHT_PX },
      { x: 0, y: 0 },
      { x: box.width - width, y: -LABEL_HEIGHT_PX },
      { x: box.width - width, y: 0 },
    ].filter((spot) => box.y + spot.y >= 0);
    const overlaps = (spot) => placed.some((other) =>
      box.x + spot.x < other.x + other.width && other.x < box.x + spot.x + width
      && box.y + spot.y < other.y + LABEL_HEIGHT_PX && other.y < box.y + spot.y + LABEL_HEIGHT_PX);
    const spot = spots.find((candidate) => !overlaps(candidate)) ?? spots[0];

    placed.push({ x: box.x + spot.x, y: box.y + spot.y, width });

    return { ...box, labelX: spot.x, labelY: spot.y };
  });
}

// Width and height from the PNG header (IHDR), so no image library is needed.
function pngSize(file) {
  const header = readFileSync(file).subarray(16, 24);

  return { width: header.readUInt32BE(0), height: header.readUInt32BE(4) };
}

function renderShot(dir, shot) {
  const output = path.join(dir, shot.image);
  const propsFile = output.replace(/\.png$/, '.props.json');
  const props = { image: shot.source, imageWidth: shot.imageWidth, imageHeight: shot.imageHeight, crop: shot.crop, boxes: shot.boxes };
  const isUnchanged = existsSync(output) && JSON.stringify(readJson(propsFile, null)) === JSON.stringify(props);

  if (isUnchanged) return;

  mkdirSync(path.dirname(output), { recursive: true });
  writeJson(propsFile, props);
  ensureRemotionInstalled();
  run('npx', [
    'remotion', 'still', 'src/index.ts', 'review-shot', output,
    `--props=${propsFile}`, `--public-dir=${dir}`, '--log=warn', '--overwrite',
  ], { cwd: REMOTION_DIR, quiet: true });
  console.log(`review: ${path.relative(ROOT, output)}`);
}

// --- The diff

// The branch the PR merges into, so the map shows only this PR's files.
function baseBranch(script) {
  if (script.base) return script.base;

  if (!script.prUrl) return BASE_BRANCH;

  const number = script.prUrl.split('/').at(-1);

  return run('gh', ['pr', 'view', number, '--json', 'baseRefName', '-q', '.baseRefName'], { quiet: true }).trim() || BASE_BRANCH;
}

// Changed since the merge base with the base branch, uncommitted work and new files included.
function changedFiles(base) {
  const mergeBase = git(['merge-base', base, 'HEAD']).trim();
  const tracked = git(['diff', '--name-status', '-M', mergeBase])
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [code, ...paths] = line.split('\t');

      return { file: paths.at(-1), status: STATUS_BY_GIT_CODE[code[0]] ?? 'changed' };
    });
  const untracked = git(['ls-files', '--others', '--exclude-standard'])
    .split('\n')
    .filter(Boolean)
    .map((file) => ({ file, status: 'added' }));

  return [...tracked, ...untracked];
}

// Exported component names in changed .jsx/.tsx files -> their file.
function exportedComponents(changes) {
  const componentFiles = changes.filter((change) => /\.[jt]sx$/.test(change.file) && change.status !== 'removed');
  const pairs = componentFiles.flatMap(({ file }) => {
    const source = readFileSync(path.join(ROOT, file), 'utf8');

    return [...source.matchAll(EXPORTED_COMPONENT)].map((match) => [match[1] ?? match[2], file]);
  });

  return new Map(pairs);
}

function git(args) {
  return run('git', args, { quiet: true });
}
