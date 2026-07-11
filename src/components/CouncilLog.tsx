'use client';
import { useState } from 'react';
import type { KGNode, KGEdge } from '@/lib/types';
import { IconEdit, IconLayers, IconShield, IconScale, IconSpinner } from '@/components/icons';
import { color, font, heroStyle, heroSubStyle, heroTitleStyle, primaryButtonStyle, radius, tagStyle } from '@/components/theme';

const AGENT_ICON: Record<string, typeof IconEdit> = { scribe: IconEdit, curator: IconLayers, auditor: IconShield };
// Verbatim type-family hues stay on the graph; these are their AA-readable text pairs.
const AGENT_TEXT: Record<string, string> = { scribe: '#6d28d9', curator: '#a21caf', auditor: color.brandText };
const AGENT_NAME: Record<string, string> = { scribe: 'Scribe', curator: 'Curator', auditor: 'Auditor' };

export default function CouncilLog({ graph, onHighlight }: {
  graph: { nodes: KGNode[]; edges: KGEdge[] };
  onHighlight: (ids: string[]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const actions = graph.nodes
    .filter(n => n.type === 'agent_action')
    .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));

  function highlight(action: KGNode) {
    const ids = graph.edges
      .filter(e => e.from_node === action.id)
      .map(e => e.to_node);
    onHighlight([action.id, ...ids]);
  }

  async function runCouncil() {
    setBusy(true);
    try { await fetch('/api/council', { method: 'POST' }); } finally { setBusy(false); }
  }

  function when(a: KGNode) {
    if (!a.created_at) return '';
    const d = new Date(a.created_at);
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div style={{ fontFamily: font.family }}>
      <div style={heroStyle}>
        <div>
          <h1 style={heroTitleStyle}>Council log</h1>
          <p style={heroSubStyle}>
            Every agent verdict, in order — read directly off the graph, nothing hidden.
            Click a verdict to trace it on the memory map.
          </p>
        </div>
        <button onClick={runCouncil} disabled={busy} style={primaryButtonStyle(busy)}>
          {busy ? <IconSpinner size={14} /> : <IconScale size={15} />}
          {busy ? 'Council in session…' : 'Run Council — re-review all knowledge'}
        </button>
      </div>

      {actions.length === 0 && (
        <div
          style={{
            padding: '28px 20px', textAlign: 'center', border: `1px dashed ${color.borderStrong}`,
            borderRadius: radius.lg, color: color.textMuted, fontSize: 13.5, background: color.surface2,
          }}
        >
          No council activity yet — capture something, and the verdicts appear here.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {actions.map(a => {
          const agent = a.author ?? 'scribe';
          const Icon = AGENT_ICON[agent] ?? IconEdit;
          const c = AGENT_TEXT[agent] ?? color.textMuted;
          return (
            <button
              key={a.id}
              onClick={() => highlight(a)}
              style={{
                display: 'grid', gridTemplateColumns: '36px minmax(0, 1fr) auto', gap: 12,
                alignItems: 'start', width: '100%', textAlign: 'left',
                padding: '13px 14px', background: color.surface, border: `1px solid ${color.border}`,
                borderRadius: radius.md, fontFamily: font.family,
                boxShadow: '0 1px 2px rgba(23,50,53,0.04)',
                transition: 'border-color 150ms ease',
              }}
            >
              <span
                style={{
                  width: 36, height: 36, borderRadius: radius.sm, flexShrink: 0, display: 'grid', placeItems: 'center',
                  background: `${c}14`, color: c,
                }}
              >
                <Icon size={16} />
              </span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: color.text }}>{a.label}</span>
                <span style={{ display: 'block', fontSize: 13, color: color.textMuted, marginTop: 3, lineHeight: 1.55 }}>{a.content}</span>
                {a.created_at && (
                  <span style={{ display: 'block', fontSize: 12, color: color.textFaint, marginTop: 5 }}>{when(a)}</span>
                )}
              </span>
              <span style={tagStyle(`${c}14`, c)}>{AGENT_NAME[agent] ?? agent}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
