import { openai } from '@ai-sdk/openai';
import { appendClientMessage, appendResponseMessages, createDataStreamResponse, createIdGenerator, streamText } from 'ai';
import { processToolCalls } from '@/lib/ai/utils';
import { getAllTools } from '@/lib/ai/tools';
import { fetchGitHubEvents } from '@/lib/ai/actions';
import { loadChat, saveChat } from '@/lib/ai/chat-store';


// Allow streaming responses up to 5 minutes
export const maxDuration = 60 * 5;

// IMPORTANT: Ensure this route uses the Node.js runtime.

// export const runtime = 'node' // defaults to node runtime uncomment incase of serverless deployment

export async function POST(req: Request) {
  try {
    const { message, id } = await req.json();
    const previousMessages = await loadChat(id);
    
    const messages = appendClientMessage({
      messages: previousMessages,
      message,
    });

    // Load all tools asynchronously *inside* the handler
    console.log("Loading available tools...");
    const availableTools = await getAllTools();
    console.log("Available tools loaded:", Object.keys(availableTools));

    return createDataStreamResponse({
      execute: async dataStream => {
        try {
          console.log("Processing tool calls...");
          // Utility function to handle tools that require human confirmation or specific actions
          const processedMessages = await processToolCalls(
            {
              messages,
              dataStream,
              tools: availableTools // Pass the dynamically loaded tools
            },
            {
              // Define the action functions for tools that need server-side execution
              getLocalDateTime: async () => {
                const dateTime = new Date().toISOString();
                console.log("Executing getLocalDateTime action");
                return dateTime;
              },
              // Assuming getGitHubEvents is handled by the MCP server via githubToolSets
              // If fetchGitHubEvents was intended for a different purpose or a direct tool, adjust accordingly.
              getGitHubEvents: fetchGitHubEvents,
              // Add other action implementations if needed
            },
          );
          console.log("Tool calls processed. Streaming text...");

          const result = streamText({
            model: openai('gpt-4o'),
            messages: processedMessages,
            tools: availableTools, // Pass the tools to the LLM
            async onFinish({ response }) {
              console.log("LLM stream finished. Saving chat...");
              await saveChat({
                id,
                messages: appendResponseMessages({
                  messages, // Pass the original messages augmented by processToolCalls
                  responseMessages: response.messages,
                }),
              });
              console.log("Chat saved.");
            },
            // id format for server-side messages:
            experimental_generateMessageId: createIdGenerator({
              prefix: 'msgs',
              size: 16,
            }),
          });

          // consume the stream to ensure it runs to completion & triggers onFinish
          // even when the client response is aborted:
          result.consumeStream().catch(error => {
              console.error("Error consuming stream:", error);
          });
          console.log("Merging result into data stream.");
          result.mergeIntoDataStream(dataStream);

        } catch (error) {
           console.error("Error during data stream execution:", error);
           // Ensure the data stream is closed properly on error
           // Optionally, send an error message back through the stream if appropriate
           // dataStream.appendMessage({ type: 'error', content: 'An internal error occurred.' });
        }
      },
    });
  } catch (error) {
     console.error("Error in POST /api/chat:", error);
     // Return a generic error response
     return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
       status: 500,
       headers: { 'Content-Type': 'application/json' },
     });
  }
}