'use client';
import { useRef, useState } from 'react';
import type { SourceKind, PipelineResult } from '@/lib/types';
import { IconMessage, IconHash, IconFileText, IconNote, IconUpload, IconSpinner, IconCheck, IconAlertTriangle } from '@/components/icons';
import { color, font, inputStyle, primaryButtonStyle, radius, space } from '@/components/theme';

const KINDS: { v: SourceKind; l: string; hint: string; icon: typeof IconMessage }[] = [
  { v: 'claude_conversation', l: 'Claude conversation', hint: 'Exported chat', icon: IconMessage },
  { v: 'chatgpt_export', l: 'ChatGPT export', hint: 'Exported chat', icon: IconMessage },
  { v: 'slack_thread', l: 'Slack thread', hint: 'Decision / lesson', icon: IconHash },
  { v: 'config_file', l: 'Agent config', hint: 'Workflow / settings', icon: IconFileText },
  { v: 'manual', l: 'Notes / other', hint: 'Free text', icon: IconNote },
];

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
      <h1 style={{ fontSize: 16, fontWeight: 700, color: color.text, margin: '0 0 6px' }}>Capture knowledge</h1>
      <p style={{ fontSize: 12, color: color.textMuted, lineHeight: 1.5, margin: '0 0 16px' }}>
        Drop in the exhaust of AI work — conversations, threads, configs. The Scribe distills it into memory.
      </p>

      <label style={{ fontSize: 11, fontWeight: 600, color: color.textFaint, display: 'block', marginBottom: 6 }}>Your name</label>
      <input style={{ ...inputStyle, marginBottom: space.lg }} placeholder="e.g. Sarah Chen" value={uploader} onChange={e => setUploader(e.target.value)} />

      <label style={{ fontSize: 11, fontWeight: 600, color: color.textFaint, display: 'block', marginBottom: 6 }}>Source type</label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: space.lg }}>
        {KINDS.map(({ v, l, hint, icon: Icon }) => {
          const selected = kind === v;
          return (
            <button
              key={v}
              onClick={() => setKind(v)}
              style={{
                display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start',
                padding: '10px 11px', borderRadius: radius.md, textAlign: 'left',
                background: selected ? color.brandSoft : color.surface2,
                border: `1px solid ${selected ? color.brand : color.border}`,
                color: color.text, fontFamily: font.family,
              }}
            >
              <Icon size={16} style={{ color: selected ? color.brandText : color.textMuted }} />
              <span style={{ fontSize: 12, fontWeight: 600 }}>{l}</span>
              <span style={{ fontSize: 10, color: color.textFaint }}>{hint}</span>
            </button>
          );
        })}
      </div>

      <label style={{ fontSize: 11, fontWeight: 600, color: color.textFaint, display: 'block', marginBottom: 6 }}>Raw text</label>
      <textarea
        style={{ ...inputStyle, height: 160, resize: 'vertical', marginBottom: 8, lineHeight: 1.5 }}
        placeholder="Paste raw text…"
        value={text}
        onChange={e => setText(e.target.value)}
      />

      <input ref={fileRef} type="file" accept=".txt,.md,.json" onChange={e => onFile(e.target.files?.[0])} style={{ display: 'none' }} />
      <button
        onClick={() => fileRef.current?.click()}
        style={{
          display: 'flex', alignItems: 'center', gap: 7, background: 'transparent', border: 'none',
          color: color.textMuted, fontSize: 11, fontFamily: font.family, padding: '4px 0', marginBottom: space.lg,
        }}
      >
        <IconUpload size={13} /> Upload a file instead
      </button>

      <button onClick={submit} disabled={busy} style={{ ...primaryButtonStyle(busy), width: '100%' }}>
        {busy && <IconSpinner size={14} />}
        {busy ? 'The Council is reviewing…' : 'Capture into memory'}
      </button>

      {result && (
        <div
          style={{
            display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: space.md, padding: '10px 12px',
            borderRadius: radius.sm, fontSize: 12, lineHeight: 1.5,
            background: result.ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            color: result.ok ? color.approved : color.flagged,
          }}
        >
          {result.ok ? <IconCheck size={14} style={{ flexShrink: 0, marginTop: 1 }} /> : <IconAlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />}
          <span>
            {result.ok
              ? `Captured ${result.createdNodeIds.length} assets · ${result.log.length} council actions — see Council Log`
              : `Capture landed as pending — council will review (${result.error ?? 'agent error'})`}
          </span>
        </div>
      )}
    </div>
  );
}
