'use client';
import type { KGNode, KGEdge } from '@/lib/types';

const EDGE_LABELS: Record<string, string> = {
  derived_from: 'Derived from', authored_by: 'Authored by', used_in: 'Used in',
  supports: 'Supports', contradicts: 'Contradicts', superseded_by: 'Superseded by',
  reviewed_by: 'Reviewed', governs: 'Cites standard',
};

export default function NodeDrawer({ graph, nodeId, onClose, onJump }: {
  graph: { nodes: KGNode[]; edges: KGEdge[] };
  nodeId: string;
  onClose: () => void;
  onJump: (id: string) => void;
}) {
  const node = graph.nodes.find(n => n.id === nodeId);
  if (!node) return null;
  const related = graph.edges
    .filter(e => e.from_node === nodeId || e.to_node === nodeId)
    .map(e => {
      const otherId = e.from_node === nodeId ? e.to_node : e.from_node;
      const other = graph.nodes.find(n => n.id === otherId);
      const dir = e.from_node === nodeId ? '→' : '←';
      return other ? { edge: e, other, dir } : null;
    })
    .filter(Boolean) as { edge: KGEdge; other: KGNode; dir: string }[];

  return (
    <aside style={{
      position: 'absolute', right: 0, top: 0, bottom: 0, width: 360, zIndex: 20,
      background: '#0f172a', borderLeft: '1px solid #1e293b', padding: 16, overflowY: 'auto',
    }}>
      <button onClick={onClose} style={{ float: 'right', background: 'none', border: 'none', color: '#64748b', fontSize: 18 }}>✕</button>
      <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#64748b' }}>{node.type} · {node.status}</div>
      <h2 style={{ fontSize: 16, margin: '6px 0 12px' }}>{node.label}</h2>
      {node.content && (<>
        <div style={{ fontSize: 11, color: '#64748b' }}>CONTENT</div>
        <p style={{ fontSize: 13, whiteSpace: 'pre-wrap', margin: '4px 0 12px', color: '#cbd5e1' }}>{node.content}</p>
      </>)}
      {node.context && (<>
        <div style={{ fontSize: 11, color: '#64748b' }}>WHY (CONTEXT)</div>
        <p style={{ fontSize: 13, whiteSpace: 'pre-wrap', margin: '4px 0 12px', color: '#a5b4fc' }}>{node.context}</p>
      </>)}
      {node.author && <p style={{ fontSize: 12, color: '#64748b' }}>By {node.author}{node.source ? ` · from ${node.source.name}` : ''}</p>}
      <div style={{ fontSize: 11, color: '#64748b', marginTop: 12 }}>PROVENANCE & CONNECTIONS</div>
      {related.map(({ edge, other, dir }) => (
        <button key={edge.id} onClick={() => onJump(other.id)} style={{
          display: 'block', width: '100%', textAlign: 'left', margin: '6px 0', padding: 8,
          background: '#1e293b', border: 'none', borderRadius: 6, color: '#e2e8f0', fontSize: 12,
        }}>
          <span style={{ color: '#f472b6' }}>{EDGE_LABELS[edge.type] ?? edge.type} {dir}</span> {other.label}
        </button>
      ))}
    </aside>
  );
}
