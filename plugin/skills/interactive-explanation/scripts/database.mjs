// The "Data model" section. The facts (columns, keys, relations, constraints)
// come from the command in .claude/explain.config.json (`database.command`), so
// they are always what the schema says. The script only adds the story: which
// tables and what each relation means.
import path from 'node:path';

import { CONFIG, ROOT } from './constants.mjs';
import { run } from './lib.mjs';

const KEY_LABEL = { primary: 'PK', foreign: 'FK', unique: 'UK' };
// Parent on the left, children on the right.
const ONE_TO_MANY = '||--o{';

// Reads the facts for the script's tables and joins the story onto them.
export function loadDatabase(database) {
  if (!database) return null;

  const facts = readSchemaFacts(database.tables);
  const meaningByRelation = new Map((database.relations ?? []).map((item) => [relationKey(item), item.meaning]));
  const tables = facts.tables;
  const relations = tables.flatMap((table) => relationsOf(table, meaningByRelation));

  return { tables, relations, intro: database.intro ?? null };
}

export function erDiagram({ tables, relations }) {
  const lines = ['erDiagram'];

  for (const relation of relations) {
    lines.push(`  ${relation.to.table} ${ONE_TO_MANY} ${relation.from.table} : "${mermaidLabel(relation.label)}"`);
  }

  for (const table of tables) {
    lines.push(`  ${table.name} {`);

    for (const column of table.columns) {
      lines.push(`    ${erType(column.type)} ${column.name} ${erKeys(column)}${erComment(column)}`);
    }

    lines.push('  }');
  }

  return lines.join('\n');
}

// One line per foreign key, in words: from, to, how many, what happens on delete, meaning.
function relationsOf(table, meaningByRelation) {
  return table.columns
    .filter((column) => column.foreignKey)
    .map((column) => {
      const to = column.foreignKey;
      const key = `${table.name}.${column.name}`;

      return {
        from: { table: table.name, column: column.name },
        to: { table: to.table, column: to.column },
        cardinality: 'many-to-one',
        onDelete: to.onDelete,
        label: column.name,
        meaning: meaningByRelation.get(key) ?? null,
      };
    });
}

export function relationSentence(relation) {
  const effect = DELETE_EFFECT[relation.onDelete] ?? `ON DELETE ${relation.onDelete}`;

  return `Each ${relation.from.table} row points to one ${relation.to.table} row through ${relation.from.column} → ${relation.to.column}. ${effect}`;
}

const DELETE_EFFECT = {
  CASCADE: 'Delete the parent and these rows go too.',
  RESTRICT: 'The parent cannot be deleted while these rows exist.',
  'SET NULL': 'Delete the parent and this column becomes empty.',
  'NO ACTION': 'The parent cannot be deleted while these rows exist.',
};

// Column flags in the order a reader expects: PK, FK, UK.
function columnFlags(column) {
  return [
    column.primary && KEY_LABEL.primary,
    column.foreignKey && KEY_LABEL.foreign,
    column.unique && !column.primary && KEY_LABEL.unique,
  ].filter(Boolean);
}

function readSchemaFacts(tables) {
  const source = CONFIG.database;

  if (!source?.command) {
    throw new Error('The script has a "database" block, but .claude/explain.config.json has no database.command. Add one, or draw the schema as an "er" diagram.');
  }

  const [program, ...args] = source.command;
  const output = run(program, [...args, ...tables], { cwd: source.cwd ? path.join(ROOT, source.cwd) : ROOT, quiet: true });

  return JSON.parse(output);
}

function relationKey(item) {
  return `${item.table}.${item.column}`;
}

function erType(type) {
  // Mermaid ER types allow no parentheses or spaces: varchar(200) -> varchar_200.
  return type.replace(/\((\d+)\)/, '_$1').replace(/\s+/g, '_');
}

function erKeys(column) {
  const flags = columnFlags(column);

  return flags.length ? `${flags.join(',')} ` : '';
}

function erComment(column) {
  const parts = [column.comment, column.nullable ? 'nullable' : null, column.default !== null && column.default !== 'now()' ? `default ${column.default}` : null].filter(Boolean);

  return parts.length ? `"${mermaidLabel(parts.join(', '))}"` : '';
}

function mermaidLabel(text) {
  return text.replace(/"/g, "'");
}
