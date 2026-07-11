import { config } from 'dotenv';
config({ path: '.env.local' });
import { readFileSync } from 'fs';

async function main() {
  const { getGraph } = await import('../src/lib/supabase');
  const { runIngestPipeline } = await import('../src/lib/agents/pipeline');
  const before = await getGraph();
  const text = readFileSync('data/fixtures/claude-conversation.txt', 'utf8');
  const result = await runIngestPipeline({
    text, uploader: 'Sarah Chen', sourceKind: 'claude_conversation',
    sourceName: 'smoke-test-conversation',
  });
  const after = await getGraph();
  const newAssets = result.createdNodeIds.length;
  const newActions = after.nodes.filter(n => n.type === 'agent_action').length
    - before.nodes.filter(n => n.type === 'agent_action').length;
  console.log(`assets created: ${newAssets}, agent actions logged: ${newActions}, log entries: ${result.log.length}`);
  if (!result.ok) throw new Error('pipeline reported not ok');
  if (newAssets < 1) throw new Error('scribe extracted nothing');
  if (newActions < 2) throw new Error('council did not log actions');
  console.log('SMOKE PASS');
}
main().catch((e) => { console.error('SMOKE FAIL:', e); process.exit(1); });
