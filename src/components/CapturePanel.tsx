'use client';
import { useState } from 'react';
import type { SourceKind, PipelineResult } from '@/lib/types';

const KINDS: { v: SourceKind; l: string }[] = [
  { v: 'claude_conversation', l: 'Claude conversation' },
  { v: 'chatgpt_export', l: 'ChatGPT export' },
  { v: 'slack_thread', l: 'Slack thread' },
  { v: 'config_file', l: 'Agent config file' },
  { v: 'manual', l: 'Notes / other' },
];

export default function CapturePanel({ onDone }: { onDone: () => void }) {
  const [text, setText] = useState('');
  const [uploader, setUploader] = useState('');
  const [kind, setKind] = useState<SourceKind>('claude_conversation');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PipelineResult | null>(null);

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

  const inputStyle = { width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#e2e8f0', padding: 8, fontSize: 13, marginBottom: 8 };
  return (
    <div>
      <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>
        Drop in the exhaust of AI work — conversations, threads, configs. The Scribe distills it into memory.
      </p>
      <input style={inputStyle} placeholder="Your name" value={uploader} onChange={e => setUploader(e.target.value)} />
      <select style={inputStyle} value={kind} onChange={e => setKind(e.target.value as SourceKind)}>
        {KINDS.map(k => <option key={k.v} value={k.v}>{k.l}</option>)}
      </select>
      <textarea style={{ ...inputStyle, height: 180 }} placeholder="Paste raw text…" value={text} onChange={e => setText(e.target.value)} />
      <input type="file" accept=".txt,.md,.json" onChange={e => onFile(e.target.files?.[0])} style={{ fontSize: 12, marginBottom: 8, color: '#94a3b8' }} />
      <button onClick={submit} disabled={busy} style={{
        width: '100%', padding: 10, background: busy ? '#334155' : '#4f46e5', color: 'white',
        border: 'none', borderRadius: 6, fontSize: 14,
      }}>{busy ? 'The Council is reviewing…' : 'Capture into memory'}</button>
      {result && (
        <div style={{ marginTop: 12, fontSize: 12, color: result.ok ? '#22c55e' : '#ef4444' }}>
          {result.ok
            ? `Captured ${result.createdNodeIds.length} assets · ${result.log.length} council actions — see Council Log`
            : `Capture landed as pending — council will review (${result.error ?? 'agent error'})`}
        </div>
      )}
    </div>
  );
}
