import { Hono } from 'hono'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from './routers'
import { createContext } from './_core/trpc'
import { cors } from 'hono/cors'
import oauthApp from './oauth-callback'

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
  const body = await c.req.json().catch(() => ({}))
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
  const { provider, apiKey, extraData } = await c.req.json()

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
      if (!phoneId) return c.json({ success: false, message: 'Phone ID required to test WhatsApp.' }, 400)

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

app.use('/api/oauth/*', oauthApp)

app.use('/trpc/*', async (c, next) => {
  return fetchRequestHandler({
    endpoint: '/trpc',
    req: c.req.raw,
    router: appRouter,
    createContext,
  })
})

export default app
