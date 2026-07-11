'use client';
import { useState } from 'react';
import type { KGNode, KGEdge } from '@/lib/types';

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
    <div>
      <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>What are you about to work on? The memory surfaces what the firm already knows.</p>
      <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. starting a market-entry study for a retail client"
        style={{ width: '100%', height: 80, background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#e2e8f0', padding: 8, fontSize: 13, marginBottom: 8 }} />
      <button onClick={go} disabled={busy} style={{ width: '100%', padding: 10, background: busy ? '#334155' : '#4f46e5', color: 'white', border: 'none', borderRadius: 6, fontSize: 14 }}>
        {busy ? 'Searching the memory…' : 'Find relevant knowledge'}
      </button>
      {res && (<div style={{ marginTop: 12 }}>
        <p style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 8 }}>{res.answer}</p>
        {res.nodeIds.map(id => {
          const n = graph.nodes.find(x => x.id === id);
          if (!n) return null;
          return (
            <div key={id} style={{ padding: 10, marginBottom: 8, background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}>
              <div style={{ fontSize: 13 }}><b>{n.label}</b> <span style={{ color: '#64748b' }}>({n.type})</span></div>
              <div style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0' }}>{n.context.slice(0, 140)}</div>
              <button onClick={() => trace(id)} style={{ fontSize: 12, background: 'none', border: '1px solid #4f46e5', color: '#818cf8', borderRadius: 4, padding: '2px 8px' }}>trace in graph</button>
            </div>
          );
        })}
      </div>)}
    </div>
  );
}
