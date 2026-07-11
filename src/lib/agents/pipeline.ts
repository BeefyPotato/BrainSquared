import { runScribe } from './scribe';
import type { IngestInput, PipelineResult, CouncilLogEntry } from '../types';
import { getGraph } from '../supabase';
import { ASSET_TYPES } from '../types';

export async function runIngestPipeline(input: IngestInput): Promise<PipelineResult> {
  const log: CouncilLogEntry[] = [];
  let createdNodeIds: string[] = [];
  try {
    const s = await runScribe(input);
    createdNodeIds = s.createdNodeIds;
    log.push(...s.log);
    try {
      const { runCurator } = await import('./curator');
      log.push(...(await runCurator(createdNodeIds)).log);
    } catch { /* curator not built yet or failed — nodes stay pending, spec §4 */ }
    try {
      const { runAuditor } = await import('./auditor');
      log.push(...(await runAuditor(createdNodeIds)).log);
    } catch { /* auditor not built yet or failed — nodes stay pending */ }
    return { ok: true, createdNodeIds, log };
  } catch (e) {
    return { ok: false, createdNodeIds, log, error: String(e) };
  }
}

// Run Council button: audit sweep across all live assets.
// (Spec §4 deviation, deliberate: the sweep runs the Auditor only. Running the
// Curator over the whole graph risks surprise merges mid-demo; Curator runs on ingest.)
export async function runCouncilReview(): Promise<PipelineResult> {
  try {
    const { nodes } = await getGraph();
    const ids = nodes
      .filter(n => ASSET_TYPES.includes(n.type) && n.status !== 'superseded')
      .map(n => n.id);
    const { runAuditor } = await import('./auditor');
    const a = await runAuditor(ids);
    return { ok: true, createdNodeIds: [], log: a.log };
  } catch (e) {
    return { ok: false, createdNodeIds: [], log: [], error: String(e) };
  }
}
