'use client';

import { useEffect, useState } from 'react';
import { Message, useChat } from '@ai-sdk/react';
import { ToolInvocation } from 'ai'; // Keep ToolInvocation import
import { APPROVAL, getToolsRequiringConfirmation } from '@/lib/ai/utils';
// Import coreTools to know which ones are 'core' vs 'mcp'
import { coreTools } from '@/lib/ai/core-tools';
import { createIdGenerator } from 'ai';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SendHorizontalIcon } from 'lucide-react';
import { AgentModeData } from '@/types';
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
      experimental_throttle: 50,
      initialMessages,
      sendExtraMessageFields: true,
      generateId: createIdGenerator({
        prefix: 'msgc',
        size: 16,
      }),
      experimental_prepareRequestBody({ messages, id }) {
        return { message: messages[messages.length - 1], id };
      },
    });

  // This list is now less critical for *triggering* confirmation, but still useful
  // for potentially distinguishing core vs MCP later if needed.
  const coreToolsRequiringConfirmation = getToolsRequiringConfirmation(coreTools);

  // Effect to find and set the tool invocation that needs confirmation
  useEffect(() => {
    if (toolConfirmation) return; // Already waiting for a confirmation

    // Find the first tool invocation part in 'call' state
    const invocationToConfirmPart = messages
      .flatMap(m => m.parts ?? [])
      .find((part) => part.type === 'tool-invocation' && part.toolInvocation?.state === 'call');

    // *** CHANGE HERE: Request confirmation for *any* tool in 'call' state ***
    if (invocationToConfirmPart && invocationToConfirmPart.type === 'tool-invocation') {
        console.log('Requesting confirmation for tool:', invocationToConfirmPart.toolInvocation.toolName);
        setToolConfirmation(invocationToConfirmPart.toolInvocation);
    }
  }, [messages, toolConfirmation]); // Removed coreToolsRequiringConfirmation dependency here

  const isPendingToolCallConfirmation = toolConfirmation !== null;
  const isLoading = status === 'streaming';

  const handleDialogConfirmation = (approved: boolean) => {
    if (toolConfirmation) {
      console.log(`Tool ${toolConfirmation.toolName} confirmation result:`, approved);
      addToolResult({
        toolCallId: toolConfirmation.toolCallId,
        result: approved ? APPROVAL.YES : APPROVAL.NO,
      });
      setToolConfirmation(null);
    }
  };

  const closeConfirmationDialog = () => {
    console.log('Tool confirmation dialog closed/cancelled.');
    // Decide if cancelling should send NO automatically
    if (toolConfirmation) {
       addToolResult({
           toolCallId: toolConfirmation.toolCallId,
           result: APPROVAL.NO, // Send NO on cancel to prevent agent stall
       });
    }
    setToolConfirmation(null);
  };

  const openAgentSidebar = (data: AgentModeData) => {
    setAgentModeData(data);
    setSidebarOpen(true);
  };

  return (
    <div className="flex flex-col h-screen justify-between items-center">
       {/* Main Area */}
      <div className="flex flex-1 w-full overflow-hidden">
        <ChatSidebar chatIds={chatIds || []} />
        <div className="flex flex-col flex-1 overflow-y-scroll bg-background">
          <ChatArea
            isLoading={isLoading}
            isPendingToolCallConfirmation={isPendingToolCallConfirmation}
            messages={messages}
            openAgentSidebar={openAgentSidebar}
          />
        </div>
         <AgentSidebar
           agentModeData={agentModeData}
           setSidebarOpen={setSidebarOpen}
           sidebarOpen={sidebarOpen}
         />
      </div>

      {/* Tool Confirmation Modal */}
      <ToolComformDialog
        handleToolConfirmation={closeConfirmationDialog}
        setConfirmToolState={handleDialogConfirmation}
        toolConfirmation={toolConfirmation}
      />

      {/* Input Area */}
      <div className="flex justify-center items-center w-full bg-background border-t">
          <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto p-4 flex items-center gap-2">
            <Input
              disabled={isPendingToolCallConfirmation || isLoading}
              className="flex w-full rounded-2xl border-input bg-background px-4 py-6"
              value={input}
              placeholder={isPendingToolCallConfirmation ? "Waiting for tool confirmation..." : "Ask something..."}
              onChange={handleInputChange}
              name="prompt"
            />
            <Button type="submit" size="icon" className="rounded-full h-12 w-12 flex items-center justify-center" disabled={isPendingToolCallConfirmation || isLoading || !input.trim()}>
              <SendHorizontalIcon size={18} />
            </Button>
          </form>
      </div>
    </div>
  );
}