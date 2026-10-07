// ASD-STE100 style warnings for every piece of text in a script: the page, the
// PR body and the narration. Warnings never block the build; they list what to
// rewrite. The checks are heuristics, not the full STE dictionary.
import { Mode, READING, VIDEOS } from './constants.mjs';

// STE limits: 20 words in a procedural sentence (a step), 25 in a descriptive one.
const MAX_WORDS = { procedural: 20, descriptive: 25 };

// Filler and words STE replaces with a simpler approved word.
const AVOID = {
  simply: 'leave it out',
  just: 'leave it out',
  basically: 'leave it out',
  obviously: 'leave it out',
  actually: 'leave it out',
  really: 'leave it out',
  very: 'leave it out',
  easily: 'leave it out',
  quite: 'leave it out',
  utilize: 'use',
  utilise: 'use',
  leverage: 'use',
  facilitate: 'help',
  commence: 'start',
  terminate: 'stop',
  approximately: 'about',
  'in order to': 'to',
  'a lot of': 'many',
  'make sure': 'ensure',
};

// "is shown", "are deleted", "was made": a likely passive verb.
const PASSIVE = /\b(?:is|are|was|were|be|been|being)\s+(?:\w+ed|made|done|shown|given|taken|kept|sent|built|set|put|written|seen|run|found|held|told|left)\b/i;

const SENTENCE_BREAK = /(?<=[.!?])\s+(?=[A-Z0-9"“(])/;

export function checkStyle(script) {
  const warnings = textsOf(script).flatMap(({ where, text, kind }) => {
    return sentencesOf(text).flatMap((sentence) => sentenceWarnings(sentence, kind).map((problem) => `${where}: ${problem}`));
  });
  const minutes = readingMinutes(script);
  const max = READING.maxMinutes[script.mode ?? Mode.Pr];

  if (minutes > max) {
    warnings.push(`page: about ${minutes.toFixed(1)} minutes to read; aim for ${max} or less`);
  }

  return warnings;
}

// Reading time for the page, videos excluded: words at a steady pace, plus a
// fixed time to take in each diagram, screen and sketch (test output counts as a sketch).
export function readingMinutes(script) {
  const words = textsOf(script, { includeVideo: false })
    .map(({ text }) => wordCount(text))
    .reduce((sum, count) => sum + count, 0);
  const diagrams = (script.diagrams?.length ?? 0) + (script.beforeAfter ? 1 : 0) + (script.risks?.mermaid ? 1 : 0) + (script.database ? 1 : 0);
  const screens = script.screens?.length ?? 0;
  const sketches = (script.sketches?.length ?? 0) + (script.evidence?.length ?? 0) * 2;
  const seconds =
    (words / READING.wordsPerMinute) * 60 +
    diagrams * READING.secondsPerDiagram +
    screens * READING.secondsPerScreen +
    sketches * READING.secondsPerSketch;

  return seconds / 60;
}

export function printStyleWarnings(warnings) {
  if (warnings.length === 0) {
    console.log('style: no ASD-STE100 warnings');

    return;
  }

  console.log(`style: ${warnings.length} ASD-STE100 warning(s). The build continues; rewrite these when you can:`);
  warnings.forEach((warning) => console.log(`  - ${warning}`));
}

function sentenceWarnings(sentence, kind) {
  const words = wordCount(sentence);
  const lower = ` ${sentence.toLowerCase()} `;
  const avoid = Object.entries(AVOID)
    .filter(([word]) => new RegExp(`[^a-z]${word}[^a-z]`).test(lower))
    .map(([word, instead]) => `"${word}": ${instead}`);

  return [
    ...(words > MAX_WORDS[kind] ? [`${words} words (max ${MAX_WORDS[kind]}) in "${clip(sentence)}"`] : []),
    ...avoid.map((advice) => `${advice} in "${clip(sentence)}"`),
    ...(PASSIVE.test(sentence) ? [`likely passive voice in "${clip(sentence)}"`] : []),
  ];
}

// Every human-readable string, labelled with where it lives. Steps (deploy,
// migration steps) are procedural; everything else is descriptive.
function textsOf(script, { includeVideo = true } = {}) {
  const texts = [];
  const add = (where, text, kind = 'descriptive') => {
    if (typeof text === 'string' && text.trim()) texts.push({ where, text, kind });
  };

  [script.description].flat().forEach((line, i) => add(`description[${i}]`, line));
  add('impact', script.impact);
  (script.sketches ?? []).forEach((sketch, i) => {
    add(`sketches[${i}].heading`, sketch.heading);
    add(`sketches[${i}].text`, sketch.text);
  });
  (script.evidence ?? []).forEach((pair, i) => add(`evidence[${i}].label`, pair.label));
  add('beforeAfter.note', script.beforeAfter?.note);
  (script.diagrams ?? []).forEach((diagram, i) => {
    add(`diagrams[${i}].heading`, diagram.heading);
    add(`diagrams[${i}].note`, diagram.note);
    (diagram.steps ?? []).forEach((step, j) => add(`diagrams[${i}].steps[${j}]`, step, 'procedural'));
  });
  (script.screens ?? []).forEach((screen, i) => add(`screens[${i}].caption`, screen.caption));
  (script.outcome ?? []).forEach((line, i) => add(`outcome[${i}]`, line));
  add('risks.door.text', script.risks?.door?.text);
  add('risks.blastRadius.text', script.risks?.blastRadius?.text);
  (script.risks?.items ?? []).forEach((item, i) => add(`risks.items[${i}]`, item.text));
  add('tests.summary', script.tests?.summary);
  (script.tests?.items ?? []).forEach((item, i) => add(`tests.items[${i}]`, item.proves));
  (script.risks?.deploy ?? []).forEach((step, i) => add(`risks.deploy[${i}]`, step, 'procedural'));
  add('database.intro', script.database?.intro);
  (script.database?.relations ?? []).forEach((item, i) => add(`database.relations[${i}].meaning`, item.meaning));

  if (includeVideo) {
    VIDEOS.flatMap((video) => script[video]?.scenes ?? []).forEach((scene) => {
      add(`${scene.id}.narration`, scene.narration);
      add(`${scene.id}.caption`, scene.caption);
      (scene.items ?? []).forEach((item, j) => add(`${scene.id}.items[${j}]`, item));
    });
  }

  return texts;
}

function sentencesOf(text) {
  return text.split(SENTENCE_BREAK).map((sentence) => sentence.trim()).filter(Boolean);
}

function wordCount(text) {
  return text.split(/\s+/).filter((word) => /[A-Za-z0-9]/.test(word)).length;
}

function clip(sentence) {
  return sentence.length > 60 ? `${sentence.slice(0, 57)}…` : sentence;
}
