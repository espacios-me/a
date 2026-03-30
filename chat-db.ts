import { eq, desc } from 'drizzle-orm';
import { chatSessions, chatMessages, toolCallsLog, ChatSession, ChatMessage, ToolCallsLog, InsertChatMessage, InsertChatSession, InsertToolCallsLog } from '../drizzle/schema';
import { getDb } from './db';

/**
 * Create a new chat session
 */
export async function createChatSession(userId: number, title: string, systemPrompt?: string): Promise<ChatSession> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const result = await db.insert(chatSessions).values({
    userId,
    title,
    systemPrompt,
  });

  const sessionId = result[0]?.insertId;
  if (!sessionId) throw new Error('Failed to create chat session');

  const sessions = await db.select().from(chatSessions).where(eq(chatSessions.id, sessionId as any));
  return sessions[0]!;
}

/**
 * Get all chat sessions for a user
 */
export async function getUserChatSessions(userId: number): Promise<ChatSession[]> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  return db.select().from(chatSessions).where(eq(chatSessions.userId, userId)).orderBy(desc(chatSessions.updatedAt));
}

/**
 * Get a specific chat session
 */
export async function getChatSession(sessionId: number, userId: number): Promise<ChatSession | null> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const result = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.id, sessionId))
    .limit(1);

  if (result.length === 0 || result[0].userId !== userId) {
    return null;
  }

  return result[0];
}

/**
 * Get chat messages for a session
 */
export async function getChatMessages(sessionId: number, limit: number = 50): Promise<ChatMessage[]> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  return db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(chatMessages.createdAt)
    .limit(limit);
}

/**
 * Add a message to a chat session
 */
export async function addChatMessage(
  sessionId: number,
  role: 'user' | 'assistant' | 'system' | 'tool',
  content: string,
  data?: {
    toolName?: string;
    toolInput?: Record<string, any>;
    toolResult?: Record<string, any>;
    metadata?: Record<string, any>;
  }
): Promise<ChatMessage> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const message: InsertChatMessage = {
    sessionId,
    role,
    content,
    toolName: data?.toolName,
    toolInput: data?.toolInput ? JSON.stringify(data.toolInput) : undefined,
    toolResult: data?.toolResult ? JSON.stringify(data.toolResult) : undefined,
    metadata: data?.metadata ? JSON.stringify(data.metadata) : undefined,
  };

  await db.insert(chatMessages).values(message);

  const messages = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(1);

  return messages[0]!;
}

/**
 * Log a tool call for auditing
 */
export async function logToolCall(
  userId: number,
  sessionId: number | null,
  toolName: string,
  provider: string,
  input: Record<string, any>,
  output: Record<string, any> | null,
  status: 'success' | 'error',
  errorMessage?: string,
  executionTimeMs?: number
): Promise<ToolCallsLog> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const log: InsertToolCallsLog = {
    userId,
    sessionId: sessionId || undefined,
    toolName,
    provider,
    input: JSON.stringify(input),
    output: output ? JSON.stringify(output) : undefined,
    status,
    errorMessage,
    executionTimeMs,
  };

  await db.insert(toolCallsLog).values(log);

  const logs = await db
    .select()
    .from(toolCallsLog)
    .orderBy(desc(toolCallsLog.createdAt))
    .limit(1);

  return logs[0]!;
}

/**
 * Delete a chat session and all its messages
 */
export async function deleteChatSession(sessionId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Verify ownership
  const session = await getChatSession(sessionId, userId);
  if (!session) throw new Error('Session not found or unauthorized');

  // Delete messages first
  await db.delete(chatMessages).where(eq(chatMessages.sessionId, sessionId));

  // Delete session
  await db.delete(chatSessions).where(eq(chatSessions.id, sessionId));
}
