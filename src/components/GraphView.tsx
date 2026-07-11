'use client';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { KGNode, KGEdge } from '@/lib/types';
import { color, radius } from '@/components/theme';
import type { ForceGraphProps, NodeObject, LinkObject } from 'react-force-graph-2d';

type EdgeMeta = { type: string };
type GraphNode = NodeObject<KGNode>;
type GraphLink = LinkObject<KGNode, EdgeMeta>;

const ForceGraph2D = dynamic<ForceGraphProps<KGNode, EdgeMeta>>(
  () => import('react-force-graph-2d'),
  { ssr: false }
);

const STATUS_COLORS: Record<string, string> = {
  pending: color.pending, approved: color.approved, flagged: color.flagged, superseded: color.superseded,
};
const TYPE_COLORS: Record<string, string> = {
  person: color.person, project: color.project, source: color.source, agent_action: color.agentAction,
};
const LEGEND: { label: string; c: string }[] = [
  { label: 'Person', c: color.person },
  { label: 'Project', c: color.project },
  { label: 'Source', c: color.source },
  { label: 'Agent action', c: color.agentAction },
];

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

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <ForceGraph2D
        width={size.width || undefined}
        height={size.height || undefined}
        graphData={data}
        backgroundColor={color.bg}
        nodeId="id"
        nodeLabel={(n: GraphNode) => `${n.type}: ${n.label}`}
        nodeVal={(n: GraphNode) => (hi.has(n.id) ? 10 : 4)}
        nodeColor={(n: GraphNode) => {
          if (dimmed && !hi.has(n.id)) return 'rgba(255,255,255,0.08)';
          return TYPE_COLORS[n.type] ?? STATUS_COLORS[n.status] ?? color.textMuted;
        }}
        linkColor={(l: GraphLink) => {
          const sourceId = String(typeof l.source === 'object' ? l.source?.id : l.source);
          const targetId = String(typeof l.target === 'object' ? l.target?.id : l.target);
          return dimmed && !(hi.has(sourceId) && hi.has(targetId))
            ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.14)';
        }}
        linkDirectionalArrowLength={3}
        onNodeClick={(n: GraphNode) => onNodeClick(n.id)}
        cooldownTicks={80}
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
