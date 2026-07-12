import OpenAI from 'openai';
import { insertNodes, insertEdges, newId } from '../supabase';
import type { KGNode, KGEdge } from '../types';

// Created lazily: constructing without a key throws, and doing that at module
// load makes every importing API route fail with an HTML 500 instead of the
// route's own JSON error response.
let openai: OpenAI | null = null;
const MODEL = process.env.OPENAI_MODEL ?? 'gpt-4.1';

export async function llmJson<T>(system: string, user: string): Promise<T> {
  openai ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await openai.chat.completions.create({
        model: MODEL,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      });
      return JSON.parse(res.choices[0].message.content ?? '') as T;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

export async function logAction(
  agent: 'scribe' | 'curator' | 'auditor',
  action: string,
  reasoning: string,
  nodeIds: string[]
): Promise<KGNode> {
  const node: KGNode = {
    id: newId('act'), type: 'agent_action', label: `${agent}: ${action}`,
    content: reasoning, context: '', status: 'approved', author: agent,
    source: null, team: null,
  };
  await insertNodes([node]);
  const edges: KGEdge[] = nodeIds.map(t => ({
    id: newId('e'), from_node: node.id, to_node: t, type: 'reviewed_by',
  }));
  await insertEdges(edges);
  return node;
}
