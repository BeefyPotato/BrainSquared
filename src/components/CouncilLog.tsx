'use client';
import { useState } from 'react';
import type { KGNode, KGEdge } from '@/lib/types';
import { IconEdit, IconLayers, IconShield, IconScale, IconSpinner } from '@/components/icons';
import { color, font, primaryButtonStyle, radius, secondaryButtonStyle, space } from '@/components/theme';

const AGENT_ICON: Record<string, typeof IconEdit> = { scribe: IconEdit, curator: IconLayers, auditor: IconShield };
const AGENT_COLOR: Record<string, string> = { scribe: color.source, curator: color.agentAction, auditor: color.brandText };

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

  return (
    <div style={{ fontFamily: font.family }}>
      <h1 style={{ fontSize: 16, fontWeight: 700, color: color.text, margin: '0 0 6px' }}>Council log</h1>
      <p style={{ fontSize: 12, color: color.textMuted, lineHeight: 1.5, margin: '0 0 16px' }}>
        Every agent verdict, in order — read directly off the graph, nothing hidden.
      </p>

      <button onClick={runCouncil} disabled={busy} style={{ ...primaryButtonStyle(busy), width: '100%', marginBottom: 8 }}>
        {busy ? <IconSpinner size={14} /> : <IconScale size={15} />}
        {busy ? 'Council in session…' : 'Run Council — re-review all knowledge'}
      </button>
      <button
        onClick={() => onHighlight([])}
        style={{ ...secondaryButtonStyle, border: 'none', padding: '4px 0', color: color.textFaint, marginBottom: space.lg }}
      >
        Clear highlight
      </button>

      {actions.length === 0 && (
        <p style={{ fontSize: 12, color: color.textFaint, padding: '10px 0' }}>No council activity yet — capture something.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {actions.map(a => {
          const agent = a.author ?? 'scribe';
          const Icon = AGENT_ICON[agent] ?? IconEdit;
          const c = AGENT_COLOR[agent] ?? color.textMuted;
          return (
            <button
              key={a.id}
              onClick={() => highlight(a)}
              style={{
                display: 'flex', gap: 10, alignItems: 'flex-start', width: '100%', textAlign: 'left',
                padding: 12, background: color.surface, border: `1px solid ${color.border}`,
                borderRadius: radius.md, fontFamily: font.family,
              }}
            >
              <span
                style={{
                  width: 30, height: 30, borderRadius: radius.sm, flexShrink: 0, display: 'grid', placeItems: 'center',
                  background: `${c}22`, color: c,
                }}
              >
                <Icon size={15} />
              </span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: color.text }}>{a.label}</span>
                <span style={{ display: 'block', fontSize: 11.5, color: color.textMuted, marginTop: 3, lineHeight: 1.5 }}>{a.content}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
