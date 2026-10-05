import type { CSSProperties } from 'react';
import { AbsoluteFill } from 'remotion';

import { PAGE_PAD, theme } from '../theme';
import type { BulletsScene } from '../types';
import { CONTENT_TOP, Heading, useReveal } from './shared';

const KICKER_OFFSET = 30;
const BIG_TEXT_MAX_ITEMS = 4;

export const Bullets: React.FC<{ scene: BulletsScene }> = ({ scene }) => {
  const top = CONTENT_TOP + (scene.kicker ? KICKER_OFFSET : 0);
  const isBig = scene.items.length <= BIG_TEXT_MAX_ITEMS;

  return (
    <AbsoluteFill>
      <Heading kicker={scene.kicker}>{scene.heading}</Heading>

      <ul style={{ ...styles.list, top }}>
        {scene.items.map((item, index) => (
          <Item key={item} text={item} order={index + 1} isBig={isBig} />
        ))}
      </ul>
    </AbsoluteFill>
  );
};

type ItemProps = { text: string; order: number; isBig: boolean };

const Item: React.FC<ItemProps> = ({ text, order, isBig }) => {
  const reveal = useReveal(order, { delay: 6, every: 8 });
  const fontSize = isBig ? 28 : 23;

  return (
    <li style={{ ...styles.item, fontSize, ...reveal }}>
      <span style={styles.rail} />
      <span>{text}</span>
    </li>
  );
};

const styles = {
  list: {
    position: 'absolute',
    left: PAGE_PAD,
    right: PAGE_PAD,
    display: 'flex',
    flexDirection: 'column',
    gap: 22,
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },
  item: {
    display: 'flex',
    gap: 18,
    maxWidth: 1000,
    color: theme.heading,
    lineHeight: 1.4,
  },
  rail: {
    flex: 'none',
    alignSelf: 'stretch',
    width: 3,
    marginTop: 4,
    borderRadius: 2,
    background: theme.brand,
  },
} satisfies Record<string, CSSProperties>;
