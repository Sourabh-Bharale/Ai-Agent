import type { ToolSet } from 'ai';
import { getGitHubToolSets } from './mcp/github_mcp_server';
import { getFileSystemToolSets } from './mcp/file_system_mcp_server';
import { coreTools } from './core-tools'; // Use the separated core tools

// Define a list of MCP tool providers (functions that return Promise<ToolSet>)
const mcpToolProviders: (() => Promise<ToolSet>)[] = [
  getGitHubToolSets,
  getFileSystemToolSets,
  // Add more MCP tool provider functions here in the future
];

/**
 * Asynchronously fetches tool sets from all registered MCP providers
 * and combines them with the core tools.
 * The fetched tools will retain their original 'execute' functions.
 * This function should ONLY be called in a Node.js environment (e.g., API routes).
 */
export async function getAllTools(): Promise<ToolSet> {
  let combinedMcpTools: ToolSet = {};

  // Iterate over each provider, fetch tools, and merge them
  for (const provider of mcpToolProviders) {
    try {
      const tools = await provider();
      if (tools && typeof tools === 'object') {
        console.log(`Fetched tools from ${provider.name}:`, Object.keys(tools));
        combinedMcpTools = { ...combinedMcpTools, ...tools };
      }
    } catch (error) {
      // Log the error and continue with the next provider
      console.error(`Error fetching tools from ${provider.name || 'unknown provider'}:`, error);
    }
  }

  // Combine core tools with the fetched MCP tools
  const finalTools = {
    ...coreTools,
    ...combinedMcpTools,
  };

  console.log("Final Combined Tools:", Object.keys(finalTools));
  return finalTools;
}