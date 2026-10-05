import type { CSSProperties } from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

import { theme } from '../theme';
import type { TitleScene } from '../types';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

export const Title: React.FC<{ scene: TitleScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rise = spring({ frame, fps, config: { damping: 200, stiffness: 90 } });
  const subOpacity = interpolate(frame, [12, 30], [0, 1], clamp);
  const railScale = interpolate(frame, [0, 24], [0, 1], clamp);

  const railStyle = { ...styles.rail, transform: `scaleY(${railScale})` };
  const headlineStyle = {
    ...styles.headline,
    opacity: rise,
    transform: `translateY(${(1 - rise) * 24}px)`,
  };

  return (
    <AbsoluteFill style={styles.frame}>
      <div style={styles.row}>
        <div style={railStyle} />

        <div>
          <div style={headlineStyle}>{scene.headline}</div>
          {scene.sub ? <div style={{ ...styles.sub, opacity: subOpacity }}>{scene.sub}</div> : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const styles = {
  frame: { justifyContent: 'center', padding: '0 160px' },
  row: { display: 'flex', gap: 28, alignItems: 'stretch' },
  rail: {
    width: 6,
    borderRadius: 3,
    background: theme.brand,
    transformOrigin: 'top',
  },
  headline: {
    color: theme.heading,
    fontSize: 60,
    fontWeight: 600,
    letterSpacing: '-0.015em',
    lineHeight: 1.1,
  },
  sub: { marginTop: 18, color: theme.muted, fontSize: 26 },
} satisfies Record<string, CSSProperties>;
