'use client';
import type { ReactNode, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 18, children, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function IconInbox(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 7h4.5l1.8 4h5.4l1.8-4H21" />
      <rect x="3" y="7" width="18" height="12" rx="2" />
    </Base>
  );
}

export function IconTarget(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function IconScale(props: IconProps) {
  return (
    <Base {...props}>
      <line x1="12" y1="3" x2="12" y2="21" />
      <line x1="5" y1="7" x2="19" y2="7" />
      <circle cx="5" cy="12" r="3" />
      <circle cx="19" cy="12" r="3" />
      <line x1="8" y1="21" x2="16" y2="21" />
    </Base>
  );
}

export function IconBarChart(props: IconProps) {
  return (
    <Base {...props}>
      <line x1="4" y1="20" x2="4" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="20" y1="20" x2="20" y2="14" />
    </Base>
  );
}

export function IconClose(props: IconProps) {
  return (
    <Base {...props}>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </Base>
  );
}

export function IconUpload(props: IconProps) {
  return (
    <Base {...props}>
      <line x1="12" y1="3" x2="12" y2="15" />
      <polyline points="7 8 12 3 17 8" />
      <polyline points="4 15 4 19 20 19 20 15" />
    </Base>
  );
}

export function IconEdit(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 20l4-1 10-10-3-3L5 16l-1 4z" />
      <line x1="13" y1="7" x2="17" y2="11" />
    </Base>
  );
}

export function IconLayers(props: IconProps) {
  return (
    <Base {...props}>
      <polygon points="12 3 21 8 12 13 3 8" />
      <polyline points="3 13 12 18 21 13" />
      <polyline points="3 17.5 12 22 21 17.5" />
    </Base>
  );
}

export function IconShield(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
      <polyline points="9 12 11 14 15 10" />
    </Base>
  );
}

export function IconChevronRight(props: IconProps) {
  return (
    <Base {...props}>
      <polyline points="9 6 15 12 9 18" />
    </Base>
  );
}

export function IconMessage(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <polygon points="7 17 7 21 11 17" />
    </Base>
  );
}

export function IconHash(props: IconProps) {
  return (
    <Base {...props}>
      <line x1="9" y1="3" x2="7" y2="21" />
      <line x1="17" y1="3" x2="15" y2="21" />
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="3" y1="15" x2="19" y2="15" />
    </Base>
  );
}

export function IconFileText(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <line x1="8" y1="8" x2="16" y2="8" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="16" x2="13" y2="16" />
    </Base>
  );
}

export function IconNote(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M5 3h10l4 4v14H5z" />
      <polyline points="15 3 15 7 19 7" />
    </Base>
  );
}

export function IconArrowUpRight(props: IconProps) {
  return (
    <Base {...props}>
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="8 7 17 7 17 16" />
    </Base>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <Base {...props}>
      <polyline points="5 13 9 17 19 7" />
    </Base>
  );
}

export function IconAlertTriangle(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3l10 18H2z" />
      <line x1="12" y1="9" x2="12" y2="13.5" />
      <circle cx="12" cy="16.5" r="0.6" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function IconSpinner(props: IconProps) {
  return (
    <Base {...props} style={{ animation: 'spin 0.8s linear infinite', ...props.style }}>
      <path d="M12 3a9 9 0 1 0 9 9" />
    </Base>
  );
}

export function IconLink(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M9 15l6-6" />
      <path d="M11 6l1-1a4 4 0 0 1 6 6l-1 1" />
      <path d="M13 18l-1 1a4 4 0 0 1-6-6l1-1" />
    </Base>
  );
}
