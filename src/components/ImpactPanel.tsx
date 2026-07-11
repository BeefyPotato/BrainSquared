'use client';
import { IconArrowUpRight, IconRefresh, IconStar } from '@/components/icons';
import { cardHeadStyle, cardStyle, color, font, heroStyle, heroSubStyle, heroTitleStyle, radius, space, statusSoft, statusText } from '@/components/theme';

// Demo-only content: this tab's data is intentionally hardcoded, not backed
// by a real credits/gamification system. See the mock this replicates.
const STATS = [
  { label: 'Knowledge credits', value: '1,240', badge: 'Level 7' },
  { label: 'Verified reuses', value: '47', badge: '+7 this week' },
  { label: 'Estimated time saved', value: '31h', badge: '+18%' },
  { label: 'Teams helped', value: '6', badge: 'Cross-team' },
];

const ATTRIBUTION = [
  {
    icon: IconArrowUpRight, iconBg: color.brandSoft, iconFg: color.brandText,
    title: 'Vietnam Campaign Prompt reused',
    desc: 'Growth adapted it while preserving your original authorship.',
    time: '8 minutes ago', credit: '+25',
  },
  {
    icon: IconRefresh, iconBg: color.brandSoft, iconFg: color.brandText,
    title: 'ESG workflow improved',
    desc: 'Operations added a vendor-risk step. Both contributors are credited.',
    time: 'Yesterday', credit: '+35',
  },
  {
    icon: IconStar, iconBg: 'rgba(234,179,8,0.16)', iconFg: '#854d0e',
    title: 'Response prompt became standard',
    desc: 'Approved for company-wide use by the Agent Council.',
    time: '2 days ago', credit: '+100',
  },
];

const CONTRIBUTIONS: { label: string; value: number; color: string }[] = [
  { label: 'Campaign prompt', value: 19, color: color.brand },
  { label: 'ESG workflow', value: 14, color: '#0b7773' },
  { label: 'Response prompt', value: 11, color: color.brand },
  { label: 'Vendor lesson', value: 5, color: '#eab308' },
];

export default function ImpactPanel() {
  return (
    <div style={{ fontFamily: font.family }}>
      <div style={heroStyle}>
        <div>
          <h1 style={heroTitleStyle}>Your contribution impact</h1>
          <p style={heroSubStyle}>Original creators remain visible as knowledge is reused and improved.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: space.xl }}>
        {STATS.map((s) => (
          <div key={s.label} style={{ ...cardStyle, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: color.text, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
                {s.value}
              </div>
              <span
                style={{
                  fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: radius.pill,
                  background: color.brandSoft, color: color.brandText, whiteSpace: 'nowrap',
                }}
              >
                {s.badge}
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: color.textMuted, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <section style={cardStyle}>
          <div style={cardHeadStyle}>
            <div>
              <strong style={{ fontSize: 14, display: 'block' }}>Recent attribution</strong>
              <small style={{ fontSize: 12, color: color.textMuted }}>Credits are awarded after verified usefulness.</small>
            </div>
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700,
                padding: '4px 10px', borderRadius: radius.pill, color: color.brandText, background: color.brandSoft,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: color.brand }} />
              Live
            </span>
          </div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {ATTRIBUTION.map((a) => (
              <div key={a.title} style={{ display: 'grid', gridTemplateColumns: '38px 1fr auto', gap: 12, alignItems: 'start' }}>
                <span
                  style={{
                    width: 38, height: 38, borderRadius: radius.md, display: 'grid', placeItems: 'center',
                    background: a.iconBg, color: a.iconFg, flexShrink: 0,
                  }}
                >
                  <a.icon size={16} />
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: color.text }}>{a.title}</div>
                  <div style={{ fontSize: 12.5, color: color.textMuted, marginTop: 2, lineHeight: 1.5 }}>{a.desc}</div>
                  <div style={{ fontSize: 11.5, color: color.textFaint, marginTop: 4 }}>{a.time}</div>
                </div>
                <span
                  style={{
                    fontSize: 12, fontWeight: 800, padding: '4px 10px', borderRadius: radius.pill,
                    background: statusSoft.approved, color: statusText.approved, whiteSpace: 'nowrap',
                  }}
                >
                  {a.credit}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section style={cardStyle}>
          <div style={cardHeadStyle}>
            <div>
              <strong style={{ fontSize: 14, display: 'block' }}>Your strongest contributions</strong>
              <small style={{ fontSize: 12, color: color.textMuted }}>Impact, not upload volume.</small>
            </div>
          </div>
          <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {CONTRIBUTIONS.map((c) => {
                const max = Math.max(...CONTRIBUTIONS.map(x => x.value));
                return (
                  <div key={c.label} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 28px', alignItems: 'center', gap: 10, fontSize: 13 }}>
                    <span style={{ color: color.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.label}</span>
                    <div style={{ height: 9, background: '#e8f1ef', borderRadius: radius.pill, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(c.value / max) * 100}%`, background: c.color, borderRadius: radius.pill }} />
                    </div>
                    <span style={{ color: color.text, fontWeight: 700, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{c.value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
