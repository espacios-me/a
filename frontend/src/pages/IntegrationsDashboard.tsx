import React, { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Cloud,
  Folder,
  Github,
  Mail,
  MessageCircle,
  Plus,
  RefreshCcw,
  Shield,
  Star,
  ToggleRight,
} from 'lucide-react'
import { useLocation } from 'wouter'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { DiagnosticsResponse, IntegrationProviderState, IntegrationStateResponse, ProviderId, apiRequest, beginSSO, loginDemo } from '@/lib/api'

const providerAccent: Record<ProviderId, string> = {
  google: 'from-sky-500/20 to-cyan-500/10',
  github: 'from-zinc-400/20 to-zinc-500/10',
  microsoft: 'from-blue-500/20 to-indigo-500/10',
  whatsapp: 'from-emerald-500/20 to-green-500/10',
  cloudflare: 'from-orange-500/20 to-amber-500/10',
}

const providerIcons: Record<ProviderId, React.ReactNode> = {
  google: <Mail className="h-5 w-5" />,
  github: <Github className="h-5 w-5" />,
  microsoft: <Star className="h-5 w-5" />,
  whatsapp: <MessageCircle className="h-5 w-5" />,
  cloudflare: <Cloud className="h-5 w-5" />,
}

const requestCards = [
  {
    title: 'Microsoft 365',
    description: 'Email, calendars, docs, and enterprise identity for the next wave of Atom workflows.',
  },
  {
    title: 'Apple ecosystem',
    description: 'Calendar, Mail, Notes, and Shortcuts for deeply personal assistant flows.',
  },
]

function statusTone(status: IntegrationProviderState['status']) {
  switch (status) {
    case 'connected':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20'
    case 'available':
      return 'bg-blue-500/15 text-blue-200 border-blue-500/20'
    default:
      return 'bg-white/5 text-white/55 border-white/10'
  }
}

function healthTone(health: IntegrationProviderState['health']) {
  switch (health) {
    case 'healthy':
      return 'text-emerald-300'
    case 'attention':
      return 'text-amber-300'
    default:
      return 'text-white/45'
  }
}

export default function IntegrationsDashboard() {
  const { user, loading: authLoading, logout, refresh } = useAuth()
  const [, setLocation] = useLocation()
  const [state, setState] = useState<IntegrationStateResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<ProviderId | null>(null)
  const [diagnostics, setDiagnostics] = useState<Record<string, DiagnosticsResponse>>({})

  const loadState = async () => {
    setLoading(true)
    try {
      const response = await apiRequest<IntegrationStateResponse>('/api/integrations/state')
      setState(response)
      setError(null)
      if (response.providers.length > 0) {
        const preferred = response.providers.find((provider) => provider.connection)?.id || response.providers[0].id
        setSelectedProvider(preferred)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load integrations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadState()
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const auth = params.get('auth')
    const connected = params.get('connected')
    const reason = params.get('reason')

    if (auth === 'success' && connected) {
      setNotice(`${connected.charAt(0).toUpperCase()}${connected.slice(1)} connected successfully.`)
      params.delete('auth')
      params.delete('connected')
      window.history.replaceState({}, '', `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`)
    }

    if (auth === 'error' && reason) {
      setError(reason.replace(/-/g, ' '))
      params.delete('auth')
      params.delete('reason')
      window.history.replaceState({}, '', `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`)
    }
  }, [])

  useEffect(() => {
    if (!selectedProvider || diagnostics[selectedProvider]) return
    apiRequest<DiagnosticsResponse>(`/api/integrations/${selectedProvider}/diagnostics`)
      .then((response) => {
        setDiagnostics((current) => ({ ...current, [selectedProvider]: response }))
      })
      .catch(() => undefined)
  }, [selectedProvider, diagnostics])

  const workspaceProviders = useMemo(
    () => state?.providers.filter((provider) => provider.category === 'workspace') || [],
    [state],
  )

  const selectedDiagnostics = selectedProvider ? diagnostics[selectedProvider] : null

  const runAction = async (key: string, action: () => Promise<void>) => {
    setBusyKey(key)
    try {
      await action()
      await refresh()
      await loadState()
      if (selectedProvider) {
        const freshDiagnostics = await apiRequest<DiagnosticsResponse>(`/api/integrations/${selectedProvider}/diagnostics`)
        setDiagnostics((current) => ({ ...current, [selectedProvider]: freshDiagnostics }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusyKey(null)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/15 border-t-white" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white px-4 py-10">
        <div className="max-w-xl mx-auto">
          <Card variant="elevated" className="bg-[#0a0a0d] border border-white/10">
            <CardHeader>
              <p className="text-xs uppercase tracking-[0.35em] text-white/45 mb-3">Integrations</p>
              <CardTitle className="text-white text-3xl">Sign in to unlock seamless connections</CardTitle>
              <CardDescription className="text-white/60 max-w-lg">
                Atom now supports signed sessions and real OAuth callback flows. Connect Google Workspace or GitHub,
                or use the demo path while wiring your credentials.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" size="lg" onClick={() => beginSSO('google', '/integrations')}>
                <Mail className="h-4 w-4" />
                Continue with Google
              </Button>
              <Button className="w-full" size="lg" variant="secondary" onClick={() => beginSSO('github', '/integrations')}>
                <Github className="h-4 w-4" />
                Continue with GitHub
              </Button>
              <Button className="w-full" size="lg" variant="outline" onClick={() => void loginDemo('demo').then(() => setLocation('/integrations'))}>
                <Shield className="h-4 w-4" />
                Enter demo mode
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/45 mb-2">Atom Integrations</p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-[-0.03em]">Seamless connections, deliberate control.</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-white/50">{user.email}</p>
            </div>
            <Button variant="secondary" onClick={() => void runAction('refresh', loadState)} isLoading={busyKey === 'refresh'}>
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" onClick={() => void logout()}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {notice && (
          <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-emerald-200 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 mt-0.5" />
            <div>
              <p className="font-medium">Connection updated</p>
              <p className="text-sm text-emerald-100/80">{notice}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-amber-200 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <div>
              <p className="font-medium">We hit a recoverable snag.</p>
              <p className="text-sm text-amber-100/80">{error}</p>
            </div>
          </div>
        )}

        <section className="grid xl:grid-cols-[1.2fr_0.8fr] gap-6 xl:gap-8">
          <div className="space-y-6">
            <Card variant="elevated" className="bg-[#060608] border border-white/10 shadow-2xl shadow-black/40 overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6 sm:p-8 border-b border-white/10">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/45 mb-4">Connected Workspace</p>
                  <div className="rounded-[2rem] border border-white/10 bg-[#0d0d11] p-5 sm:p-6 space-y-5">
                    <div>
                      <h2 className="text-3xl font-semibold tracking-[-0.04em]">Connect Google Workspace</h2>
                      <p className="text-white/55 mt-2 max-w-xl leading-relaxed">
                        Your inbox, calendar, and files should feel like one surface. Connect once, then enable only the flows you trust.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {(workspaceProviders.length > 0 ? workspaceProviders : state?.providers || []).map((provider) => (
                        <div
                          key={provider.id}
                          className={`rounded-[1.6rem] border border-white/10 bg-gradient-to-r ${providerAccent[provider.id]} px-4 py-4 flex items-center justify-between gap-3`}
                        >
                          <button className="flex items-center gap-3 min-w-0 flex-1 text-left" onClick={() => setSelectedProvider(provider.id)}>
                            <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white/85 shrink-0">
                              {provider.connection?.accountLabel?.[0]?.toUpperCase() || provider.name[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate">{provider.connection?.accountLabel || provider.name}</p>
                              <p className="text-sm text-white/55 truncate">{provider.description}</p>
                            </div>
                          </button>

                          <button
                            className={`w-14 h-8 rounded-full p-1 transition-smooth ${provider.enabled ? 'bg-white' : 'bg-white/15'}`}
                            onClick={() =>
                              void runAction(`toggle:${provider.id}`, async () => {
                                await apiRequest(`/api/integrations/${provider.id}/settings`, {
                                  method: 'PATCH',
                                  body: JSON.stringify({ enabled: !provider.enabled }),
                                })
                              })
                            }
                            aria-label={`Toggle ${provider.name}`}
                          >
                            <div className={`w-6 h-6 rounded-full transition-smooth ${provider.enabled ? 'bg-black ml-auto' : 'bg-black/80'}`} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {['Google Calendar', 'Gmail', 'Drive'].map((chip) => (
                        <div key={chip} className="rounded-2xl border border-white/10 px-4 py-3 text-center text-sm text-white/70 bg-white/[0.03]">
                          {chip}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8 grid md:grid-cols-3 gap-4 bg-gradient-to-b from-transparent to-white/[0.02]">
                  {[
                    { label: 'Connected', value: state?.summary.connected || 0 },
                    { label: 'Available', value: state?.summary.available || 0 },
                    { label: 'Healthy', value: state?.summary.healthy || 0 },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-sm text-white/45">{item.label}</p>
                      <p className="text-3xl font-semibold mt-2">{item.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card variant="default" className="bg-[#09090c] border border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Provider rail</CardTitle>
                <CardDescription className="text-white/55">
                  Browse every integration, connect through SSO when available, then fine-tune the connection without leaving the page.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {state?.providers.map((provider) => (
                  <div
                    key={provider.id}
                    className={`rounded-2xl border ${selectedProvider === provider.id ? 'border-white/20 bg-white/[0.06]' : 'border-white/10 bg-white/[0.03]'} p-4`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <button className="flex items-start gap-3 text-left" onClick={() => setSelectedProvider(provider.id)}>
                        <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center text-white/85 shrink-0">
                          {providerIcons[provider.id]}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <p className="font-medium">{provider.name}</p>
                            <span className={`px-2.5 py-1 rounded-full text-xs border ${statusTone(provider.status)}`}>
                              {provider.status}
                            </span>
                          </div>
                          <p className="text-sm text-white/55 leading-relaxed max-w-xl">{provider.description}</p>
                        </div>
                      </button>

                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        {provider.supportsSSO && provider.available && !provider.connection && (
                          <Button size="sm" onClick={() => beginSSO(provider.id, '/integrations')}>
                            Connect with SSO
                          </Button>
                        )}
                        {!provider.connection && provider.supportsDemo && (
                          <Button
                            size="sm"
                            variant={provider.available ? 'secondary' : 'outline'}
                            isLoading={busyKey === `demo:${provider.id}`}
                            onClick={() =>
                              void runAction(`demo:${provider.id}`, async () => {
                                await loginDemo(provider.id)
                              })
                            }
                          >
                            Demo connect
                          </Button>
                        )}
                        {provider.connection && (
                          <Button
                            size="sm"
                            variant="outline"
                            isLoading={busyKey === `disconnect:${provider.id}`}
                            onClick={() =>
                              void runAction(`disconnect:${provider.id}`, async () => {
                                await apiRequest(`/api/integrations/${provider.id}/disconnect`, { method: 'POST' })
                              })
                            }
                          >
                            Disconnect
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                      <span className={`inline-flex items-center gap-1 ${healthTone(provider.health)}`}>
                        <CheckCircle2 className="h-4 w-4" />
                        {provider.health === 'healthy' ? 'Healthy' : provider.health === 'attention' ? 'Needs attention' : 'Needs setup'}
                      </span>
                      {provider.connection?.connectedAt && (
                        <span className="text-white/45">Connected {new Date(provider.connection.connectedAt).toLocaleDateString()}</span>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {provider.capabilities.map((capability) => (
                        <span key={capability} className="px-3 py-1.5 rounded-full text-xs border border-white/10 bg-white/[0.03] text-white/65">
                          {capability}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card variant="default" className="bg-[#09090c] border border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Selected diagnostics</CardTitle>
                <CardDescription className="text-white/55">
                  Quick observability for configuration, auth health, and account state.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(selectedDiagnostics?.checks || []).map((check) => (
                  <div key={check.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex items-start gap-3">
                    {check.status === 'pass' ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-300 mt-0.5" />
                    ) : check.status === 'warn' ? (
                      <AlertCircle className="h-5 w-5 text-amber-300 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-rose-300 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium">{check.label}</p>
                      <p className="text-sm text-white/55 leading-relaxed">{check.detail}</p>
                    </div>
                  </div>
                ))}
                {!selectedDiagnostics && <p className="text-white/45 text-sm">Choose a provider to inspect its current health.</p>}
              </CardContent>
            </Card>

            <Card variant="default" className="bg-[#09090c] border border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Request an integration</CardTitle>
                <CardDescription className="text-white/55">
                  Keep the roadmap focused. These next integrations are framed for premium personal and enterprise workflows.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                {requestCards.map((card) => (
                  <div key={card.title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
                      <Plus className="h-5 w-5 text-white/80" />
                    </div>
                    <h3 className="text-2xl font-semibold tracking-[-0.03em] mb-2">{card.title}</h3>
                    <p className="text-white/55 leading-relaxed text-sm">{card.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card variant="default" className="bg-[#09090c] border border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Operator notes</CardTitle>
                <CardDescription className="text-white/55">
                  The current build chooses the simplest strong architecture: signed sessions, modular provider metadata, and one calm control surface.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-white/60 leading-relaxed">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex gap-3">
                  <ToggleRight className="h-5 w-5 text-white/80 mt-0.5" />
                  OAuth-enabled providers redirect through the worker, then land back here with the session refreshed automatically.
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex gap-3">
                  <Folder className="h-5 w-5 text-white/80 mt-0.5" />
                  Connected provider metadata is normalized for the dashboard and the AI chat surface.
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex gap-3">
                  <ArrowUpRight className="h-5 w-5 text-white/80 mt-0.5" />
                  Missing credentials gracefully degrade into demo connect mode so the product remains explorable during setup.
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  )
}
