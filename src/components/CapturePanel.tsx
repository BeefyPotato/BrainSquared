'use client';
import { useRef, useState } from 'react';
import type { SourceKind, PipelineResult } from '@/lib/types';
import { IconMessage, IconHash, IconFileText, IconNote, IconUpload, IconSpinner, IconCheck, IconAlertTriangle, IconEdit, IconLayers, IconShield } from '@/components/icons';
import { cardHeadStyle, cardStyle, color, font, heroStyle, heroSubStyle, heroTitleStyle, inputStyle, primaryButtonStyle, radius, space, tagStyle } from '@/components/theme';

const KINDS: { v: SourceKind; l: string; hint: string; icon: typeof IconMessage }[] = [
  { v: 'claude_conversation', l: 'Claude conversation', hint: 'Exported chat', icon: IconMessage },
  { v: 'chatgpt_export', l: 'ChatGPT export', hint: 'Exported chat', icon: IconMessage },
  { v: 'slack_thread', l: 'Slack thread', hint: 'Decision / lesson', icon: IconHash },
  { v: 'config_file', l: 'Agent config', hint: 'Workflow / settings', icon: IconFileText },
  { v: 'manual', l: 'Notes / other', hint: 'Free text', icon: IconNote },
];

const COUNCIL_STEPS: { icon: typeof IconEdit; c: string; title: string; text: string }[] = [
  { icon: IconEdit, c: '#6d28d9', title: 'The Scribe distills', text: 'Pulls out the reusable pieces — prompts, workflows, lessons — and keeps why they worked.' },
  { icon: IconLayers, c: '#a21caf', title: 'The Curator organizes', text: 'Merges duplicates with what the firm already knows and links related work.' },
  { icon: IconShield, c: color.brandText, title: 'The Auditor checks', text: 'Reviews everything against current firm standards and decisions, and explains its verdict.' },
];

const LABEL: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: color.textMuted, display: 'block', marginBottom: 6,
};

export default function CapturePanel({ onDone }: { onDone: () => void }) {
  const [text, setText] = useState('');
  const [uploader, setUploader] = useState('');
  const [kind, setKind] = useState<SourceKind>('claude_conversation');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function submit() {
    if (!text.trim() || !uploader.trim()) return;
    setBusy(true); setResult(null);
    try {
      const res = await fetch('/api/ingest', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, uploader, sourceKind: kind, sourceName: `${kind} from ${uploader}` }),
      });
      const json: PipelineResult = await res.json();
      setResult(json);
      if (json.ok) { setText(''); onDone(); }
    } finally { setBusy(false); }
  }

  function onFile(f: File | undefined) {
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setText(String(r.result ?? ''));
    r.readAsText(f);
  }

  return (
    <div style={{ fontFamily: font.family }}>
      <div style={heroStyle}>
        <div>
          <h1 style={heroTitleStyle}>Capture knowledge</h1>
          <p style={heroSubStyle}>
            Drop in the exhaust of AI work — conversations, threads, configs. Nothing to write up; the Council does the rest.
          </p>
        </div>
      </div>

      {/* Source type — card row per the mock */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: space.lg }}>
        {KINDS.map(({ v, l, hint, icon: Icon }) => {
          const selected = kind === v;
          return (
            <button
              key={v}
              onClick={() => setKind(v)}
              aria-pressed={selected}
              style={{
                display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start',
                padding: '12px 13px', borderRadius: radius.md, textAlign: 'left',
                background: color.surface,
                border: `1px solid ${selected ? color.brand : color.border}`,
                boxShadow: selected ? `0 0 0 3px ${color.brandSoft}` : '0 1px 2px rgba(23,50,53,0.04)',
                color: color.text, fontFamily: font.family,
                transition: 'border-color 150ms ease, box-shadow 150ms ease',
              }}
            >
              <span
                style={{
                  width: 32, height: 32, borderRadius: radius.sm, display: 'grid', placeItems: 'center',
                  background: selected ? color.brandSoft : color.surface2,
                  color: selected ? color.brandText : color.textMuted,
                }}
              >
                <Icon size={16} />
              </span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{l}</span>
              <span style={{ fontSize: 12, color: color.textFaint }}>{hint}</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 0.85fr)', gap: 16, alignItems: 'start' }}>
        <section style={cardStyle}>
          <div style={cardHeadStyle}>
            <div>
              <strong style={{ fontSize: 14, display: 'block' }}>What did you learn?</strong>
              <small style={{ fontSize: 12, color: color.textMuted }}>You choose exactly what goes in.</small>
            </div>
            <span style={tagStyle(color.brandSoft, color.brandText)}>{KINDS.find(k => k.v === kind)?.l}</span>
          </div>
          <div style={{ padding: 16 }}>
            <label htmlFor="capture-name" style={LABEL}>Your name</label>
            <input
              id="capture-name"
              style={{ ...inputStyle, marginBottom: space.lg }}
              placeholder="e.g. Sarah Chen"
              value={uploader}
              onChange={e => setUploader(e.target.value)}
            />

            <label htmlFor="capture-text" style={LABEL}>Raw text</label>
            <textarea
              id="capture-text"
              style={{ ...inputStyle, height: 200, resize: 'vertical', marginBottom: 8, lineHeight: 1.55 }}
              placeholder="Paste raw text…"
              value={text}
              onChange={e => setText(e.target.value)}
            />

            <input ref={fileRef} type="file" accept=".txt,.md,.json" onChange={e => onFile(e.target.files?.[0])} style={{ display: 'none' }} />
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, background: 'transparent', border: 'none',
                color: color.brandText, fontSize: 13, fontWeight: 600, fontFamily: font.family,
                padding: '6px 0', marginBottom: space.lg,
              }}
            >
              <IconUpload size={14} /> Upload a file instead
            </button>

            <button onClick={submit} disabled={busy} style={{ ...primaryButtonStyle(busy), width: '100%' }}>
              {busy && <IconSpinner size={14} />}
              {busy ? 'The Council is reviewing…' : 'Capture into memory'}
            </button>

            {result && (
              <div
                role="status"
                style={{
                  display: 'flex', gap: 9, alignItems: 'flex-start', marginTop: space.md, padding: '11px 13px',
                  borderRadius: radius.sm, fontSize: 13, lineHeight: 1.55,
                  background: result.ok ? 'rgba(34,197,94,0.10)' : 'rgba(234,179,8,0.12)',
                  color: result.ok ? '#166534' : '#854d0e',
                }}
              >
                {result.ok
                  ? <IconCheck size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                  : <IconAlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />}
                <span>
                  {result.ok
                    ? `Captured ${result.createdNodeIds.length} assets · ${result.log.length} council actions — see Council Log`
                    : `Capture landed as pending — council will review (${result.error ?? 'agent error'})`}
                </span>
              </div>
            )}
          </div>
        </section>

        <aside style={cardStyle}>
          <div style={cardHeadStyle}>
            <div>
              <strong style={{ fontSize: 14, display: 'block' }}>What happens next</strong>
              <small style={{ fontSize: 12, color: color.textMuted }}>Three AI librarians review every capture.</small>
            </div>
          </div>
          <div style={{ padding: 16, display: 'grid', gap: 14 }}>
            {COUNCIL_STEPS.map(({ icon: Icon, c, title, text: t }) => (
              <div key={title} style={{ display: 'grid', gridTemplateColumns: '32px 1fr', gap: 11, alignItems: 'start' }}>
                <span
                  style={{
                    width: 32, height: 32, borderRadius: radius.sm, display: 'grid', placeItems: 'center',
                    background: `${c}14`, color: c,
                  }}
                >
                  <Icon size={15} />
                </span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: color.text }}>{title}</div>
                  <div style={{ fontSize: 12.5, color: color.textMuted, marginTop: 2, lineHeight: 1.5 }}>{t}</div>
                </div>
              </div>
            ))}
            <div
              style={{
                borderLeft: `3px solid ${color.brand}`, background: color.brandSoft,
                borderRadius: `0 ${radius.sm}px ${radius.sm}px 0`, padding: '10px 12px',
                fontSize: 12.5, color: color.text, lineHeight: 1.5,
              }}
            >
              Every verdict shows up in the Council Log and on the memory map — nothing is changed silently.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
