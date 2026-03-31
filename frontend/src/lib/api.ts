export type ProviderId = 'google' | 'github' | 'microsoft' | 'whatsapp' | 'cloudflare'

export interface SessionUser {
  id: string
  name: string
  email: string
  avatarUrl?: string
  provider: string
}

export interface IntegrationConnection {
  provider: ProviderId
  enabled: boolean
  connectedAt: string
  accountLabel: string
  scopes: string[]
  health: 'healthy' | 'attention' | 'unconfigured'
}

export interface IntegrationProviderState {
  id: ProviderId
  name: string
  category: 'workspace' | 'developer' | 'messaging' | 'infrastructure'
  description: string
  capabilities: string[]
  available: boolean
  supportsSSO: boolean
  supportsDemo: boolean
  status: 'connected' | 'available' | 'unconfigured'
  enabled: boolean
  connection?: IntegrationConnection
  health: 'healthy' | 'attention' | 'unconfigured'
}

export interface IntegrationStateResponse {
  user: SessionUser | null
  providers: IntegrationProviderState[]
  summary: {
    connected: number
    available: number
    healthy: number
  }
}

export interface AuthProvidersResponse {
  providers: Array<{
    id: ProviderId | 'demo'
    name: string
    available: boolean
    supportsSSO: boolean
    description: string
  }>
}

export interface DiagnosticsResponse {
  provider: ProviderId
  checks: Array<{
    label: string
    status: 'pass' | 'warn' | 'fail'
    detail: string
  }>
}

export const API_BASE_URL = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '')

function buildUrl(path: string) {
  return `${API_BASE_URL}${path}`
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers || {})
  const hasBody = init.body !== undefined && init.body !== null

  if (hasBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(buildUrl(path), {
    ...init,
    headers,
    credentials: 'include',
  })

  const isJson = (response.headers.get('content-type') || '').includes('application/json')
  const payload = isJson ? await response.json().catch(() => null) : null

  if (!response.ok) {
    const message = payload?.error || payload?.message || 'Request failed'
    throw new Error(message)
  }

  return payload as T
}

export function beginSSO(provider: ProviderId, redirectTo = '/integrations') {
  const target = new URL(buildUrl('/api/auth/sso/start'), window.location.origin)
  target.searchParams.set('provider', provider)
  target.searchParams.set('redirectTo', redirectTo)
  window.location.assign(target.toString())
}

export async function loginDemo(provider: ProviderId | 'demo' = 'demo') {
  return apiRequest<{ user: SessionUser; success: boolean }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ provider }),
  })
}

export async function logoutRequest() {
  return apiRequest<{ success: boolean }>('/api/auth/logout', {
    method: 'POST',
  })
}
