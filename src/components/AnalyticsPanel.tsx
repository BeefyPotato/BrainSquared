'use client';
import { useEffect, useState } from 'react';
import type { AnalyticsSummary } from '@/lib/types';
import { IconAlertTriangle, IconSpinner } from '@/components/icons';
import { color, font, radius, space } from '@/components/theme';

function Bars({ title, data }: { title: string; data: Record<string, number> }) {
  const max = Math.max(1, ...Object.values(data));
  const entries = Object.entries(data);
  return (
    <div style={{ marginBottom: space.xl }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: color.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
        {title}
      </div>
      {entries.length === 0 && <p style={{ fontSize: 11.5, color: color.textFaint }}>No data yet.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entries.map(([k, v]) => (
          <div key={k} style={{ display: 'grid', gridTemplateColumns: '96px 1fr 24px', alignItems: 'center', gap: 8, fontSize: 11.5 }}>
            <span style={{ color: color.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k}</span>
            <div style={{ height: 8, background: color.surface2, borderRadius: radius.pill, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(v / max) * 100}%`, background: color.brand, borderRadius: radius.pill }} />
            </div>
            <span style={{ color: color.text, fontWeight: 600, textAlign: 'right' }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPanel() {
  const [a, setA] = useState<AnalyticsSummary | null>(null);
  useEffect(() => { fetch('/api/analytics').then(r => r.json()).then(setA); }, []);

  if (!a) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: color.textFaint, fontFamily: font.family }}>
        <IconSpinner size={13} /> Computing…
      </div>
    );
  }

  const stats = [
    { label: 'Live assets', value: Object.values(a.assetsByType).reduce((s, n) => s + n, 0) },
    { label: 'Duplicates merged', value: a.mergeCount },
    { label: 'Governance flags', value: a.flagCount },
  ];

  return (
    <div style={{ fontFamily: font.family }}>
      <h1 style={{ fontSize: 16, fontWeight: 700, color: color.text, margin: '0 0 16px' }}>Analytics</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: space.xl }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: color.surface, border: `1px solid ${color.border}`, borderRadius: radius.md, padding: '12px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: color.text }}>{s.value}</div>
            <div style={{ fontSize: 10, color: color.textFaint, marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <Bars title="Capability by type (growing)" data={a.assetsByType} />
      <Bars title="Capability by team" data={a.assetsByTeam} />

      <div style={{ fontSize: 10, fontWeight: 700, color: color.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
        Gaps (missing)
      </div>
      {a.gaps.length === 0 && <p style={{ fontSize: 11.5, color: color.textMuted }}>No coverage gaps detected.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {a.gaps.map(g => (
          <div key={g} style={{ display: 'flex', gap: 7, alignItems: 'flex-start', fontSize: 11.5, color: '#fbbf24', lineHeight: 1.5 }}>
            <IconAlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
            {g}
          </div>
        ))}
      </div>
    </div>
  );
}
