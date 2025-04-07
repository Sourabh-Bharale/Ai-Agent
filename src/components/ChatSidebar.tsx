'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MenuIcon } from 'lucide-react';
import Link from 'next/link'; // Assuming Next.js for routing

interface ChatSidebarProps {
  chatIds: string[]; // List of chat IDs
  // Potentially add props later if needed, e.g., for styling or behavior
}

export default function ChatSidebar({chatIds}: ChatSidebarProps) {
  const [isOpen, setIsOpen] = useState(false); // Control Sheet open state

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="fixed top-4 left-4 z-50">
          <MenuIcon className="h-4 w-4" />
          <span className="sr-only">Toggle Chat History</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[250px] sm:w-[300px]">
        <SheetHeader className="mb-4">
          <SheetTitle>Chat History</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)]"> {/* Adjust height as needed */}
          <div className="flex flex-col gap-2 pr-4">
            {chatIds.length > 0 ? (
              chatIds.map((id) => (
                <Button
                  key={id}
                  variant="ghost"
                  className="w-full justify-start"
                  asChild
                  onClick={() => setIsOpen(false)} // Close sheet on navigation
                >
                  {/* Use Link for navigation. Adjust href based on your routing */}
                  <Link href={`/chat/${id}`}>{id}</Link>
                </Button>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No chats found.</p>
            )}
          </div>
        </ScrollArea>
         <div className="mt-4">
            <Button
                variant="outline"
                className="w-full"
                asChild
                onClick={() => setIsOpen(false)} // Close sheet on navigation
            >
                {/* Link to create a new chat */}
                <Link href="/">New Chat</Link>
            </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}