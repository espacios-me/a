import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  GEMINI_API_KEY: string
  FRONTEND_ORIGIN?: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', async (c, next) => {
  const origin = c.env.FRONTEND_ORIGIN || '*'
  return cors({
    origin,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
  })(c, next)
})

app.post('/api/auth/login', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const { provider } = body

  return c.json({
    success: true,
    token: 'cf-worker-mock-jwt-token-789',
    user: {
      name: 'Admin User',
      email: 'admin@yourdomain.com',
      provider: provider || 'unknown',
    },
  })
})

app.post('/api/test-keys', async (c) => {
  const { apiKey } = await c.req.json()

  if (!apiKey) {
    return c.json({ success: false, message: 'Missing Gemini API key.' }, 400)
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: "reply 'ok'" }] }] }),
    })

    if (res.ok) return c.json({ success: true, message: 'Gemini API Key is valid and working!' })
    return c.json({ success: false, message: 'Invalid Gemini API Key.' }, 400)
  } catch {
    return c.json({ success: false, message: 'Server error during testing.' }, 500)
  }
})

app.post('/api/chat', async (c) => {
  const { messages, connectedApps } = await c.req.json()
  const apiKey = c.env.GEMINI_API_KEY

  if (!apiKey) {
    return c.json({ error: 'Gemini API key is missing in Cloudflare environment.' }, 500)
  }

  const contents = messages.map((msg: any) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.text }],
  }))

  const payload = {
    contents,
    systemInstruction: {
      parts: [{
        text: `You are Atom, an AI assistant. You currently have access to these connected apps: ${connectedApps.join(', ')}. Keep your answers concise, direct, and helpful.`,
      }],
    },
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      return c.json({ error: 'Failed to generate response from Gemini.' }, 502)
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response."

    return c.json({ reply: text })
  } catch {
    return c.json({ error: 'Internal server error while processing chat.' }, 500)
  }
})

app.get('/api/integrations/cloudflare/status', (c) => {
  return c.json({
    status: 'All systems operational',
    active_workers: 4,
    cache_hit_ratio: '94%',
  })
})

export default app
