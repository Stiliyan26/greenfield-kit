import type { CSSProperties } from 'react';
import { AbsoluteFill } from 'remotion';

import { theme } from '../theme';
import type { FileStatus, FilesScene } from '../types';
import { Card, contentArea, Heading, useReveal } from './shared';

type StatusLook = { label: string; color: string; background: string };

const STATUS_LOOKS: Record<FileStatus, StatusLook> = {
  added: { label: 'new', color: theme.success, background: theme.successSoft },
  changed: { label: 'changed', color: theme.warning, background: theme.warningSoft },
  removed: { label: 'removed', color: theme.danger, background: theme.dangerSoft },
  kept: { label: 'unchanged', color: theme.muted, background: theme.sunken },
};

const LARGE_LIST_ROWS = 12;
const MEDIUM_LIST_ROWS = 8;

export const Files: React.FC<{ scene: FilesScene }> = ({ scene }) => {
  const fontSize = fontSizeFor(scene.tree.length);

  return (
    <AbsoluteFill>
      <Heading>{scene.heading}</Heading>

      <div style={contentArea}>
        <Card style={styles.card}>
          {scene.tree.map((entry, index) => (
            <Row key={entry.path} entry={entry} order={index} fontSize={fontSize} />
          ))}
        </Card>
      </div>
    </AbsoluteFill>
  );
};

type RowProps = { entry: FilesScene['tree'][number]; order: number; fontSize: number };

const Row: React.FC<RowProps> = ({ entry, order, fontSize }) => {
  const reveal = useReveal(order, { delay: 6, every: 4 });
  const look = STATUS_LOOKS[entry.status] ?? STATUS_LOOKS.kept;
  const { directory, name } = splitPath(entry.path);
  const isRemoved = entry.status === 'removed';

  const rowStyle = { ...styles.row, padding: `${fontSize * 0.42}px 28px`, fontSize, ...reveal };
  const pillStyle = { ...styles.pill, color: look.color, background: look.background };
  const pathStyle = {
    textDecoration: isRemoved ? 'line-through' : 'none',
    color: isRemoved ? theme.muted : theme.heading,
  };

  return (
    <div style={rowStyle}>
      <span style={pillStyle}>{look.label}</span>

      <span style={pathStyle}>
        <span style={styles.directory}>{directory}</span>
        {name}
      </span>

      {entry.note ? <span style={{ ...styles.note, fontSize: fontSize - 3 }}>{entry.note}</span> : <span />}
    </div>
  );
};

function fontSizeFor(rowCount: number) {
  if (rowCount > LARGE_LIST_ROWS) return 16;
  if (rowCount > MEDIUM_LIST_ROWS) return 18;

  return 20;
}

function splitPath(path: string) {
  const slash = path.lastIndexOf('/');

  return { directory: path.slice(0, slash + 1), name: path.slice(slash + 1) };
}

const styles = {
  card: { height: '100%', padding: '14px 0', overflow: 'hidden' },
  row: {
    display: 'grid',
    gridTemplateColumns: '100px 1fr auto',
    gap: 16,
    alignItems: 'center',
    fontFamily: theme.mono,
  },
  pill: {
    padding: '3px 8px',
    borderRadius: 6,
    fontFamily: theme.sans,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.06em',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  directory: { color: theme.muted },
  note: { color: theme.muted, fontFamily: theme.sans },
} satisfies Record<string, CSSProperties>;
