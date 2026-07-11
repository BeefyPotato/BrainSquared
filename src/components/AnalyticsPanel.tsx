'use client';
import { useEffect, useState } from 'react';
import type { AnalyticsSummary } from '@/lib/types';

function Bars({ title, data }: { title: string; data: Record<string, number> }) {
  const max = Math.max(1, ...Object.values(data));
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>{title}</div>
      {Object.entries(data).map(([k, v]) => (
        <div key={k} style={{ display: 'flex', alignItems: 'center', marginBottom: 4, fontSize: 12 }}>
          <span style={{ width: 110, color: '#94a3b8' }}>{k}</span>
          <div style={{ height: 10, width: `${(v / max) * 60}%`, background: '#4f46e5', borderRadius: 3, marginRight: 6 }} />
          <span>{v}</span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPanel() {
  const [a, setA] = useState<AnalyticsSummary | null>(null);
  useEffect(() => { fetch('/api/analytics').then(r => r.json()).then(setA); }, []);
  if (!a) return <p style={{ fontSize: 13, color: '#64748b' }}>Computing…</p>;
  const card = { flex: 1, background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: 12, textAlign: 'center' as const };
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <div style={card}><div style={{ fontSize: 22 }}>{Object.values(a.assetsByType).reduce((s, n) => s + n, 0)}</div><div style={{ fontSize: 11, color: '#64748b' }}>live assets</div></div>
        <div style={card}><div style={{ fontSize: 22 }}>{a.mergeCount}</div><div style={{ fontSize: 11, color: '#64748b' }}>duplicates merged</div></div>
        <div style={card}><div style={{ fontSize: 22 }}>{a.flagCount}</div><div style={{ fontSize: 11, color: '#64748b' }}>governance flags</div></div>
      </div>
      <Bars title="Capability by type (growing)" data={a.assetsByType} />
      <Bars title="Capability by team" data={a.assetsByTeam} />
      <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Gaps (missing)</div>
      {a.gaps.length === 0 && <p style={{ fontSize: 12, color: '#94a3b8' }}>No coverage gaps detected.</p>}
      {a.gaps.map(g => <p key={g} style={{ fontSize: 12, color: '#f59e0b', marginBottom: 4 }}>⚠ {g}</p>)}
    </div>
  );
}
