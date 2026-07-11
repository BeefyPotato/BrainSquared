'use client';
import type { KGNode, KGEdge } from '@/lib/types';
import { IconClose, IconArrowUpRight } from '@/components/icons';
import { color, font, radius, shadow, space, statusSoft, tagStyle } from '@/components/theme';

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

  const statusFg: Record<string, string> = {
    pending: color.pending, approved: color.approved, flagged: color.flagged, superseded: color.superseded,
  };

  return (
    <aside
      style={{
        position: 'absolute', right: 16, top: 16, bottom: 16, width: 360, zIndex: 20,
        background: color.surface, border: `1px solid ${color.border}`, borderRadius: radius.lg,
        boxShadow: shadow.lg, padding: space.xl, overflowY: 'auto', fontFamily: font.family,
      }}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        style={{
          float: 'right', background: 'transparent', border: 'none', color: color.textFaint,
          width: 28, height: 28, borderRadius: radius.sm, display: 'grid', placeItems: 'center',
        }}
      >
        <IconClose size={16} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: color.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {node.type.replace('_', ' ')}
        </span>
        <span style={tagStyle(statusSoft[node.status] ?? 'rgba(255,255,255,0.08)', statusFg[node.status] ?? color.textMuted)}>
          {node.status}
        </span>
      </div>

      <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 16px', color: color.text, lineHeight: 1.3 }}>{node.label}</h2>

      {node.content && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: color.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Content</div>
          <p style={{ fontSize: 13, whiteSpace: 'pre-wrap', margin: 0, color: color.text, lineHeight: 1.55 }}>{node.content}</p>
        </div>
      )}

      {node.context && (
        <div style={{ marginBottom: 16, borderLeft: `2px solid ${color.brand}`, background: color.brandSoft, borderRadius: `0 ${radius.sm}px ${radius.sm}px 0`, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: color.brandText, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Why it works</div>
          <p style={{ fontSize: 13, whiteSpace: 'pre-wrap', margin: 0, color: color.text, lineHeight: 1.55 }}>{node.context}</p>
        </div>
      )}

      {node.author && (
        <p style={{ fontSize: 11, color: color.textMuted, marginBottom: 16 }}>
          By {node.author}{node.source ? ` · from ${node.source.name}` : ''}
        </p>
      )}

      {related.length > 0 && (
        <>
          <div style={{ fontSize: 10, fontWeight: 700, color: color.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Provenance &amp; connections
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {related.map(({ edge, other, dir }) => (
              <button
                key={edge.id}
                onClick={() => onJump(other.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
                  padding: '9px 10px', background: color.surface2, border: `1px solid ${color.border}`,
                  borderRadius: radius.sm, color: color.text, fontSize: 12, fontFamily: font.family,
                }}
              >
                <IconArrowUpRight size={13} style={{ color: color.brandText, flexShrink: 0 }} />
                <span style={{ color: color.brandText, fontWeight: 600 }}>{EDGE_LABELS[edge.type] ?? edge.type}</span>
                <span style={{ color: color.textFaint }}>{dir}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{other.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </aside>
  );
}
