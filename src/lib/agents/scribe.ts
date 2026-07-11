import { llmJson, logAction } from './runner';
import { SCRIBE_SYSTEM } from './prompts';
import { getGraph, insertNodes, insertEdges, newId } from '../supabase';
import type { IngestInput, KGNode, KGEdge, CouncilLogEntry, NodeType } from '../types';

interface ScribeOut {
  assets: { type: NodeType; label: string; content: string; context: string }[];
  summary: string;
}

export async function runScribe(
  input: IngestInput
): Promise<{ createdNodeIds: string[]; log: CouncilLogEntry[] }> {
  const out = await llmJson<ScribeOut>(
    SCRIBE_SYSTEM,
    `UPLOADER: ${input.uploader}\nSOURCE KIND: ${input.sourceKind}\n\nRAW TEXT:\n${input.text}`
  );
  const { nodes: existing } = await getGraph();
  const nodes: KGNode[] = [];
  const edges: KGEdge[] = [];

  const sourceNode: KGNode = {
    id: newId('src'), type: 'source', label: input.sourceName, content: input.text,
    context: '', status: 'approved', author: input.uploader,
    source: { kind: input.sourceKind, name: input.sourceName }, team: null,
  };
  nodes.push(sourceNode);

  let person = existing.find(
    n => n.type === 'person' && n.label.toLowerCase() === input.uploader.toLowerCase()
  );
  if (!person) {
    person = {
      id: newId('p'), type: 'person', label: input.uploader, content: '', context: '',
      status: 'approved', author: null, source: null, team: null,
    };
    nodes.push(person);
  }

  const assetIds: string[] = [];
  for (const a of out.assets) {
    const n: KGNode = {
      id: newId(a.type.slice(0, 2)), type: a.type, label: a.label,
      content: a.content, context: a.context, status: 'pending',
      author: input.uploader, source: { kind: input.sourceKind, name: input.sourceName },
      team: person.team,
    };
    nodes.push(n);
    assetIds.push(n.id);
    edges.push({ id: newId('e'), from_node: n.id, to_node: sourceNode.id, type: 'derived_from' });
    edges.push({ id: newId('e'), from_node: n.id, to_node: person.id, type: 'authored_by' });
  }

  await insertNodes(nodes);
  await insertEdges(edges);
  const action = await logAction('scribe', `captured ${assetIds.length} assets`, out.summary, assetIds);
  return {
    createdNodeIds: assetIds,
    log: [{ agent: 'scribe', actionNodeId: action.id, label: action.label, reasoning: out.summary, nodeIds: assetIds }],
  };
}
