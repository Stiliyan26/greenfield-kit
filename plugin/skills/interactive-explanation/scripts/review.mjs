// The review map: where each changed component sits on the screens, and the order
// to read the changed files. Boxes come from `<shot>.components.json` next to each
// screenshot (written by the project's evidence helper); the reading order comes
// from the diff and the imports between the changed files: screen first, then down.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { REMOTION_DIR, ROOT } from './constants.mjs';
import { ensureRemotionInstalled } from './render.mjs';
import { componentBoxesFile, readJson, run, writeJson } from './lib.mjs';

const BASE_BRANCH = 'main';
const CROP_MARGIN_PX = 40;
// A component that covers more of the shot than this is the screen itself: listed, not boxed.
const WHOLE_SCREEN_SHARE = 0.5;
const LABEL_HEIGHT_PX = 26;
const LABEL_CHAR_PX = 8.5;
const LABEL_PADDING_PX = 44;
// Boxes this close on every edge show the same area (a dialog and its overlay wrapper).
const SAME_AREA_PX = 6;
const BARREL_FILE = /(?:^|\/)index\.[cm]?[jt]sx?$/;
const CODE_FILE = /\.[cm]?[jt]sx?$/;
const TEST_FILE = /\.(?:spec|test)\.[cm]?[jt]sx?$|(?:^|\/)(?:e2e|tests?)\//;
const IMPORT_PATH = /(?:from|import)\s*\(?\s*['"](\.{1,2}\/[^'"]+)['"]/g;
const EXPORTED_COMPONENT = /export\s+(?:default\s+)?(?:function\s+([A-Z]\w*)|const\s+([A-Z]\w*))/g;
const RESOLVE_SUFFIXES = ['', '.ts', '.tsx', '.js', '.jsx', '.mjs', '/index.ts', '/index.tsx', '/index.js'];
const STATUS_BY_GIT_CODE = { A: 'added', C: 'added', M: 'changed', R: 'changed', D: 'removed' };

export const GroupKind = {
  Screen: 'screen',
  Code: 'code',
  Tests: 'tests',
  Other: 'other',
};

const GROUP_TITLES = {
  [GroupKind.Code]: 'Behind the screens',
  [GroupKind.Tests]: 'Tests',
  [GroupKind.Other]: 'Docs and config',
};

// Writes review/review.json and one annotated PNG per screen that shows a changed component.
export function buildReview(dir, script, screens) {
  const changes = changedFiles(baseBranch(script));

  if (changes.length === 0) return null;

  const statusByFile = new Map(changes.map((change) => [change.file, change.status]));
  const importsByFile = importGraph(changes);
  const fileByComponent = exportedComponents(changes);
  const numberByFile = new Map();

  const shots = screens
    .map((screen) => boxShot(dir, screen, { fileByComponent, statusByFile, numberByFile }))
    .filter(Boolean);
  const groups = readingGroups(changes, importsByFile, numberByFile, script);
  const review = { shots: withFirstNumbers(shots), groups };

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
    wholeScreen: numbered.filter(isWholeScreen).map((box) => ({ number: box.number, label: box.name })),
    ...cropAround(boxes.length > 0 ? boxes : numbered, scale, image),
  };
}

// Each shot lists the numbers that appear on it for the first time; their file
// groups are read right under that shot.
function withFirstNumbers(shots) {
  const seen = new Set();

  return shots.map((shot) => {
    const numbers = [
      ...shot.boxes.flatMap((box) => [box.number, ...box.mergedNumbers]),
      ...shot.wholeScreen.map((box) => box.number),
    ];
    const firstNumbers = [...new Set(numbers)].filter((number) => !seen.has(number)).sort((first, second) => first - second);

    firstNumbers.forEach((number) => seen.add(number));

    return { ...shot, firstNumbers };
  });
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
      twin.mergedNumbers = [...twin.mergedNumbers, box.number];
    } else {
      kept.push({ ...box, mergedNumbers: [] });
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
      mergedNumbers: box.mergedNumbers ?? [],
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

// --- Reading order

function readingGroups(changes, importsByFile, numberByFile, script) {
  const placed = new Set();
  const entryOf = (file, depth) => ({
    file,
    depth,
    status: changes.find((change) => change.file === file).status,
    note: script.review?.notes?.[file] ?? null,
    diffUrl: script.prUrl ? `${script.prUrl}/files#diff-${sha256(file)}` : null,
  });
  // A boxed file below the root keeps its own group, so it is not pulled in here.
  const walk = (file, depth, entries) => {
    if (placed.has(file) || (depth > 0 && numberByFile.has(file))) return entries;

    placed.add(file);

    // A barrel only re-exports: list what it exports at its depth, not the barrel itself.
    const isBarrel = depth > 0 && BARREL_FILE.test(file);
    const childDepth = isBarrel ? depth : depth + 1;

    if (!isBarrel) entries.push(entryOf(file, depth));
    (importsByFile.get(file) ?? []).forEach((imported) => walk(imported, childDepth, entries));

    return entries;
  };

  const screenGroups = [...numberByFile]
    .sort(([, first], [, second]) => first - second)
    .map(([file, number]) => ({ kind: GroupKind.Screen, number, title: path.parse(file).name, entries: walk(file, 0, []) }));

  const rest = changes.map((change) => change.file).filter((file) => !placed.has(file));
  const tests = rest.filter((file) => TEST_FILE.test(file));
  const code = rest.filter((file) => CODE_FILE.test(file) && !TEST_FILE.test(file));
  const other = rest.filter((file) => !CODE_FILE.test(file) && !TEST_FILE.test(file));
  const importedByCode = new Set(code.flatMap((file) => importsByFile.get(file) ?? []));
  const codeRoots = code.filter((file) => !importedByCode.has(file));

  const codeEntries = [...codeRoots, ...code].reduce((entries, file) => walk(file, 0, entries), []);
  const flatEntries = (files) => files.map((file) => entryOf(file, 0));
  const codeGroups = byTopFolder(codeEntries).map(([folder, entries]) => ({
    kind: GroupKind.Code,
    title: `${GROUP_TITLES[GroupKind.Code]}: ${folder}`,
    entries,
  }));

  return [
    ...screenGroups,
    ...codeGroups,
    { kind: GroupKind.Tests, title: GROUP_TITLES[GroupKind.Tests], entries: flatEntries(tests) },
    { kind: GroupKind.Other, title: GROUP_TITLES[GroupKind.Other], entries: flatEntries(other) },
  ].filter((group) => group.entries.length > 0);
}

// [folder, entries] in order of first appearance; a walk stays in its root's folder.
function byTopFolder(entries) {
  const entriesByFolder = new Map();
  let folder = null;

  for (const entry of entries) {
    if (entry.depth === 0) folder = `${entry.file.split('/')[0]}/`;

    entriesByFolder.set(folder, [...(entriesByFolder.get(folder) ?? []), entry]);
  }

  // App folders first, tooling folders (.github/, .claude/) after them.
  const isTooling = ([name]) => name.startsWith('.');

  return [...entriesByFolder].sort((first, second) => isTooling(first) - isTooling(second) || first[0].localeCompare(second[0]));
}

function sha256(text) {
  return createHash('sha256').update(text).digest('hex');
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

// Relative imports between changed files: file -> the changed files it imports.
function importGraph(changes) {
  const changed = new Set(changes.map((change) => change.file));
  const sources = changes.filter((change) => CODE_FILE.test(change.file) && change.status !== 'removed');

  return new Map(sources.map(({ file }) => [file, importedChangedFiles(file, changed)]));
}

function importedChangedFiles(file, changed) {
  const source = readFileSync(path.join(ROOT, file), 'utf8');
  const specifiers = [...source.matchAll(IMPORT_PATH)].map((match) => match[1]);

  return [...new Set(specifiers.map((specifier) => resolveImport(file, specifier, changed)).filter(Boolean))];
}

function resolveImport(file, specifier, changed) {
  const base = path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier.replace(/\.js$/, '')));

  return RESOLVE_SUFFIXES.map((suffix) => `${base}${suffix}`).find((candidate) => changed.has(candidate)) ?? null;
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
