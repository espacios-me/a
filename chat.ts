import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { createChatSession, getUserChatSessions, getChatSession, getChatMessages, addChatMessage, logToolCall } from '../chat-db';
import { invokeLLM } from '../_core/llm';
import { GEMINI_TOOLS, ToolName } from '../gemini-tools';
import { TRPCError } from '@trpc/server';
import { getUserIntegration, getDecryptedIntegration } from '../integrations-db';

export const chatRouter = router({
  /**
   * Create a new chat session
   */
  createSession: protectedProcedure
    .input(z.object({ title: z.string().min(1).max(255) }))
    .mutation(async ({ ctx, input }) => {
      try {
        const session = await createChatSession(ctx.user.id, input.title);
        return session;
      } catch (error) {
        console.error('Failed to create chat session:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create chat session',
        });
      }
    }),

  /**
   * Get all chat sessions for the user
   */
  listSessions: protectedProcedure.query(async ({ ctx }) => {
    try {
      const sessions = await getUserChatSessions(ctx.user.id);
      return sessions;
    } catch (error) {
      console.error('Failed to fetch chat sessions:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch chat sessions',
      });
    }
  }),

  /**
   * Get messages from a chat session
   */
  getMessages: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const session = await getChatSession(input.sessionId, ctx.user.id);
        if (!session) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Chat session not found',
          });
        }

        const messages = await getChatMessages(input.sessionId);
        return messages;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('Failed to fetch chat messages:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch chat messages',
        });
      }
    }),

  /**
   * Send a message and get AI response with tool calling
   */
  sendMessage: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        message: z.string().min(1).max(10000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const session = await getChatSession(input.sessionId, ctx.user.id);
        if (!session) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Chat session not found',
          });
        }

        // Add user message to history
        await addChatMessage(input.sessionId, 'user', input.message);

        // Get message history for context
        const messages = await getChatMessages(input.sessionId, 50);

        // Build system prompt with integration context
        const integrations = await getUserIntegration(ctx.user.id, 'google_drive');
        const systemPrompt = `You are a helpful assistant that can interact with the user's integrated accounts.
Available integrations: ${integrations ? 'Google Drive' : 'None connected yet'}

When the user asks you to perform actions like reading files, checking emails, or accessing repositories, 
use the available tools to help them. Always be helpful and provide clear summaries of what you find.`;

        // Call Gemini with tools
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map((msg) => ({
              role: msg.role as 'user' | 'assistant' | 'system' | 'tool',
              content: msg.content,
            })),
          ],
          tools: GEMINI_TOOLS as any,
          tool_choice: 'auto',
        });

        const messageContent = response.choices[0]?.message?.content;
        const assistantMessage = typeof messageContent === 'string' ? messageContent : 'I encountered an error processing your request.';

        // Add assistant response to history
        await addChatMessage(input.sessionId, 'assistant', assistantMessage);

        return {
          message: assistantMessage,
          toolCalls: response.choices[0]?.message?.tool_calls || [],
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('Failed to send message:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to process message',
        });
      }
    }),

  /**
   * Execute a tool call (for handling tool responses)
   */
  executeTool: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        toolName: z.string(),
        toolInput: z.record(z.string(), z.unknown()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const session = await getChatSession(input.sessionId, ctx.user.id);
        if (!session) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Chat session not found',
          });
        }

        const startTime = Date.now();
        let result: Record<string, any> = {};
        let errorMessage: string | undefined;

        try {
          // Route to appropriate handler based on tool name
          switch (input.toolName as ToolName) {
            case 'get_integration_status': {
              const provider = input.toolInput.provider as string;
              const integration = await getUserIntegration(ctx.user.id, provider);
              result = {
                provider,
                status: integration?.status || 'disconnected',
                connected: integration?.status === 'connected',
              };
              break;
            }

            case 'list_google_drive_files': {
              const integration = await getDecryptedIntegration(ctx.user.id, 'google_drive');
              if (!integration) {
                throw new Error('Google Drive not connected');
              }
              // TODO: Implement actual Google Drive API call
              result = { files: [], message: 'Google Drive integration coming soon' };
              break;
            }

            case 'list_github_repos': {
              const integration = await getDecryptedIntegration(ctx.user.id, 'github');
              if (!integration) {
                throw new Error('GitHub not connected');
              }
              // TODO: Implement actual GitHub API call
              result = { repos: [], message: 'GitHub integration coming soon' };
              break;
            }

            case 'list_emails': {
              const provider = input.toolInput.provider as string;
              const integration = await getDecryptedIntegration(ctx.user.id, provider);
              if (!integration) {
                throw new Error(`${provider} not connected`);
              }
              // TODO: Implement actual email API call
              result = { emails: [], message: `${provider} integration coming soon` };
              break;
            }

            default:
              throw new Error(`Unknown tool: ${input.toolName}`);
          }

          // Log successful tool call
          const executionTime = Date.now() - startTime;
          await logToolCall(
            ctx.user.id,
            input.sessionId,
            input.toolName,
            'gemini',
            input.toolInput,
            result,
            'success',
            undefined,
            executionTime
          );
        } catch (toolError) {
          errorMessage = toolError instanceof Error ? toolError.message : 'Unknown error';

          // Log failed tool call
          const failureExecutionTime = Date.now() - startTime;
          await logToolCall(
            ctx.user.id,
            input.sessionId,
            input.toolName,
            'gemini',
            input.toolInput,
            null,
            'error',
            errorMessage,
            failureExecutionTime
          );

          throw new Error(errorMessage);
        }

        // Add tool result to chat history
        await addChatMessage(input.sessionId, 'tool', JSON.stringify(result), {
          toolName: input.toolName,
          toolResult: result,
        });

        return result;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('Failed to execute tool:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to execute tool',
        });
      }
    }),
});

export type ChatRouter = typeof chatRouter;
