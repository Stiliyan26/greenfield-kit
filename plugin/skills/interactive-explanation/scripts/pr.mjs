// The PR description, from the same script.json as the page: same sections in
// the same order, same Mermaid diagrams, written in ASD-STE100. Nothing is folded.
// Writes temp/explainers/<slug>/pr-body.md
// with the screenshots and videos as local paths; `gh pr edit --attach` uploads them
// and rewrites each path to the uploaded file, so nothing is committed.
import { existsSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { DiagramType, GITHUB_MEDIA_LIMIT_BYTES, ROOT, SketchKind, Video } from './constants.mjs';
import { explainerDir, isMain } from './lib.mjs';
import { erDiagram, loadDatabase, relationSentence } from './database.mjs';
import { shotSrc, STATUS_LEGEND, usesStatusClasses, withStatusClasses } from './page.mjs';
import { shotCaption } from './page/template.mjs';
import { readReview } from './review.mjs';
import { readScript } from './script.mjs';

const DIAGRAM_TITLES = {
  [DiagramType.Flowchart]: 'Flow',
  [DiagramType.Er]: 'Data model',
  [DiagramType.Sequence]: 'Request flow',
  [DiagramType.Component]: 'Components',
  [DiagramType.State]: 'States',
};

const SKETCH_TITLES = {
  [SketchKind.Files]: 'Files',
  [SketchKind.Components]: 'Components',
  [SketchKind.Calls]: 'Call tree',
  [SketchKind.Pseudo]: 'Logic',
  [SketchKind.Code]: 'Code',
};

export function writePrBody(slug) {
  const dir = explainerDir(slug);
  const script = readScript(slug);
  const review = readReview(dir);
  const media = localMedia(dir, script, review);
  const file = path.join(dir, 'pr-body.md');

  writeFileSync(file, prBody(script, media, review));
  console.log(`pr body: ${path.relative(ROOT, file)}`);
  warnOversized(dir, media.files);
  console.log(`publish: cd ${path.relative(ROOT, dir)} && ${publishCommand(script, media.files)}`);

  return file;
}

function prBody(script, media, review) {
  const screens = script.screens ?? [];
  const evidence = script.evidence ?? [];
  const hasEvidence = evidence.length > 0 || screens.length > 0 || media.videos[Video.Journey] || script.tests;
  return [
    section('Summary', [
      bullets([script.description].flat()),
      `**Impact:** ${script.impact}`,
      ...(script.sketches ?? []).flatMap(sketchParts),
    ]),
    script.risks && section('Merge danger', dangerParts(script.risks)),
    hasEvidence && section('Evidence', [
      ...evidence.flatMap((pair) => evidenceParts(pair, media.shots)),
      ...screens.map((screen) => shotPart(screen.shot, screen.caption, media.shots)),
      media.videos[Video.Journey],
      script.tests && testsParts(script.tests),
    ]),
    review && section('Review map', reviewParts(review, media)),
    (script.diagrams?.length || media.videos[Video.Architecture]) && section('How it works', [
      ...(script.diagrams ?? []).flatMap(diagramParts),
      media.videos[Video.Architecture],
    ]),
    script.beforeAfter && section('Before and after', [
      '**Before**', mermaid(script.beforeAfter.before),
      '**After**', mermaid(script.beforeAfter.after),
      script.beforeAfter.note,
    ]),
    script.database && section('Data model', databaseParts(loadDatabase(script.database))),
    section('Outcome', [bullets(script.outcome)]),
  ]
    .filter(Boolean)
    .join('\n\n')
    .concat('\n');
}

function sketchParts(sketch) {
  return [
    `### ${SKETCH_TITLES[sketch.kind]}: ${sketch.heading}`,
    sketch.text,
    sketch.file && `\`${sketch.file}\``,
    fenced(sketchLanguage(sketch), sketch.source),
  ];
}

// GitHub colours a diff fence; code gets its file's language; trees and pseudocode stay plain.
function sketchLanguage(sketch) {
  if (sketch.diff) return 'diff';
  if (sketch.kind === SketchKind.Code) return path.extname(sketch.file).slice(1);

  return 'text';
}

function evidenceParts(pair, shots) {
  return [
    `### ${pair.label}`,
    '**Before**',
    evidenceSidePart(pair.before, `${pair.label}: before`, shots),
    '**After**',
    evidenceSidePart(pair.after, `${pair.label}: after`, shots),
  ];
}

function evidenceSidePart(side, caption, shots) {
  if (side.shot) return shotPart(side.shot, caption, shots);

  return fenced('text', side.output);
}

// A screenshot shows inline when its file exists; otherwise only its caption.
function shotPart(shot, caption, shots) {
  const src = shotSrc(shot);

  if (!shots.has(src)) return `- ${caption}`;

  return `![${caption}](${src})`;
}

function testsParts(tests) {
  return [
    '**Tests**',
    tests.summary,
    bullets(tests.items.map((item) => `\`${item.name}\`: ${item.proves}`)),
  ].filter(Boolean).join('\n\n');
}

function dangerParts(risks) {
  return [
    risks.door && `**Door:** ${risks.door.type}`,
    risks.door?.text,
    risks.blastRadius && `**Blast Radius:** ${risks.blastRadius.scope}`,
    risks.blastRadius?.text,
    risks.items?.length && bullets(risks.items.map((item) => `**${item.area}.** ${item.text}`)),
    risks.mermaid && mermaid(risks.mermaid),
    risks.deploy?.length && `**Deploy**\n\n${numbered(risks.deploy)}`,
  ];
}

// The screenshots and videos the build left next to the page, as the relative
// paths the body uses. `--attach` must get the same strings to rewrite them.
function localMedia(dir, script, review) {
  const evidenceShots = (script.evidence ?? []).flatMap((pair) => [pair.before.shot, pair.after.shot]).filter(Boolean);
  const screens = [...(script.screens ?? []).map((screen) => screen.shot), ...evidenceShots].map(shotSrc);
  const reviewShots = (review?.shots ?? []).map((shot) => shot.image);
  const exists = (file) => existsSync(path.join(dir, file));
  const videoFiles = Object.values(Video).map((video) => [video, `./${video}.mp4`]).filter(([, file]) => exists(file));

  return {
    shots: new Set(screens.filter(exists)),
    // A video renders as a player only as image syntax alone in its paragraph.
    videos: Object.fromEntries(videoFiles.map(([video, file]) => [video, `![](${file})`])),
    reviewShots: reviewShots.filter(exists),
    files: [...reviewShots.filter(exists), ...screens.filter(exists), ...videoFiles.map(([, file]) => file)],
  };
}

// The annotated shots, each followed by the groups of the boxes it shows first:
// the box's component file, then the changed files it imports, indented by depth.
function reviewParts(review, media) {
  const groupByNumber = new Map(review.groups.map((group) => [group.number, group]));
  const shots = review.shots
    .filter((shot) => media.reviewShots.includes(shot.image))
    .flatMap((shot) => [
      `### ${shot.caption}`,
      `![${shot.caption}](${shot.image})`,
      shot.wholeScreen.length > 0 && `_${shotCaption(shot)}_`,
      ...shot.firstNumbers.map((number) => reviewGroupMarkdown(groupByNumber.get(number))),
    ].filter(Boolean));

  return ['Each box is a changed component. Under each screen, read its files top to bottom: the component first, then what it uses.', ...shots];
}

function reviewGroupMarkdown(group) {
  return [`**${group.number}. ${group.title}**`, group.entries.map(reviewFileLine).join('\n')].join('\n\n');
}

// File name in bold for scanning, its folder small after it.
function reviewFileLine(entry) {
  const name = `**${path.posix.basename(entry.file)}**`;
  const link = entry.diffUrl
    ? `[${name}](${entry.diffUrl})`
    : name;
  const note = entry.note ? ` — ${entry.note}` : '';

  return `${'  '.repeat(entry.depth)}- ${link} · ${entry.status} <sub>${path.posix.dirname(entry.file)}</sub>${note}`;
}

function publishCommand(script, files) {
  const target = script.prUrl ? `edit ${prNumber(script.prUrl)}` : 'create --draft --title <title>';
  const attachments = files.map((file) => `--attach ${file}`).join(' ');

  return `gh pr ${target} --body-file pr-body.md ${attachments}`.trim();
}

function prNumber(prUrl) {
  return prUrl.split('/').at(-1);
}

function warnOversized(dir, files) {
  const oversized = files.filter((file) => statSync(path.join(dir, file)).size > GITHUB_MEDIA_LIMIT_BYTES);

  oversized.forEach((file) => console.warn(`warning: ${file} is over 10 MB; GitHub can refuse it. Render again to shrink it.`));
}

function databaseParts(database) {
  const relations = database.relations.map((relation) => {
    const meaning = relation.meaning ?? relationSentence(relation);

    return `| \`${relation.from.table}.${relation.from.column}\` → \`${relation.to.table}.${relation.to.column}\` | ${relation.cardinality}, \`ON DELETE ${relation.onDelete}\` | ${meaning} |`;
  });
  return [
    database.intro,
    mermaid(erDiagram(database)),
    '_PK primary key, FK foreign key, UK unique._',
    relations.length && ['| Foreign key | Kind | Meaning |', '| --- | --- | --- |', ...relations].join('\n'),
  ];
}

function diagramParts(diagram) {
  return [
    `### ${DIAGRAM_TITLES[diagram.type]}: ${diagram.heading}`,
    mermaid(diagram.mermaid),
    usesStatusClasses(diagram.mermaid) && `_Legend: ${STATUS_LEGEND.map(({ status, label }) => `${label} = \`${status}\``).join(', ')}._`,
    diagram.steps?.length && numbered(diagram.steps),
    diagram.note,
  ];
}

function section(heading, parts) {
  return [`## ${heading}`, ...parts.filter(Boolean)].join('\n\n');
}

function mermaid(source) {
  return fenced('mermaid', withStatusClasses(source));
}

function fenced(language, source) {
  return [`\`\`\`${language}`, source, '```'].join('\n');
}

function bullets(lines) {
  return lines.map((line) => `- ${line}`).join('\n');
}

function numbered(lines) {
  return lines.map((line, index) => `${index + 1}. ${line}`).join('\n');
}

if (isMain(import.meta.url)) {
  const slug = process.argv[2];

  if (!slug || process.argv.length > 3) {
    throw new Error('Usage: node pr.mjs <slug>');
  }

  writePrBody(slug);
}
