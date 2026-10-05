import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

import {
  diagramBounds,
  edgeEndpoints,
  edgeLabelBox,
  LABEL_FONT,
  NODE_TONES,
  nodeSize,
  SUB_FONT,
} from '../diagramLayout';
import { PAGE_PAD, theme } from '../theme';
import type { DiagramEdge, DiagramNode, DiagramScene } from '../types';
import { CONTENT_BOTTOM, CONTENT_TOP, Heading } from './shared';

const WIDTH = 1280;
const HEIGHT = 720;
const FIRST_NODE_FRAME = 6;
const FRAMES_BETWEEN_NODES = 5;
const FRAMES_BETWEEN_EDGES = 6;
const EDGE_DRAW_FRAMES = 16;
const SUB_BASELINE = 2.3;
const LABEL_BASELINE_WITH_SUB = -0.7;
const LABEL_BASELINE_ALONE = 0.8;

// Nodes pop in one by one, then the edges draw in order.
export const Diagram: React.FC<{ scene: DiagramScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nodesById = new Map(scene.nodes.map((node) => [node.id, node]));
  const bounds = diagramBounds(scene.nodes);
  const width = WIDTH - PAGE_PAD * 2;
  const height = Math.min(HEIGHT - CONTENT_TOP - CONTENT_BOTTOM, width * (bounds.height / bounds.width));
  const edgesStartFrame = FIRST_NODE_FRAME + scene.nodes.length * FRAMES_BETWEEN_NODES + 4;
  const viewBox = `${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`;

  return (
    <AbsoluteFill>
      <Heading>{scene.heading}</Heading>

      <svg
        viewBox={viewBox}
        preserveAspectRatio="xMidYMin meet"
        style={{ position: 'absolute', left: PAGE_PAD, top: CONTENT_TOP, width, height }}
      >
        <ArrowMarker />

        {(scene.edges ?? []).map((edge, index) => {
          const drawn = edgeProgress(frame, edgesStartFrame + index * FRAMES_BETWEEN_EDGES);

          return <Edge key={`${edge.from}-${edge.to}`} edge={edge} nodesById={nodesById} drawn={drawn} />;
        })}

        {scene.nodes.map((node, index) => {
          const popFrame = frame - (FIRST_NODE_FRAME + index * FRAMES_BETWEEN_NODES);
          const pop = spring({ frame: Math.max(0, popFrame), fps, config: { damping: 14, stiffness: 160 } });

          return <Node key={node.id} node={node} scale={pop} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

function edgeProgress(frame: number, startFrame: number) {
  return interpolate(frame, [startFrame, startFrame + EDGE_DRAW_FRAMES], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

const ArrowMarker: React.FC = () => (
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill={theme.muted} />
    </marker>
  </defs>
);

type NodeProps = { node: DiagramNode; scale: number };

const Node: React.FC<NodeProps> = ({ node, scale }) => {
  const { width, height } = nodeSize(node);
  const tone = NODE_TONES[node.kind ?? 'plain'];
  const labelBaseline = node.sub ? LABEL_BASELINE_WITH_SUB : LABEL_BASELINE_ALONE;
  const scaleAroundNode = `translate(${node.x} ${node.y}) scale(${scale}) translate(${-node.x} ${-node.y})`;

  return (
    <g transform={scaleAroundNode} opacity={Math.min(1, scale)}>
      <rect
        x={node.x - width / 2}
        y={node.y - height / 2}
        width={width}
        height={height}
        rx={1.4}
        fill={tone.fill}
        stroke={tone.stroke}
        strokeWidth={0.35}
      />

      <text x={node.x} y={node.y + labelBaseline} textAnchor="middle" fontSize={LABEL_FONT} fontWeight={600} fontFamily={theme.sans} fill={theme.heading}>
        {node.label}
      </text>

      {node.sub ? (
        <text x={node.x} y={node.y + SUB_BASELINE} textAnchor="middle" fontSize={SUB_FONT} fontFamily={theme.mono} fill={theme.muted}>
          {node.sub}
        </text>
      ) : null}
    </g>
  );
};

type EdgeProps = { edge: DiagramEdge; nodesById: Map<string, DiagramNode>; drawn: number };

const Edge: React.FC<EdgeProps> = ({ edge, nodesById, drawn }) => {
  const from = nodesById.get(edge.from);
  const to = nodesById.get(edge.to);
  if (!from || !to || drawn === 0) return null;

  const { start, end, length } = edgeEndpoints(from, to);
  const isComplete = drawn > 0.95;
  const showsLabel = edge.label && drawn > 0.6;

  return (
    <g>
      <line
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke={theme.muted}
        strokeWidth={0.3}
        strokeDasharray={length}
        strokeDashoffset={length * (1 - drawn)}
        markerEnd={isComplete ? 'url(#arrow)' : undefined}
      />

      {showsLabel ? <EdgeLabel label={edge.label ?? ''} start={start} end={end} /> : null}
    </g>
  );
};

type EdgeLabelProps = { label: string; start: { x: number; y: number }; end: { x: number; y: number } };

const EdgeLabel: React.FC<EdgeLabelProps> = ({ label, start, end }) => {
  const box = edgeLabelBox(start, end, label);

  return (
    <>
      <rect x={box.x} y={box.y} width={box.width} height={box.height} rx={0.6} fill={theme.canvas} />

      <text x={box.centerX} y={box.centerY + 0.7} textAnchor="middle" fontSize={SUB_FONT} fontFamily={theme.mono} fill={theme.muted}>
        {label}
      </text>
    </>
  );
};
