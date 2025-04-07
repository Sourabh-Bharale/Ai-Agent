import { generateId } from 'ai';
import { existsSync, mkdirSync } from 'fs';
import { readdir, writeFile } from 'fs/promises';
import path from 'path';
import { Message } from 'ai';
import { readFile } from 'fs/promises';

export async function saveChat({
  id,
  messages,
}: {
  id: string;
  messages: Message[];
}): Promise<void> {
  const content = JSON.stringify(messages, null, 2);
  await writeFile(getChatFile(id), content);
}

export async function loadChat(id: string): Promise<Message[]> {
  return JSON.parse(await readFile(getChatFile(id), 'utf8'));
}

export async function createChat(): Promise<string> {
  const id = generateId(); // generate a unique chat ID
  await writeFile(getChatFile(id), '[]'); // create an empty chat file
  return id;
}

function getChatFile(id: string): string {
  const chatDir = path.join(process.cwd(), '.chats');
  if (!existsSync(chatDir)) mkdirSync(chatDir, { recursive: true });
  return path.join(chatDir, `${id}.json`);
}

export async function listChats(): Promise<string[]> {
  const chatDir = path.join(process.cwd(), '.chats');
  if (!existsSync(chatDir)) {
    return []; // No chat directory exists, return empty array
  }
  const files = await readdir(chatDir);
  // Filter for JSON files and map to chat IDs (filename without extension)
  return files
    .filter((file) => file.endsWith('.json'))
    .map((file) => file.replace(/\.json$/, ''));
}