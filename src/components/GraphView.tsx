'use client';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import type { KGNode, KGEdge } from '@/lib/types';
import { color, radius } from '@/components/theme';
import type { ForceGraphMethods, ForceGraphProps, NodeObject, LinkObject } from 'react-force-graph-2d';

type EdgeMeta = { type: string };
type GraphNode = NodeObject<KGNode>;
type GraphLink = LinkObject<KGNode, EdgeMeta>;
type FGMethods = ForceGraphMethods<GraphNode, GraphLink>;

const ForceGraph2D = dynamic<ForceGraphProps<KGNode, EdgeMeta> & { ref?: MutableRefObject<FGMethods | undefined> }>(
  () => import('react-force-graph-2d'),
  { ssr: false }
);

const STATUS_COLORS: Record<string, string> = {
  pending: color.pending, approved: color.approved, flagged: color.flagged, superseded: color.superseded,
};
const TYPE_COLORS: Record<string, string> = {
  person: color.person, project: color.project, source: color.source, agent_action: color.agentAction,
};

// Obsidian-style hierarchy: asset nodes (the actual captured knowledge) read as the
// biggest hubs; agent_action entries are ephemeral governance log markers, smallest.
const NODE_RADIUS: Record<string, number> = {
  agent_action: 2.4,
  source: 3.6,
  person: 4.6,
  project: 4.6,
  prompt: 5.8, workflow: 5.8, agent_config: 5.8, lesson: 5.8, decision: 5.8, standard: 5.8,
};

const LEGEND: { label: string; c: string }[] = [
  { label: 'Person', c: color.person },
  { label: 'Project', c: color.project },
  { label: 'Source', c: color.source },
  { label: 'Agent action', c: color.agentAction },
];

function truncateLabel(s: string, max: number) {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

export default function GraphView({ graph, highlightIds, onNodeClick }: {
  graph: { nodes: KGNode[]; edges: KGEdge[] };
  highlightIds: string[];
  onNodeClick: (id: string) => void;
}) {
  const data = useMemo(() => ({
    nodes: graph.nodes.map(n => ({ ...n })),
    links: graph.edges
      .filter(e => graph.nodes.some(n => n.id === e.from_node) && graph.nodes.some(n => n.id === e.to_node))
      .map(e => ({ source: e.from_node, target: e.to_node, type: e.type })),
  }), [graph]);

  const hi = new Set(highlightIds);
  const dimmed = hi.size > 0;

  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fgRef = useRef<FGMethods | undefined>(undefined);
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    (fg.d3Force('charge') as { strength?: (v: number) => void } | undefined)?.strength?.(-160);
    (fg.d3Force('link') as { distance?: (v: number) => void } | undefined)?.distance?.(58);
  }, [data]);

  function radiusOf(n: GraphNode): number {
    const base = NODE_RADIUS[n.type] ?? 4.6;
    return hi.has(n.id) ? base + 3 : base;
  }
  function colorOf(n: GraphNode): string {
    return TYPE_COLORS[n.type] ?? STATUS_COLORS[n.status] ?? color.textMuted;
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <ForceGraph2D
        ref={fgRef}
        width={size.width || undefined}
        height={size.height || undefined}
        graphData={data}
        backgroundColor={color.bg}
        nodeId="id"
        nodeLabel={(n: GraphNode) => `${n.type}: ${n.label}`}
        linkColor={(l: GraphLink) => {
          const sourceId = String(typeof l.source === 'object' ? l.source?.id : l.source);
          const targetId = String(typeof l.target === 'object' ? l.target?.id : l.target);
          return dimmed && !(hi.has(sourceId) && hi.has(targetId))
            ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.12)';
        }}
        linkWidth={0.6}
        linkDirectionalArrowLength={0}
        onNodeClick={(n: GraphNode) => onNodeClick(n.id)}
        cooldownTicks={100}
        nodeRelSize={1}
        nodeVal={(n: GraphNode) => {
          const r = radiusOf(n);
          return r * r;
        }}
        nodeColor={(n: GraphNode) => {
          const isDim = dimmed && !hi.has(n.id);
          return isDim ? 'rgba(148,163,184,0.18)' : colorOf(n);
        }}
        nodeCanvasObjectMode={() => 'before'}
        nodeCanvasObject={(n: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const x = n.x ?? 0;
          const y = n.y ?? 0;
          const r = radiusOf(n);
          const isDim = dimmed && !hi.has(n.id);
          const fill = isDim ? 'rgba(148,163,184,0.18)' : colorOf(n);

          // soft glow halo, drawn under the library's own default circle
          if (!isDim) {
            ctx.beginPath();
            ctx.arc(x, y, r, 0, 2 * Math.PI);
            ctx.shadowColor = fill;
            ctx.shadowBlur = 8;
            ctx.fillStyle = fill;
            ctx.fill();
            ctx.shadowBlur = 0;
          }

          if (hi.has(n.id)) {
            ctx.beginPath();
            ctx.arc(x, y, r + 2, 0, 2 * Math.PI);
            ctx.strokeStyle = fill;
            ctx.globalAlpha = 0.45;
            ctx.lineWidth = 1.2;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }

          const fontSize = Math.max(3.6, 10.5 / globalScale);
          ctx.font = `${fontSize}px Inter, ui-sans-serif, system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillStyle = isDim ? 'rgba(226,232,240,0.14)' : 'rgba(226,232,240,0.8)';
          ctx.fillText(truncateLabel(n.label, 24), x, y + r + 2);
        }}
      />
      <div
        style={{
          position: 'absolute', left: 16, bottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8,
          padding: '8px 10px', borderRadius: radius.md, background: 'rgba(13,26,40,0.85)',
          border: `1px solid ${color.border}`, backdropFilter: 'blur(6px)', pointerEvents: 'none',
        }}
      >
        {LEGEND.map((l) => (
          <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: color.textMuted }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: l.c }} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}
