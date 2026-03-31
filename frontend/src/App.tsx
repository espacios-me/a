import { useEffect, useState } from 'react'
import { Route, Switch, useLocation } from 'wouter'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { apiFetch } from '@/lib'

type Integration = {
  provider: string
  label: string
  connected: boolean
  status: 'connected' | 'disconnected' | 'error'
  detail: string
}

type Thread = {
  id: string
  title: string
  updatedAt: string
}

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  createdAt: string
}

const nav = [
  { href: '/integrations', label: 'Integrations' },
  { href: '/messaging', label: 'Messaging' },
  { href: '/panel', label: 'Panel' },
  { href: '/memory', label: 'Memory' },
  { href: '/friends', label: 'Friends' },
  { href: '/settings', label: 'Settings' },
]

function Shell({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation()
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <header className="sticky top-0 z-20 border-b border-zinc-900 bg-black/90 backdrop-blur px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Atom</p>
            <h1 className="text-lg font-semibold">Sign in → Integrations → Messaging</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-zinc-400 sm:block">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={() => void signOut()}>Sign out</Button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-4 md:grid-cols-[220px_1fr]">
        <nav className="overflow-auto rounded-2xl border border-zinc-900 bg-zinc-950 p-2">
          {nav.map((item) => (
            <button
              key={item.href}
              onClick={() => setLocation(item.href)}
              className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${location === item.href ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200'}`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <main>{children}</main>
      </div>
    </div>
  )
}

function SignIn() {
  const { user, signIn, loading } = useAuth()
  const [, setLocation] = useLocation()

  useEffect(() => {
    if (user) setLocation('/integrations')
  }, [user, setLocation])

  return (
    <div className="min-h-screen bg-black px-4 py-12 text-zinc-100">
      <div className="mx-auto max-w-lg space-y-4">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Atom access</p>
        <h1 className="text-3xl font-semibold">Calm ops for connected work.</h1>
        <p className="text-zinc-400">This is preview auth: polished UX with demo session cookies, ready to swap to real SSO providers.</p>
        <Card className="border-zinc-900 bg-zinc-950">
          <div className="space-y-3">
            {['Google SSO', 'GitHub SSO', 'Microsoft SSO'].map((label) => (
              <Button key={label} className="w-full justify-start" variant="secondary" onClick={() => void signIn(label)} isLoading={loading}>{label}</Button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

function IntegrationsPage() {
  const [items, setItems] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [, setLocation] = useLocation()

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiFetch<{ integrations: Integration[] }>('/api/integrations')
      setItems(data.integrations)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const toggle = async (provider: string, connect: boolean) => {
    await apiFetch('/api/integrations/toggle', { method: 'POST', body: JSON.stringify({ provider, connect }) })
    await load()
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Integrations control center</h2>
        <Button onClick={() => setLocation('/messaging')}>Open messaging</Button>
      </div>
      {loading ? <Card className="border-zinc-900 bg-zinc-950">Loading integrations...</Card> : null}
      {error ? <Card className="border-red-900/60 bg-red-950/30 text-red-300">{error}</Card> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <Card key={item.provider} className="border-zinc-900 bg-zinc-950">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-medium">{item.label}</h3>
                <p className="text-sm text-zinc-400">{item.detail}</p>
                <p className="mt-2 text-xs uppercase tracking-widest text-zinc-500">{item.status}</p>
              </div>
              <Button size="sm" variant={item.connected ? 'outline' : 'primary'} onClick={() => void toggle(item.provider, !item.connected)}>
                {item.connected ? 'Disconnect' : 'Connect'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}

function MessagingPage() {
  const [threads, setThreads] = useState<Thread[]>([])
  const [active, setActive] = useState<string>('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)

  const loadThreads = async () => {
    const data = await apiFetch<{ threads: Thread[] }>('/api/messaging/threads')
    setThreads(data.threads)
    if (!active && data.threads[0]) setActive(data.threads[0].id)
  }

  const loadMessages = async (threadId: string) => {
    const data = await apiFetch<{ messages: ChatMessage[] }>(`/api/messaging/threads/${threadId}`)
    setMessages(data.messages)
  }

  useEffect(() => { void loadThreads() }, [])
  useEffect(() => { if (active) void loadMessages(active) }, [active])

  const send = async () => {
    if (!input.trim() || !active) return
    setSending(true)
    try {
      await apiFetch('/api/messaging/send', { method: 'POST', body: JSON.stringify({ threadId: active, text: input }) })
      setInput('')
      await loadMessages(active)
      await loadThreads()
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="grid gap-3 md:grid-cols-[260px_1fr]">
      <Card className="border-zinc-900 bg-zinc-950">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm uppercase tracking-widest text-zinc-500">Threads</h3>
          <Button size="sm" variant="ghost" onClick={() => void apiFetch('/api/messaging/threads', { method: 'POST' }).then(loadThreads)}>New</Button>
        </div>
        <div className="space-y-1">
          {threads.map((t) => (
            <button key={t.id} onClick={() => setActive(t.id)} className={`w-full rounded-lg px-2 py-2 text-left ${active === t.id ? 'bg-zinc-900' : 'hover:bg-zinc-900/60'}`}>
              <p className="text-sm font-medium">{t.title}</p>
              <p className="text-xs text-zinc-500">{new Date(t.updatedAt).toLocaleString()}</p>
            </button>
          ))}
        </div>
      </Card>
      <Card className="flex min-h-[60vh] flex-col border-zinc-900 bg-zinc-950">
        <div className="flex-1 space-y-3 overflow-auto">
          {messages.map((m) => (
            <div key={m.id} className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.role === 'user' ? 'ml-auto bg-white text-black' : 'bg-zinc-900 text-zinc-100'}`}>
              {m.text}
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Message Atom" className="flex-1 bg-zinc-900 text-zinc-100" />
          <Button onClick={() => void send()} isLoading={sending}>Send</Button>
        </div>
      </Card>
    </section>
  )
}

const SimplePage = ({ title, note }: { title: string; note: string }) => (
  <Card className="border-zinc-900 bg-zinc-950">
    <h2 className="text-xl font-semibold">{title}</h2>
    <p className="mt-2 text-sm text-zinc-400">{note}</p>
  </Card>
)

function ProtectedApp() {
  const { user, loading } = useAuth()
  const [, setLocation] = useLocation()

  useEffect(() => {
    if (!loading && !user) setLocation('/')
  }, [loading, user, setLocation])

  if (loading || !user) return <div className="min-h-screen bg-black" />

  return (
    <Shell>
      <Switch>
        <Route path="/integrations" component={IntegrationsPage} />
        <Route path="/messaging" component={MessagingPage} />
        <Route path="/panel">{() => <SimplePage title="Panel" note="Operational pulse and summaries stay here." />}</Route>
        <Route path="/memory">{() => <SimplePage title="Memory" note="Structured memory remains intentionally lightweight for now." />}</Route>
        <Route path="/friends">{() => <SimplePage title="Friends" note="Collaboration graph placeholder, no competing UX directions." />}</Route>
        <Route path="/settings">{() => <SimplePage title="Settings" note="SSO/provider config lands here when production auth is connected." />}</Route>
        <Route>{() => <IntegrationsPage />}</Route>
      </Switch>
    </Shell>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Switch>
        <Route path="/" component={SignIn} />
        <Route component={ProtectedApp} />
      </Switch>
    </AuthProvider>
  )
}
