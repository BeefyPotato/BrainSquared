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

const TABS = ['Capture', 'Council Log', 'Start a task', 'Analytics'] as const;
type Tab = (typeof TABS)[number];

export default function Home() {
  const [graph, setGraph] = useState<{ nodes: KGNode[]; edges: KGEdge[] }>({ nodes: [], edges: [] });
  const [tab, setTab] = useState<Tab>('Capture');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [highlightIds, setHighlightIds] = useState<string[]>([]);

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
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refetch]);

  return (
    <main style={{ display: 'flex', height: '100vh' }}>
      <section style={{ flex: '3 1 0', position: 'relative', borderRight: '1px solid #1e293b' }}>
        <h1 style={{ position: 'absolute', zIndex: 10, padding: 12, fontSize: 18, color: '#94a3b8' }}>
          BrainSquared <span style={{ color: '#475569' }}>— Organizational AI Memory</span>
        </h1>
        <GraphView graph={graph} highlightIds={highlightIds} onNodeClick={setSelectedNodeId} />
        {selectedNodeId && (
          <NodeDrawer graph={graph} nodeId={selectedNodeId} onClose={() => setSelectedNodeId(null)} onJump={setSelectedNodeId} />
        )}
      </section>
      <section style={{ flex: '2 1 0', display: 'flex', flexDirection: 'column', minWidth: 380 }}>
        <nav style={{ display: 'flex', borderBottom: '1px solid #1e293b' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: 12, background: tab === t ? '#1e293b' : 'transparent',
              color: tab === t ? '#e2e8f0' : '#64748b', border: 'none', fontSize: 14,
            }}>{t}</button>
          ))}
        </nav>
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {tab === 'Capture' && <CapturePanel onDone={refetch} />}
          {tab === 'Council Log' && <CouncilLog graph={graph} onHighlight={setHighlightIds} />}
          {tab === 'Start a task' && <TaskPanel onHighlight={setHighlightIds} graph={graph} />}
          {tab === 'Analytics' && <AnalyticsPanel />}
        </div>
      </section>
    </main>
  );
}
