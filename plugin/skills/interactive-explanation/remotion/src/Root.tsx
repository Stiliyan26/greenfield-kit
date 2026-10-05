import { Composition } from 'remotion';

import { Explainer } from './Explainer';
import { ReviewShot } from './ReviewShot';
import type { ExplainerProps, ReviewShotProps } from './types';

const FPS = 30;
const WIDTH = 1280;
const HEIGHT = 720;
const PLACEHOLDER_FRAMES = 90;
const VIDEOS = ['journey', 'architecture'] as const;

export const Root: React.FC = () => (
  <>
    {VIDEOS.map((video) => (
      <Composition
        key={video}
        id={video}
        component={Explainer}
        defaultProps={placeholderProps(video)}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        durationInFrames={PLACEHOLDER_FRAMES}
        calculateMetadata={({ props }) => ({
          durationInFrames: sceneFrames(props),
          fps: props.fps,
          width: props.width,
          height: props.height,
        })}
      />
    ))}

    <Composition
      id="review-shot"
      component={ReviewShot}
      defaultProps={REVIEW_PLACEHOLDER}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      durationInFrames={1}
      calculateMetadata={({ props }) => ({ width: props.crop.width, height: props.crop.height })}
    />
  </>
);

// Only for the studio; real stills get their props from scripts/review.mjs.
const REVIEW_PLACEHOLDER: ReviewShotProps = {
  image: 'placeholder.png',
  imageWidth: WIDTH,
  imageHeight: HEIGHT,
  crop: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
  boxes: [],
};

function sceneFrames(props: ExplainerProps) {
  const total = props.scenes.reduce((sum, scene) => sum + scene.durationInFrames, 0);

  return Math.max(1, total);
}

// Only for the studio; real renders get their props from scripts/render.mjs.
function placeholderProps(video: ExplainerProps['video']): ExplainerProps {
  return {
    brand: 'Project',
    title: 'Explainer',
    subtitle: '',
    video,
    fps: FPS,
    width: WIDTH,
    height: HEIGHT,
    totalFrames: PLACEHOLDER_FRAMES,
    scenes: [
      {
        id: 'placeholder',
        kind: 'title',
        headline: 'Pass --props from scripts/render.mjs',
        sub: 'This is only the studio placeholder.',
        narration: '',
        index: 0,
        audioSeconds: 0,
        clipFrames: 0,
        durationInFrames: PLACEHOLDER_FRAMES,
        startFrame: 0,
      },
    ],
  };
}
