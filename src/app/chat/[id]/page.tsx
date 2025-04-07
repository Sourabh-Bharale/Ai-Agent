import { listChats, loadChat } from '@/lib/ai/chat-store';
import Chat from '@/components/Chat';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params; // get the chat ID from the URL
  const messages = await loadChat(id); // load the chat messages
  const chatIds = await listChats();
  return <Chat id={id} initialMessages={messages} chatIds={chatIds} />; // display the chat
}

