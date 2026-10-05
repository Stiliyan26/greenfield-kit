// Mirrors the scene shapes documented in .claude/skills/interactive-explanation/references/script-format.md,
// plus the fields the skill's scripts/render.mjs adds (durations and start frames).

export type FileStatus = 'added' | 'changed' | 'removed' | 'kept';
export type NodeKind = 'client' | 'server' | 'db' | 'plain';

type Base = {
  id: string;
  narration: string;
  caption?: string;
  index: number;
  audioSeconds: number;
  clipFrames: number;
  durationInFrames: number;
  startFrame: number;
};

export type TitleScene = Base & { kind: 'title'; headline: string; sub?: string };
export type BeforeAfterScene = Base & { kind: 'before-after'; heading: string; before: string[]; after: string[] };
export type ClipScene = Base & { kind: 'clip'; clip: string; heading?: string; step?: string };
export type FilesScene = Base & { kind: 'files'; heading: string; tree: { path: string; status: FileStatus; note?: string }[] };
export type DiagramNode = { id: string; label: string; sub?: string; x: number; y: number; width?: number; kind?: NodeKind };
export type DiagramEdge = { from: string; to: string; label?: string };
export type DiagramScene = Base & { kind: 'diagram'; heading: string; nodes: DiagramNode[]; edges?: DiagramEdge[] };
export type CodeScene = Base & { kind: 'code'; heading?: string; file: string; code: string; highlight?: number[] };
export type BulletsScene = Base & { kind: 'bullets'; heading: string; kicker?: string; items: string[] };

export type Scene = TitleScene | BeforeAfterScene | ClipScene | FilesScene | DiagramScene | CodeScene | BulletsScene;

export type ExplainerProps = {
  brand: string;
  title: string;
  subtitle: string;
  video: 'journey' | 'architecture';
  fps: number;
  width: number;
  height: number;
  scenes: Scene[];
  totalFrames: number;
};

// One still for the review map: a crop of a screenshot with a numbered box per changed component.
export type ReviewBox = {
  number: number;
  label: string;
  status: FileStatus;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Label position relative to the box's top-left corner. */
  labelX: number;
  labelY: number;
};

export type ReviewShotProps = {
  image: string;
  imageWidth: number;
  imageHeight: number;
  crop: { x: number; y: number; width: number; height: number };
  boxes: ReviewBox[];
};
