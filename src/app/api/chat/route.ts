import { openai } from '@ai-sdk/openai';
import { createDataStreamResponse, Message, streamText } from 'ai';
import { processToolCalls } from '@/lib/ai/utils';
import { tools } from '@/lib/ai/tools';
import { fetchGitHubEvents, fetchGitHubUserDetails } from '@/lib/ai/actions';


// Allow streaming responses up to 5 minutes
export const maxDuration = 60 * 5;

export async function POST(req: Request) {
  const { messages }: { messages: Message[] } = await req.json();

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
      });

      result.mergeIntoDataStream(dataStream);
    },
  });
}