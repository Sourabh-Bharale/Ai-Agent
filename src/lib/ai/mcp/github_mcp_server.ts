import { experimental_createMCPClient as createMCPClient } from 'ai';
import { Experimental_StdioMCPTransport as StdioMCPTransport } from 'ai/mcp-stdio';
import type { ToolSet } from 'ai';

// Ensure these are truly acting as caches across requests in the local dev server
let githubMCPStdioClient: Awaited<ReturnType<typeof createMCPClient>> | null = null;
let githubToolSetsCache: ToolSet | null = null;
let isInitializing = false; // Add a flag to prevent concurrent initializations

async function initializeGitHubMCPClient() {
  const callId = Date.now(); // Unique ID for this call attempt
  console.log(`[${callId}] initializeGitHubMCPClient called.`);

  // Check cache first
  if (githubMCPStdioClient) {
    console.log(`[${callId}] Returning cached GitHub MCP Client.`);
    return githubMCPStdioClient;
  }

  // Prevent multiple initializations running at the same time
  if (isInitializing) {
      console.log(`[${callId}] Initialization already in progress, waiting...`);
      // Simple wait loop (consider a more robust promise-based approach if needed)
      while (isInitializing) {
          await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
      }
      console.log(`[${callId}] Initialization finished by another call, checking cache again.`);
      // After waiting, the client should be initialized by the other call
      if (githubMCPStdioClient) {
          console.log(`[${callId}] Returning cached client after waiting.`);
          return githubMCPStdioClient;
      } else {
           console.error(`[${callId}] Waited for initialization, but client is still null!`);
           throw new Error("Failed to get client after waiting for initialization.");
      }
  }

  // Set the flag to block other calls
  isInitializing = true;
  console.log(`[${callId}] *** Starting NEW GitHub MCP Client Initialization ***`);

  // Ensure this runs only in Node.js (redundant check locally, but good practice)
  if (typeof process === 'undefined' || !process.versions || !process.versions.node) {
     console.error(`[${callId}] Attempted StdioMCPTransport outside Node.js.`);
     isInitializing = false; // Release the lock
     throw new Error("StdioMCPTransport requires a Node.js environment.");
  }

  console.log(`[${callId}] Initializing GitHub MCP Stdio Transport (starting Docker)...`);
  const startTime = performance.now(); // Start timing
  const githubMCPTransport = new StdioMCPTransport({
    command: "docker",
    args: [ "run", "-i", "--rm", "-e", "GITHUB_PERSONAL_ACCESS_TOKEN", "ghcr.io/github/github-mcp-server" ],
    env: { "GITHUB_PERSONAL_ACCESS_TOKEN": process.env.GITHUB_PERSONAL_ACCESS_TOKEN! },
    // debug: true, // Uncomment for verbose MCP logs if needed
  });

  console.log(`[${callId}] Creating GitHub MCP Client...`);
  try {
    const client = await createMCPClient({
      transport: githubMCPTransport,
    });
    const endTime = performance.now();
    console.log(`[${callId}] *** GitHub MCP Client Initialized Successfully (took ${(endTime - startTime).toFixed(2)} ms) ***`);
    githubMCPStdioClient = client; // Store in cache
    isInitializing = false; // Release the lock
    return githubMCPStdioClient;
  } catch (error) {
    const endTime = performance.now();
    console.error(`[${callId}] !!! Failed to initialize GitHub MCP Client (after ${(endTime - startTime).toFixed(2)} ms) !!!`, error);
    isInitializing = false; // Release the lock
    githubMCPStdioClient = null; // Ensure cache is clear on error
    throw error; // Re-throw error
  }
}

export async function getGitHubToolSets(): Promise<ToolSet> {
  const callId = Date.now();
  console.log(`[${callId}] getGitHubToolSets called.`);

  // Check tool cache first
  if (githubToolSetsCache) {
    console.log(`[${callId}] Returning cached GitHub tool sets.`);
    return githubToolSetsCache;
  }

  console.log(`[${callId}] Tool cache miss. Need to initialize client (or use existing).`);
  try {
    const client = await initializeGitHubMCPClient(); // Will either init or return cache

    // Check cache *again* in case another concurrent call populated it while waiting
     if (githubToolSetsCache) {
         console.log(`[${callId}] Tool cache populated while waiting for client. Returning cached tools.`);
         return githubToolSetsCache;
     }

    console.log(`[${callId}] Fetching tools from GitHub MCP Client...`);
    const tools = await client.tools();
    if (!tools || typeof tools !== 'object') {
       console.error(`[${callId}] Invalid tools format received from MCP client:`, tools);
       throw new Error("Invalid tools format received from MCP client.");
    }
    console.log(`[${callId}] *** Fetched and cached GitHub tools:`, Object.keys(tools));
    githubToolSetsCache = tools; // Store tools in cache
    return githubToolSetsCache;
  } catch (error) {
     console.error(`[${callId}] Error getting GitHub tool sets:`, error);
     // Don't cache on error
     githubToolSetsCache = null; // Clear tool cache on error
     // We might not want to clear the client cache here unless the client itself failed
     throw error; // Re-throw error
  }
}

// ... (shutdown function if needed) ...