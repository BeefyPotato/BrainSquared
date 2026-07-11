'use client';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import type { KGNode, KGEdge } from '@/lib/types';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

const STATUS_COLORS: Record<string, string> = {
  pending: '#eab308', approved: '#22c55e', flagged: '#ef4444', superseded: '#64748b',
};
const TYPE_COLORS: Record<string, string> = {
  person: '#3b82f6', project: '#06b6d4', source: '#8b5cf6', agent_action: '#d946ef',
};

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

  return (
    <ForceGraph2D
      graphData={data}
      backgroundColor="#0b1220"
      nodeId="id"
      nodeLabel={(n: any) => `${n.type}: ${n.label}`}
      nodeVal={(n: any) => (hi.has(n.id) ? 10 : 4)}
      nodeColor={(n: any) => {
        if (dimmed && !hi.has(n.id)) return '#1e293b';
        return TYPE_COLORS[n.type] ?? STATUS_COLORS[n.status] ?? '#94a3b8';
      }}
      linkColor={(l: any) =>
        dimmed && !(hi.has(l.source.id ?? l.source) && hi.has(l.target.id ?? l.target))
          ? '#111827' : '#334155'}
      linkDirectionalArrowLength={3}
      onNodeClick={(n: any) => onNodeClick(n.id)}
      cooldownTicks={80}
    />
  );
}
