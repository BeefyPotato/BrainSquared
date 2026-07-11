import { llmJson, logAction } from './runner';
import { CURATOR_SYSTEM } from './prompts';
import { getGraph, insertEdges, setNodeStatus, newId } from '../supabase';
import { ASSET_TYPES, type CouncilLogEntry } from '../types';

interface CuratorOut {
  actions: {
    action: 'merge' | 'link' | 'pass';
    node_id: string;
    target_id: string | null;
    edge_type: 'supports' | 'used_in' | null;
    reasoning: string;
  }[];
}

export async function runCurator(targetIds: string[]): Promise<{ log: CouncilLogEntry[] }> {
  const { nodes } = await getGraph();
  const targets = nodes.filter(n => targetIds.includes(n.id));
  if (!targets.length) return { log: [] };
  const index = nodes
    .filter(n => (ASSET_TYPES.includes(n.type) || n.type === 'project')
      && n.status !== 'superseded' && !targetIds.includes(n.id))
    .map(n => `${n.id} | ${n.type} | ${n.label} | ${n.content.slice(0, 150)}`)
    .join('\n');
  const newList = targets
    .map(n => `${n.id} | ${n.type} | ${n.label} | ${n.content.slice(0, 300)}`)
    .join('\n');

  const out = await llmJson<CuratorOut>(
    CURATOR_SYSTEM,
    `NEW NODES:\n${newList}\n\nEXISTING INDEX:\n${index}`
  );

  const log: CouncilLogEntry[] = [];
  for (const act of out.actions) {
    if (act.action === 'pass') continue;
    if (!act.target_id) continue;
    if (act.action === 'merge') {
      // Safety invariant: the Curator may only merge same-type duplicates.
      // Cross-type "supersedes" judgments belong to the Auditor (protects the memo-moment demo beat).
      const source = targets.find(n => n.id === act.node_id);
      const target = nodes.find(n => n.id === act.target_id);
      if (!source || !target || source.type !== target.type) continue;
      await setNodeStatus(act.target_id, 'superseded');
      await insertEdges([{ id: newId('e'), from_node: act.target_id, to_node: act.node_id, type: 'superseded_by' }]);
    } else if (act.action === 'link' && act.edge_type) {
      await insertEdges([{ id: newId('e'), from_node: act.node_id, to_node: act.target_id, type: act.edge_type }]);
    }
    const a = await logAction('curator', act.action, act.reasoning, [act.node_id, act.target_id]);
    log.push({ agent: 'curator', actionNodeId: a.id, label: a.label, reasoning: act.reasoning, nodeIds: [act.node_id, act.target_id] });
  }
  return { log };
}
