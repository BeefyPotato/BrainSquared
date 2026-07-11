'use client';
import { useCallback, useEffect, useState } from 'react';
import type { KGNode, KGEdge } from '@/lib/types';
import { supabase, getGraph } from '@/lib/supabase';
import GraphView from '@/components/GraphView';
import NodeDrawer from '@/components/NodeDrawer';
import CapturePanel from '@/components/CapturePanel';
import CouncilLog from '@/components/CouncilLog';
import TaskPanel from '@/components/TaskPanel';
import AnalyticsPanel from '@/components/AnalyticsPanel';
import { IconInbox, IconScale, IconTarget, IconBarChart } from '@/components/icons';
import { color, font, radius, space } from '@/components/theme';

const TABS = [
  { id: 'Capture', label: 'Capture', icon: IconInbox },
  { id: 'Council Log', label: 'Council Log', icon: IconScale },
  { id: 'Start a task', label: 'Start a task', icon: IconTarget },
  { id: 'Analytics', label: 'Analytics', icon: IconBarChart },
] as const;
type Tab = (typeof TABS)[number]['id'];

const STATUS_LEGEND: { label: string; c: string }[] = [
  { label: 'Pending', c: color.pending },
  { label: 'Approved', c: color.approved },
  { label: 'Flagged', c: color.flagged },
  { label: 'Superseded', c: color.superseded },
];

export default function Home() {
  const [graph, setGraph] = useState<{ nodes: KGNode[]; edges: KGEdge[] }>({ nodes: [], edges: [] });
  const [tab, setTab] = useState<Tab>('Capture');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [highlightIds, setHighlightIds] = useState<string[]>([]);
  const [live, setLive] = useState(false);

  const refetch = useCallback(async () => {
    if (process.env.NEXT_PUBLIC_USE_FALLBACK === '1') {
      setGraph(await (await fetch('/fallback-snapshot.json')).json());
      return;
    }
    setGraph(await getGraph());
  }, []);

  useEffect(() => {
    refetch();
    if (process.env.NEXT_PUBLIC_USE_FALLBACK === '1') return;
    const ch = supabase
      .channel('kg')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'nodes' }, refetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'edges' }, refetch)
      .subscribe((status) => setLive(status === 'SUBSCRIBED'));
    return () => { supabase.removeChannel(ch); };
  }, [refetch]);

  return (
    <main style={{ display: 'flex', height: '100vh', fontFamily: font.family, background: color.bg }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 232,
          flex: '0 0 232px',
          display: 'flex',
          flexDirection: 'column',
          background: color.bgElevated,
          borderRight: `1px solid ${color.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '18px 16px', borderBottom: `1px solid ${color.border}` }}>
          <div
            style={{
              width: 34, height: 34, borderRadius: radius.md, flexShrink: 0,
              display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 13,
              color: '#052622', background: `linear-gradient(135deg, ${color.brand}, #34d6c4)`,
            }}
          >
            B²
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: color.text, lineHeight: 1.2 }}>BrainSquared</div>
            <div style={{ fontSize: 10, color: color.textFaint, lineHeight: 1.3 }}>Organizational AI Memory</div>
          </div>
        </div>

        <nav style={{ padding: space.sm, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: radius.sm, border: 'none',
                  textAlign: 'left', fontSize: 13, fontWeight: active ? 700 : 500,
                  background: active ? color.brandSoft : 'transparent',
                  color: active ? color.brandText : color.textMuted,
                  boxShadow: active ? `inset 2px 0 0 ${color.brand}` : 'none',
                  transition: 'background 150ms ease, color 150ms ease',
                }}
              >
                <Icon size={17} />
                {label}
              </button>
            );
          })}
        </nav>

        <div style={{ marginTop: 'auto', padding: space.lg, borderTop: `1px solid ${color.border}` }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: color.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Node status
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {STATUS_LEGEND.map((s) => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: color.textMuted }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.c, flexShrink: 0 }} />
                {s.label}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <header
          style={{
            height: 52, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 20px', borderBottom: `1px solid ${color.border}`, background: color.bgElevated,
          }}
        >
          <div style={{ fontSize: 12, color: color.textFaint }}>
            BrainSquared <span style={{ color: color.textMuted, margin: '0 6px' }}>/</span>
            <span style={{ color: color.text, fontWeight: 600 }}>{tab}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: color.textMuted }}>
              {graph.nodes.length} nodes · {graph.edges.length} edges
            </span>
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 700,
                padding: '4px 9px', borderRadius: radius.pill, color: live ? color.brandText : color.textFaint,
                background: live ? color.brandSoft : 'rgba(255,255,255,0.05)',
              }}
            >
              <span
                style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: live ? color.brand : color.textFaint,
                  boxShadow: live ? `0 0 0 3px ${color.brandSoft}` : 'none',
                }}
              />
              {live ? 'Live' : 'Connecting'}
            </span>
          </div>
        </header>

        <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
          <section style={{ flex: '3 1 0', minWidth: 0, position: 'relative' }}>
            <GraphView graph={graph} highlightIds={highlightIds} onNodeClick={setSelectedNodeId} />
            {selectedNodeId && (
              <NodeDrawer graph={graph} nodeId={selectedNodeId} onClose={() => setSelectedNodeId(null)} onJump={setSelectedNodeId} />
            )}
          </section>
          <section
            style={{
              flex: '2 1 0', minWidth: 380, maxWidth: 460, overflowY: 'auto',
              borderLeft: `1px solid ${color.border}`, background: color.bg, padding: space.xl,
            }}
          >
            {tab === 'Capture' && <CapturePanel onDone={refetch} />}
            {tab === 'Council Log' && <CouncilLog graph={graph} onHighlight={setHighlightIds} />}
            {tab === 'Start a task' && <TaskPanel onHighlight={setHighlightIds} graph={graph} />}
            {tab === 'Analytics' && <AnalyticsPanel />}
          </section>
        </div>
      </div>
    </main>
  );
}
