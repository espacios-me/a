import { Hono } from 'hono'
import { z } from 'zod'
import { exchangeCodeForToken, OAuthCallbackSchema } from './oauth'

const app = new Hono()

/**
 * OAuth Callback Handler
 * POST /api/oauth/callback
 * 
 * Exchanges OAuth authorization code for access token
 */
app.post('/callback', async (c) => {
  try {
    const body = await c.req.json()
    const { code, state, provider } = OAuthCallbackSchema.parse(body)

    // In production, verify the state parameter against stored state in database
    // to prevent CSRF attacks

    const redirectUri = `${c.req.header('origin')}/oauth/callback`

    // Exchange code for token
    const tokenData = await exchangeCodeForToken(provider, code, redirectUri)

    // In production, encrypt and store the token in database
    // associated with the user and provider

    return c.json({
      success: true,
      provider,
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresIn: tokenData.expiresIn,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: 'Invalid request parameters' }, 400)
    }

    const message = error instanceof Error ? error.message : 'OAuth callback failed'
    return c.json({ success: false, error: message }, 500)
  }
})

/**
 * OAuth Authorization URL Generator
 * POST /api/oauth/authorize
 * 
 * Generates OAuth authorization URL for the specified provider
 */
app.post('/authorize', async (c) => {
  try {
    const body = await c.req.json()
    const { provider } = z.object({ provider: z.string() }).parse(body)

    // In production, generate and store a unique state parameter
    const state = Math.random().toString(36).substring(7)

    // For now, return a placeholder URL
    // In production, use generateOAuthUrl from oauth.ts
    const authUrl = `https://oauth.example.com/${provider}?state=${state}`

    return c.json({
      success: true,
      authUrl,
      state,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate authorization URL'
    return c.json({ success: false, error: message }, 500)
  }
})

export default app
