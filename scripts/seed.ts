import { config } from 'dotenv';
config({ path: '.env.local' });
import seed from '../data/seed.json';

async function main() {
  const { supabase } = await import('../src/lib/supabase');
  await supabase.from('edges').delete().neq('id', '');
  await supabase.from('nodes').delete().neq('id', '');
  const { error: nErr } = await supabase.from('nodes').insert(seed.nodes);
  if (nErr) throw nErr;
  const { error: eErr } = await supabase.from('edges').insert(seed.edges);
  if (eErr) throw eErr;
  console.log(`Seeded ${seed.nodes.length} nodes, ${seed.edges.length} edges`);
}
main().catch((e) => { console.error(e); process.exit(1); });
