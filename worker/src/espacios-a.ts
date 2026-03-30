interface Env {
  ASSETS: Fetcher
}

type ChatMessage = {
  role?: 'assistant' | 'user'
  text?: string
  content?: string
}

const BASE_PATH = '/a'

function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...headers,
    },
  })
}

function corsHeaders() {
  return {
    'access-control-allow-origin': 'https://espacios.me',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'Content-Type,Authorization',
  }
}

function stripBasePath(pathname: string) {
  if (pathname === BASE_PATH || pathname === `${BASE_PATH}/`) return '/'
  if (pathname.startsWith(`${BASE_PATH}/`)) return pathname.slice(BASE_PATH.length) || '/'
  return null
}

function rewriteRequest(request: Request, pathname: string) {
  const url = new URL(request.url)
  url.pathname = pathname
  return new Request(url.toString(), request)
}

function latestUserText(messages: ChatMessage[]) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i]
    if (message?.role === 'user') return (message.text || message.content || '').trim()
  }
  return ''
}

function replyFor(text: string, apps: string[]) {
  const lower = text.toLowerCase()

  if (lower.includes('cloudflare')) {
    return 'Cloudflare is configured for a route-based deploy on espacios.me/a.'
  }

  if (lower.includes('github')) {
    return 'GitHub now triggers the Worker deployment workflow for espacios.me/a.'
  }

  if (lower.includes('status') || lower.includes('health')) {
    return 'This shell is running as a single Worker with bundled assets and API endpoints under /a/api.'
  }

  if (apps.length > 0) {
    return `Connected apps in this shell: ${apps.join(', ')}.`
  }

  return 'The deployment shell is ready. Use the page to check route status and verify the /a setup.'
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const pathname = stripBasePath(url.pathname)

    if (!pathname) {
      return new Response('Not found.', { status: 404 })
    }

    if (request.method === 'OPTIONS' && pathname.startsWith('/api/')) {
      return new Response(null, { status: 204, headers: corsHeaders() })
    }

    if (pathname.startsWith('/api/')) {
      const headers = corsHeaders()

      if (request.method === 'GET' && pathname === '/api/health') {
        return json({ ok: true, route: 'espacios.me/a', mode: 'worker-with-assets' }, 200, headers)
      }

      if (request.method === 'GET' && pathname === '/api/auth/me') {
        return json({ authenticated: false }, 401, headers)
      }

      if (request.method === 'POST' && pathname === '/api/auth/login') {
        const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
        const provider = typeof body.provider === 'string' ? body.provider : 'cloudflare'

        return json({
          success: true,
          token: 'mock-session',
          user: {
            id: 'admin',
            name: 'Espacios Admin',
            email: 'keifferjapeth@outlook.com',
            provider,
          },
        }, 200, headers)
      }

      if (request.method === 'GET' && pathname === '/api/integrations/cloudflare/status') {
        return json({
          status: 'Deployment route configured',
          target: 'espacios.me/a',
          worker: 'espacios-me-a',
          mode: 'Worker + static assets',
        }, 200, headers)
      }

      if (request.method === 'POST' && pathname === '/api/test-keys') {
        const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
        const apiKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : ''

        if (!apiKey) {
          return json({ success: false, message: 'Missing API key.' }, 400, headers)
        }

        const looksValid = apiKey.length >= 20

        return json({
          success: looksValid,
          message: looksValid
            ? 'Key format looks usable. Add the real key to your Cloudflare Worker secrets before production use.'
            : 'This key looks too short. Double-check and try again.',
        }, looksValid ? 200 : 400, headers)
      }

      if (request.method === 'POST' && pathname === '/api/chat') {
        const body = (await request.json().catch(() => ({}))) as {
          messages?: ChatMessage[]
          connectedApps?: string[]
        }

        const messages = Array.isArray(body.messages) ? body.messages : []
        const apps = Array.isArray(body.connectedApps) ? body.connectedApps.map((item) => String(item)) : []

        return json({ reply: replyFor(latestUserText(messages), apps) }, 200, headers)
      }

      return json({ error: 'API route not found.' }, 404, headers)
    }

    return env.ASSETS.fetch(rewriteRequest(request, pathname))
  },
} satisfies ExportedHandler<Env>
