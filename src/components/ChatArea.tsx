import React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Message } from '@ai-sdk/react';
import {
  UserIcon,
  BotIcon,
  AlertCircleIcon,
  TerminalIcon,
  ArrowRightIcon
} from 'lucide-react';
import { MemoizedMarkdown } from '@/components/memoised-markdown';
import ChatLoader from '@/components/ChatLoader';
import { ToolInvocation } from 'ai';
import { AgentModeData } from '@/types';

type Props = {
  messages: Message[]
  toolsRequiringConfirmation: string[]
  handleToolConfirmation: (toolInvocation: ToolInvocation | null) => void
  openAgentSidebar: (data: AgentModeData) => void
  isLoading: boolean
  isPendingToolCallConfirmation: boolean
}

const ChatArea = (props: Props) => {
  const {messages,toolsRequiringConfirmation,handleToolConfirmation,openAgentSidebar,isLoading,isPendingToolCallConfirmation} = props
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
            <CardContent className="space-y-2">
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

                    if (
                      toolsRequiringConfirmation.includes(toolInvocation.toolName) &&
                      toolInvocation.state === 'call'
                    ) {
                      // Instead of inline buttons, show an indicator and handle with modal
                      return (
                        <div
                          key={`${m.id}-tool-${i}-${toolCallId}`}
                          className="mt-2 pt-2 border-t border-border"
                        >
                          <div
                            className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/60 p-2 rounded-md"
                            onClick={() => handleToolConfirmation(toolInvocation)}
                          >
                            <AlertCircleIcon size={16} className="text-amber-500" />
                            <span>Tool action requires confirmation</span>
                            <Badge variant="outline" className="ml-auto">
                              {toolInvocation.toolName}
                            </Badge>
                          </div>
                        </div>
                      );
                    } else if (toolInvocation.state === 'result') {
                      return (
                        <div
                          key={`${m.id}-tool-${i}-${toolCallId}`}
                          className="mt-2 pt-2 border-t border-border text-xs"
                        >
                          <div
                            className="flex items-center gap-2 p-2 rounded-md bg-background/50 cursor-pointer"
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
      {/* Loading Indicator */}
      {isLoading && !isPendingToolCallConfirmation && (
        <ChatLoader/>
      )}
    </div>
  </ScrollArea>

  )
}

export default ChatArea