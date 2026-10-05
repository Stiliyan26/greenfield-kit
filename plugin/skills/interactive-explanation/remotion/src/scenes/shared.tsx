import type { CSSProperties, ReactNode } from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

import { PAGE_PAD, theme } from '../theme';

export const CONTENT_TOP = 150;
export const CONTENT_BOTTOM = 96;

type RevealOptions = { delay?: number; every?: number };

// Opacity and rise for the n-th item of a staggered list.
export function useReveal(order: number, { delay = 8, every = 6 }: RevealOptions = {}): CSSProperties {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const startFrame = Math.max(0, frame - delay - order * every);
  const progress = spring({ frame: startFrame, fps, config: { damping: 200, stiffness: 120 } });
  const rise = interpolate(progress, [0, 1], [14, 0]);

  return { opacity: progress, transform: `translateY(${rise}px)` };
}

type HeadingProps = { children: ReactNode; kicker?: string };

export const Heading: React.FC<HeadingProps> = ({ children, kicker }) => {
  const reveal = useReveal(0, { delay: 2 });

  return (
    <div style={{ ...styles.heading, ...reveal }}>
      {kicker ? <div style={styles.kicker}>{kicker}</div> : null}
      <div style={styles.headingText}>{children}</div>
    </div>
  );
};

type CardProps = { children: ReactNode; style?: CSSProperties; rail?: string };

export const Card: React.FC<CardProps> = ({ children, style, rail }) => {
  const railStyle = rail ? { borderLeft: `3px solid ${rail}` } : {};

  return <div style={{ ...styles.card, ...railStyle, ...style }}>{children}</div>;
};

// Absolutely positioned content area under the heading.
export const contentArea: CSSProperties = {
  position: 'absolute',
  left: PAGE_PAD,
  right: PAGE_PAD,
  top: CONTENT_TOP,
  bottom: CONTENT_BOTTOM,
};

const styles = {
  heading: {
    position: 'absolute',
    left: PAGE_PAD,
    right: PAGE_PAD,
    top: 56,
  },
  kicker: {
    marginBottom: 8,
    color: theme.brand,
    fontSize: 15,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  headingText: {
    color: theme.heading,
    fontSize: 40,
    fontWeight: 600,
    letterSpacing: '-0.01em',
    lineHeight: 1.15,
  },
  card: {
    padding: 28,
    borderRadius: 14,
    background: theme.surface,
    boxShadow: '0 1px 2px rgba(30,27,21,.06), 0 8px 24px rgba(30,27,21,.06)',
  },
} satisfies Record<string, CSSProperties>;
