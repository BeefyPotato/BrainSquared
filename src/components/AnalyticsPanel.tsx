'use client';
import { useEffect, useState } from 'react';
import type { AnalyticsSummary } from '@/lib/types';
import { IconAlertTriangle, IconSpinner } from '@/components/icons';
import { cardHeadStyle, cardStyle, color, font, heroStyle, heroSubStyle, heroTitleStyle, radius, space } from '@/components/theme';

function Bars({ data }: { data: Record<string, number> }) {
  const max = Math.max(1, ...Object.values(data));
  const entries = Object.entries(data);
  if (entries.length === 0) return <p style={{ fontSize: 13, color: color.textFaint, margin: 0 }}>No data yet.</p>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {entries.map(([k, v]) => (
        <div key={k} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 28px', alignItems: 'center', gap: 10, fontSize: 13 }}>
          <span style={{ color: color.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k}</span>
          <div style={{ height: 9, background: '#e8f1ef', borderRadius: radius.pill, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(v / max) * 100}%`, background: color.brand, borderRadius: radius.pill }} />
          </div>
          <span style={{ color: color.text, fontWeight: 700, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{v}</span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPanel() {
  const [a, setA] = useState<AnalyticsSummary | null>(null);
  useEffect(() => { fetch('/api/analytics').then(r => r.json()).then(setA); }, []);

  if (!a) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: color.textMuted, fontFamily: font.family }}>
        <IconSpinner size={14} /> Computing…
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
      <div style={heroStyle}>
        <div>
          <h1 style={heroTitleStyle}>Capability analytics</h1>
          <p style={heroSubStyle}>What the firm knows, where it&apos;s growing, and what&apos;s still missing.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: space.xl }}>
        {stats.map((s) => (
          <div key={s.label} style={{ ...cardStyle, padding: '16px 18px' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: color.text, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
              {s.value}
            </div>
            <div style={{ fontSize: 12.5, color: color.textMuted, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: space.xl }}>
        <section style={cardStyle}>
          <div style={cardHeadStyle}>
            <div>
              <strong style={{ fontSize: 14, display: 'block' }}>Capability by type</strong>
              <small style={{ fontSize: 12, color: color.textMuted }}>What kind of know-how is growing.</small>
            </div>
          </div>
          <div style={{ padding: 16 }}><Bars data={a.assetsByType} /></div>
        </section>

        <section style={cardStyle}>
          <div style={cardHeadStyle}>
            <div>
              <strong style={{ fontSize: 14, display: 'block' }}>Capability by team</strong>
              <small style={{ fontSize: 12, color: color.textMuted }}>Where knowledge compounds fastest.</small>
            </div>
          </div>
          <div style={{ padding: 16 }}><Bars data={a.assetsByTeam} /></div>
        </section>
      </div>

      <section style={cardStyle}>
        <div style={cardHeadStyle}>
          <div>
            <strong style={{ fontSize: 14, display: 'block' }}>Coverage gaps</strong>
            <small style={{ fontSize: 12, color: color.textMuted }}>Capability the firm is missing.</small>
          </div>
        </div>
        <div style={{ padding: 16 }}>
          {a.gaps.length === 0 && <p style={{ fontSize: 13, color: color.textMuted, margin: 0 }}>No coverage gaps detected.</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {a.gaps.map(g => (
              <div key={g} style={{ display: 'grid', gridTemplateColumns: '32px 1fr', gap: 11, alignItems: 'start' }}>
                <span
                  style={{
                    width: 32, height: 32, borderRadius: radius.sm, display: 'grid', placeItems: 'center',
                    background: 'rgba(234,179,8,0.16)', color: '#854d0e',
                  }}
                >
                  <IconAlertTriangle size={15} />
                </span>
                <span style={{ fontSize: 13, color: color.text, lineHeight: 1.55, paddingTop: 6 }}>{g}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
