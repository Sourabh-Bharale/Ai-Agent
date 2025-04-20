import React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Message } from '@ai-sdk/react';
import {
  UserIcon,
  BotIcon,
  AlertCircleIcon, // Keep if you want a generic indicator for pending calls
  TerminalIcon,
  ArrowRightIcon
} from 'lucide-react';
import { MemoizedMarkdown } from '@/components/memoised-markdown';
import ChatLoader from '@/components/ChatLoader';
import { ToolInvocation } from 'ai';
import { AgentModeData } from '@/types';

type Props = {
  messages: Message[]
  // Removed: toolsRequiringConfirmation: string[]
  // Removed: handleToolConfirmation: (toolInvocation: ToolInvocation | null) => void
  openAgentSidebar: (data: AgentModeData) => void
  isLoading: boolean
  isPendingToolCallConfirmation: boolean
}

const ChatArea = (props: Props) => {
  // Removed toolsRequiringConfirmation, handleToolConfirmation from destructuring
  const {messages, openAgentSidebar, isLoading, isPendingToolCallConfirmation} = props
  return (
    <ScrollArea className="flex-grow w-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-4 space-y-4">
        {messages?.map((m: Message) => (
          <div
            key={m.id}
            className={`flex gap-3 ${
              m.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {/* Avatar */}
            {m.role !== 'user' && (
              <Avatar className="h-10 w-10 border bg-background">
                <AvatarFallback className="bg-primary/10">
                  <BotIcon size={20} className="text-primary" />
                </AvatarFallback>
              </Avatar>
            )}

            {/* Message Content */}
            <Card
              className={`max-w-[80%] shadow-sm border-0 ${
                m.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              <CardContent className="space-y-2 py-3 px-4"> {/* Adjusted padding slightly */}
                {m.parts?.map((part, i: number) => {
                  switch (part.type) {
                    case 'text':
                      return (
                        <div
                          key={`${m.id}-text-${i}`}
                          className="whitespace-pre-wrap text-sm"
                        >
                          <MemoizedMarkdown id={i.toString()} content={part.text} />
                        </div>
                      );
                    case 'tool-invocation':
                      const toolInvocation = part.toolInvocation;
                      const toolCallId = toolInvocation.toolCallId;

                      // Removed the block that checked toolsRequiringConfirmation and called handleToolConfirmation
                      // Now we only render the result or potentially a generic pending state (optional)

                      if (toolInvocation.state === 'result') {
                        return (
                          <div
                            key={`${m.id}-tool-${i}-${toolCallId}`}
                            className="mt-2 pt-2 border-t border-border text-xs"
                          >
                            <div
                              className="flex items-center gap-2 p-2 rounded-md bg-background/50 cursor-pointer hover:bg-muted/60"
                              onClick={() => openAgentSidebar({
                                toolName: toolInvocation.toolName,
                                result: toolInvocation.result,
                                args: toolInvocation.args
                              })}
                            >
                              <TerminalIcon size={14} className="text-primary" />
                              <span className="font-medium">{toolInvocation.toolName}</span>
                              <ArrowRightIcon size={12} className="ml-auto" />
                            </div>
                          </div>
                        );
                      } else if (toolInvocation.state === 'call') {
                         // Optional: Render a non-interactive pending state indicator
                         // if needed, but the main indicator is the disabled input/loader below
                         // Example:
                         return (
                           <div key={`${m.id}-tool-call-${i}-${toolCallId}`} className="mt-2 pt-2 border-t text-xs italic text-muted-foreground">
                             <span className="flex items-center gap-1"><AlertCircleIcon size={12}/>Pending: {toolInvocation.toolName}</span>
                           </div>
                         );
                        //  return null; // Or return null if no specific indicator needed here
                      }
                      return null;
                    default:
                      return null;
                  }
                })}
              </CardContent>
            </Card>

            {/* User Avatar */}
            {m.role === 'user' && (
              <Avatar className="h-10 w-10 border">
                <AvatarFallback className="bg-background">
                  <UserIcon size={20} className="text-foreground" />
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
        {/* Loading Indicator - considers pending confirmation */}
        {isLoading && (
          <ChatLoader/>
        )}
        {/* If only pending confirmation but not loading new stream, show simpler indicator? */}
        {!isLoading && isPendingToolCallConfirmation && (
           <div className="flex justify-center items-center p-2 text-sm text-muted-foreground">
             <AlertCircleIcon size={16} className="mr-2 text-amber-500" />
             Waiting for tool confirmation...
           </div>
        )}
      </div>
    </ScrollArea>

  )
}

export default ChatArea