'use client';
import { useState } from 'react';
import { ASSET_TYPES, type KGNode, type KGEdge, type NodeType } from '@/lib/types';
import { color, font, heroStyle, heroSubStyle, heroTitleStyle, inputStyle, radius, space, statusSoft, statusText, tagStyle } from '@/components/theme';

const TYPE_LABELS: Record<string, string> = {
  workflow: 'Workflows', prompt: 'Prompts', lesson: 'Lessons',
  agent_config: 'Agent configs', decision: 'Decisions', standard: 'Standards',
};

export default function LibraryPanel({ graph, onSelect }: {
  graph: { nodes: KGNode[]; edges: KGEdge[] };
  onSelect: (id: string) => void;
}) {
  const [filter, setFilter] = useState<NodeType | 'all'>('all');
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const assets = graph.nodes
    .filter(n => ASSET_TYPES.includes(n.type) && n.status !== 'superseded')
    .filter(n => filter === 'all' || n.type === filter)
    .filter(n => !q || `${n.label} ${n.content} ${n.author ?? ''}`.toLowerCase().includes(q))
    .sort((a, b) => a.label.localeCompare(b.label));

  const chips: { v: NodeType | 'all'; label: string }[] = [
    { v: 'all', label: 'All types' },
    ...ASSET_TYPES.map(t => ({ v: t, label: TYPE_LABELS[t] ?? t })),
  ];

  return (
    <div style={{ fontFamily: font.family }}>
      <div style={heroStyle}>
        <div>
          <h1 style={heroTitleStyle}>Capability library</h1>
          <p style={heroSubStyle}>
            Every live asset the firm has captured — structured know-how, not a document dump.
            Click one to open it on the memory map.
          </p>
        </div>
      </div>

      <input
        aria-label="Search the library"
        style={{ ...inputStyle, marginBottom: space.md, maxWidth: 460 }}
        placeholder="Search prompts, workflows, lessons…"
        value={query}
        onChange={e => setQuery(e.target.value)}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: space.lg }}>
        {chips.map(({ v, label }) => {
          const active = filter === v;
          return (
            <button
              key={v}
              onClick={() => setFilter(v)}
              aria-pressed={active}
              style={{
                padding: '7px 13px', borderRadius: radius.pill, fontSize: 12.5, fontWeight: 600,
                border: `1px solid ${active ? color.brandDark : color.borderStrong}`,
                background: active ? color.brandDark : color.surface,
                color: active ? '#ffffff' : color.textMuted,
                fontFamily: font.family,
                transition: 'background 150ms ease, color 150ms ease',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {assets.length === 0 && (
        <div
          style={{
            padding: '28px 20px', textAlign: 'center', border: `1px dashed ${color.borderStrong}`,
            borderRadius: radius.lg, color: color.textMuted, fontSize: 13.5, background: color.surface2,
          }}
        >
          {q ? 'Nothing matches that search.' : 'Nothing of this type yet — capture something to grow the library.'}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {assets.map((n) => (
          <button
            key={n.id}
            onClick={() => onSelect(n.id)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 8,
              textAlign: 'left', padding: 16,
              background: color.surface, border: `1px solid ${color.border}`,
              borderRadius: radius.lg, fontFamily: font.family,
              boxShadow: '0 1px 2px rgba(23,50,53,0.04)',
              transition: 'border-color 150ms ease, box-shadow 150ms ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <span style={tagStyle(color.brandSoft, color.brandText)}>{n.type.replace('_', ' ')}</span>
              <span style={tagStyle(statusSoft[n.status] ?? color.surface2, statusText[n.status] ?? color.textMuted)}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: color[n.status] }} />
                {n.status}
              </span>
            </div>
            <span style={{ fontSize: 14.5, fontWeight: 700, color: color.text, lineHeight: 1.35 }}>{n.label}</span>
            <span style={{ fontSize: 13, color: color.textMuted, lineHeight: 1.55, flex: 1 }}>
              {n.content.slice(0, 110)}{n.content.length > 110 ? '…' : ''}
            </span>
            <span style={{ fontSize: 12, color: color.textFaint }}>
              by {n.author ?? 'unknown'}{n.team ? ` · ${n.team}` : ''}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
