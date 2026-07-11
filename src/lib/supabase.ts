import { createClient } from '@supabase/supabase-js';
import type { KGNode, KGEdge, NodeStatus } from './types';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function getGraph(): Promise<{ nodes: KGNode[]; edges: KGEdge[] }> {
  const [n, e] = await Promise.all([
    supabase.from('nodes').select('*').order('created_at'),
    supabase.from('edges').select('*').order('created_at'),
  ]);
  if (n.error) throw n.error;
  if (e.error) throw e.error;
  return { nodes: n.data as KGNode[], edges: e.data as KGEdge[] };
}

export async function insertNodes(nodes: KGNode[]): Promise<void> {
  if (!nodes.length) return;
  const { error } = await supabase.from('nodes').insert(nodes);
  if (error) throw error;
}

export async function insertEdges(edges: KGEdge[]): Promise<void> {
  if (!edges.length) return;
  const { error } = await supabase.from('edges').insert(edges);
  if (error) throw error;
}

export async function setNodeStatus(id: string, status: NodeStatus): Promise<void> {
  const { error } = await supabase.from('nodes').update({ status }).eq('id', id);
  if (error) throw error;
}
