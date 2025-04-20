import type { ToolSet } from 'ai';
import { getGitHubToolSets } from './mcp/github_mcp_server';
import { coreTools } from './core-tools'; // Use the separated core tools

/**
 * Asynchronously fetches GitHub tool sets and combines them with the core tools.
 * The fetched GitHub tools will retain their original 'execute' functions.
 * This function should ONLY be called in a Node.js environment (e.g., API routes).
 */
export async function getAllTools(): Promise<ToolSet> {
  let githubTools: ToolSet = {};
  try {
    githubTools = await getGitHubToolSets();
    console.log("Fetched GitHub Tools:", Object.keys(githubTools));
  } catch (error) {
    console.error("Failed to get GitHub tool sets, proceeding with core tools only:", error);
    return coreTools; // Fallback to only core tools
  }

  // Combine core tools with the fetched GitHub tools (WITHOUT stripping execute)
  const combinedTools = {
    ...coreTools,
    ...(githubTools && typeof githubTools === 'object' ? githubTools : {}),
  };

  console.log("Combined Tools:", Object.keys(combinedTools));
  return combinedTools;
}