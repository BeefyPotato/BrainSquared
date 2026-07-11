import { NextResponse } from 'next/server';
import { getGraph, insertNodes, insertEdges, setNodeStatus, newId } from '@/lib/supabase';
import { runAuditor } from '@/lib/agents/auditor';
import type { KGNode } from '@/lib/types';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { nodeId, content, context, editor } = await req.json();
    if (!nodeId || !content || !editor) {
      return NextResponse.json({ ok: false, error: 'nodeId, content, editor required' }, { status: 400 });
    }
    const { nodes } = await getGraph();
    const old = nodes.find(n => n.id === nodeId);
    if (!old) return NextResponse.json({ ok: false, error: 'node not found' }, { status: 404 });
    if (old.status === 'superseded') {
      return NextResponse.json({ ok: false, error: 'cannot edit a superseded version' }, { status: 400 });
    }

    const newNodes: KGNode[] = [];
    let person = nodes.find(
      n => n.type === 'person' && n.label.toLowerCase() === String(editor).toLowerCase()
    );
    if (!person) {
      person = {
        id: newId('p'), type: 'person', label: editor, content: '', context: '',
        status: 'approved', author: null, source: null, team: null,
      };
      newNodes.push(person);
    }
    const revised: KGNode = {
      id: newId(old.type.slice(0, 2)), type: old.type, label: old.label,
      content, context: context ?? old.context, status: 'pending',
      author: editor, source: { kind: 'manual', name: `edit by ${editor}` }, team: person.team,
    };
    newNodes.push(revised);
    await insertNodes(newNodes);
    await insertEdges([
      { id: newId('e'), from_node: old.id, to_node: revised.id, type: 'superseded_by' },
      { id: newId('e'), from_node: revised.id, to_node: person.id, type: 'authored_by' },
    ]);
    await setNodeStatus(old.id, 'superseded');
    const a = await runAuditor([revised.id]);
    return NextResponse.json({ ok: true, createdNodeIds: [revised.id], log: a.log });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
