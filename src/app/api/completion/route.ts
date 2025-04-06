import { experimental_createMCPClient, streamText } from 'ai';
import { Experimental_StdioMCPTransport } from 'ai/mcp-stdio';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  const { prompt }: { prompt: string } = await req.json();

  try {

    if (!process.env.GITHUB_PERSONAL_ACCESS_TOKEN){
      return new Response("Github personal access key not set",{
        status: 500,
      })
    }
    // Initialize an MCP client to connect to a `stdio` MCP server:
    const transport = new Experimental_StdioMCPTransport({
      command: "docker",
      args: [
        "run",
        "-i",
        "--rm",
        "-e",
        "GITHUB_PERSONAL_ACCESS_TOKEN",
        "ghcr.io/github/github-mcp-server"
      ],
      env: {
        "GITHUB_PERSONAL_ACCESS_TOKEN": process.env.GITHUB_PERSONAL_ACCESS_TOKEN
      }
    });
    const stdioClient = await experimental_createMCPClient({
      transport,
    });

    // Alternatively, you can connect to a Server-Sent Events (SSE) MCP server:
    // const sseClient = await experimental_createMCPClient({
    //   transport: {
    //     type: 'sse',
    //     url: 'https://actions.zapier.com/mcp/<key>/sse',
    //   },
    // });

    // // Similarly to the stdio example, you can pass in your own custom transport as long as it implements the `MCPTransport` interface:
    // const transport = new MyCustomTransport({
    //   // ...
    // });
    // const customTransportClient = await experimental_createMCPClient({
    //   transport,
    // });

    const toolSetOne = await stdioClient.tools();
    // const toolSetTwo = await sseClient.tools();
    // const toolSetThree = await customTransportClient.tools();
    const tools = {
      ...toolSetOne,
      // ...toolSetTwo,
      // ...toolSetThree, // note: this approach causes subsequent tool sets to override tools with the same name
    };

    const response = await streamText({
      model: openai('gpt-4o'),
      tools,
      prompt,
      // When streaming, the client should be closed after the response is finished:
      onFinish: async () => {
        await stdioClient.close();
        // await sseClient.close();
        // await customTransportClient.close();
      },
    });

    return response.toDataStreamResponse();
  } catch (error) {
    return new Response('Internal Server Error', { status: 500 });
  }
}