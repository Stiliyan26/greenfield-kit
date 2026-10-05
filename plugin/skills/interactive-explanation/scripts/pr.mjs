// The PR description, from the same script.json as the page: same sections,
// same Mermaid diagrams, written in ASD-STE100. Writes temp/explainers/<slug>/pr-body.md
// with the screenshots and videos as local paths; `gh pr edit --attach` uploads them
// and rewrites each path to the uploaded file, so nothing is committed.
import { existsSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { DiagramType, GITHUB_MEDIA_LIMIT_BYTES, ROOT, Video } from './constants.mjs';
import { explainerDir, isMain } from './lib.mjs';
import { erDiagram, loadDatabase, relationSentence } from './database.mjs';
import { STATUS_LEGEND, usesStatusClasses, withStatusClasses } from './page.mjs';
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
  return [
    review && section('Review map', reviewParts(review, media)),
    section('Summary', [bullets([script.description].flat()), `**Impact:** ${script.impact}`]),
    script.beforeAfter && section('Before and after', [
      '**Before**', mermaid(script.beforeAfter.before),
      '**After**', mermaid(script.beforeAfter.after),
      script.beforeAfter.note,
    ]),
    (script.diagrams?.length || media.videos[Video.Architecture]) && section('How it works', [
      ...(script.diagrams ?? []).flatMap(diagramParts),
      media.videos[Video.Architecture],
    ]),
    script.database && section('Data model', databaseParts(loadDatabase(script.database))),
    (script.screens?.length || media.videos[Video.Journey]) && section('Screens', [
      ...screenParts(script.screens ?? [], media.screens),
      media.videos[Video.Journey],
    ]),
    section('Outcome', [bullets(script.outcome)]),
    script.risks && section('Impact and risk', [
      script.risks.mermaid && mermaid(script.risks.mermaid),
      bullets(script.risks.items.map((item) => `**${item.area}.** ${item.text}`)),
      script.risks.deploy?.length && `**Deploy**\n\n${numbered(script.risks.deploy)}`,
    ]),
    script.tests && section('Tests', [
      script.tests.summary,
      bullets(script.tests.items.map((item) => `\`${item.name}\`: ${item.proves}`)),
    ]),
  ]
    .filter(Boolean)
    .join('\n\n')
    .concat('\n');
}

// The screenshots and videos the build left next to the page, as the relative
// paths the body uses. `--attach` must get the same strings to rewrite them.
function localMedia(dir, script, review) {
  const screens = (script.screens ?? []).map((screen) => `./screens/${screen.shot.replace('/', '-')}.png`);
  const reviewShots = (review?.shots ?? []).map((shot) => shot.image);
  const exists = (file) => existsSync(path.join(dir, file));
  const videoFiles = Object.values(Video).map((video) => [video, `./${video}.mp4`]).filter(([, file]) => exists(file));

  return {
    screens: screens.map((file) => (exists(file) ? file : null)),
    // A video renders as a player only as image syntax alone in its paragraph.
    videos: Object.fromEntries(videoFiles.map(([video, file]) => [video, `![](${file})`])),
    reviewShots: reviewShots.filter(exists),
    files: [...reviewShots.filter(exists), ...screens.filter(exists), ...videoFiles.map(([, file]) => file)],
  };
}

// The annotated shots, then one group per box in reading order: the box's component
// file, then the changed files it imports, indented by depth.
function reviewParts(review, media) {
  const groupByNumber = new Map(review.groups.filter((group) => group.number).map((group) => [group.number, group]));
  const shots = review.shots
    .filter((shot) => media.reviewShots.includes(shot.image))
    .flatMap((shot) => [
      `### ${shot.caption}`,
      `![${shot.caption}](${shot.image})`,
      shot.wholeScreen.length > 0 && `_${shotCaption(shot)}_`,
      ...shot.firstNumbers.map((number) => reviewGroupMarkdown(groupByNumber.get(number))),
    ].filter(Boolean));
  const placed = new Set(review.shots.flatMap((shot) => shot.firstNumbers));
  const rest = review.groups.filter((group) => !placed.has(group.number)).map(reviewGroupMarkdown);

  return ['Each box is a changed component. Under each screen, read its files top to bottom: the component first, then what it uses.', ...shots, ...rest];
}

function reviewGroupMarkdown(group) {
  const title = group.number
    ? `**${group.number}. ${group.title}**`
    : `**${group.title}**`;

  return [title, group.entries.map(reviewFileLine).join('\n')].join('\n\n');
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

// A screenshot shows inline when its file exists; otherwise only its caption.
function screenParts(screens, files) {
  return screens.map((screen, index) => {
    const file = files[index];

    return file
      ? `![${screen.caption}](${file})`
      : `- ${screen.caption}`;
  });
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
  return ['```mermaid', withStatusClasses(source), '```'].join('\n');
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
