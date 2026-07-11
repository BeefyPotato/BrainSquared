import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const BASE_URL = process.env.BRAINSQUARED_URL ?? 'http://localhost:3000';

const server = new McpServer({ name: 'brainsquared', version: '0.1.0' });

server.registerTool(
  'save_to_org_memory',
  {
    description:
      'Save valuable AI knowledge from this conversation (refined prompts, workflows, agent configs, lessons learned, decisions) into the organization\'s shared memory graph, where the Agent Council will review and organize it. Use when the user asks to save, remember, or share what was learned.',
    inputSchema: {
      conversation_text: z
        .string()
        .describe('The relevant conversation content or knowledge worth preserving, verbatim'),
      uploader: z.string().describe('The name of the person saving this knowledge'),
    },
  },
  async ({ conversation_text, uploader }) => {
    const res = await fetch(`${BASE_URL}/api/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: conversation_text,
        uploader,
        sourceKind: 'claude_conversation',
        sourceName: `MCP capture by ${uploader}`,
      }),
    });
    const json = await res.json();
    return {
      content: [{
        type: 'text' as const,
        text: json.ok
          ? `Saved ${json.createdNodeIds.length} knowledge assets to org memory. The Agent Council (Scribe, Curator, Auditor) is reviewing them now — watch them appear on the graph.`
          : `Could not save to org memory: ${json.error}`,
      }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('BrainSquared MCP server running (stdio)');
