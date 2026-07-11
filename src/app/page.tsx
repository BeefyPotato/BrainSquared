'use client';
import { useCallback, useEffect, useState } from 'react';
import { ASSET_TYPES, type KGNode, type KGEdge } from '@/lib/types';
import { supabase, getGraph } from '@/lib/supabase';
import GraphView from '@/components/GraphView';
import NodeDrawer from '@/components/NodeDrawer';
import CapturePanel from '@/components/CapturePanel';
import CouncilLog from '@/components/CouncilLog';
import TaskPanel from '@/components/TaskPanel';
import AnalyticsPanel from '@/components/AnalyticsPanel';
import LibraryPanel from '@/components/LibraryPanel';
import ImpactPanel from '@/components/ImpactPanel';
import { IconInbox, IconScale, IconTarget, IconBarChart, IconBook, IconLink, IconStar } from '@/components/icons';
import { color, font, heroStyle, heroSubStyle, heroTitleStyle, pageStyle, radius } from '@/components/theme';

type Tab = 'Start a task' | 'Capture' | 'Council Log' | 'Library' | 'Analytics' | 'My Impact' | 'Company Memory';

const STATUS_LEGEND: { label: string; c: string }[] = [
  { label: 'Pending', c: color.pending },
  { label: 'Approved', c: color.approved },
  { label: 'Flagged', c: color.flagged },
  { label: 'Superseded', c: color.superseded },
];

export default function Home() {
  const [graph, setGraph] = useState<{ nodes: KGNode[]; edges: KGEdge[] }>({ nodes: [], edges: [] });
  const [tab, setTab] = useState<Tab>('Start a task');
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

  // Tracing knowledge jumps into the memory map so the highlight is visible.
  const highlightAndShow = useCallback((ids: string[]) => {
    setHighlightIds(ids);
    if (ids.length > 0) setTab('Company Memory');
  }, []);

  const openNode = useCallback((id: string) => {
    setSelectedNodeId(id);
    setTab('Company Memory');
  }, []);

  const councilCount = graph.nodes.filter(n => n.type === 'agent_action').length;
  const libraryCount = graph.nodes.filter(n => ASSET_TYPES.includes(n.type) && n.status !== 'superseded').length;

  const NAV_GROUPS: { label: string; items: { id: Tab; label: string; icon: typeof IconInbox; count?: number }[] }[] = [
    {
      label: 'Workspace',
      items: [
        { id: 'Start a task', label: 'Start a task', icon: IconTarget },
        { id: 'Capture', label: 'Capture', icon: IconInbox },
        { id: 'Council Log', label: 'Council Log', icon: IconScale, count: councilCount },
        { id: 'Library', label: 'Library', icon: IconBook, count: libraryCount },
        { id: 'Analytics', label: 'Analytics', icon: IconBarChart },
        { id: 'My Impact', label: 'My Impact', icon: IconStar },
      ],
    },
    {
      label: 'Explore',
      items: [{ id: 'Company Memory', label: 'Company Memory', icon: IconLink }],
    },
  ];

  return (
    <main style={{ display: 'flex', height: '100vh', fontFamily: font.family, background: color.bg }}>
      {/* Sidebar — dark teal shell per the mock */}
      <aside
        style={{
          width: 236,
          flex: '0 0 236px',
          display: 'flex',
          flexDirection: 'column',
          background: `radial-gradient(circle at 20% 0%, rgba(15,157,152,0.22), transparent 30%), ${color.shell}`,
          color: color.shellText,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '18px 16px', borderBottom: `1px solid ${color.shellBorder}` }}>
          <div
            style={{
              width: 36, height: 36, borderRadius: radius.md, flexShrink: 0,
              display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 14,
              color: '#052622', background: `linear-gradient(135deg, #35c6be, ${color.brand})`,
              boxShadow: '0 8px 20px rgba(15,157,152,0.28)',
            }}
          >
            B²
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>BrainSquared</div>
            <div style={{ fontSize: 11, color: color.shellTextMuted, lineHeight: 1.3 }}>Organizational AI Memory</div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px 16px' }}>
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <div
                style={{
                  margin: '14px 8px 6px', color: color.shellTextFaint, fontSize: 11,
                  fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em',
                }}
              >
                {group.label}
              </div>
              {group.items.map(({ id, label, icon: Icon, count }) => {
                const active = tab === id;
                return (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    aria-current={active ? 'page' : undefined}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                      padding: '10px 10px', borderRadius: radius.sm, border: 'none',
                      textAlign: 'left', fontSize: 13.5, fontWeight: active ? 700 : 500,
                      background: active
                        ? 'linear-gradient(90deg, rgba(15,157,152,0.30), rgba(15,157,152,0.08))'
                        : 'transparent',
                      color: active ? '#ffffff' : color.shellTextMuted,
                      boxShadow: active ? 'inset 3px 0 #2fd0c5' : 'none',
                      transition: 'background 150ms ease, color 150ms ease',
                      margin: '2px 0',
                    }}
                  >
                    <Icon size={17} style={{ flexShrink: 0, color: active ? '#5eead4' : color.shellTextFaint }} />
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                    {typeof count === 'number' && count > 0 && (
                      <span
                        style={{
                          fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: radius.pill,
                          background: 'rgba(255,255,255,0.10)', color: color.shellTextMuted,
                        }}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div style={{ borderTop: `1px solid ${color.shellBorder}`, padding: '14px 16px' }}>
          <div
            style={{
              fontSize: 11, fontWeight: 800, color: color.shellTextFaint,
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
            }}
          >
            Node status
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {STATUS_LEGEND.map((s) => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: color.shellTextMuted }}>
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
            height: 56, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 24px', borderBottom: `1px solid ${color.border}`, background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(14px)', zIndex: 10,
          }}
        >
          <div style={{ fontSize: 13, color: color.textFaint }}>
            BrainSquared <span style={{ color: color.borderStrong, margin: '0 6px' }}>/</span>
            <span style={{ color: color.text, fontWeight: 700 }}>{tab}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                fontSize: 12, color: color.textMuted, border: `1px solid ${color.border}`,
                borderRadius: radius.pill, padding: '5px 12px', background: color.surface,
              }}
            >
              {graph.nodes.length} nodes · {graph.edges.length} edges
            </span>
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700,
                padding: '5px 12px', borderRadius: radius.pill,
                color: live ? color.brandText : color.textFaint,
                background: live ? color.brandSoft : color.surface2,
                border: `1px solid ${live ? '#c4e9e5' : color.border}`,
              }}
            >
              <span
                style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: live ? color.brand : color.textFaint,
                  boxShadow: live ? `0 0 0 3px ${color.brandSoft}` : 'none',
                }}
              />
              {live ? 'Live' : 'Connecting'}
            </span>
          </div>
        </header>

        {tab === 'Company Memory' ? (
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: '24px 32px 24px' }}>
            <div style={{ ...heroStyle, marginBottom: 16 }}>
              <div>
                <h1 style={heroTitleStyle}>Company memory map</h1>
                <p style={heroSubStyle}>
                  Every asset, person, source and Council verdict — live. Click any node to see its content, why it works, and where it came from.
                </p>
              </div>
              {highlightIds.length > 0 && (
                <button
                  onClick={() => setHighlightIds([])}
                  style={{
                    border: `1px solid ${color.borderStrong}`, background: color.surface, borderRadius: radius.sm,
                    padding: '8px 14px', fontSize: 13, fontWeight: 600, color: color.text, fontFamily: font.family,
                  }}
                >
                  Clear highlight
                </button>
              )}
            </div>
            <section
              style={{
                flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden',
                border: `1px solid ${color.border}`, borderRadius: radius.lg,
                background: 'linear-gradient(#ffffff, #f8fbfa)', boxShadow: '0 1px 2px rgba(23,50,53,0.04)',
              }}
            >
              <GraphView graph={graph} highlightIds={highlightIds} onNodeClick={setSelectedNodeId} />
              {selectedNodeId && (
                <NodeDrawer graph={graph} nodeId={selectedNodeId} onClose={() => setSelectedNodeId(null)} onJump={setSelectedNodeId} />
              )}
            </section>
          </div>
        ) : (
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            <div style={pageStyle}>
              {tab === 'Start a task' && <TaskPanel onHighlight={highlightAndShow} graph={graph} />}
              {tab === 'Capture' && <CapturePanel onDone={refetch} />}
              {tab === 'Council Log' && <CouncilLog graph={graph} onHighlight={highlightAndShow} />}
              {tab === 'Library' && <LibraryPanel graph={graph} onSelect={openNode} />}
              {tab === 'Analytics' && <AnalyticsPanel />}
              {tab === 'My Impact' && <ImpactPanel />}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
