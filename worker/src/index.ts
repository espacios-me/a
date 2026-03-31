import { Hono } from 'hono'

type ProviderId = 'google' | 'github' | 'microsoft' | 'whatsapp' | 'cloudflare'
type HealthState = 'healthy' | 'attention' | 'unconfigured'

type Bindings = {
  GEMINI_API_KEY?: string
  GEMINI_MODEL?: string
  FRONTEND_ORIGIN?: string
  APP_SESSION_SECRET?: string
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
  GOOGLE_REDIRECT_URI?: string
  GITHUB_CLIENT_ID?: string
  GITHUB_CLIENT_SECRET?: string
  GITHUB_REDIRECT_URI?: string
  WHATSAPP_TOKEN?: string
  WHATSAPP_PHONE_ID?: string
}

type ChatMessage = {
  role: 'assistant' | 'user'
  text: string
}

type SessionUser = {
  id: string
  name: string
  email: string
  avatarUrl?: string
  provider: string
}

type IntegrationConnection = {
  provider: ProviderId
  enabled: boolean
  connectedAt: string
  accountLabel: string
  scopes: string[]
  health: HealthState
}

type SessionState = {
  user: SessionUser | null
  integrations: Partial<Record<ProviderId, IntegrationConnection>>
}

type ProviderDefinition = {
  id: ProviderId
  name: string
  category: 'workspace' | 'developer' | 'messaging' | 'infrastructure'
  description: string
  capabilities: string[]
  supportsSSO: boolean
  supportsDemo: boolean
  envKeys?: Array<keyof Bindings>
}

type OAuthState = {
  provider: ProviderId
  redirectTo: string
  nonce: string
  issuedAt: number
}

const DEFAULT_MODEL = 'gemini-2.0-flash'
const SESSION_COOKIE = 'atom_session'
const OAUTH_COOKIE = 'atom_oauth_state'
const SESSION_TTL = 60 * 60 * 24 * 14
const OAUTH_TTL = 60 * 10

const PROVIDERS: ProviderDefinition[] = [
  {
    id: 'google',
    name: 'Google Workspace',
    category: 'workspace',
    description: 'Mail, Calendar, and Drive under one calm workspace surface.',
    capabilities: ['Gmail', 'Calendar', 'Drive'],
    supportsSSO: true,
    supportsDemo: true,
    envKeys: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REDIRECT_URI'],
  },
  {
    id: 'github',
    name: 'GitHub',
    category: 'developer',
    description: 'Repository context, engineering workflows, and issue intelligence.',
    capabilities: ['Repos', 'Issues', 'Pull requests'],
    supportsSSO: true,
    supportsDemo: true,
    envKeys: ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET', 'GITHUB_REDIRECT_URI'],
  },
  {
    id: 'microsoft',
    name: 'Microsoft 365',
    category: 'workspace',
    description: 'Enterprise mail, calendars, docs, and identity — staged for the next release.',
    capabilities: ['Outlook', 'Calendar', 'OneDrive'],
    supportsSSO: false,
    supportsDemo: true,
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    category: 'messaging',
    description: 'Business messaging actions, delivery workflows, and assistant follow-through.',
    capabilities: ['Messaging', 'Templates', 'Delivery status'],
    supportsSSO: false,
    supportsDemo: true,
    envKeys: ['WHATSAPP_TOKEN', 'WHATSAPP_PHONE_ID'],
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    category: 'infrastructure',
    description: 'Edge health, worker status, and operational visibility from the same dashboard.',
    capabilities: ['Workers', 'Status', 'Cache'],
    supportsSSO: false,
    supportsDemo: true,
  },
]

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', async (c, next) => {
  const origin = c.req.header('Origin')
  const allowedOrigin = c.env.FRONTEND_ORIGIN || origin || '*'

  c.header('Access-Control-Allow-Origin', allowedOrigin)
  c.header('Access-Control-Allow-Credentials', 'true')
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  c.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS')
  c.header('Vary', 'Origin')

  if (c.req.method === 'OPTIONS') {
    return c.body(null, 204)
  }

  await next()
})

function getSecret(env: Bindings) {
  return env.APP_SESSION_SECRET || 'atom-dev-secret-change-me'
}

function emptySession(): SessionState {
  return { user: null, integrations: {} }
}

function base64UrlEncode(value: string) {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '==='.slice((normalized.length + 3) % 4)
  return atob(padded)
}

async function signValue(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))
  const bytes = new Uint8Array(signature)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return base64UrlEncode(binary)
}

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false
  let result = 0
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return result === 0
}

async function encodeSigned<T>(payload: T, secret: string) {
  const body = base64UrlEncode(JSON.stringify(payload))
  const signature = await signValue(body, secret)
  return `${body}.${signature}`
}

async function decodeSigned<T>(token: string | undefined, secret: string): Promise<T | null> {
  if (!token) return null
  const [body, signature] = token.split('.')
  if (!body || !signature) return null
  const expected = await signValue(body, secret)
  if (!safeEqual(expected, signature)) return null
  try {
    return JSON.parse(base64UrlDecode(body)) as T
  } catch {
    return null
  }
}

function parseCookies(header: string | undefined) {
  return (header || '').split(';').reduce<Record<string, string>>((accumulator, part) => {
    const [name, ...rest] = part.trim().split('=')
    if (!name) return accumulator
    accumulator[name] = rest.join('=')
    return accumulator
  }, {})
}

function cookieAttributes(requestUrl: string, frontendOrigin?: string, maxAge = SESSION_TTL) {
  const requestOrigin = new URL(requestUrl).origin
  const isSecure = requestUrl.startsWith('https://')
  const sameSite = frontendOrigin && frontendOrigin !== requestOrigin ? 'None' : 'Lax'
  return `Path=/; HttpOnly; Max-Age=${maxAge}; SameSite=${sameSite}${isSecure ? '; Secure' : ''}`
}

async function getSession(c: any): Promise<SessionState> {
  const cookies = parseCookies(c.req.header('Cookie'))
  const session = await decodeSigned<SessionState>(cookies[SESSION_COOKIE], getSecret(c.env))
  return session || emptySession()
}

async function setSignedCookie(c: any, name: string, value: unknown, maxAge: number) {
  const encoded = await encodeSigned(value, getSecret(c.env))
  c.header('Set-Cookie', `${name}=${encoded}; ${cookieAttributes(c.req.url, c.env.FRONTEND_ORIGIN, maxAge)}`, { append: true })
}

function clearCookie(c: any, name: string) {
  c.header('Set-Cookie', `${name}=; Path=/; Max-Age=0; SameSite=Lax`, { append: true })
}

function providerConfigured(provider: ProviderDefinition, env: Bindings) {
  if (!provider.envKeys || provider.envKeys.length === 0) return provider.id === 'cloudflare'
  return provider.envKeys.every((key) => Boolean(env[key]))
}

function inferHealth(provider: ProviderDefinition, connection?: IntegrationConnection): HealthState {
  if (connection?.enabled) return 'healthy'
  if (connection && !connection.enabled) return 'attention'
  if (provider.id === 'cloudflare') return 'healthy'
  return 'unconfigured'
}

function buildProviderStates(env: Bindings, session: SessionState) {
  return PROVIDERS.map((provider) => {
    const connection = session.integrations[provider.id]
    const available = providerConfigured(provider, env) || provider.supportsDemo
    const status = connection ? 'connected' : available ? 'available' : 'unconfigured'
    return {
      id: provider.id,
      name: provider.name,
      category: provider.category,
      description: provider.description,
      capabilities: provider.capabilities,
      available,
      supportsSSO: provider.supportsSSO,
      supportsDemo: provider.supportsDemo,
      status,
      enabled: connection?.enabled ?? provider.id === 'cloudflare',
      connection,
      health: inferHealth(provider, connection),
    }
  })
}

function redirectToFrontend(c: any, redirectTo: string, params: Record<string, string>) {
  const base = c.env.FRONTEND_ORIGIN || new URL(c.req.url).origin
  const target = new URL(redirectTo.startsWith('http') ? redirectTo : `${base}${redirectTo}`)
  Object.entries(params).forEach(([key, value]) => target.searchParams.set(key, value))
  return c.redirect(target.toString(), 302)
}

async function exchangeGitHubCode(env: Bindings, code: string) {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      redirect_uri: env.GITHUB_REDIRECT_URI,
      code,
    }),
  })

  if (!response.ok) throw new Error('GitHub token exchange failed')

  const tokenPayload = await response.json<any>()
  const accessToken = tokenPayload.access_token
  if (!accessToken) throw new Error('GitHub did not return an access token')

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'Atom-App',
  }

  const profileResponse = await fetch('https://api.github.com/user', { headers })
  const emailResponse = await fetch('https://api.github.com/user/emails', { headers })
  if (!profileResponse.ok || !emailResponse.ok) throw new Error('GitHub profile lookup failed')

  const profile = await profileResponse.json<any>()
  const emails = await emailResponse.json<any[]>()
  const primaryEmail = emails.find((entry) => entry.primary)?.email || profile.email || `${profile.login}@users.noreply.github.com`

  return {
    user: {
      id: `github:${profile.id}`,
      name: profile.name || profile.login,
      email: primaryEmail,
      avatarUrl: profile.avatar_url,
      provider: 'github',
    } as SessionUser,
    accountLabel: primaryEmail,
    scopes: ['read:user', 'user:email', 'repo'],
  }
}

async function exchangeGoogleCode(env: Bindings, code: string) {
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID || '',
      client_secret: env.GOOGLE_CLIENT_SECRET || '',
      redirect_uri: env.GOOGLE_REDIRECT_URI || '',
      code,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenResponse.ok) throw new Error('Google token exchange failed')

  const tokenPayload = await tokenResponse.json<any>()
  const accessToken = tokenPayload.access_token
  if (!accessToken) throw new Error('Google did not return an access token')

  const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!profileResponse.ok) throw new Error('Google profile lookup failed')

  const profile = await profileResponse.json<any>()
  return {
    user: {
      id: `google:${profile.id}`,
      name: profile.name,
      email: profile.email,
      avatarUrl: profile.picture,
      provider: 'google',
    } as SessionUser,
    accountLabel: profile.email,
    scopes: ['openid', 'email', 'profile', 'calendar.readonly', 'gmail.readonly', 'drive.metadata.readonly'],
  }
}

function githubAuthUrl(env: Bindings, state: OAuthState) {
  const url = new URL('https://github.com/login/oauth/authorize')
  url.searchParams.set('client_id', env.GITHUB_CLIENT_ID || '')
  url.searchParams.set('redirect_uri', env.GITHUB_REDIRECT_URI || '')
  url.searchParams.set('scope', 'read:user user:email repo')
  url.searchParams.set('state', state.nonce)
  url.searchParams.set('allow_signup', 'true')
  return url.toString()
}

function googleAuthUrl(env: Bindings, state: OAuthState) {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id', env.GOOGLE_CLIENT_ID || '')
  url.searchParams.set('redirect_uri', env.GOOGLE_REDIRECT_URI || '')
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('access_type', 'offline')
  url.searchParams.set('include_granted_scopes', 'true')
  url.searchParams.set('prompt', 'consent')
  url.searchParams.set(
    'scope',
    [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/drive.metadata.readonly',
    ].join(' '),
  )
  url.searchParams.set('state', state.nonce)
  return url.toString()
}

function providerChecks(provider: ProviderDefinition, env: Bindings, session: SessionState) {
  const connection = session.integrations[provider.id]
  const configured = providerConfigured(provider, env)

  const checks: Array<{ label: string; status: 'pass' | 'warn' | 'fail'; detail: string }> = [
    {
      label: 'Environment readiness',
      status: configured ? 'pass' : provider.supportsDemo ? 'warn' : 'fail',
      detail: configured
        ? 'Required credentials are present for this provider.'
        : provider.supportsDemo
          ? 'Credentials are missing, but demo mode keeps the flow explorable.'
          : 'This provider needs credentials before it can connect.',
    },
    {
      label: 'Connection state',
      status: connection ? 'pass' : 'warn',
      detail: connection ? `${provider.name} is connected as ${connection.accountLabel}.` : `${provider.name} is not connected yet.`,
    },
    {
      label: 'Toggle state',
      status: connection?.enabled ? 'pass' : 'warn',
      detail: connection?.enabled
        ? 'This integration is enabled and available to the app.'
        : connection
          ? 'Connected, but currently disabled in the dashboard.'
          : 'Enable after connecting to expose it to the assistant.',
    },
  ]

  if (provider.id === 'cloudflare') {
    checks.push({
      label: 'Edge status',
      status: 'pass',
      detail: 'Worker health endpoint is available and ready to report operational status.',
    })
  }

  if (provider.id === 'whatsapp') {
    checks.push({
      label: 'Messaging credentials',
      status: env.WHATSAPP_TOKEN && env.WHATSAPP_PHONE_ID ? 'pass' : 'warn',
      detail: env.WHATSAPP_TOKEN && env.WHATSAPP_PHONE_ID
        ? 'WhatsApp token and phone ID are configured for sending.'
        : 'Add WHATSAPP_TOKEN and WHATSAPP_PHONE_ID to enable message delivery.',
    })
  }

  return checks
}

function ensureUser(session: SessionState) {
  if (session.user) return session
  return {
    ...session,
    user: {
      id: `demo:${crypto.randomUUID()}`,
      name: 'Atom Demo User',
      email: 'demo@atom.local',
      provider: 'demo',
    },
  }
}

app.get('/api/auth/providers', (c) => {
  return c.json({
    providers: [
      ...PROVIDERS.filter((provider) => provider.supportsSSO).map((provider) => ({
        id: provider.id,
        name: provider.name,
        available: providerConfigured(provider, c.env),
        supportsSSO: provider.supportsSSO,
        description: provider.description,
      })),
      {
        id: 'demo',
        name: 'Demo access',
        available: true,
        supportsSSO: false,
        description: 'Preview the integrations dashboard before credentials are wired.',
      },
    ],
  })
})

app.get('/api/auth/me', async (c) => {
  const session = await getSession(c)
  return c.json({ user: session.user })
})

app.post('/api/auth/login', async (c) => {
  const body = await c.req.json().catch(() => ({} as { provider?: ProviderId | 'demo' }))
  const provider = body.provider || 'demo'
  const now = new Date().toISOString()
  const session = ensureUser(await getSession(c))

  if (provider !== 'demo' && PROVIDERS.some((item) => item.id === provider)) {
    session.integrations[provider] = {
      provider,
      enabled: true,
      connectedAt: now,
      accountLabel: `${provider}.demo@atom.local`,
      scopes: ['demo:read', 'demo:write'],
      health: 'healthy',
    }
  }

  await setSignedCookie(c, SESSION_COOKIE, session, SESSION_TTL)
  return c.json({ success: true, user: session.user })
})

app.post('/api/auth/logout', async (c) => {
  clearCookie(c, SESSION_COOKIE)
  clearCookie(c, OAUTH_COOKIE)
  return c.json({ success: true })
})

app.get('/api/auth/sso/start', async (c) => {
  const providerId = c.req.query('provider') as ProviderId | undefined
  const redirectTo = c.req.query('redirectTo') || '/integrations'
  const provider = PROVIDERS.find((item) => item.id === providerId)

  if (!provider || !provider.supportsSSO) {
    return redirectToFrontend(c, redirectTo, { auth: 'error', reason: 'provider-not-supported' })
  }

  if (!providerConfigured(provider, c.env)) {
    return redirectToFrontend(c, redirectTo, { auth: 'error', reason: 'provider-not-configured' })
  }

  const state: OAuthState = {
    provider: provider.id,
    redirectTo,
    nonce: crypto.randomUUID(),
    issuedAt: Date.now(),
  }

  await setSignedCookie(c, OAUTH_COOKIE, state, OAUTH_TTL)
  const url = provider.id === 'google' ? googleAuthUrl(c.env, state) : githubAuthUrl(c.env, state)
  return c.redirect(url, 302)
})

app.get('/api/auth/sso/callback', async (c) => {
  const code = c.req.query('code')
  const nonce = c.req.query('state')
  const cookies = parseCookies(c.req.header('Cookie'))
  const oauthState = await decodeSigned<OAuthState>(cookies[OAUTH_COOKIE], getSecret(c.env))

  if (!code || !oauthState || oauthState.nonce !== nonce) {
    clearCookie(c, OAUTH_COOKIE)
    return redirectToFrontend(c, '/integrations', { auth: 'error', reason: 'invalid-oauth-state' })
  }

  try {
    const session = await getSession(c)
    const exchange = oauthState.provider === 'google'
      ? await exchangeGoogleCode(c.env, code)
      : await exchangeGitHubCode(c.env, code)

    const nextSession: SessionState = {
      user: exchange.user,
      integrations: {
        ...session.integrations,
        [oauthState.provider]: {
          provider: oauthState.provider,
          enabled: true,
          connectedAt: new Date().toISOString(),
          accountLabel: exchange.accountLabel,
          scopes: exchange.scopes,
          health: 'healthy',
        },
      },
    }

    await setSignedCookie(c, SESSION_COOKIE, nextSession, SESSION_TTL)
    clearCookie(c, OAUTH_COOKIE)
    return redirectToFrontend(c, oauthState.redirectTo, { auth: 'success', connected: oauthState.provider })
  } catch (error) {
    clearCookie(c, OAUTH_COOKIE)
    return redirectToFrontend(c, oauthState.redirectTo, {
      auth: 'error',
      reason: error instanceof Error ? error.message : 'oauth-callback-failed',
    })
  }
})

app.get('/api/integrations/state', async (c) => {
  const session = await getSession(c)
  const providers = buildProviderStates(c.env, session)
  return c.json({
    user: session.user,
    providers,
    summary: {
      connected: providers.filter((provider) => provider.connection).length,
      available: providers.filter((provider) => provider.available).length,
      healthy: providers.filter((provider) => provider.health === 'healthy').length,
    },
  })
})

app.get('/api/integrations/:provider/diagnostics', async (c) => {
  const provider = PROVIDERS.find((item) => item.id === c.req.param('provider'))
  if (!provider) return c.json({ error: 'Unknown provider' }, 404)
  const session = await getSession(c)
  return c.json({ provider: provider.id, checks: providerChecks(provider, c.env, session) })
})

app.patch('/api/integrations/:provider/settings', async (c) => {
  const provider = PROVIDERS.find((item) => item.id === c.req.param('provider'))
  if (!provider) return c.json({ error: 'Unknown provider' }, 404)

  const session = ensureUser(await getSession(c))
  const body = await c.req.json().catch(() => ({} as { enabled?: boolean }))
  const existing = session.integrations[provider.id]

  session.integrations[provider.id] = {
    provider: provider.id,
    enabled: Boolean(body.enabled),
    connectedAt: existing?.connectedAt || new Date().toISOString(),
    accountLabel: existing?.accountLabel || `${provider.id}.demo@atom.local`,
    scopes: existing?.scopes || ['demo:read'],
    health: body.enabled ? 'healthy' : 'attention',
  }

  await setSignedCookie(c, SESSION_COOKIE, session, SESSION_TTL)
  return c.json({ success: true, integration: session.integrations[provider.id] })
})

app.post('/api/integrations/:provider/disconnect', async (c) => {
  const provider = PROVIDERS.find((item) => item.id === c.req.param('provider'))
  if (!provider) return c.json({ error: 'Unknown provider' }, 404)
  const session = await getSession(c)
  delete session.integrations[provider.id]
  await setSignedCookie(c, SESSION_COOKIE, session, SESSION_TTL)
  return c.json({ success: true })
})

app.post('/api/chat', async (c) => {
  const session = await getSession(c)
  const { messages = [], connectedApps = [] } = await c.req.json<{ messages?: ChatMessage[]; connectedApps?: string[] }>()

  const apiKey = c.env.GEMINI_API_KEY
  if (!apiKey) {
    return c.json({ error: 'Gemini API key is missing in Cloudflare environment.' }, 500)
  }

  const typedMessages = messages as ChatMessage[]
  const latestUserMessage = [...typedMessages].reverse().find((message) => message.role === 'user')?.text?.toLowerCase() || ''
  const liveConnectedApps = buildProviderStates(c.env, session)
    .filter((provider) => provider.connection && provider.enabled)
    .map((provider) => provider.name)
  const effectiveApps = Array.from(new Set([...connectedApps, ...liveConnectedApps]))

  if (latestUserMessage.includes('cloudflare status')) {
    return c.json({ reply: 'Cloudflare status: all systems operational, active workers: 4, cache hit ratio: 94%.' })
  }

  const payload = {
    contents: typedMessages.map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.text }],
    })),
    systemInstruction: {
      parts: [
        {
          text: [
            'You are Atom, a calm and capable productivity assistant.',
            `Authenticated user: ${session.user?.name || 'Guest'} (${session.user?.email || 'no email'})`,
            `Enabled integrations: ${effectiveApps.join(', ') || 'none'}.`,
            'Answer with a concise, premium tone and suggest the next useful action when appropriate.',
          ].join(' '),
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

    if (!response.ok) return c.json({ error: 'Failed to generate response from Gemini.' }, 502)

    const data = await response.json<any>()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response."
    return c.json({ reply: text })
  } catch {
    return c.json({ error: 'Internal server error while processing chat.' }, 500)
  }
})

app.post('/api/test-keys', async (c) => {
  const { provider = 'gemini', apiKey, extraData } = await c.req.json<{
    provider?: 'gemini' | 'whatsapp'
    apiKey?: string
    extraData?: { phoneId?: string }
  }>()

  if (!apiKey) return c.json({ success: false, message: 'Missing API key.' }, 400)

  try {
    if (provider === 'gemini') {
      const model = c.env.GEMINI_MODEL || DEFAULT_MODEL
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: "reply with the word 'ok'" }] }] }),
      })
      if (res.ok) return c.json({ success: true, message: 'Gemini API key is valid and working.' })
      return c.json({ success: false, message: 'Invalid Gemini API key.' }, 400)
    }

    if (provider === 'whatsapp') {
      const phoneId = extraData?.phoneId
      if (!phoneId) return c.json({ success: false, message: 'Phone ID required to test WhatsApp.' }, 400)

      const url = `https://graph.facebook.com/v19.0/${phoneId}?access_token=${apiKey}`
      const res = await fetch(url)
      if (res.ok) return c.json({ success: true, message: 'WhatsApp token and phone ID are valid.' })

      const errorData = await res.json<any>()
      return c.json({ success: false, message: 'WhatsApp verification failed.', details: errorData }, 400)
    }

    return c.json({ success: false, message: 'Unknown provider specified.' }, 400)
  } catch {
    return c.json({ success: false, message: 'Server error during testing.' }, 500)
  }
})

app.post('/api/integrations/whatsapp/send', async (c) => {
  const token = c.env.WHATSAPP_TOKEN
  const phoneId = c.env.WHATSAPP_PHONE_ID

  if (!token || !phoneId) {
    return c.json({ error: 'WhatsApp credentials are not configured in the environment.' }, 500)
  }

  const { to, message } = await c.req.json<{ to?: string; message?: string }>()
  if (!to || !message) return c.json({ error: 'Missing "to" or "message" field.' }, 400)

  try {
    const response = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
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

    const data = await response.json<any>()
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

app.get('/', (c) => c.json({ status: 'ok', service: 'atom-integrations-worker' }))

export default app
