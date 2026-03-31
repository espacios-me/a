import React, { useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import { ArrowRight, Github, Mail, ShieldCheck, Sparkles, Waypoints } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { apiRequest, AuthProvidersResponse, ProviderId, beginSSO, loginDemo } from '@/lib/api'

const providerIcons: Record<string, React.ReactNode> = {
  google: <Mail className="h-4 w-4" />,
  github: <Github className="h-4 w-4" />,
  demo: <Sparkles className="h-4 w-4" />,
}

export default function Home() {
  const { user, loading } = useAuth()
  const [, setLocation] = useLocation()
  const [providers, setProviders] = useState<AuthProvidersResponse['providers']>([])

  useEffect(() => {
    apiRequest<AuthProvidersResponse>('/api/auth/providers')
      .then((response) => setProviders(response.providers))
      .catch(() => setProviders([]))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-700 border-t-white"></div>
      </div>
    )
  }

  const authButtons = providers.length > 0
    ? providers
    : [
        { id: 'google' as const, name: 'Google', available: true, supportsSSO: true, description: 'Google Workspace SSO' },
        { id: 'github' as const, name: 'GitHub', available: true, supportsSSO: true, description: 'GitHub SSO' },
        { id: 'demo' as const, name: 'Demo access', available: true, supportsSSO: false, description: 'Local demo mode' },
      ]

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 bg-black/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/60 mb-2">Atom App</p>
            <h1 className="text-2xl sm:text-3xl font-semibold">Integrations that feel invisible</h1>
          </div>
          <Button onClick={() => setLocation(user ? '/integrations' : '/chat')} variant="secondary">
            {user ? 'Open dashboard' : 'Preview chat'}
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <section className="grid lg:grid-cols-[1.15fr_0.85fr] gap-8 items-start">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-sm text-white/70 mb-6">
              <Waypoints className="h-4 w-4" />
              One place to connect, monitor, and trust your workflows
            </div>
            <h2 className="text-5xl sm:text-6xl font-semibold tracking-[-0.04em] leading-[0.95] mb-6">
              Seamless SSO, cleaner ops, and a premium integrations layer.
            </h2>
            <p className="text-lg sm:text-xl text-white/60 max-w-2xl mb-8 leading-relaxed">
              Atom now centers integrations around a simple truth: connecting a tool should feel as calm as using it.
              Sign in once, enable only what you need, and keep every surface reliable across mobile and desktop.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              {user ? (
                <>
                  <Button variant="primary" size="lg" onClick={() => setLocation('/integrations')}>
                    Go to integrations
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => setLocation('/chat')}>
                    Open AI chat
                  </Button>
                </>
              ) : (
                authButtons.map((provider) => (
                  <Button
                    key={provider.id}
                    variant={provider.id === 'demo' ? 'secondary' : 'primary'}
                    size="lg"
                    disabled={!provider.available}
                    onClick={() => {
                      if (provider.id === 'demo') {
                        void loginDemo('demo').then(() => setLocation('/integrations'))
                        return
                      }
                      beginSSO(provider.id as ProviderId, '/integrations')
                    }}
                  >
                    {providerIcons[provider.id]}
                    {provider.id === 'demo' ? 'Try demo' : `Continue with ${provider.name}`}
                  </Button>
                ))
              )}
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {[
                {
                  title: 'Intentional UX',
                  description: 'Focused cards, fewer decisions, and delightfully clear connection states.',
                },
                {
                  title: 'Production-ready auth',
                  description: 'Signed session cookies, real OAuth callback handling, and graceful config fallbacks.',
                },
                {
                  title: 'Operational calm',
                  description: 'Diagnostics, toggles, account labels, and empty states built for real teams.',
                },
              ].map((item) => (
                <Card key={item.title} variant="flat" className="bg-white/5 border border-white/10">
                  <CardContent>
                    <CardTitle className="text-white text-lg">{item.title}</CardTitle>
                    <CardDescription className="text-white/60">{item.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card variant="elevated" className="bg-[#0a0a0d] border border-white/10 shadow-2xl shadow-black/50 overflow-hidden">
            <CardContent className="p-0">
              <div className="p-6 sm:p-8 border-b border-white/10">
                <p className="text-xs uppercase tracking-[0.35em] text-white/50 mb-4">Preview</p>
                <div className="rounded-[2rem] border border-white/10 bg-black p-5 shadow-inner shadow-white/5">
                  <div className="rounded-[1.75rem] bg-white/[0.03] border border-white/10 p-5 space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-white/45">Atom Integrations</p>
                      <h3 className="text-2xl font-semibold mt-3">Connect Google Workspace</h3>
                      <p className="text-white/55 mt-2 leading-relaxed">Toggle Gmail, Calendar, and Drive from one calm workspace card.</p>
                    </div>
                    {[
                      'keifferjapeth@gmail.com',
                      'thekeifferjapeth@gmail.com',
                      'propertiestage@gmail.com',
                    ].map((email, index) => (
                      <div key={email} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-white/20 text-white/80 flex items-center justify-center font-semibold">
                            {email[0].toUpperCase()}
                          </div>
                          <span className="truncate text-white/85">{email}</span>
                        </div>
                        <div className={`w-12 h-7 rounded-full p-1 ${index === 0 ? 'bg-white' : 'bg-white/20'} transition-smooth`}>
                          <div className={`w-5 h-5 rounded-full ${index === 0 ? 'bg-black ml-auto' : 'bg-black/90'}`} />
                        </div>
                      </div>
                    ))}
                    <div className="grid grid-cols-3 gap-3 pt-2 text-sm text-white/65">
                      {['Google Calendar', 'Gmail', 'Drive'].map((chip) => (
                        <div key={chip} className="rounded-xl border border-white/10 px-3 py-2 bg-white/[0.03] text-center truncate">
                          {chip}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8 grid sm:grid-cols-2 gap-4 bg-gradient-to-b from-transparent to-white/[0.02]">
                {[
                  {
                    icon: <ShieldCheck className="h-5 w-5" />,
                    title: 'Signed sessions',
                    description: 'Secure cookie-based auth for the dashboard and callback flows.',
                  },
                  {
                    icon: <Sparkles className="h-5 w-5" />,
                    title: 'Graceful fallbacks',
                    description: 'Demo mode keeps product review moving before secrets are wired.',
                  },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
                      {item.icon}
                    </div>
                    <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                    <p className="text-white/60 text-sm leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}
