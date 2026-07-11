import type { CSSProperties } from 'react';

export const color = {
  bg: '#0a1420',
  bgElevated: '#0d1a28',
  surface: '#101f2f',
  surfaceHover: '#16283b',
  surface2: '#0c1826',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.16)',
  text: '#e7edf2',
  textMuted: '#8fa3b0',
  textFaint: '#5c7282',

  brand: '#17b8a6',
  brandDark: '#0f9488',
  brandSoft: 'rgba(23,184,166,0.14)',
  brandText: '#5eead4',

  danger: '#ef4444',
  dangerSoft: 'rgba(239,68,68,0.14)',

  // Node status — verbatim per AGENTS.md, never change
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

export const statusSoft: Record<string, string> = {
  pending: 'rgba(234,179,8,0.14)',
  approved: 'rgba(34,197,94,0.14)',
  flagged: 'rgba(239,68,68,0.14)',
  superseded: 'rgba(100,116,139,0.14)',
};

export const radius = { sm: 6, md: 10, lg: 14, xl: 18, pill: 999 };

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };

export const shadow = {
  card: '0 8px 24px rgba(0,0,0,0.35)',
  lg: '0 20px 56px rgba(0,0,0,0.5)',
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

export const inputStyle: CSSProperties = {
  width: '100%',
  background: color.surface2,
  border: `1px solid ${color.border}`,
  borderRadius: radius.sm,
  color: color.text,
  padding: '10px 12px',
  fontSize: 13,
  fontFamily: font.family,
  outline: 'none',
};

export function primaryButtonStyle(busy: boolean): CSSProperties {
  return {
    padding: '10px 14px',
    background: busy ? color.surfaceHover : color.brand,
    color: busy ? color.textMuted : '#052622',
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
    transition: 'background 150ms ease, transform 150ms ease',
  };
}

export const secondaryButtonStyle: CSSProperties = {
  padding: '9px 13px',
  background: 'transparent',
  color: color.text,
  border: `1px solid ${color.borderStrong}`,
  borderRadius: radius.sm,
  fontSize: 12,
  fontWeight: 600,
  fontFamily: font.family,
  cursor: 'pointer',
};

export const tagStyle = (bg: string, fg: string): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '3px 8px',
  borderRadius: radius.pill,
  fontSize: 10,
  fontWeight: 700,
  background: bg,
  color: fg,
  whiteSpace: 'nowrap',
});
