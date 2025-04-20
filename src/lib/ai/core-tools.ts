import { tool, type ToolSet } from 'ai';
import { z } from 'zod';

// Define core tools here, independent of MCP server logic

const getLocalDateTime = tool({
  description: 'get the local date and time for current session',
  parameters: z.object({ location: z.string().optional() }),
  // no execution function, handled by processToolCalls actions or human loop
});

const getGitHubEvents = tool({
  description: 'Get GitHub events for a user within a date range (handled via confirmation)',
  parameters: z.object({
    username: z.string().describe('GitHub username'),
    from: z.string().describe('Start date (YYYY-MM-DD)'),
    to: z.string().describe('End date (YYYY-MM-DD)')
  }),
  // no execution function, handled by processToolCalls actions or human loop
});

// Export the core set of tools defined in this file
export const coreTools: ToolSet = {
  getLocalDateTime,
  getGitHubEvents,
  // Add any other purely client-safe/core tools here
};