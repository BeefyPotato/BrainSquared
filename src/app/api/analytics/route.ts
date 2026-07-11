import { NextResponse } from 'next/server';
import { getGraph } from '@/lib/supabase';
import { ASSET_TYPES, type AnalyticsSummary } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { nodes } = await getGraph();
    const assets = nodes.filter(n => ASSET_TYPES.includes(n.type) && n.status !== 'superseded');
    const assetsByType: Record<string, number> = {};
    const assetsByTeam: Record<string, number> = {};
    for (const a of assets) {
      assetsByType[a.type] = (assetsByType[a.type] ?? 0) + 1;
      if (a.team) assetsByTeam[a.team] = (assetsByTeam[a.team] ?? 0) + 1;
    }
    const actions = nodes.filter(n => n.type === 'agent_action');
    const mergeCount = actions.filter(n => n.label.startsWith('curator: merge')).length;
    const flagCount = actions.filter(n => n.label.startsWith('auditor: flagged')).length;
    const teams = [...new Set(nodes.filter(n => n.team).map(n => n.team as string))];
    const gaps: string[] = [];
    for (const team of teams) {
      for (const t of ['prompt', 'workflow', 'lesson'] as const) {
        if (!assets.some(a => a.team === team && a.type === t)) {
          gaps.push(`${team} team has no ${t}s in the memory`);
        }
      }
    }
    const summary: AnalyticsSummary = { assetsByType, assetsByTeam, mergeCount, flagCount, gaps };
    return NextResponse.json(summary);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
