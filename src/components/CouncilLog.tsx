'use client';
import { useState } from 'react';
import type { KGNode, KGEdge } from '@/lib/types';

const AVATARS: Record<string, string> = { scribe: '📝', curator: '🧹', auditor: '🕵️' };

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
    <div>
      <button onClick={runCouncil} disabled={busy} style={{
        width: '100%', padding: 10, marginBottom: 12, background: busy ? '#334155' : '#7c3aed',
        color: 'white', border: 'none', borderRadius: 6, fontSize: 14,
      }}>{busy ? 'Council in session…' : '⚖️ Run Council — re-review all knowledge'}</button>
      <button onClick={() => onHighlight([])} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 12, marginBottom: 8 }}>clear highlight</button>
      {actions.length === 0 && <p style={{ fontSize: 13, color: '#64748b' }}>No council activity yet — capture something.</p>}
      {actions.map(a => {
        const agent = a.author ?? 'scribe';
        return (
          <button key={a.id} onClick={() => highlight(a)} style={{
            display: 'block', width: '100%', textAlign: 'left', marginBottom: 8, padding: 10,
            background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, color: '#e2e8f0',
          }}>
            <div style={{ fontSize: 13 }}>{AVATARS[agent] ?? '🤖'} <b>{a.label}</b></div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{a.content}</div>
          </button>
        );
      })}
    </div>
  );
}
