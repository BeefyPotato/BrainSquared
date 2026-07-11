'use client';
import { useState } from 'react';
import type { KGNode, KGEdge } from '@/lib/types';
import { IconArrowUpRight, IconSpinner, IconTarget } from '@/components/icons';
import { color, font, primaryButtonStyle, radius, sectionLabelStyle, space, statusSoft, statusText, tagStyle } from '@/components/theme';

const QUICK_TASKS = [
  'Market-entry study for a retail client',
  'Due diligence on an acquisition target',
  'Plan a new client onboarding',
];

type TaskResult = { answer: string; nodeIds: string[] };

// The panel unmounts whenever the user traces a result into the graph (the tab
// switches to Company Memory), so the last session lives here to survive that.
let cachedSession: { desc: string; res: TaskResult } | null = null;

export default function TaskPanel({ graph, onHighlight }: {
  graph: { nodes: KGNode[]; edges: KGEdge[] };
  onHighlight: (ids: string[]) => void;
}) {
  const [desc, setDesc] = useState(cachedSession?.desc ?? '');
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<TaskResult | null>(cachedSession?.res ?? null);

  async function go() {
    if (!desc.trim() || busy) return;
    setBusy(true); setRes(null);
    try {
      const r = await fetch('/api/task', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: desc }),
      });
      const json = await r.json();
      if (json.ok) {
        setRes(json);
        cachedSession = { desc, res: json };
      }
    } finally { setBusy(false); }
  }

  function trace(id: string) {
    const around = graph.edges
      .filter(e => e.from_node === id || e.to_node === id)
      .flatMap(e => [e.from_node, e.to_node]);
    onHighlight([id, ...around]);
  }

  return (
    <div style={{ fontFamily: font.family }}>
      {/* Welcome hero — dark teal shell panel from the mock */}
      <section
        style={{
          borderRadius: radius.xl,
          padding: '28px 28px 24px',
          background: `radial-gradient(circle at 85% 0%, rgba(15,157,152,0.30), transparent 40%), linear-gradient(135deg, ${color.shell}, ${color.shell2})`,
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 24px 70px rgba(13,36,38,0.18)',
        }}
      >
        <span
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '5px 11px', borderRadius: radius.pill,
            background: 'rgba(255,255,255,0.10)', color: '#d9f6f2',
            fontSize: 12, fontWeight: 700,
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2fd0c5' }} />
          Company memory is ready
        </span>
        <h1 style={{ fontSize: 28, maxWidth: 640, margin: '14px 0 8px', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
          What are you working on today?
        </h1>
        <p style={{ color: '#cdeeea', maxWidth: 620, margin: 0, fontSize: 14, lineHeight: 1.55 }}>
          Describe the task, and the memory surfaces the prompts, workflows and lessons the firm has
          already proven — each with why-context and where it came from.
        </p>

        <div
          style={{
            marginTop: 20, display: 'flex', gap: 8, alignItems: 'center',
            background: '#ffffff', borderRadius: radius.md,
            padding: '8px 8px 8px 16px', boxShadow: '0 13px 30px rgba(0,0,0,0.18)',
          }}
        >
          <input
            aria-label="Describe your task"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') go(); }}
            placeholder="e.g. starting a market-entry study for a retail client"
            style={{ flex: 1, border: 0, outline: 0, background: 'transparent', color: color.text, fontSize: 14, minWidth: 0 }}
          />
          <button onClick={go} disabled={busy} style={{ ...primaryButtonStyle(busy), flexShrink: 0 }}>
            {busy ? <IconSpinner size={14} /> : <IconTarget size={15} />}
            {busy ? 'Searching…' : 'Find prior work'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          {QUICK_TASKS.map(q => (
            <button
              key={q}
              onClick={() => setDesc(q)}
              style={{
                border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(255,255,255,0.09)',
                color: '#d9f6f2', borderRadius: radius.pill, padding: '7px 12px',
                fontSize: 12, fontWeight: 600, fontFamily: font.family,
                transition: 'background 150ms ease',
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </section>

      {res && (
        <section style={{ marginTop: space.xxl }}>
          <div style={sectionLabelStyle}>What the memory found</div>
          <div
            style={{
              background: color.surface, border: `1px solid ${color.border}`, borderRadius: radius.lg,
              padding: '16px 18px', marginBottom: space.md, boxShadow: '0 1px 2px rgba(23,50,53,0.04)',
            }}
          >
            <p style={{ fontSize: 14, color: color.text, lineHeight: 1.6, margin: 0 }}>{res.answer}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
            {res.nodeIds.map(id => {
              const n = graph.nodes.find(x => x.id === id);
              if (!n) return null;
              return (
                <div
                  key={id}
                  style={{
                    padding: 16, background: color.surface, border: `1px solid ${color.border}`,
                    borderRadius: radius.lg, boxShadow: '0 1px 2px rgba(23,50,53,0.04)',
                    display: 'flex', flexDirection: 'column', gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={tagStyle(color.brandSoft, color.brandText)}>{n.type.replace('_', ' ')}</span>
                    <span style={tagStyle(statusSoft[n.status] ?? color.surface2, statusText[n.status] ?? color.textMuted)}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color[n.status] }} />
                      {n.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: color.text, lineHeight: 1.35 }}>{n.label}</div>
                  {n.content && (
                    <div
                      style={{
                        fontSize: 12.5, color: color.text, lineHeight: 1.55, whiteSpace: 'pre-wrap',
                        background: color.surface2, border: `1px solid ${color.border}`,
                        borderRadius: radius.sm, padding: '10px 12px',
                        maxHeight: 170, overflowY: 'auto',
                      }}
                    >
                      {n.content}
                    </div>
                  )}
                  {n.context && (
                    <div style={{ fontSize: 12.5, color: color.textMuted, lineHeight: 1.55, flex: 1 }}>
                      <span style={{ fontWeight: 700, color: color.brandText }}>Why it works: </span>
                      {n.context}
                    </div>
                  )}
                  <button
                    onClick={() => trace(id)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
                      fontSize: 12.5, fontWeight: 700, background: 'transparent',
                      border: `1px solid ${color.brandDark}`, color: color.brandText,
                      borderRadius: radius.sm, padding: '7px 12px', fontFamily: font.family,
                    }}
                  >
                    <IconArrowUpRight size={12} /> Trace in graph
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
