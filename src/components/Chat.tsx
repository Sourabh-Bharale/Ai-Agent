'use client';

import { useState } from 'react';
import { Message, useChat } from '@ai-sdk/react';
import { APPROVAL, getToolsRequiringConfirmation } from '@/lib/ai/utils';
import { tools } from '@/lib/ai/tools';
import { createIdGenerator } from 'ai';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SendHorizontalIcon } from 'lucide-react';
import { AgentModeData } from '@/types';
import { ToolInvocation } from 'ai';
import ToolComformDialog from '@/components/ToolComformDialog';
import AgentSidebar from '@/components/AgentSidebar';
import ChatArea from '@/components/ChatArea';
import ChatSidebar from './ChatSidebar';

export default function Chat({id,initialMessages,chatIds}: { id?: string | undefined; initialMessages?: Message[]; chatIds?: string[] } = {}) {
  const [toolConfirmation, setToolConfirmation] = useState<ToolInvocation | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [agentModeData, setAgentModeData] = useState<AgentModeData | null>(null);

  const { messages, input, handleInputChange, handleSubmit, addToolResult, status } =
    useChat({
      id,
      maxSteps: 5,
      experimental_throttle : 50,
      initialMessages,
      sendExtraMessageFields: true, // send id and createdAt for each message
      // id format for client-side messages:
      generateId: createIdGenerator({
        prefix: 'msgc',
        size: 16,
      }),
      // only send the last message to the server:
      experimental_prepareRequestBody({ messages, id }) {
        return { message: messages[messages.length - 1], id };
      },
    });

  const toolsRequiringConfirmation = getToolsRequiringConfirmation(tools);

  const pendingToolCallConfirmation = messages.some((m: Message) =>
    m.parts?.some(
      (part) =>
        part.type === 'tool-invocation' &&
        part.toolInvocation.state === 'call' &&
        toolsRequiringConfirmation.includes(part.toolInvocation.toolName),
    ),
  );

  const isLoading = status === 'streaming';

  const handleToolConfirmation = (toolInvocation: ToolInvocation | null) => {
    setToolConfirmation(toolInvocation);
  };

  const confirmTool = (approved: boolean) => {
    if (toolConfirmation) {
      addToolResult({
        toolCallId: toolConfirmation.toolCallId,
        result: approved ? APPROVAL.YES : APPROVAL.NO,
      });
      setToolConfirmation(null);
    }
  };

  const openAgentSidebar = (data: AgentModeData) => {
    setAgentModeData(data);
    setSidebarOpen(true);
  };

  return (
    <div className="flex flex-col h-screen justify-between items-center">
      <div className="flex flex-col overflow-y-scroll bg-background">

        <ChatSidebar chatIds={chatIds||[]}/>

        {/* ChatArea */}
        <ChatArea
        handleToolConfirmation={handleToolConfirmation}
        isLoading={isLoading}
        isPendingToolCallConfirmation={pendingToolCallConfirmation}
        messages={messages}
        openAgentSidebar={openAgentSidebar}
        toolsRequiringConfirmation={toolsRequiringConfirmation}
        />

        {/* Tool Confirmation Modal */}
        <ToolComformDialog
          handleToolConfirmation={handleToolConfirmation}
          setConfirmToolState={confirmTool}
          toolConfirmation={toolConfirmation}
        />

        {/* Agent Mode Sidebar */}
        <AgentSidebar
        agentModeData={agentModeData}
        setSidebarOpen={setSidebarOpen}
        sidebarOpen={sidebarOpen}
        />

      </div>
      <div className="flex justify-center items-center w-full bg-background">
          {/* Use explicit form handler */}
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-2xl mx-auto p-4 flex items-center gap-2"
          >
            <Input
              disabled={pendingToolCallConfirmation || isLoading}
              className="flex w-full rounded-2xl border-input bg-background px-4 py-6" // py-6 seems large, check if intended
              value={input}
              placeholder={pendingToolCallConfirmation ? "Waiting for confirmation..." : "Ask something..."}
              onChange={handleInputChange}
              name="prompt" // Add name attribute if needed
            />
            <Button
              type="submit"
              size="icon"
              className="rounded-full h-12 w-12 flex items-center justify-center"
              disabled={pendingToolCallConfirmation || isLoading || !input.trim()}
            >
              <SendHorizontalIcon size={18} />
            </Button>
          </form>
      </div>
    </div>
  );
}