import { config } from 'dotenv';
config({ path: '.env.local' });
import { writeFileSync } from 'fs';

async function main() {
  const { getGraph } = await import('../src/lib/supabase');
  const g = await getGraph();
  writeFileSync('public/fallback-snapshot.json', JSON.stringify(g, null, 2));
  console.log(`Snapshot: ${g.nodes.length} nodes, ${g.edges.length} edges`);
}
main().catch((e) => { console.error(e); process.exit(1); });
