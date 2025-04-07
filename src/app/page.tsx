import { redirect } from 'next/navigation';
import { createChat } from '@/lib/ai/chat-store';

export default async function Page() {
  const newChatId = await createChat();
  redirect(`/chat/${newChatId}`);
}