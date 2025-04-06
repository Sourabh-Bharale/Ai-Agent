import { tool } from 'ai';
import { z } from 'zod';

// Human in loop
const getLocalDateTime = tool({
  description: 'get the local date and time for current session',
  parameters: z.object({ location: z.string().optional() }),
  // no execution human intervention required
});

// // Human-in-the-loop
const getGitHubUserDetails = tool({
  description: 'Get GitHub user details',
  parameters: z.object({
    username: z.string().describe('GitHub username to fetch information for'),
    date: z.string().optional().describe('Optional date (YYYY-MM-DD) to check contributions for a specific date')
  }),
  // no execute function, we want human in the loop
});

export const getGitHubEvents = tool({
  description: 'Get GitHub events received by a specific user, Get comprehensive GitHub user activity including commits, PRs, issues, and comments for a specific user and date',
  parameters: z.object({
    username: z.string().describe('GitHub username to fetch events for'),
    from: z.string().describe('start date (YYYY-MM-DD) to check contributions for a specific date in ISO 8601 format'),
    to: z.string().describe('end date (YYYY-MM-DD) to check contributions for a specific date in ISO 8601 format')
  }),
});

export const tools = {
  getLocalDateTime,
  getGitHubUserDetails,
  // getGitHubUserActivity,
  getGitHubEvents
};


