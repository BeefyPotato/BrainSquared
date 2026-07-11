'use client';
import { useEffect, useState } from 'react';
import { ASSET_TYPES, type KGNode, type KGEdge } from '@/lib/types';
import { IconClose, IconArrowUpRight, IconEdit, IconSave, IconSpinner } from '@/components/icons';
import { color, font, inputStyle, primaryButtonStyle, radius, secondaryButtonStyle, shadow, space, statusSoft, tagStyle } from '@/components/theme';

const EDGE_LABELS: Record<string, string> = {
  derived_from: 'Derived from', authored_by: 'Authored by', used_in: 'Used in',
  supports: 'Supports', contradicts: 'Contradicts', superseded_by: 'Superseded by',
  reviewed_by: 'Reviewed', governs: 'Cites standard',
};

const STATUS_FG: Record<string, string> = {
  pending: color.pending, approved: color.approved, flagged: color.flagged, superseded: color.superseded,
};

export default function NodeDrawer({ graph, nodeId, onClose, onJump }: {
  graph: { nodes: KGNode[]; edges: KGEdge[] };
  nodeId: string;
  onClose: () => void;
  onJump: (id: string) => void;
}) {
  const node = graph.nodes.find(n => n.id === nodeId);
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState('');
  const [context, setContext] = useState('');
  const [editor, setEditor] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setEditing(false);
    setContent(node?.content ?? '');
    setContext(node?.context ?? '');
  }, [nodeId, node?.content, node?.context]);

  if (!node) return null;
  const editable = ASSET_TYPES.includes(node.type) && node.status !== 'superseded';
  const related = graph.edges
    .filter(e => e.from_node === nodeId || e.to_node === nodeId)
    .map(e => {
      const otherId = e.from_node === nodeId ? e.to_node : e.from_node;
      const other = graph.nodes.find(n => n.id === otherId);
      const dir = e.from_node === nodeId ? '→' : '←';
      return other ? { edge: e, other, dir } : null;
    })
    .filter(Boolean) as { edge: KGEdge; other: KGNode; dir: string }[];

  async function save() {
    if (!content.trim() || !editor.trim()) return;
    setBusy(true);
    try {
      const res = await fetch('/api/edit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId, content, context, editor }),
      });
      const json = await res.json();
      if (json.ok && json.createdNodeIds?.[0]) {
        setEditing(false);
        onJump(json.createdNodeIds[0]);
      }
    } finally { setBusy(false); }
  }

  return (
    <aside
      style={{
        position: 'absolute', right: 16, top: 16, bottom: 16, width: 360, zIndex: 20,
        background: color.surface, border: `1px solid ${color.border}`, borderRadius: radius.lg,
        boxShadow: shadow.lg, padding: space.xl, overflowY: 'auto', fontFamily: font.family,
      }}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        style={{
          float: 'right', background: 'transparent', border: 'none', color: color.textFaint,
          width: 28, height: 28, borderRadius: radius.sm, display: 'grid', placeItems: 'center',
        }}
      >
        <IconClose size={16} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: color.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {node.type.replace('_', ' ')}
        </span>
        <span style={tagStyle(statusSoft[node.status] ?? 'rgba(255,255,255,0.08)', STATUS_FG[node.status] ?? color.textMuted)}>
          {node.status}
        </span>
      </div>

      <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 16px', color: color.text, lineHeight: 1.3 }}>{node.label}</h2>

      {editing ? (
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: color.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
            Content
          </label>
          <textarea
            style={{ ...inputStyle, height: 120, resize: 'vertical', marginBottom: 12, lineHeight: 1.5 }}
            value={content}
            onChange={e => setContent(e.target.value)}
          />
          <label style={{ fontSize: 10, fontWeight: 700, color: color.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
            Why (context)
          </label>
          <textarea
            style={{ ...inputStyle, height: 70, resize: 'vertical', marginBottom: 12, lineHeight: 1.5 }}
            value={context}
            onChange={e => setContext(e.target.value)}
          />
          <label style={{ fontSize: 10, fontWeight: 700, color: color.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
            Your name
          </label>
          <input style={{ ...inputStyle, marginBottom: 12 }} placeholder="Your name" value={editor} onChange={e => setEditor(e.target.value)} />

          <button onClick={save} disabled={busy} style={{ ...primaryButtonStyle(busy), width: '100%', marginBottom: 8 }}>
            {busy ? <IconSpinner size={13} /> : <IconSave size={13} />}
            {busy ? 'Saving — Auditor reviewing…' : 'Save as new version'}
          </button>
          <button onClick={() => setEditing(false)} style={{ ...secondaryButtonStyle, width: '100%' }}>Cancel</button>
          <p style={{ fontSize: 10.5, color: color.textFaint, lineHeight: 1.5, marginTop: 8 }}>
            Saving creates a new version. The old one stays viewable, and the Auditor reviews your change against firm standards.
          </p>
        </div>
      ) : (
        <>
          {node.content && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: color.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Content</div>
              <p style={{ fontSize: 13, whiteSpace: 'pre-wrap', margin: 0, color: color.text, lineHeight: 1.55 }}>{node.content}</p>
            </div>
          )}

          {node.context && (
            <div style={{ marginBottom: 16, borderLeft: `2px solid ${color.brand}`, background: color.brandSoft, borderRadius: `0 ${radius.sm}px ${radius.sm}px 0`, padding: '10px 12px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: color.brandText, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Why it works</div>
              <p style={{ fontSize: 13, whiteSpace: 'pre-wrap', margin: 0, color: color.text, lineHeight: 1.55 }}>{node.context}</p>
            </div>
          )}

          {node.author && (
            <p style={{ fontSize: 11, color: color.textMuted, marginBottom: 12 }}>
              By {node.author}{node.source ? ` · from ${node.source.name}` : ''}
            </p>
          )}

          {editable && (
            <button
              onClick={() => setEditing(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16,
                padding: '6px 12px', background: 'transparent', border: `1px solid ${color.brand}`,
                borderRadius: radius.sm, color: color.brandText, fontSize: 11.5, fontWeight: 600, fontFamily: font.family,
              }}
            >
              <IconEdit size={12} /> Edit (creates new version)
            </button>
          )}
        </>
      )}

      {related.length > 0 && (
        <>
          <div style={{ fontSize: 10, fontWeight: 700, color: color.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Provenance &amp; connections
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {related.map(({ edge, other, dir }) => (
              <button
                key={edge.id}
                onClick={() => onJump(other.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
                  padding: '9px 10px', background: color.surface2, border: `1px solid ${color.border}`,
                  borderRadius: radius.sm, color: color.text, fontSize: 12, fontFamily: font.family,
                }}
              >
                <IconArrowUpRight size={13} style={{ color: color.brandText, flexShrink: 0 }} />
                <span style={{ color: color.brandText, fontWeight: 600 }}>{EDGE_LABELS[edge.type] ?? edge.type}</span>
                <span style={{ color: color.textFaint }}>{dir}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{other.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </aside>
  );
}
