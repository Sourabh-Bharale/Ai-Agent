import { experimental_createMCPClient as createMCPClient } from 'ai';
import { Experimental_StdioMCPTransport as StdioMCPTransport } from 'ai/mcp-stdio';
import type { ToolSet } from 'ai';

// Caching variables
let filesystemMCPStdioClient: Awaited<ReturnType<typeof createMCPClient>> | null = null;
let filesystemToolSetsCache: ToolSet | null = null;
let isInitializing = false; // Flag to prevent concurrent initializations

async function initializeFileSystemMCPClient() {
  const callId = Date.now(); // Unique ID for this call attempt
  console.log(`[${callId}] initializeFileSystemMCPClient called.`);

  // Check cache first
  if (filesystemMCPStdioClient) {
    console.log(`[${callId}] Returning cached Filesystem MCP Client.`);
    return filesystemMCPStdioClient;
  }

  // Prevent multiple initializations running at the same time
  if (isInitializing) {
      console.log(`[${callId}] Filesystem initialization already in progress, waiting...`);
      while (isInitializing) {
          await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
      }
      console.log(`[${callId}] Filesystem initialization finished by another call, checking cache again.`);
      if (filesystemMCPStdioClient) {
          console.log(`[${callId}] Returning cached filesystem client after waiting.`);
          return filesystemMCPStdioClient;
      } else {
           console.error(`[${callId}] Waited for filesystem initialization, but client is still null!`);
           throw new Error("Failed to get filesystem client after waiting for initialization.");
      }
  }

  // Set the flag to block other calls
  isInitializing = true;
  console.log(`[${callId}] *** Starting NEW Filesystem MCP Client Initialization ***`);

  // Ensure this runs only in Node.js
  if (typeof process === 'undefined' || !process.versions || !process.versions.node) {
     console.error(`[${callId}] Attempted StdioMCPTransport outside Node.js.`);
     isInitializing = false; // Release the lock
     throw new Error("StdioMCPTransport requires a Node.js environment.");
  }

  console.log(`[${callId}] Initializing Filesystem MCP Stdio Transport...`);
  const startTime = performance.now(); // Start timing
  const filesystemMCPTransport = new StdioMCPTransport({
    command: "npx",
      args: [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        // TODO: Consider making these paths dynamic or configurable via environment variables
        "/Users/sourabh/Desktop"
      ],
  });

  console.log(`[${callId}] Creating Filesystem MCP Client...`);
  try {
    const client = await createMCPClient({
      transport: filesystemMCPTransport,
    });
    const endTime = performance.now();
    console.log(`[${callId}] *** Filesystem MCP Client Initialized Successfully (took ${(endTime - startTime).toFixed(2)} ms) ***`);
    filesystemMCPStdioClient = client; // Store in cache
    isInitializing = false; // Release the lock
    return filesystemMCPStdioClient;
  } catch (error) {
    const endTime = performance.now();
    console.error(`[${callId}] !!! Failed to initialize Filesystem MCP Client (after ${(endTime - startTime).toFixed(2)} ms) !!!`, error);
    isInitializing = false; // Release the lock
    filesystemMCPStdioClient = null; // Ensure cache is clear on error
    throw error; // Re-throw error
  }
}

export async function getFileSystemToolSets(): Promise<ToolSet> {
  const callId = Date.now();
  console.log(`[${callId}] getFileSystemToolSets called.`);

  // Check tool cache first
  if (filesystemToolSetsCache) {
    console.log(`[${callId}] Returning cached Filesystem tool sets.`);
    return filesystemToolSetsCache;
  }

  console.log(`[${callId}] Filesystem tool cache miss. Need to initialize client (or use existing).`);
  try {
    const client = await initializeFileSystemMCPClient(); // Will either init or return cache

    // Check cache *again* in case another concurrent call populated it while waiting
     if (filesystemToolSetsCache) {
         console.log(`[${callId}] Filesystem tool cache populated while waiting for client. Returning cached tools.`);
         return filesystemToolSetsCache;
     }

    console.log(`[${callId}] Fetching tools from Filesystem MCP Client...`);
    const tools = await client.tools();
     if (!tools || typeof tools !== 'object') {
         console.error(`[${callId}] Invalid tools format received from Filesystem MCP client:`, tools);
         throw new Error("Invalid tools format received from Filesystem MCP client.");
     }
    console.log(`[${callId}] *** Fetched and cached Filesystem tools:`, Object.keys(tools));
    filesystemToolSetsCache = tools; // Store tools in cache
    return filesystemToolSetsCache;
  } catch (error) {
     console.error(`[${callId}] Error getting Filesystem tool sets:`, error);
     // Don't cache on error
     filesystemToolSetsCache = null; // Clear tool cache on error
     // We might not want to clear the client cache here unless the client itself failed
     throw error; // Re-throw error
  }
}

// Consider adding a shutdown function if the MCP server process needs explicit cleanup
// export async function shutdownFileSystemMCPClient() {
//   if (filesystemMCPStdioClient) {
//     console.log("Shutting down Filesystem MCP client...");
//     await filesystemMCPStdioClient.transport.terminate(); // Assuming transport has terminate
//     filesystemMCPStdioClient = null;
//     filesystemToolSetsCache = null;
//     console.log("Filesystem MCP client shut down.");
//   }
// }