export type NodeType =
  | 'prompt' | 'workflow' | 'agent_config' | 'lesson' | 'decision' | 'standard'
  | 'person' | 'project' | 'source' | 'agent_action';
export type NodeStatus = 'pending' | 'approved' | 'flagged' | 'superseded';
export type EdgeType =
  | 'derived_from' | 'authored_by' | 'used_in' | 'supports'
  | 'contradicts' | 'superseded_by' | 'reviewed_by' | 'governs';
export type SourceKind =
  | 'claude_conversation' | 'chatgpt_export' | 'slack_thread' | 'config_file' | 'manual';

export const ASSET_TYPES: NodeType[] =
  ['prompt', 'workflow', 'agent_config', 'lesson', 'decision', 'standard'];

export interface KGNode {
  id: string;
  type: NodeType;
  label: string;
  content: string;
  context: string;
  status: NodeStatus;
  author: string | null;
  source: { kind: SourceKind; name: string } | null;
  team: string | null;
  created_at?: string;
}

export interface KGEdge {
  id: string;
  from_node: string;
  to_node: string;
  type: EdgeType;
  created_at?: string;
}

export interface IngestInput {
  text: string;
  uploader: string;
  sourceKind: SourceKind;
  sourceName: string;
}

export interface CouncilLogEntry {
  agent: 'scribe' | 'curator' | 'auditor';
  actionNodeId: string;
  label: string;
  reasoning: string;
  nodeIds: string[];
}

export interface PipelineResult {
  ok: boolean;
  createdNodeIds: string[];
  log: CouncilLogEntry[];
  error?: string;
}

export interface AnalyticsSummary {
  assetsByType: Record<string, number>;
  assetsByTeam: Record<string, number>;
  mergeCount: number;
  flagCount: number;
  gaps: string[];
}
