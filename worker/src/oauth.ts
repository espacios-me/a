import { z } from 'zod'

export const OAUTH_PROVIDERS = {
  github: {
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    scopes: ['repo', 'user', 'gist'],
  },
  gmail: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
  },
  outlook: {
    clientId: process.env.MICROSOFT_CLIENT_ID || '',
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scopes: ['Mail.Read'],
  },
  'google-drive': {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  },
  whatsapp: {
    clientId: process.env.WHATSAPP_CLIENT_ID || '',
    clientSecret: process.env.WHATSAPP_CLIENT_SECRET || '',
    authUrl: 'https://www.whatsapp.com/business/api/oauth',
    tokenUrl: 'https://www.whatsapp.com/business/api/oauth/token',
    scopes: ['whatsapp_business_messaging'],
  },
  cloudflare: {
    clientId: process.env.CLOUDFLARE_CLIENT_ID || '',
    clientSecret: process.env.CLOUDFLARE_CLIENT_SECRET || '',
    authUrl: 'https://dash.cloudflare.com/oauth2/authorize',
    tokenUrl: 'https://dash.cloudflare.com/oauth2/token',
    scopes: ['account:read', 'workers:write'],
  },
}

export function generateOAuthUrl(
  provider: keyof typeof OAUTH_PROVIDERS,
  redirectUri: string,
  state: string
): string {
  const config = OAUTH_PROVIDERS[provider]
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    state,
  })

  return `${config.authUrl}?${params.toString()}`
}

export async function exchangeCodeForToken(
  provider: keyof typeof OAUTH_PROVIDERS,
  code: string,
  redirectUri: string
): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
  const config = OAUTH_PROVIDERS[provider]

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }).toString(),
  })

  if (!response.ok) {
    throw new Error(`OAuth token exchange failed: ${response.statusText}`)
  }

  const data = await response.json()
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  }
}

export const OAuthCallbackSchema = z.object({
  code: z.string(),
  state: z.string(),
  provider: z.enum(['github', 'gmail', 'outlook', 'google-drive', 'whatsapp', 'cloudflare']),
})
