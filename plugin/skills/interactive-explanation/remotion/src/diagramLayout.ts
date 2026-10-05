import { theme } from './theme.ts';
import type { DiagramNode, NodeKind } from './types';

// Shared by the video (scenes/Diagram.tsx) and the page (scripts/page/diagram-svg.mjs).
// Coordinates live on a 100 x 56 grid; the grid guides placement and never clips.

export const GRID = { width: 100, height: 56 };
export const LABEL_FONT = 2.2;
export const SUB_FONT = 1.7;
export const NODE_HEIGHT = 9;
export const EDGE_LABEL_OFFSET = 5.6;

const DEFAULT_NODE_WIDTH = 22;
const NODE_TEXT_PADDING = 4;
const LABEL_CHARACTER_WIDTH = LABEL_FONT * 0.6;
const SUB_CHARACTER_WIDTH = SUB_FONT * 0.62;
const EDGE_LABEL_CHARACTER_WIDTH = 1.24;
const EDGE_LABEL_HEIGHT = 3;
const BOX_GAP = 0.8;
const BOUNDS_PADDING = 4;
const TITLE_CLEARANCE = 3;

export type Point = { x: number; y: number };

export type NodeTone = { fill: string; stroke: string };

export const NODE_TONES: Record<NodeKind, NodeTone> = {
  client: { fill: theme.infoSoft, stroke: theme.info },
  server: { fill: theme.brandSoft, stroke: theme.brand },
  db: { fill: theme.successSoft, stroke: theme.success },
  plain: { fill: theme.surface, stroke: theme.line },
};

export function nodeSize(node: DiagramNode) {
  const labelWidth = node.label.length * LABEL_CHARACTER_WIDTH;
  const subWidth = (node.sub?.length ?? 0) * SUB_CHARACTER_WIDTH;
  const textWidth = Math.max(labelWidth, subWidth) + NODE_TEXT_PADDING;
  const width = Math.max(node.width ?? DEFAULT_NODE_WIDTH, textWidth);

  return { width, height: NODE_HEIGHT };
}

export function diagramBounds(nodes: DiagramNode[]) {
  const xs = nodes.flatMap(horizontalExtent);
  const ys = nodes.flatMap(verticalExtent);

  const minX = Math.min(0, ...xs) - BOUNDS_PADDING;
  const maxX = Math.max(GRID.width, ...xs) + BOUNDS_PADDING;
  const minY = Math.min(...ys) - BOUNDS_PADDING - TITLE_CLEARANCE;
  const maxY = Math.max(...ys) + BOUNDS_PADDING;

  return { minX, minY, width: maxX - minX, height: maxY - minY };
}

export function edgeEndpoints(from: DiagramNode, to: DiagramNode) {
  const start = borderPointToward(from, to);
  const end = borderPointToward(to, from);
  const length = Math.hypot(end.x - start.x, end.y - start.y);

  return { start, end, length };
}

// Beside the arrow, not on top of it.
export function edgeLabelBox(start: Point, end: Point, label: string) {
  const length = Math.hypot(end.x - start.x, end.y - start.y) || 1;
  const normalX = -(end.y - start.y) / length;
  const normalY = (end.x - start.x) / length;
  const centerX = (start.x + end.x) / 2 + normalX * EDGE_LABEL_OFFSET;
  const centerY = (start.y + end.y) / 2 + normalY * EDGE_LABEL_OFFSET;
  const width = label.length * EDGE_LABEL_CHARACTER_WIDTH;

  return {
    centerX,
    centerY,
    x: centerX - width / 2,
    y: centerY - EDGE_LABEL_HEIGHT / 2,
    width,
    height: EDGE_LABEL_HEIGHT,
  };
}

function horizontalExtent(node: DiagramNode) {
  const { width } = nodeSize(node);

  return [node.x - width / 2, node.x + width / 2];
}

function verticalExtent(node: DiagramNode) {
  return [node.y - NODE_HEIGHT / 2, node.y + NODE_HEIGHT / 2];
}

function borderPointToward(node: DiagramNode, other: DiagramNode): Point {
  const { width, height } = nodeSize(node);
  const dx = other.x - node.x;
  const dy = other.y - node.y;

  if (dx === 0 && dy === 0) return { x: node.x, y: node.y };

  const scaleX = (width / 2 + BOX_GAP) / Math.abs(dx || 1e-9);
  const scaleY = (height / 2 + BOX_GAP) / Math.abs(dy || 1e-9);
  const scale = Math.min(scaleX, scaleY);

  return { x: node.x + dx * scale, y: node.y + dy * scale };
}
