import type { CSSProperties } from 'react';
import { AbsoluteFill } from 'remotion';

import { PAGE_PAD, theme } from '../theme';
import type { CodeScene } from '../types';
import { CONTENT_BOTTOM, CONTENT_TOP, Card, Heading, useReveal } from './shared';

const WIDTH = 1280;
const HEIGHT = 720;
const FILE_BAR_HEIGHT = 56;
const GUTTER_WIDTH = 90;
const LINE_HEIGHT = 1.55;
const CHARACTER_WIDTH = 0.62;
const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 21;
const NO_HEADING_TOP = 64;

// Monospace code with line numbers. Highlighted lines carry the brand rail.
export const Code: React.FC<{ scene: CodeScene }> = ({ scene }) => {
  const lines = scene.code.replace(/\n$/, '').split('\n');
  const highlighted = new Set(scene.highlight ?? []);
  const top = scene.heading ? CONTENT_TOP : NO_HEADING_TOP;
  const fontSize = fontSizeFor(lines, top);

  return (
    <AbsoluteFill>
      {scene.heading ? <Heading>{scene.heading}</Heading> : null}

      <div style={{ ...styles.area, top }}>
        <Card style={styles.card}>
          <div style={styles.fileBar}>{scene.file}</div>

          <pre style={{ ...styles.code, fontSize }}>
            {lines.map((text, index) => (
              <Line key={index} number={index + 1} text={text} isHighlighted={highlighted.has(index + 1)} />
            ))}
          </pre>
        </Card>
      </div>
    </AbsoluteFill>
  );
};

type LineProps = { number: number; text: string; isHighlighted: boolean };

const Line: React.FC<LineProps> = ({ number, text, isHighlighted }) => {
  const reveal = useReveal(number - 1, { delay: 4, every: 2 });
  const lineStyle = {
    ...styles.line,
    background: isHighlighted ? theme.wash : 'transparent',
    borderLeft: `3px solid ${isHighlighted ? theme.brand : 'transparent'}`,
    ...reveal,
  };

  return (
    <div style={lineStyle}>
      <span style={styles.number}>{number}</span>
      <span style={{ color: isHighlighted ? theme.heading : theme.text }}>{text || ' '}</span>
    </div>
  );
};

// The largest size at which every line fits both the height and the width.
function fontSizeFor(lines: string[], top: number) {
  const longest = Math.max(1, ...lines.map((line) => line.length));
  const availableHeight = HEIGHT - top - CONTENT_BOTTOM - FILE_BAR_HEIGHT;
  const availableWidth = WIDTH - PAGE_PAD * 2 - GUTTER_WIDTH;
  const byHeight = Math.floor(availableHeight / (lines.length * LINE_HEIGHT));
  const byWidth = Math.floor(availableWidth / (longest * CHARACTER_WIDTH));

  return Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, byHeight, byWidth));
}

const styles = {
  area: { position: 'absolute', left: PAGE_PAD, right: PAGE_PAD, bottom: CONTENT_BOTTOM },
  card: { height: '100%', padding: 0, overflow: 'hidden' },
  fileBar: {
    padding: '10px 20px',
    borderBottom: `1px solid ${theme.line}`,
    background: theme.sunken,
    color: theme.muted,
    fontFamily: theme.mono,
    fontSize: 14,
  },
  code: {
    margin: 0,
    padding: '12px 0',
    fontFamily: theme.mono,
    lineHeight: LINE_HEIGHT,
    whiteSpace: 'pre',
    overflow: 'hidden',
  },
  line: { display: 'flex' },
  number: {
    flex: 'none',
    width: 56,
    paddingRight: 16,
    color: theme.muted,
    textAlign: 'right',
    userSelect: 'none',
  },
} satisfies Record<string, CSSProperties>;
