'use client';
import { useState } from 'react';
import type { KGNode, KGEdge } from '@/lib/types';
import { IconArrowUpRight, IconSpinner, IconTarget } from '@/components/icons';
import { color, font, inputStyle, primaryButtonStyle, radius, space } from '@/components/theme';

export default function TaskPanel({ graph, onHighlight }: {
  graph: { nodes: KGNode[]; edges: KGEdge[] };
  onHighlight: (ids: string[]) => void;
}) {
  const [desc, setDesc] = useState('');
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ answer: string; nodeIds: string[] } | null>(null);

  async function go() {
    if (!desc.trim()) return;
    setBusy(true); setRes(null);
    try {
      const r = await fetch('/api/task', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: desc }),
      });
      const json = await r.json();
      if (json.ok) setRes(json);
    } finally { setBusy(false); }
  }

  function trace(id: string) {
    const around = graph.edges
      .filter(e => e.from_node === id || e.to_node === id)
      .flatMap(e => [e.from_node, e.to_node]);
    onHighlight([id, ...around]);
  }

  return (
    <div style={{ fontFamily: font.family }}>
      <h1 style={{ fontSize: 16, fontWeight: 700, color: color.text, margin: '0 0 6px' }}>Start a task</h1>
      <p style={{ fontSize: 12, color: color.textMuted, lineHeight: 1.5, margin: '0 0 16px' }}>
        What are you about to work on? The memory surfaces what the firm already knows.
      </p>

      <textarea
        value={desc}
        onChange={e => setDesc(e.target.value)}
        placeholder="e.g. starting a market-entry study for a retail client"
        style={{ ...inputStyle, height: 80, resize: 'vertical', marginBottom: space.md, lineHeight: 1.5 }}
      />
      <button onClick={go} disabled={busy} style={{ ...primaryButtonStyle(busy), width: '100%' }}>
        {busy ? <IconSpinner size={14} /> : <IconTarget size={15} />}
        {busy ? 'Searching the memory…' : 'Find relevant knowledge'}
      </button>

      {res && (
        <div style={{ marginTop: space.lg }}>
          <p style={{ fontSize: 12.5, color: color.text, lineHeight: 1.55, margin: '0 0 12px' }}>{res.answer}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {res.nodeIds.map(id => {
              const n = graph.nodes.find(x => x.id === id);
              if (!n) return null;
              return (
                <div key={id} style={{ padding: 12, background: color.surface, border: `1px solid ${color.border}`, borderRadius: radius.md }}>
                  <div style={{ fontSize: 12.5, color: color.text }}>
                    <b>{n.label}</b> <span style={{ color: color.textFaint, fontWeight: 400 }}>({n.type})</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: color.textMuted, margin: '5px 0 8px', lineHeight: 1.5 }}>{n.context.slice(0, 140)}</div>
                  <button
                    onClick={() => trace(id)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600,
                      background: 'transparent', border: `1px solid ${color.brand}`, color: color.brandText,
                      borderRadius: radius.sm, padding: '4px 9px', fontFamily: font.family,
                    }}
                  >
                    <IconArrowUpRight size={11} /> Trace in graph
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
