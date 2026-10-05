import type { CSSProperties } from 'react';
import { AbsoluteFill, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';

import { theme } from '../theme';
import type { ClipScene } from '../types';
import { useReveal } from './shared';

// 960x540 video + 34px browser bar + caption fits above the footer.
const FRAME_WIDTH = 960;
const FRAME_HEIGHT = (FRAME_WIDTH * 9) / 16;
const TRAFFIC_LIGHTS = [theme.danger, theme.warning, theme.success];

// A recorded journey step inside a browser-like frame, with a caption under it.
export const Clip: React.FC<{ scene: ClipScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 14], [0.97, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const captionReveal = useReveal(0, { delay: 10 });
  const holdsLastFrame = scene.clipFrames < scene.durationInFrames;

  return (
    <AbsoluteFill style={styles.frame}>
      <div style={{ ...styles.browser, transform: `scale(${scale})` }}>
        <AddressBar heading={scene.heading} step={scene.step} />

        <div style={styles.screen}>
          <Sequence from={0} durationInFrames={Math.max(1, scene.clipFrames)} layout="none">
            <OffthreadVideo src={staticFile(`clips/${scene.clip}.mp4`)} muted style={styles.media} />
          </Sequence>

          {holdsLastFrame ? (
            <Sequence from={Math.max(1, scene.clipFrames)} layout="none">
              <Img src={staticFile(`clips/${scene.clip}.last.png`)} style={{ ...styles.media, ...styles.still }} />
            </Sequence>
          ) : null}
        </div>
      </div>

      {scene.caption ? (
        <div style={{ ...styles.caption, ...captionReveal }}>
          <span style={styles.captionRail} />
          <span>{scene.caption}</span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

type AddressBarProps = { heading?: string; step?: string };

const AddressBar: React.FC<AddressBarProps> = ({ heading, step }) => {
  const address = heading ?? 'App';

  return (
    <div style={styles.bar}>
      {TRAFFIC_LIGHTS.map((color) => (
        <span key={color} style={{ ...styles.light, background: color }} />
      ))}

      <span style={styles.address}>{address}</span>
      {step ? <span style={styles.step}>{step}</span> : null}
    </div>
  );
};

const styles = {
  frame: { alignItems: 'center' },
  browser: {
    width: FRAME_WIDTH,
    marginTop: 32,
    borderRadius: 14,
    overflow: 'hidden',
    background: theme.surface,
    boxShadow: '0 2px 4px rgba(30,27,21,.08), 0 18px 40px rgba(30,27,21,.16)',
  },
  bar: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    height: 34,
    padding: '0 14px',
    borderBottom: `1px solid ${theme.line}`,
    background: theme.sunken,
  },
  light: { width: 10, height: 10, borderRadius: '50%', opacity: 0.8 },
  address: {
    display: 'flex',
    flex: 1,
    alignItems: 'center',
    height: 18,
    marginLeft: 14,
    paddingLeft: 10,
    border: `1px solid ${theme.line}`,
    borderRadius: 9,
    background: theme.surface,
    color: theme.muted,
    fontFamily: theme.mono,
    fontSize: 11,
  },
  step: { color: theme.brand, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em' },
  screen: { position: 'relative', width: FRAME_WIDTH, height: FRAME_HEIGHT, background: theme.canvas },
  media: { width: FRAME_WIDTH, height: FRAME_HEIGHT, objectFit: 'cover' },
  still: { position: 'absolute', inset: 0 },
  caption: {
    display: 'flex',
    gap: 14,
    width: FRAME_WIDTH,
    marginTop: 16,
    color: theme.heading,
    fontSize: 21,
    lineHeight: 1.35,
  },
  captionRail: { flex: 'none', width: 3, borderRadius: 2, background: theme.brand },
} satisfies Record<string, CSSProperties>;
