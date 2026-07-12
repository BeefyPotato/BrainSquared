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
    const fail = (text: string) => ({ content: [{ type: 'text' as const, text }], isError: true });
    let res: Response;
    try {
      res = await fetch(`${BASE_URL}/api/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: conversation_text,
          uploader,
          sourceKind: 'claude_conversation',
          sourceName: `MCP capture by ${uploader}`,
        }),
      });
    } catch (e) {
      return fail(`Could not reach BrainSquared at ${BASE_URL} (${e}). Start the app with \`npm run dev\`, or point BRAINSQUARED_URL at where it runs.`);
    }
    if (!(res.headers.get('content-type') ?? '').includes('application/json')) {
      return fail(`BrainSquared at ${BASE_URL} answered ${res.status} without JSON — the app is up but likely misconfigured (check OPENAI_API_KEY and Supabase vars in .env.local).`);
    }
    const json = await res.json();
    if (!json.ok) return fail(`Could not save to org memory: ${json.error}`);
    return {
      content: [{
        type: 'text' as const,
        text: `Saved ${json.createdNodeIds.length} knowledge assets to org memory. The Agent Council (Scribe, Curator, Auditor) is reviewing them now — watch them appear on the graph.`,
      }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('BrainSquared MCP server running (stdio)');
}
main().catch((e) => { console.error(e); process.exit(1); });
