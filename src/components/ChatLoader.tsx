import React from 'react'
import { Avatar, AvatarFallback } from './ui/avatar'
import { BotIcon } from 'lucide-react'
import { Card, CardContent } from './ui/card'

const ChatLoader = () => {
  return (
    <div className="flex gap-3 justify-start">
              <Avatar className="h-10 w-10 border bg-background">
                <AvatarFallback className="bg-primary/10">
                  <BotIcon size={20} className="text-primary" />
                </AvatarFallback>
              </Avatar>
              <Card className="bg-muted border-0 shadow-sm">
                <CardContent className="p-3 flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '600ms' }}></div>
                  </div>
                </CardContent>
              </Card>
            </div>
  )
}

export default ChatLoader