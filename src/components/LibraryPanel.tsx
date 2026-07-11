'use client';
import { useState } from 'react';
import { ASSET_TYPES, type KGNode, type KGEdge, type NodeType } from '@/lib/types';
import { color, font, radius, space, statusSoft, tagStyle } from '@/components/theme';

const TYPE_LABELS: Record<string, string> = {
  workflow: 'Workflows', prompt: 'Prompts', lesson: 'Lessons',
  agent_config: 'Agent configs', decision: 'Decisions', standard: 'Standards',
};

const STATUS_FG: Record<string, string> = {
  pending: color.pending, approved: color.approved, flagged: color.flagged, superseded: color.superseded,
};

export default function LibraryPanel({ graph, onSelect }: {
  graph: { nodes: KGNode[]; edges: KGEdge[] };
  onSelect: (id: string) => void;
}) {
  const [filter, setFilter] = useState<NodeType>('workflow');
  const assets = graph.nodes
    .filter(n => n.type === filter && n.status !== 'superseded')
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div style={{ fontFamily: font.family }}>
      <h1 style={{ fontSize: 16, fontWeight: 700, color: color.text, margin: '0 0 6px' }}>Capability library</h1>
      <p style={{ fontSize: 12, color: color.textMuted, lineHeight: 1.5, margin: '0 0 16px' }}>
        Every live asset the firm has captured, browsable by type.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: space.lg }}>
        {ASSET_TYPES.map((t) => {
          const active = filter === t;
          return (
            <button
              key={t}
              onClick={() => setFilter(t)}
              style={{
                padding: '5px 11px', borderRadius: radius.pill, fontSize: 11, fontWeight: 600,
                border: `1px solid ${active ? color.brand : color.border}`,
                background: active ? color.brand : 'transparent',
                color: active ? '#052622' : color.textMuted,
                fontFamily: font.family,
              }}
            >
              {TYPE_LABELS[t] ?? t}
            </button>
          );
        })}
      </div>

      {assets.length === 0 && (
        <p style={{ fontSize: 12, color: color.textFaint, padding: '10px 0' }}>Nothing of this type yet.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {assets.map((n) => (
          <button
            key={n.id}
            onClick={() => onSelect(n.id)}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: 12, background: color.surface, border: `1px solid ${color.border}`,
              borderRadius: radius.md, fontFamily: font.family,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: color.text }}>{n.label}</span>
              <span style={tagStyle(statusSoft[n.status] ?? 'rgba(255,255,255,0.08)', STATUS_FG[n.status] ?? color.textMuted)}>
                {n.status}
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: color.textMuted, lineHeight: 1.5, marginBottom: 4 }}>
              {n.content.slice(0, 100)}
            </div>
            <div style={{ fontSize: 10.5, color: color.textFaint }}>by {n.author ?? 'unknown'}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
