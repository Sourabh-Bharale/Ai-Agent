import { openai } from '@ai-sdk/openai';
import { appendClientMessage, appendResponseMessages, createDataStreamResponse, createIdGenerator, streamText } from 'ai';
import { processToolCalls } from '@/lib/ai/utils';
import { tools } from '@/lib/ai/tools';
import { fetchGitHubEvents, fetchGitHubUserDetails } from '@/lib/ai/actions';
import { loadChat, saveChat } from '@/lib/ai/chat-store';


// Allow streaming responses up to 5 minutes
export const maxDuration = 60 * 5;

export async function POST(req: Request) {
  const { message, id } = await req.json();
   // load the previous messages from the server:
   const previousMessages = await loadChat(id);
   // append the new message to the previous messages:
   const messages = appendClientMessage({
     messages: previousMessages,
     message,
   });

  return createDataStreamResponse({
    execute: async dataStream => {
      // Utility function to handle tools that require human confirmation
      // Checks for confirmation in last message and then runs associated tool
      const processedMessages = await processToolCalls(
        {
          messages,
          dataStream,
          tools,
        },
        {
          getLocalDateTime: async () => {
            const dateTime = new Date().toISOString()
            return dateTime
          },
          getGitHubUserDetails: fetchGitHubUserDetails,
          getGitHubEvents: fetchGitHubEvents,
          // getGitHubUserActivity: fetchGitHubUserActivity,
        },
      );

      const result = streamText({
        model: openai('gpt-4o'),
        messages: processedMessages,
        tools,
        async onFinish({ response }) {
          await saveChat({
            id,
            messages: appendResponseMessages({
              messages,
              responseMessages: response.messages,
            }),
          });
        },
        // id format for server-side messages:
        experimental_generateMessageId: createIdGenerator({
          prefix: 'msgs',
          size: 16,
        }),
      });

      // consume the stream to ensure it runs to completion & triggers onFinish
      // even when the client response is aborted:
      result.consumeStream()

      result.mergeIntoDataStream(dataStream);
    },
  });
}