import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  GEMINI_API_KEY: string
  GEMINI_MODEL?: string
  FRONTEND_ORIGIN?: string
  WHATSAPP_TOKEN?: string
  WHATSAPP_PHONE_ID?: string
}

type ChatMessage = {
  role: 'assistant' | 'user'
  text: string
}

const DEFAULT_MODEL = 'gemini-2.0-flash'

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
  const body = await c.req.json().catch(() => ({} as { provider?: string }))
  const provider = body?.provider || 'unknown'

  return c.json({
    success: true,
    token: 'cf-worker-mock-jwt-token-789',
    user: {
      name: 'Admin User',
      email: 'admin@yourdomain.com',
      provider,
    },
  })
})

app.post('/api/test-keys', async (c) => {
  const { provider = 'gemini', apiKey, extraData } = await c.req.json<{
    provider?: 'gemini' | 'whatsapp'
    apiKey?: string
    extraData?: { phoneId?: string }
  }>()

  if (!apiKey) {
    return c.json({ success: false, message: 'Missing API key.' }, 400)
  }

  try {
    if (provider === 'gemini') {
      const model = c.env.GEMINI_MODEL || DEFAULT_MODEL
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: "reply with the word 'ok'" }] }] }),
      })

      if (res.ok) return c.json({ success: true, message: 'Gemini API Key is valid and working!' })
      return c.json({ success: false, message: 'Invalid Gemini API Key.' }, 400)
    }

    if (provider === 'whatsapp') {
      const phoneId = extraData?.phoneId
      if (!phoneId) {
        return c.json({ success: false, message: 'Phone ID required to test WhatsApp.' }, 400)
      }

      const url = `https://graph.facebook.com/v19.0/${phoneId}?access_token=${apiKey}`
      const res = await fetch(url)

      if (res.ok) return c.json({ success: true, message: 'WhatsApp Token and Phone ID are valid!' })

      const errorData = await res.json()
      return c.json({ success: false, message: 'WhatsApp verification failed.', details: errorData }, 400)
    }

    return c.json({ success: false, message: 'Unknown provider specified.' }, 400)
  } catch {
    return c.json({ success: false, message: 'Server error during testing.' }, 500)
  }
})

app.post('/api/chat', async (c) => {
  const { messages = [], connectedApps = [] } = await c.req.json<{
    messages?: ChatMessage[]
    connectedApps?: string[]
  }>()

  const apiKey = c.env.GEMINI_API_KEY
  if (!apiKey) {
    return c.json({ error: 'Gemini API key is missing in Cloudflare environment.' }, 500)
  }

  const typedMessages = messages as ChatMessage[]
  const latestUserMessage = [...typedMessages].reverse().find((msg) => msg.role === 'user')?.text?.toLowerCase() || ''

  if (latestUserMessage.includes('cloudflare status')) {
    return c.json({ reply: 'Cloudflare status: All systems operational. Active workers: 4. Cache hit ratio: 94%.' })
  }

  const contents = typedMessages.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.text }],
  }))

  const payload = {
    contents,
    systemInstruction: {
      parts: [
        {
          text: `You are Atom, an AI assistant for a productivity app. Connected apps: ${connectedApps.join(', ') || 'none'}. Keep answers concise and practical.`,
        },
      ],
    },
  }

  try {
    const model = c.env.GEMINI_MODEL || DEFAULT_MODEL
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      return c.json({ error: 'Failed to generate response from Gemini.' }, 502)
    }

    const data: any = await response.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response."

    return c.json({ reply: text })
  } catch {
    return c.json({ error: 'Internal server error while processing chat.' }, 500)
  }
})

app.post('/api/integrations/whatsapp/send', async (c) => {
  const token = c.env.WHATSAPP_TOKEN
  const phoneId = c.env.WHATSAPP_PHONE_ID

  if (!token || !phoneId) {
    return c.json({ error: 'WhatsApp credentials are not configured in the environment.' }, 500)
  }

  const { to, message } = await c.req.json<{ to?: string; message?: string }>()
  if (!to || !message) {
    return c.json({ error: 'Missing "to" (phone number) or "message" field.' }, 400)
  }

  try {
    const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: message },
      }),
    })

    const data: any = await response.json()

    if (!response.ok) {
      return c.json({ success: false, error: 'Failed to send WhatsApp message.', details: data }, 502)
    }

    return c.json({ success: true, messageId: data.messages?.[0]?.id })
  } catch {
    return c.json({ success: false, error: 'Internal server error sending WhatsApp message.' }, 500)
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
