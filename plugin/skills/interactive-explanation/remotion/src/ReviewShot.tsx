import type { CSSProperties } from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';

import { theme } from './theme';
import type { FileStatus, ReviewBox, ReviewShotProps } from './types';

const BORDER = 3;
const LABEL_HEIGHT = 26;

const STATUS_COLORS: Record<FileStatus, string> = {
  added: theme.success,
  changed: theme.warning,
  removed: theme.danger,
  kept: theme.muted,
};

export const ReviewShot: React.FC<ReviewShotProps> = ({ image, imageWidth, imageHeight, crop, boxes }) => (
  <AbsoluteFill style={styles.canvas}>
    <Img
      src={staticFile(image)}
      style={{ ...styles.image, left: -crop.x, top: -crop.y, width: imageWidth, height: imageHeight }}
    />

    {boxes.map((box) => (
      <Box key={box.number} box={box} />
    ))}
  </AbsoluteFill>
);

const Box: React.FC<{ box: ReviewBox }> = ({ box }) => {
  const color = STATUS_COLORS[box.status];

  return (
    <div style={{ ...styles.box, left: box.x, top: box.y, width: box.width, height: box.height, borderColor: color }}>
      <span style={{ ...styles.label, left: box.labelX - BORDER, top: box.labelY - BORDER, background: color }}>
        <span style={styles.number}>{box.number}</span>
        {box.label}
      </span>
    </div>
  );
};

const styles = {
  canvas: { background: theme.canvas, overflow: 'hidden' },
  image: { position: 'absolute', maxWidth: 'none' },
  box: {
    position: 'absolute',
    boxSizing: 'border-box',
    border: `${BORDER}px solid`,
    borderRadius: 8,
    marginLeft: -BORDER,
    marginTop: -BORDER,
    padding: BORDER,
  },
  label: {
    position: 'absolute',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    height: LABEL_HEIGHT,
    padding: '0 10px 0 4px',
    borderRadius: 6,
    color: theme.surface,
    fontFamily: theme.sans,
    fontSize: 14,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  number: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: theme.surface,
    color: theme.heading,
    fontSize: 12,
    fontWeight: 700,
  },
} satisfies Record<string, CSSProperties>;
