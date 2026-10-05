import type { CSSProperties } from 'react';
import { AbsoluteFill } from 'remotion';

import { theme } from '../theme';
import type { BeforeAfterScene } from '../types';
import { Card, contentArea, Heading, useReveal } from './shared';

export const BeforeAfter: React.FC<{ scene: BeforeAfterScene }> = ({ scene }) => (
  <AbsoluteFill>
    <Heading>{scene.heading}</Heading>

    <div style={styles.columns}>
      <Column label="Before" items={scene.before} isAfter={false} firstOrder={0} />
      <Column label="After" items={scene.after} isAfter firstOrder={scene.before.length} />
    </div>
  </AbsoluteFill>
);

type ColumnProps = { label: string; items: string[]; isAfter: boolean; firstOrder: number };

const Column: React.FC<ColumnProps> = ({ label, items, isAfter, firstOrder }) => {
  const reveal = useReveal(firstOrder, { delay: 6 });
  const cardStyle = { background: isAfter ? theme.surface : theme.sunken };
  const railColor = isAfter ? theme.brand : theme.line;
  const labelStyle = { ...styles.label, color: isAfter ? theme.brand : theme.muted, ...reveal };

  return (
    <Card rail={railColor} style={cardStyle}>
      <div style={labelStyle}>{label}</div>

      <ul style={styles.list}>
        {items.map((item, index) => (
          <Item key={item} text={item} order={firstOrder + index + 1} isAfter={isAfter} />
        ))}
      </ul>
    </Card>
  );
};

type ItemProps = { text: string; order: number; isAfter: boolean };

const Item: React.FC<ItemProps> = ({ text, order, isAfter }) => {
  const reveal = useReveal(order, { delay: 6 });
  const bulletColor = isAfter ? theme.brand : theme.muted;
  const textColor = isAfter ? theme.heading : theme.text;

  return (
    <li style={{ ...styles.item, color: textColor, ...reveal }}>
      <span style={{ ...styles.bullet, background: bulletColor }} />
      <span>{text}</span>
    </li>
  );
};

const styles = {
  columns: {
    ...contentArea,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 28,
  },
  label: {
    marginBottom: 16,
    fontSize: 15,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },
  item: { display: 'flex', gap: 12, fontSize: 22, lineHeight: 1.4 },
  bullet: { flex: 'none', width: 8, height: 8, marginTop: 11, borderRadius: '50%' },
} satisfies Record<string, CSSProperties>;
