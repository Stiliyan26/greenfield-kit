import type { CSSProperties } from 'react';
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

import { BeforeAfter } from './scenes/BeforeAfter';
import { Bullets } from './scenes/Bullets';
import { Clip } from './scenes/Clip';
import { Code } from './scenes/Code';
import { Diagram } from './scenes/Diagram';
import { Files } from './scenes/Files';
import { Title } from './scenes/Title';
import { PAGE_PAD, theme } from './theme';
import type { ExplainerProps, Scene } from './types';

const FADE_FRAMES = 10;

export const Explainer: React.FC<ExplainerProps> = (props) => (
  <AbsoluteFill style={styles.canvas}>
    {props.scenes.map((scene) => (
      <Sequence
        key={scene.id}
        from={scene.startFrame}
        durationInFrames={scene.durationInFrames}
        name={`${scene.index + 1} ${scene.kind} ${scene.id}`}
      >
        <SceneFrame scene={scene} />
      </Sequence>
    ))}

    <Footer brand={props.brand} title={props.title} video={props.video} totalFrames={props.totalFrames} />
  </AbsoluteFill>
);

const SceneFrame: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const fadeStops = [0, FADE_FRAMES, scene.durationInFrames - FADE_FRAMES, scene.durationInFrames];
  const opacity = interpolate(frame, fadeStops, [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const showsCaption = scene.caption && scene.kind !== 'clip';

  return (
    <AbsoluteFill style={{ opacity }}>
      {scene.audioSeconds > 0 ? <Audio src={staticFile(`audio/${scene.id}.mp3`)} /> : null}

      <SceneBody scene={scene} />

      {showsCaption ? <div style={styles.caption}>{scene.caption}</div> : null}
    </AbsoluteFill>
  );
};

const SceneBody: React.FC<{ scene: Scene }> = ({ scene }) => {
  switch (scene.kind) {
    case 'title':
      return <Title scene={scene} />;
    case 'before-after':
      return <BeforeAfter scene={scene} />;
    case 'clip':
      return <Clip scene={scene} />;
    case 'files':
      return <Files scene={scene} />;
    case 'diagram':
      return <Diagram scene={scene} />;
    case 'code':
      return <Code scene={scene} />;
    case 'bullets':
      return <Bullets scene={scene} />;
  }
};

type FooterProps = Pick<ExplainerProps, 'brand' | 'title' | 'video' | 'totalFrames'>;

const Footer: React.FC<FooterProps> = ({ brand, title, video, totalFrames }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const progress = Math.min(1, frame / Math.max(1, totalFrames));

  return (
    <>
      <div style={styles.brand}>
        <span style={styles.brandMark} />
        {brand} · {title} · {video}
      </div>

      <div style={{ ...styles.track, width }}>
        <div style={{ ...styles.progress, width: width * progress }} />
      </div>
    </>
  );
};

const styles = {
  canvas: { background: theme.canvas, color: theme.text, fontFamily: theme.sans },
  caption: {
    position: 'absolute',
    left: PAGE_PAD,
    right: PAGE_PAD,
    bottom: 64,
    color: theme.muted,
    fontSize: 20,
  },
  brand: {
    position: 'absolute',
    left: PAGE_PAD,
    bottom: 26,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    color: theme.brand,
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  brandMark: { display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: theme.brand },
  track: { position: 'absolute', left: 0, bottom: 0, height: 4, background: theme.line },
  progress: { height: '100%', background: theme.brand },
} satisfies Record<string, CSSProperties>;
