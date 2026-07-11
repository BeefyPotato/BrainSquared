import { NextResponse } from 'next/server';
import { llmJson } from '@/lib/agents/runner';
import { RECOMMENDER_SYSTEM } from '@/lib/agents/prompts';
import { getGraph } from '@/lib/supabase';
import { ASSET_TYPES } from '@/lib/types';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { description } = await req.json();
    if (!description) return NextResponse.json({ ok: false, error: 'description required' }, { status: 400 });
    const { nodes } = await getGraph();
    const index = nodes
      .filter(n => ASSET_TYPES.includes(n.type) && n.status === 'approved')
      .map(n => `${n.id} | ${n.type} | ${n.label} | ${n.content.slice(0, 150)} | why: ${n.context.slice(0, 100)}`)
      .join('\n');
    const out = await llmJson<{ node_ids: string[]; answer: string }>(
      RECOMMENDER_SYSTEM,
      `TASK: ${description}\n\nAPPROVED ASSETS:\n${index}`
    );
    return NextResponse.json({ ok: true, answer: out.answer, nodeIds: out.node_ids });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
