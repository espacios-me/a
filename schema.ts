import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Integration credentials table for storing OAuth tokens and provider-specific credentials.
 * All sensitive data (tokens, secrets) is encrypted before storage.
 */
export const integrations = mysqlTable("integrations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  provider: varchar("provider", { length: 64 }).notNull(), // 'google_drive', 'github', 'gmail', 'outlook', 'whatsapp', 'cloudflare'
  status: mysqlEnum("status", ["connected", "disconnected", "error"]).default("disconnected").notNull(),
  encryptedToken: text("encryptedToken"), // Encrypted OAuth access token
  encryptedRefreshToken: text("encryptedRefreshToken"), // Encrypted refresh token (if applicable)
  encryptedCredentials: text("encryptedCredentials"), // Encrypted provider-specific credentials (JSON)
  expiresAt: timestamp("expiresAt"), // Token expiration time
  lastSyncedAt: timestamp("lastSyncedAt"), // Last successful API call
  errorMessage: text("errorMessage"), // Error details if status is 'error'
  metadata: text("metadata"), // JSON metadata (email, username, etc.)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Integration = typeof integrations.$inferSelect;
export type InsertIntegration = typeof integrations.$inferInsert;

/**
 * OAuth state table for secure OAuth flow state management.
 * Stores PKCE code_verifier and state for verification during callback.
 */
export const oauthStates = mysqlTable("oauthStates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  state: varchar("state", { length: 256 }).notNull().unique(),
  codeVerifier: varchar("codeVerifier", { length: 256 }),
  provider: varchar("provider", { length: 64 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OAuthState = typeof oauthStates.$inferSelect;
export type InsertOAuthState = typeof oauthStates.$inferInsert;

/**
 * Chat sessions table for storing conversation history
 */
export const chatSessions = mysqlTable("chatSessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  systemPrompt: text("systemPrompt"), // Custom system prompt for this session
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = typeof chatSessions.$inferInsert;

/**
 * Chat messages table for storing individual messages in conversations
 */
export const chatMessages = mysqlTable("chatMessages", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  role: mysqlEnum("role", ["user", "assistant", "system", "tool"]).notNull(),
  content: text("content").notNull(),
  toolName: varchar("toolName", { length: 255 }), // For tool calls
  toolInput: text("toolInput"), // JSON stringified tool input
  toolResult: text("toolResult"), // JSON stringified tool result
  metadata: text("metadata"), // JSON metadata (tokens, model, etc.)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

/**
 * Tool calls history for auditing and debugging
 */
export const toolCallsLog = mysqlTable("toolCallsLog", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sessionId: int("sessionId"),
  toolName: varchar("toolName", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 64 }).notNull(), // Which integration was used
  input: text("input"), // JSON stringified input
  output: text("output"), // JSON stringified output
  status: mysqlEnum("status", ["success", "error"]).notNull(),
  errorMessage: text("errorMessage"),
  executionTimeMs: int("executionTimeMs"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ToolCallsLog = typeof toolCallsLog.$inferSelect;
export type InsertToolCallsLog = typeof toolCallsLog.$inferInsert;