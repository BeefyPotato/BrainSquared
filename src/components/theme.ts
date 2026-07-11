import type { CSSProperties } from 'react';

// Teal light theme following the approved HTML mock, refined per ui-ux-pro-max:
// text tokens are AA-contrast (>=4.5:1) on their surfaces, type scale starts at 12px,
// spacing stays on the 4/8 rhythm. Sidebar keeps the mock's dark teal shell.
export const color = {
  // Light content canvas
  bg: '#f2f8f7',
  bgElevated: '#ffffff',
  surface: '#ffffff',
  surfaceHover: '#f0f7f6',
  surface2: '#f6fbfa',
  border: '#d8e8e6',
  borderStrong: '#c2dad7',
  text: '#14292b',
  textMuted: '#44605f',
  textFaint: '#5c7877',

  // Dark teal shell (sidebar + welcome hero), from the mock
  shell: '#0d2426',
  shell2: '#12383b',
  shell3: '#1a4b4f',
  shellBorder: 'rgba(255,255,255,0.10)',
  shellText: '#eef6f5',
  shellTextMuted: '#a7bfbd',
  shellTextFaint: '#84a09e',

  brand: '#0f9d98',
  brandDark: '#0b7773',
  brandSoft: '#e2f5f3',
  brandText: '#0b6e6a',

  danger: '#ef4444',
  dangerSoft: 'rgba(239,68,68,0.10)',
  dangerText: '#b91c1c',

  // Node status — verbatim per AGENTS.md, never change (graph dots, legend swatches)
  pending: '#eab308',
  approved: '#22c55e',
  flagged: '#ef4444',
  superseded: '#64748b',

  // Node type colors — verbatim families per AGENTS.md (person blue, project cyan, source purple, agent_action magenta)
  person: '#3b82f6',
  project: '#06b6d4',
  source: '#8b5cf6',
  agentAction: '#d946ef',
} as const;

// Readable text companions for the verbatim status colors on light soft backgrounds
// (the raw swatches stay on dots/graph; tags pair a swatch dot with this text).
export const statusText: Record<string, string> = {
  pending: '#854d0e',
  approved: '#166534',
  flagged: '#b91c1c',
  superseded: '#475569',
};

export const statusSoft: Record<string, string> = {
  pending: 'rgba(234,179,8,0.16)',
  approved: 'rgba(34,197,94,0.14)',
  flagged: 'rgba(239,68,68,0.12)',
  superseded: 'rgba(100,116,139,0.14)',
};

export const radius = { sm: 8, md: 11, lg: 14, xl: 18, pill: 999 };

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };

export const shadow = {
  card: '0 1px 2px rgba(23,50,53,0.04), 0 8px 24px rgba(23,50,53,0.06)',
  lg: '0 24px 70px rgba(13,36,38,0.18)',
};

export const font = {
  family: "var(--font-sans), ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
};

export const cardStyle: CSSProperties = {
  background: color.surface,
  border: `1px solid ${color.border}`,
  borderRadius: radius.lg,
  boxShadow: shadow.card,
};

export const cardHeadStyle: CSSProperties = {
  padding: '14px 16px',
  borderBottom: `1px solid ${color.border}`,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 10,
};

export const inputStyle: CSSProperties = {
  width: '100%',
  background: color.surface,
  border: `1px solid ${color.borderStrong}`,
  borderRadius: radius.sm,
  color: color.text,
  padding: '10px 12px',
  fontSize: 14,
  fontFamily: font.family,
  outline: 'none',
};

export function primaryButtonStyle(busy: boolean): CSSProperties {
  return {
    padding: '10px 16px',
    minHeight: 40,
    background: busy ? color.surfaceHover : color.brandDark,
    color: busy ? color.textMuted : '#ffffff',
    border: 'none',
    borderRadius: radius.sm,
    fontSize: 13,
    fontWeight: 700,
    fontFamily: font.family,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    cursor: busy ? 'default' : 'pointer',
    transition: 'background 150ms ease, filter 150ms ease',
  };
}

export const secondaryButtonStyle: CSSProperties = {
  padding: '9px 14px',
  minHeight: 38,
  background: color.surface,
  color: color.text,
  border: `1px solid ${color.borderStrong}`,
  borderRadius: radius.sm,
  fontSize: 13,
  fontWeight: 600,
  fontFamily: font.family,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  transition: 'background 150ms ease, filter 150ms ease',
};

export const tagStyle = (bg: string, fg: string): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: '3px 9px',
  borderRadius: radius.pill,
  fontSize: 11,
  fontWeight: 700,
  background: bg,
  color: fg,
  whiteSpace: 'nowrap',
});

// Full-page view scaffolding from the mock (.view / .page / .hero)
export const pageStyle: CSSProperties = {
  maxWidth: 1120,
  margin: '0 auto',
  padding: '28px 32px 72px',
};

export const heroStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  gap: 16,
  flexWrap: 'wrap',
  marginBottom: 20,
};

export const heroTitleStyle: CSSProperties = {
  fontSize: 26,
  letterSpacing: '-0.03em',
  lineHeight: 1.15,
  fontWeight: 800,
  color: color.text,
  margin: '0 0 6px',
};

export const heroSubStyle: CSSProperties = {
  margin: 0,
  color: color.textMuted,
  fontSize: 13.5,
  lineHeight: 1.5,
};

export const sectionLabelStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: color.textFaint,
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  marginBottom: 10,
};
