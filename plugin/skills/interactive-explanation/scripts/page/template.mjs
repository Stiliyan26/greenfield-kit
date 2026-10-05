import { readFileSync } from 'node:fs';
import path from 'node:path';

import { BRAND, DiagramType, MERMAID_CDN, Video } from '../constants.mjs';
import { erDiagram, relationSentence } from '../database.mjs';
import { STATUS_LEGEND, usesStatusClasses, withStatusClasses } from '../page.mjs';
import { escapeHtml, formatClock } from './html.mjs';

const PAGE_DIR = import.meta.dirname;
const STYLES = readFileSync(path.join(PAGE_DIR, 'page.css'), 'utf8');
const PLAYER_SCRIPT = readFileSync(path.join(PAGE_DIR, 'player.js'), 'utf8');
const REVIEW_SCRIPT = readFileSync(path.join(PAGE_DIR, 'review.js'), 'utf8');

const VIDEO_BLURBS = {
  [Video.Journey]: { heading: 'Watch the user journey', blurb: 'How it was before, and how it works now' },
  [Video.Architecture]: { heading: 'Watch the architecture walkthrough', blurb: 'File split, where state lives, decisions' },
};

const DIAGRAM_KICKERS = {
  [DiagramType.Flowchart]: 'Flow',
  [DiagramType.Er]: 'Data model',
  [DiagramType.Sequence]: 'Request flow',
  [DiagramType.Component]: 'Components',
  [DiagramType.State]: 'States',
};

// Page order: read top to bottom in 2–5 minutes; each video sits in the section it explains.
const SECTIONS = [
  { id: 'review', label: 'Review map', render: ({ review }) => reviewHtml(review) },
  { id: 'what', label: 'What it does', render: ({ script }) => whatHtml(script.description) },
  { id: 'before-after', label: 'Before → After', render: ({ script }) => beforeAfterHtml(script.beforeAfter) },
  { id: 'how', label: 'How it works', render: howHtml },
  { id: 'data', label: 'Data model', render: ({ database }) => databaseHtml(database) },
  { id: 'screens', label: 'Screens', render: screensHtml },
  { id: 'outcome', label: 'Outcome', render: ({ script }) => listSection('outcome', 'Outcome', 'What people can do now', script.outcome) },
  { id: 'impact', label: 'Impact & risk', render: ({ script }) => risksHtml(script.risks) },
  { id: 'tests', label: 'Tests', render: ({ script }) => testsHtml(script.tests) },
];

const FONTS_LINK =
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap">';

const MERMAID_INIT = `mermaid.initialize({
  startOnLoad: true,
  securityLevel: 'strict',
  theme: 'base',
  themeVariables: {
    fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
    fontSize: '15px',
    primaryColor: '#fbf2e8',
    primaryBorderColor: '#5e4500',
    primaryTextColor: '#1e1b15',
    secondaryColor: '#f9f7f2',
    tertiaryColor: '#ffffff',
    lineColor: '#786e60',
    textColor: '#4d4638',
    actorBkg: '#fbf2e8',
    actorBorder: '#5e4500',
    noteBkgColor: '#f9f7f2',
    noteBorderColor: '#e6e1d6'
  }
});`;

// A full local document that loads Mermaid from cdnjs.
export function renderPage(context) {
  const { script } = context;
  const rendered = SECTIONS.map((section) => ({ ...section, html: section.render(context) })).filter((section) => section.html);
  const head = `<title>${escapeHtml(script.title)}</title>
${FONTS_LINK}
<style>
${STYLES}
</style>`;
  const content = `<main>
${headerHtml(context)}
${navHtml(rendered)}
${rendered.map((section) => section.html).join('\n')}
${footerHtml(script.slug)}
</main>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${head}
</head>
<body>
${content}
<script src="${MERMAID_CDN}"></script>
<script>
${MERMAID_INIT}
${PLAYER_SCRIPT}
${REVIEW_SCRIPT}
</script>
</body>
</html>
`;
}

function headerHtml({ script, readMinutes, videos }) {
  const subtitle = script.subtitle ? `<p class="muted">${escapeHtml(script.subtitle)}</p>` : '';
  const pr = script.prUrl ? `<a href="${escapeHtml(script.prUrl)}">${escapeHtml(prLabel(script.prUrl))}</a><span aria-hidden="true">·</span>` : '';

  return `<header>
  <div class="brand"><i></i> ${escapeHtml(BRAND)} explainer</div>
  <h1>${escapeHtml(script.title)}</h1>
  ${subtitle}
  <p class="meta">${pr}<span>About ${Math.max(1, Math.round(readMinutes))} min to read</span>${Object.keys(videos).length ? '<span aria-hidden="true">·</span><span>Videos are extra</span>' : ''}</p>
  <p class="impact">${escapeHtml(script.impact)}</p>
</header>`;
}

function navHtml(sections) {
  const links = sections.map((section) => `<a href="#${section.id}">${escapeHtml(section.label)}</a>`).join('');

  return `<nav class="toc" aria-label="Sections">${links}</nav>`;
}

function whatHtml(description) {
  const lines = [description].flat();
  const body = lines.length === 1
    ? `<p class="plain">${escapeHtml(lines[0])}</p>`
    : `<ul class="functions">${lines.map((line) => `<li><span>${escapeHtml(line)}</span></li>`).join('')}</ul>`;

  return sectionHtml('what', 'What it does', null, body);
}

function beforeAfterHtml(beforeAfter) {
  if (!beforeAfter) return '';

  const note = beforeAfter.note ? `<p class="note">${escapeHtml(beforeAfter.note)}</p>` : '';
  const body = `<div class="pair">
    <figure class="pair__side pair__side--before"><figcaption>Before</figcaption>${mermaidHtml(beforeAfter.before)}</figure>
    <figure class="pair__side pair__side--after"><figcaption>After</figcaption>${mermaidHtml(beforeAfter.after)}</figure>
  </div>${note}`;

  return sectionHtml('before-after', 'Before → After', 'What changes for the people who use it', body);
}

function howHtml({ script, videos }) {
  const diagrams = (script.diagrams ?? []).map(diagramBlockHtml).join('');
  const video = videoHtml(Video.Architecture, videos[Video.Architecture]);

  if (!diagrams && !video) return '';

  return sectionHtml('how', 'How it works', 'The diagrams that matter for this change', `${diagrams}${video}`);
}

// Data model: the ER with keys, every relation in words, then example rows per
// table whose foreign key values line up, so the reader can follow one story.
function databaseHtml(database) {
  if (!database) return '';

  const intro = database.intro ? `<p class="plain">${escapeHtml(database.intro)}</p>` : '';
  const diagram = `<div class="block">
    <div class="kicker">Tables and keys</div>
    ${mermaidHtml(erDiagram(database))}
    <ul class="legend" aria-label="Key legend"><li><b>PK</b> primary key</li><li><b>FK</b> foreign key</li><li><b>UK</b> unique</li></ul>
  </div>`;
  const relations = database.relations.length ? relationsHtml(database.relations) : '';

  return sectionHtml('data', 'Data model', 'How the tables relate', `${intro}${diagram}${relations}`);
}

function relationsHtml(relations) {
  const rows = relations.map((relation) => `<tr>
      <th scope="row"><code>${escapeHtml(relation.from.table)}.${escapeHtml(relation.from.column)}</code> → <code>${escapeHtml(relation.to.table)}.${escapeHtml(relation.to.column)}</code></th>
      <td>${escapeHtml(relation.cardinality)}, <code>ON DELETE ${escapeHtml(relation.onDelete)}</code></td>
      <td>${relation.meaning ? escapeHtml(relation.meaning) : `<span class="muted">${escapeHtml(relationSentence(relation))}</span>`}</td>
    </tr>`).join('');

  return `<div class="block">
    <div class="kicker">Relations</div>
    <table class="tests relations"><thead><tr><th scope="col">Foreign key</th><th scope="col">Kind</th><th scope="col">Meaning</th></tr></thead><tbody>${rows}</tbody></table>
  </div>`;
}

function diagramBlockHtml(diagram) {
  const steps = diagram.steps?.length
    ? `<ol class="steps">${diagram.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol>`
    : '';
  const note = diagram.note ? `<p class="note">${escapeHtml(diagram.note)}</p>` : '';
  const legend = usesStatusClasses(diagram.mermaid) ? legendHtml() : '';

  return `<div class="block">
    <div class="kicker">${escapeHtml(DIAGRAM_KICKERS[diagram.type])}</div>
    <h3>${escapeHtml(diagram.heading)}</h3>
    ${mermaidHtml(diagram.mermaid)}
    ${legend}${steps}${note}
  </div>`;
}

function screensHtml({ screens, videos }) {
  if (!screens.length && !videos[Video.Journey]) return '';

  const gallery = screens.length
    ? `<div class="screens">${screens.map(screenHtml).join('')}</div>`
    : '';

  return sectionHtml('screens', 'Screens', 'Captured from the real app in the journey run', `${gallery}${videoHtml(Video.Journey, videos[Video.Journey])}`);
}

// Each box on a shot and its group in the reading order share data-review="<number>";
// review.js lights up both on hover.
function reviewHtml(review) {
  if (!review) return '';

  const groupByNumber = new Map(review.groups.filter((group) => group.number).map((group) => [group.number, group]));
  const placed = new Set(review.shots.flatMap((shot) => shot.firstNumbers));
  const shots = review.shots.map((shot) => {
    const groups = shot.firstNumbers.map((number) => reviewGroupHtml(groupByNumber.get(number))).join('');

    return `${reviewShotHtml(shot)}<ol class="review-map">${groups}</ol>`;
  });
  const rest = review.groups.filter((group) => !placed.has(group.number)).map(reviewGroupHtml).join('');

  return sectionHtml('review', 'Review map', 'Each box is a changed component. Under each screen, read its files top to bottom: the component first, then what it uses.', `${shots.join('')}<ol class="review-map">${rest}</ol>`);
}

function reviewShotHtml(shot) {
  const percent = (value, total) => `${((value / total) * 100).toFixed(2)}%`;
  const hits = shot.boxes.map((box) => {
    const position = `left:${percent(box.x, shot.crop.width)};top:${percent(box.y, shot.crop.height)};width:${percent(box.width, shot.crop.width)};height:${percent(box.height, shot.crop.height)}`;

    return `<a class="review-shot__hit" href="#review-${box.number}" data-review="${box.number}" style="${position}" aria-label="${escapeHtml(box.label)}"></a>`;
  });

  return `<figure class="review-shot">
    <div class="review-shot__frame"><img src="${escapeHtml(shot.image)}" alt="${escapeHtml(shot.caption)}">${hits.join('')}</div>
    <figcaption>${escapeHtml(shotCaption(shot))}</figcaption>
  </figure>`;
}

// Components that fill the shot have no box; the caption names them.
export function shotCaption(shot) {
  const wholeScreen = shot.wholeScreen.map((box) => `${box.number} ${box.label}`).join(', ');

  return wholeScreen ? `${shot.caption} Whole screen: ${wholeScreen}.` : shot.caption;
}

function reviewGroupHtml(group) {
  const hasNumber = Boolean(group.number);
  const marker = hasNumber
    ? `<span class="review-map__number">${group.number}</span>`
    : '';
  const attributes = hasNumber
    ? ` id="review-${group.number}" data-review="${group.number}"`
    : '';
  const files = group.entries.map(reviewFileHtml).join('');

  return `<li class="review-map__group"${attributes}>
    <h3>${marker}${escapeHtml(group.title)}</h3>
    <ul class="review-map__files">${files}</ul>
  </li>`;
}

function reviewFileHtml(entry) {
  const name = `<code>${escapeHtml(path.posix.basename(entry.file))}</code>`;
  const folder = `<span class="review-map__folder">${escapeHtml(path.posix.dirname(entry.file))}</span>`;
  const link = entry.diffUrl
    ? `<a href="${escapeHtml(entry.diffUrl)}" target="_blank" rel="noopener">${name}</a>`
    : name;
  const note = entry.note ? ` <span class="muted">${escapeHtml(entry.note)}</span>` : '';

  return `<li class="review-map__file" style="--depth:${entry.depth}">${link} <span class="review-map__status review-map__status--${entry.status}">${entry.status}</span> ${folder}${note}</li>`;
}

function screenHtml(screen) {
  return `<figure class="screen">
    <a href="${escapeHtml(screen.src)}" target="_blank" rel="noopener"><img src="${escapeHtml(screen.src)}" alt="${escapeHtml(screen.caption)}"></a>
    <figcaption>${escapeHtml(screen.caption)}</figcaption>
  </figure>`;
}

function risksHtml(risks) {
  if (!risks) return '';

  const diagram = risks.mermaid ? `<div class="block">${mermaidHtml(risks.mermaid)}${usesStatusClasses(risks.mermaid) ? legendHtml() : ''}</div>` : '';
  const items = risks.items.map((item) => `<div class="risk"><dt>${escapeHtml(item.area)}</dt><dd>${escapeHtml(item.text)}</dd></div>`).join('');
  const deploy = risks.deploy?.length
    ? `<h3>Deploy</h3><ol class="steps">${risks.deploy.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol>`
    : '';

  return sectionHtml('impact', 'Impact & risk', 'What this changes for data, the API, users and performance', `${diagram}<dl class="risks">${items}</dl>${deploy}`);
}

function testsHtml(tests) {
  if (!tests) return '';

  const summary = tests.summary ? `<p class="plain">${escapeHtml(tests.summary)}</p>` : '';
  const rows = tests.items.map((item) => `<tr><th scope="row"><code>${escapeHtml(item.name)}</code></th><td>${escapeHtml(item.proves)}</td></tr>`).join('');

  return sectionHtml('tests', 'Tests', null, `${summary}<table class="tests"><thead><tr><th scope="col">Test</th><th scope="col">What it proves</th></tr></thead><tbody>${rows}</tbody></table>`);
}

function listSection(id, heading, blurb, lines) {
  if (!lines?.length) return '';

  return sectionHtml(id, heading, blurb, `<ul class="functions">${lines.map((line) => `<li><span>${escapeHtml(line)}</span></li>`).join('')}</ul>`);
}

function sectionHtml(id, heading, blurb, body) {
  const sub = blurb ? `<p class="muted">${escapeHtml(blurb)}</p>` : '';

  return `<section class="card" id="${id}" aria-labelledby="${id}-title">
  <h2 id="${id}-title">${escapeHtml(heading)}</h2>
  ${sub}
  <div class="card__body">${body}</div>
</section>`;
}

function mermaidHtml(source) {
  return `<pre class="mermaid">${escapeHtml(withStatusClasses(source))}</pre>`;
}

function legendHtml() {
  const items = STATUS_LEGEND.map(({ status, label }) => `<li><i class="swatch swatch--${status}"></i>${label}</li>`).join('');

  return `<ul class="legend" aria-label="Legend">${items}</ul>`;
}

function videoHtml(video, described) {
  if (!described) return '';

  const { chapters, seconds } = described;
  const { heading, blurb } = VIDEO_BLURBS[video];
  const chapterItems = chapters.map(chapterHtml).join('');

  return `<div class="video" data-video="${video}">
  <div class="video__head">
    <div>
      <h3>${heading}</h3>
      <p class="muted">${blurb} · ${formatClock(seconds)}</p>
    </div>
    <div class="actions">
      <button type="button" class="btn btn--primary" data-play-all>Play all</button>
      <a class="btn" href="./${video}.mp4" download>Download</a>
    </div>
  </div>
  <video class="video__player" src="./${video}.mp4" poster="./${video}.poster.jpg" controls preload="metadata" playsinline></video>
  <p class="video__status muted" data-status>Pick a chapter below, or play all.</p>
  <ol class="chapters">${chapterItems}</ol>
</div>`;
}

function chapterHtml(chapter, index) {
  return `
    <li class="chapter" data-start="${chapter.start}" data-end="${chapter.end}">
      <button type="button" class="chapter__button">
        <span class="chapter__index">${index + 1}</span>
        <span class="chapter__label">${escapeHtml(chapter.label)}</span>
        <span class="chapter__time">${formatClock(chapter.start)}</span>
      </button>
      <p class="chapter__narration">${escapeHtml(chapter.narration)}</p>
    </li>`;
}

function prLabel(url) {
  const match = /\/pull\/(\d+)/.exec(url);

  return match ? `Pull request #${match[1]}` : 'Pull request';
}

function footerHtml(slug) {
  return `<footer>Generated by the interactive-explanation skill for <code>${escapeHtml(slug)}</code>. Local files only; nothing is published.</footer>`;
}
