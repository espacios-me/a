import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  FRONTEND_ORIGIN?: string
}

type User = {
  id: string
  name: string
  email: string
  authMode: 'preview'
}

type IntegrationState = {
  provider: string
  label: string
  connected: boolean
  status: 'connected' | 'disconnected' | 'error'
  detail: string
}

type Message = {
  id: string
  role: 'user' | 'assistant'
  text: string
  createdAt: string
}

type Thread = {
  id: string
  title: string
  updatedAt: string
  messages: Message[]
}

type SessionData = {
  user: User
  integrations: IntegrationState[]
  threads: Thread[]
}

const SESSION_COOKIE = 'atom_session'

const INTEGRATION_TEMPLATES: IntegrationState[] = [
  { provider: 'github', label: 'GitHub', connected: false, status: 'disconnected', detail: 'Repos and pull requests' },
  { provider: 'gmail', label: 'Gmail', connected: false, status: 'disconnected', detail: 'Inbox and search' },
  { provider: 'google-drive', label: 'Google Drive', connected: false, status: 'disconnected', detail: 'Files and folders' },
  { provider: 'whatsapp', label: 'WhatsApp', connected: false, status: 'disconnected', detail: 'Outbound notifications' },
  { provider: 'cloudflare', label: 'Cloudflare', connected: false, status: 'disconnected', detail: 'Workers and Pages diagnostics' },
]

const sessions = new Map<string, SessionData>()

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', async (c, next) => {
  const origin = c.env.FRONTEND_ORIGIN || '*'
  return cors({
    origin,
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
  })(c, next)
})

function parseCookies(cookieHeader?: string | null) {
  const cookies: Record<string, string> = {}
  if (!cookieHeader) return cookies
  cookieHeader.split(';').forEach((chunk) => {
    const [key, ...rest] = chunk.trim().split('=')
    cookies[key] = decodeURIComponent(rest.join('='))
  })
  return cookies
}

function getSession(c: any) {
  const cookieHeader = c.req.header('Cookie')
  const token = parseCookies(cookieHeader)[SESSION_COOKIE]
  if (!token) return null
  return { token, data: sessions.get(token) || null }
}

function unauthorized(c: any) {
  return c.json({ error: 'Unauthorized. Sign in first.' }, 401)
}

app.get('/api/health', (c) => c.json({ ok: true, service: 'atom-worker' }))

app.get('/api/auth/session', (c) => {
  const session = getSession(c)
  return c.json({ user: session?.data?.user || null })
})

app.post('/api/auth/login', async (c) => {
  const { provider = 'SSO' } = await c.req.json<{ provider?: string }>().catch(() => ({ provider: 'SSO' }))
  const token = crypto.randomUUID()
  const user: User = {
    id: crypto.randomUUID(),
    name: 'Atom Operator',
    email: 'operator@atom.local',
    authMode: 'preview',
  }

  sessions.set(token, {
    user,
    integrations: structuredClone(INTEGRATION_TEMPLATES),
    threads: [
      {
        id: crypto.randomUUID(),
        title: 'Daily operations',
        updatedAt: new Date().toISOString(),
        messages: [
          { id: crypto.randomUUID(), role: 'assistant', text: `Signed in with ${provider}. Connect integrations, then message me.`, createdAt: new Date().toISOString() },
        ],
      },
    ],
  })

  c.header('Set-Cookie', `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`)
  return c.json({ user })
})

app.post('/api/auth/logout', (c) => {
  const session = getSession(c)
  if (session?.token) sessions.delete(session.token)
  c.header('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`)
  return c.json({ ok: true })
})

app.get('/api/integrations', (c) => {
  const session = getSession(c)
  if (!session?.data) return unauthorized(c)
  return c.json({ integrations: session.data.integrations })
})

app.post('/api/integrations/toggle', async (c) => {
  const session = getSession(c)
  if (!session?.data) return unauthorized(c)

  const { provider, connect } = await c.req.json<{ provider: string; connect: boolean }>()
  session.data.integrations = session.data.integrations.map((item) => {
    if (item.provider !== provider) return item
    return {
      ...item,
      connected: Boolean(connect),
      status: connect ? 'connected' : 'disconnected',
      detail: connect ? `${item.label} linked in preview mode.` : `${item.label} disconnected.`,
    }
  })

  return c.json({ ok: true })
})

app.get('/api/messaging/threads', (c) => {
  const session = getSession(c)
  if (!session?.data) return unauthorized(c)

  return c.json({
    threads: session.data.threads.map((t) => ({ id: t.id, title: t.title, updatedAt: t.updatedAt })),
  })
})

app.post('/api/messaging/threads', (c) => {
  const session = getSession(c)
  if (!session?.data) return unauthorized(c)

  const thread: Thread = {
    id: crypto.randomUUID(),
    title: 'New thread',
    updatedAt: new Date().toISOString(),
    messages: [{ id: crypto.randomUUID(), role: 'assistant', text: 'New thread ready.', createdAt: new Date().toISOString() }],
  }
  session.data.threads.unshift(thread)

  return c.json({ thread })
})

app.get('/api/messaging/threads/:threadId', (c) => {
  const session = getSession(c)
  if (!session?.data) return unauthorized(c)

  const thread = session.data.threads.find((t) => t.id === c.req.param('threadId'))
  if (!thread) return c.json({ error: 'Thread not found' }, 404)
  return c.json({ messages: thread.messages })
})

app.post('/api/messaging/send', async (c) => {
  const session = getSession(c)
  if (!session?.data) return unauthorized(c)

  const { threadId, text } = await c.req.json<{ threadId: string; text: string }>()
  const thread = session.data.threads.find((t) => t.id === threadId)
  if (!thread) return c.json({ error: 'Thread not found' }, 404)

  const userMessage: Message = { id: crypto.randomUUID(), role: 'user', text, createdAt: new Date().toISOString() }
  const connected = session.data.integrations.filter((i) => i.connected).map((i) => i.label)
  const assistantText = connected.length
    ? `Acknowledged. Connected context: ${connected.join(', ')}. Next action for "${text}" is queued.`
    : `Acknowledged. No integrations connected yet, so this is guidance-only for "${text}".`
  const assistantMessage: Message = { id: crypto.randomUUID(), role: 'assistant', text: assistantText, createdAt: new Date().toISOString() }

  thread.messages.push(userMessage, assistantMessage)
  thread.updatedAt = new Date().toISOString()
  if (thread.title === 'New thread') thread.title = text.slice(0, 36) || 'Conversation'

  return c.json({ ok: true })
})

export default app
