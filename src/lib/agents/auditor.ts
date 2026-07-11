import { llmJson, logAction } from './runner';
import { AUDITOR_SYSTEM } from './prompts';
import { getGraph, insertEdges, setNodeStatus, newId } from '../supabase';
import type { CouncilLogEntry } from '../types';

interface AuditorOut {
  verdicts: {
    node_id: string;
    verdict: 'approve' | 'flag';
    standard_id: string | null;
    reasoning: string;
  }[];
}

export async function runAuditor(targetIds: string[]): Promise<{ log: CouncilLogEntry[] }> {
  const { nodes } = await getGraph();
  const targets = nodes.filter(n => targetIds.includes(n.id) && n.status !== 'superseded');
  if (!targets.length) return { log: [] };
  const rules = nodes.filter(
    n => (n.type === 'standard' || n.type === 'decision') && n.status !== 'superseded'
  );
  const rulesList = rules.map(r => `${r.id} | ${r.type} | ${r.label} | ${r.content}`).join('\n');
  const targetList = targets
    .map(t => `${t.id} | ${t.type} | ${t.label} | ${t.content} | why: ${t.context.slice(0, 200)}`)
    .join('\n');

  const out = await llmJson<AuditorOut>(
    AUDITOR_SYSTEM,
    `CURRENT STANDARDS AND DECISIONS:\n${rulesList}\n\nNODES UNDER REVIEW:\n${targetList}`
  );

  const log: CouncilLogEntry[] = [];
  for (const v of out.verdicts) {
    if (!targets.some(t => t.id === v.node_id)) continue;
    await setNodeStatus(v.node_id, v.verdict === 'approve' ? 'approved' : 'flagged');
    const involved = [v.node_id];
    if (v.verdict === 'flag' && v.standard_id) {
      await insertEdges([{ id: newId('e'), from_node: v.node_id, to_node: v.standard_id, type: 'contradicts' }]);
      involved.push(v.standard_id);
    }
    const a = await logAction('auditor', v.verdict === 'approve' ? 'approved' : 'flagged', v.reasoning, involved);
    if (v.verdict === 'flag' && v.standard_id) {
      await insertEdges([{ id: newId('e'), from_node: a.id, to_node: v.standard_id, type: 'governs' }]);
    }
    log.push({ agent: 'auditor', actionNodeId: a.id, label: a.label, reasoning: v.reasoning, nodeIds: involved });
  }
  return { log };
}
