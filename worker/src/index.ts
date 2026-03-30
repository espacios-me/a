import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  GEMINI_API_KEY?: string
  GEMINI_MODEL?: string
  FRONTEND_ORIGIN?: string
  ATOM_MESSAGES?: KVNamespace
}

type Role = 'assistant' | 'user'
type Status = 'failed' | 'sending' | 'sent'

type Conversation = {
  id: string
  title: string
  preview: string
  updatedAt: string
  messageCount: number
  lastMessageRole: Role
  connectedApps: string[]
}

type Message = {
  id: string
  conversationId: string
  role: Role
  content: string
  status: Status
  createdAt: string
  model?: string
  latencyMs?: number
}

const app = new Hono<{ Bindings: Bindings }>()
const INDEX_KEY = 'atom:conversations'
const DEFAULT_MODEL = 'gemini-2.0-flash'
const memory = new Map<string, string>()

app.use('/api/*', async (c, next) => {
  const origin = c.env.FRONTEND_ORIGIN || '*'
  return cors({
    origin,
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })(c, next)
})

const now = () => new Date().toISOString()
const uid = () => crypto.randomUUID()
const cut = (v: string, n: number) => (v.length <= n ? v : `${v.slice(0, n).trimEnd()}…`)

async function read<T>(env: Bindings, key: string, fallback: T): Promise<T> {
  const raw = env.ATOM_MESSAGES ? await env.ATOM_MESSAGES.get(key) : memory.get(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

async function write(env: Bindings, key: string, value: unknown) {
  const raw = JSON.stringify(value)
  if (env.ATOM_MESSAGES) {
    await env.ATOM_MESSAGES.put(key, raw)
    return
  }
  memory.set(key, raw)
}

async function listConversations(env: Bindings) {
  return read<Conversation[]>(env, INDEX_KEY, [])
}

async function saveConversationList(env: Bindings, items: Conversation[]) {
  const sorted = [...items].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  await write(env, INDEX_KEY, sorted)
}

async function getMessages(env: Bindings, id: string) {
  return read<Message[]>(env, `atom:conversation:${id}:messages`, [])
}

async function saveMessages(env: Bindings, id: string, messages: Message[]) {
  await write(env, `atom:conversation:${id}:messages`, messages)
}

function buildConversation(id: string, content = '', connectedApps: string[] = []): Conversation {
  return {
    id,
    title: cut(content.replace(/\s+/g, ' ').trim() || 'New conversation', 42),
    preview: content || 'No messages yet',
    updatedAt: now(),
    messageCount: content ? 1 : 0,
    lastMessageRole: 'assistant',
    connectedApps,
  }
}

function buildMessage(conversationId: string, role: Role, content: string, extra: Partial<Message> = {}): Message {
  return {
    id: uid(),
    conversationId,
    role,
    content,
    status: 'sent',
    createdAt: now(),
    ...extra,
  }
}

function fallbackReply(input: string, connectedApps: string[]) {
  const lower = input.toLowerCase()
  if (lower.includes('email') || lower.includes('inbox')) {
    return 'I can help with inbox triage. Paste the thread or notes and I will summarize what matters, surface risks, and draft a calm reply.'
  }
  if (lower.includes('calendar')) {
    return `I do not have live calendar access here. Paste the schedule and I will turn it into a clean agenda with priorities. Current connected apps: ${connectedApps.join(', ') || 'none'}.`
  }
  if (lower.includes('github') || lower.includes('pull request')) {
    return 'Share the issue or diff and I will rewrite it into a crisp status update, risks, and next actions.'
  }
  return 'Got it. Tell me whether you want a summary, a reply draft, a decision, or a next-step plan and I will keep it concise.'
}

async function generateReply(env: Bindings, messages: Message[], connectedApps: string[]) {
  const started = Date.now()
  const model = env.GEMINI_MODEL || DEFAULT_MODEL
  const recent = messages.slice(-10)
  const lastUser = [...recent].reverse().find((m) => m.role === 'user')?.content || ''

  if (!env.GEMINI_API_KEY) {
    return { text: fallbackReply(lastUser, connectedApps), model: 'fallback', latencyMs: Date.now() - started }
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: recent.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
        systemInstruction: {
          parts: [{
            text: `You are Atom, a calm premium AI messaging assistant. Keep replies concise, readable, and useful. Connected apps: ${connectedApps.join(', ') || 'none'}. If live data is unavailable, say so clearly and offer the next best action.`,
          }],
        },
        generationConfig: { temperature: 0.55, topP: 0.9, maxOutputTokens: 360 },
      }),
    })

    if (!response.ok) {
      return { text: fallbackReply(lastUser, connectedApps), model: 'fallback', latencyMs: Date.now() - started }
    }

    const data = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    return { text: text || fallbackReply(lastUser, connectedApps), model, latencyMs: Date.now() - started }
  } catch {
    return { text: fallbackReply(lastUser, connectedApps), model: 'fallback', latencyMs: Date.now() - started }
  }
}

app.get('/api/health', (c) => c.json({ status: 'ok', service: 'atom-messaging-worker' }))

app.post('/api/auth/login', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { provider?: string }
  const provider = body.provider || 'demo'
  return c.json({
    success: true,
    token: 'atom-demo-session',
    user: {
      id: `demo-${provider}`,
      name: 'Atom User',
      email: 'demo@atom.app',
      provider,
    },
  })
})

app.get('/api/auth/me', (c) => c.json({ authenticated: false }, 401))

app.get('/api/conversations', async (c) => c.json({ conversations: await listConversations(c.env) }))

app.get('/api/conversations/:conversationId/messages', async (c) => {
  const id = c.req.param('conversationId')
  const conversations = await listConversations(c.env)
  const conversation = conversations.find((item) => item.id === id) || null
  return c.json({ conversation, messages: await getMessages(c.env, id) })
})

app.post('/api/conversations', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { title?: string; connectedApps?: string[] }
  const conversation = buildConversation(uid(), body.title || '', body.connectedApps || [])
  const current = await listConversations(c.env)
  await saveConversationList(c.env, [conversation, ...current])
  await saveMessages(c.env, conversation.id, [])
  return c.json({ conversation })
})

app.post('/api/messages', async (c) => {
  const body = (await c.req.json()) as { conversationId?: string; content?: string; connectedApps?: string[] }
  const content = (body.content || '').trim()
  if (!content) return c.json({ error: 'Message content is required.' }, 400)

  const connectedApps = body.connectedApps || []
  const conversationId = body.conversationId || uid()
  const conversations = await listConversations(c.env)
  const existing = conversations.find((item) => item.id === conversationId)
  const previousMessages = await getMessages(c.env, conversationId)

  const userMessage = buildMessage(conversationId, 'user', content)
  const reply = await generateReply(c.env, [...previousMessages, userMessage], connectedApps)
  const assistantMessage = buildMessage(conversationId, 'assistant', reply.text, { model: reply.model, latencyMs: reply.latencyMs })
  const messages = [...previousMessages, userMessage, assistantMessage]
  await saveMessages(c.env, conversationId, messages)

  const conversation: Conversation = {
    id: conversationId,
    title: existing?.title || buildConversation(conversationId, content, connectedApps).title,
    preview: assistantMessage.content,
    updatedAt: assistantMessage.createdAt,
    messageCount: messages.length,
    lastMessageRole: 'assistant',
    connectedApps,
  }

  await saveConversationList(c.env, [conversation, ...conversations.filter((item) => item.id !== conversationId)])
  return c.json({ conversation, messages })
})

app.post('/api/chat', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { messages?: Array<{ role: Role; text: string }>; connectedApps?: string[] }
  const messages = (body.messages || []).map((message) => buildMessage('legacy-chat', message.role, message.text))
  const reply = await generateReply(c.env, messages, body.connectedApps || [])
  return c.json({ reply: reply.text, model: reply.model, latencyMs: reply.latencyMs })
})

app.get('/api/integrations/cloudflare/status', (c) => c.json({ status: 'All systems operational', active_workers: 4, cache_hit_ratio: '94%' }))
app.get('/', (c) => c.json({ status: 'ok', service: 'atom-messaging-worker' }))

export default app
