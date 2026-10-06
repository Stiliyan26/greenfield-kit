import { DIAGRAM_TYPES, DOORS, ID_PATTERN, Mode, MODES, SCENE_KINDS, SceneKind, SKETCH_KINDS, SketchKind, VIDEOS, videosIn } from './constants.mjs';

const MIN_NARRATION_LENGTH = 10;

const SHOT_PATTERN = /^[a-z0-9-]+\/[A-Za-z0-9._-]+$/;

const DIFF_LINE_PATTERN = /^[+\- ]/;

export function validateScript(script, slug) {
  const problems = [
    ...checkHeader(script, slug),
    ...checkSections(script),
    ...checkVideos(script),
    ...checkUniqueIds(script),
  ];

  if (problems.length === 0) return;

  throw new Error(`script.json is not valid:\n- ${problems.join('\n- ')}`);
}

function checkHeader(script, slug) {
  const descriptionLines = [script.description].flat();

  return failures([
    [script.slug !== slug, `slug must be "${slug}"`],
    [!isFilled(script.title), 'title is required'],
    [
      !descriptionLines.every((line) => isFilled(line)),
      'description is required (a sentence, or a list of functionalities)',
    ],
    [!isFilled(script.impact), 'impact is required (one sentence)'],
    [script.mode !== undefined && !MODES.includes(script.mode), `mode must be one of ${MODES.join(', ')}`],
  ]);
}

// The reading sections of the page. A PR needs sketches, evidence, outcome, merge
// danger, tests and at least one "How it works" diagram. A task needs outcome and
// something to see: a before/after pair, a diagram or a sketch. Everything else
// only when it applies.
function checkSections(script) {
  const isPr = (script.mode ?? Mode.Pr) === Mode.Pr;
  const hasPicture = script.beforeAfter !== undefined || hasItems(script.diagrams) || hasItems(script.sketches);

  return [
    ...(isPr || script.sketches !== undefined ? checkSketches(script.sketches) : []),
    ...checkBeforeAfter(script.beforeAfter),
    ...(isPr || script.diagrams !== undefined ? checkDiagrams(script.diagrams) : []),
    ...failures([[!isPr && !hasPicture, 'a task needs beforeAfter, a diagram or a sketch']]),
    ...checkList(script.outcome, 'outcome', { required: true }),
    ...(isPr || script.evidence !== undefined ? checkEvidence(script.evidence) : []),
    ...(isPr || script.risks ? checkRisks(script.risks, { isPr }) : []),
    ...(isPr || script.tests ? checkTests(script.tests) : []),
    ...checkScreens(script.screens),
    ...checkDatabase(script.database),
    ...checkList(script.risks?.deploy, 'risks.deploy'),
    ...failures([
      [script.decisions !== undefined, 'decisions moved: put each decision in outcome, with its plan.md Q-number in the text ("… (Q7 in plan.md)")'],
      [script.deploy !== undefined, 'deploy moved: put the deploy steps in risks.deploy'],
      [script.workflow !== undefined, 'workflow is gone: use a Mermaid diagram in diagrams instead'],
    ]),
  ];
}

// Summary sketches: a file tree, component tree, call tree, pseudocode or code.
// With `diff`, every line starts with "+", "-" or a space.
function checkSketches(sketches) {
  if (!hasItems(sketches)) return ['sketches must list at least one Summary sketch'];

  return sketches.flatMap((sketch, index) => {
    const sourceLines = typeof sketch.source === 'string' ? sketch.source.split('\n') : [];
    const problems = failures([
      [!SKETCH_KINDS.includes(sketch.kind), `kind must be one of ${SKETCH_KINDS.join(', ')}`],
      [!isFilled(sketch.heading), 'heading is required'],
      [!isFilled(sketch.text), 'text is required (one sentence next to the sketch)'],
      [!isFilled(sketch.source), 'source is required'],
      [sketch.kind === SketchKind.Code && !isFilled(sketch.file), 'code sketches need "file"'],
      [sketch.diff === true && !sourceLines.every((line) => line === '' || DIFF_LINE_PATTERN.test(line)), 'with diff, every line starts with "+", "-" or a space'],
      [sketch.highlight !== undefined && !isLineNumberList(sketch.highlight), 'highlight must list 1-based line numbers'],
    ]);

    return problems.map((problem) => `sketches[${index}]: ${problem}`);
  });
}

// Evidence pairs: each side is a screenshot ({ shot }) or a test run or console output ({ output }).
function checkEvidence(evidence) {
  if (!hasItems(evidence)) return ['evidence must list at least one before/after pair'];

  return evidence.flatMap((pair, index) => {
    const problems = [
      ...failures([[!isFilled(pair.label), 'label is required']]),
      ...checkEvidenceSide(pair.before, 'before'),
      ...checkEvidenceSide(pair.after, 'after'),
    ];

    return problems.map((problem) => `evidence[${index}]: ${problem}`);
  });
}

function checkEvidenceSide(side, name) {
  const hasShot = side?.shot !== undefined;
  const hasOutput = side?.output !== undefined;

  return failures([
    [hasShot === hasOutput, `${name} needs exactly one of "shot" or "output"`],
    [hasShot && !SHOT_PATTERN.test(side.shot), `${name}.shot must be "<feature>/<step>" from saveStep`],
    [hasOutput && !isFilled(side.output), `${name}.output must be the test or console output`],
  ]);
}

function checkBeforeAfter(beforeAfter) {
  if (beforeAfter === undefined) return [];

  return failures([
    [!isFilled(beforeAfter.before), 'beforeAfter.before must be Mermaid source'],
    [!isFilled(beforeAfter.after), 'beforeAfter.after must be Mermaid source'],
  ]);
}

function checkDiagrams(diagrams) {
  if (!hasItems(diagrams)) return ['diagrams must list at least one "How it works" diagram'];

  return diagrams.flatMap((diagram, index) => {
    const problems = failures([
      [!DIAGRAM_TYPES.includes(diagram.type), `type must be one of ${DIAGRAM_TYPES.join(', ')}`],
      [!isFilled(diagram.heading), 'heading is required'],
      [!isFilled(diagram.mermaid), 'mermaid source is required'],
      [diagram.steps !== undefined && !isStringList(diagram.steps), 'steps must be a list of sentences'],
    ]);

    return problems.map((problem) => `diagrams[${index}]: ${problem}`);
  });
}

// Merge danger. A PR needs the door and the blast radius; the area rows are optional.
function checkRisks(risks, { isPr }) {
  if (!risks) return ['risks is required ({ door, blastRadius, items?, mermaid?, deploy? })'];

  const items = risks.items ?? [];
  const itemProblems = items.flatMap((item, index) => {
    return failures([
      [!isFilled(item.area), `risks.items[${index}].area is required`],
      [!isFilled(item.text), `risks.items[${index}].text is required`],
    ]);
  });

  return [
    ...failures([
      [(isPr || risks.door !== undefined) && !DOORS.includes(risks.door?.type), `risks.door.type must be one of ${DOORS.join(', ')}`],
      [(isPr || risks.blastRadius !== undefined) && !isFilled(risks.blastRadius?.scope), 'risks.blastRadius.scope is required (one word)'],
      [risks.items !== undefined && !hasItems(items), 'risks.items must not be empty when present'],
    ]),
    ...itemProblems,
  ];
}

function checkTests(tests) {
  if (!tests) return ['tests is required ({ summary?, items: [{ name, proves }] })'];

  const items = tests.items ?? [];
  const itemProblems = items.flatMap((item, index) => {
    return failures([
      [!isFilled(item.name), `tests.items[${index}].name is required`],
      [!isFilled(item.proves), `tests.items[${index}].proves is required`],
    ]);
  });

  return [...failures([[!hasItems(items), 'tests.items must not be empty']]), ...itemProblems];
}

function checkScreens(screens) {
  if (screens === undefined) return [];
  if (!hasItems(screens)) return ['screens must be a non-empty list when present'];

  return screens.flatMap((screen, index) => {
    return failures([
      [!SHOT_PATTERN.test(screen.shot ?? ''), `screens[${index}].shot must be "<feature>/<step>" from saveStep`],
      [!isFilled(screen.caption), `screens[${index}].caption is required`],
    ]);
  });
}

// The data model: which tables to read from the server metadata, plus the story
// the agent writes (relation meanings and example rows that line up).
function checkDatabase(database) {
  if (database === undefined) return [];

  const relationProblems = (database.relations ?? []).flatMap((item, index) => {
    return failures([
      [!isFilled(item.table) || !isFilled(item.column), `database.relations[${index}] needs table and column (the foreign key column)`],
      [!isFilled(item.meaning), `database.relations[${index}].meaning is required`],
    ]);
  });

  return [
    ...failures([[!isStringList(database.tables), 'database.tables must list the table names to show']]),
    ...relationProblems,
  ];
}

function checkList(list, name, { required = false } = {}) {
  if (list === undefined) return required ? [`${name} is required (a list of sentences)`] : [];

  return failures([[!isStringList(list), `${name} must be a non-empty list of sentences`]]);
}

// Videos are optional per video; a PR needs at least one.
function checkVideos(script) {
  const isPr = (script.mode ?? Mode.Pr) === Mode.Pr;
  const present = videosIn(script);

  return [
    ...failures([[isPr && present.length === 0, 'a PR needs at least one video (journey or architecture)']]),
    ...present.flatMap((video) => checkVideo(script, video)),
  ];
}

function checkVideo(script, video) {
  const scenes = script[video]?.scenes;

  if (!hasItems(scenes)) return [`${video}.scenes must be a non-empty array`];

  return scenes.flatMap((scene, index) => {
    return checkScene(scene).map((problem) => `${video}.scenes[${index}]: ${problem}`);
  });
}

function checkScene(scene) {
  return failures([
    [!ID_PATTERN.test(scene.id ?? ''), 'id must be lowercase letters, digits and dashes'],
    [!SCENE_KINDS.includes(scene.kind), `kind must be one of ${SCENE_KINDS.join(', ')}`],
    [!isFilled(scene.narration, MIN_NARRATION_LENGTH), 'narration is required'],
    [
      scene.kind === SceneKind.Clip && !scene.clip,
      'clip scenes need "clip" (the recorded clip id)',
    ],
    [
      scene.kind === SceneKind.Diagram && !hasItems(scene.nodes),
      'diagram scenes need nodes',
    ],
    [
      scene.kind === SceneKind.Code && typeof scene.code !== 'string',
      'code scenes need "code"',
    ],
  ]);
}

function checkUniqueIds(script) {
  const ids = VIDEOS.flatMap((video) => script[video]?.scenes ?? []).map((scene) => scene.id);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);

  return duplicates.map((id) => `duplicate scene id "${id}"`);
}

// rules are [failed, message] pairs; returns the messages of the ones that failed.
function failures(rules) {
  return rules.filter(([failed]) => failed).map(([, message]) => message);
}

function isFilled(value, minLength = 1) {
  return typeof value === 'string' && value.trim().length >= minLength;
}

function isStringList(value) {
  return hasItems(value) && value.every((item) => isFilled(item));
}

function isLineNumberList(value) {
  return hasItems(value) && value.every((item) => Number.isInteger(item) && item > 0);
}

function hasItems(value) {
  return Array.isArray(value) && value.length > 0;
}
