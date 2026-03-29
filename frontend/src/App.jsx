import React, { useMemo, useState } from 'react'
import {
  Atom,
  Grid3X3,
  Users,
  Puzzle,
  Star,
  Plus,
  Mic,
  ArrowUp,
  CalendarDays,
  Mail,
  FileText,
  Search,
  Monitor,
  Apple,
} from 'lucide-react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8787'

const quickPrompts = ['What’s on my calendar?', 'Summarize my emails', 'Create a reminder']

const workspaceAccounts = [
  'keifferjapeth@gmail.com',
  'thekeifferjapeth@gmail.com',
  'propertiestage@gmail.com',
]

const requestIntegrations = [
  {
    id: 'microsoft',
    title: 'Microsoft 365',
    description: 'Email, calendars, docs, sheets, enterprise accounts.',
    icon: Monitor,
    color: 'from-orange-500 to-blue-500',
  },
  {
    id: 'apple',
    title: 'Apple Ecosystem',
    description: 'High penetration among prosumers; deep personal workflows.',
    icon: Apple,
    color: 'from-white to-neutral-300',
  },
]

function GlassCard({ children, className = '' }) {
  return <div className={`rounded-[30px] border border-white/20 bg-white/[0.03] backdrop-blur-xl shadow-2xl ${className}`}>{children}</div>
}

function IntegrationPill({ icon: Icon, label }) {
  return (
    <button className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/[0.03] px-4 py-2 text-sm text-white/90">
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )
}

function AccountToggle({ email }) {
  const initial = useMemo(() => email.charAt(0).toUpperCase(), [email])
  const [enabled, setEnabled] = useState(false)

  return (
    <div className="flex items-center justify-between rounded-[26px] border border-white/20 bg-white/[0.02] px-4 py-4">
      <div className="mr-3 flex min-w-0 items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xl text-white/85">{initial}</div>
        <p className="break-all text-[20px] leading-tight text-white/95">{email}</p>
      </div>
      <button
        onClick={() => setEnabled((s) => !s)}
        className={`relative h-12 w-24 rounded-full transition ${enabled ? 'bg-blue-500/80' : 'bg-white/35'}`}
      >
        <span className={`absolute top-1 h-10 w-10 rounded-full bg-white transition ${enabled ? 'left-[50px]' : 'left-1'}`} />
      </button>
    </div>
  )
}

function IntegrationsScreen({ setTab }) {
  return (
    <div className="px-4 pb-28 pt-6 text-white">
      <h1 className="mb-5 text-center text-[48px] font-semibold tracking-wide">ATOM INTEGRATIONS</h1>

      <GlassCard className="p-4">
        <div className="mb-4 flex gap-4 rounded-[26px] border border-white/20 bg-white/[0.02] p-4">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[22px] border border-white/20 bg-white/5 text-5xl font-bold text-white">
            G
          </div>
          <div>
            <h2 className="text-4xl font-medium leading-tight">Connect Google Workspace</h2>
            <p className="mt-2 text-3xl leading-tight text-white/60">Connect your full suite of Google Workspace apps.</p>
          </div>
        </div>

        <div className="space-y-4">
          {workspaceAccounts.map((account) => (
            <AccountToggle key={account} email={account} />
          ))}

          <button className="flex w-full items-center gap-4 rounded-[26px] border border-white/20 bg-white/[0.02] px-5 py-5 text-4xl text-white/90">
            <Plus className="h-10 w-10" />
            Add Workspace account
          </button>
        </div>

        <div className="mt-6 flex gap-3 overflow-x-auto pb-1">
          <IntegrationPill icon={CalendarDays} label="Google Calendar" />
          <IntegrationPill icon={Mail} label="Gmail" />
          <IntegrationPill icon={FileText} label="Google Docs" />
        </div>
      </GlassCard>

      <h3 className="mt-8 mb-4 text-5xl font-semibold">Request an integration</h3>
      <div className="grid grid-cols-2 gap-3">
        {requestIntegrations.map((item) => {
          const Icon = item.icon
          return (
            <GlassCard key={item.id} className="min-h-[280px] p-5">
              <div className={`mb-10 inline-flex rounded-xl bg-gradient-to-br p-3 ${item.color}`}>
                <Icon className="h-10 w-10 text-black" />
              </div>
              <h4 className="text-4xl font-medium leading-tight">{item.title}</h4>
              <p className="mt-3 text-3xl leading-tight text-white/60">{item.description}</p>
            </GlassCard>
          )
        })}
      </div>

      <button onClick={() => setTab('atom')} className="mt-5 inline-flex items-center gap-2 text-sm text-white/70 hover:text-white">
        <ArrowUp className="h-4 w-4 rotate-[-90deg]" /> Back to Atom
      </button>
    </div>
  )
}

function AtomScreen() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', text: 'Summarize my emails', chip: true },
  ])

  const send = async (text) => {
    const value = text.trim()
    if (!value) return

    setMessages((m) => [...m, { id: Date.now(), role: 'user', text: value }])
    setInput('')

    try {
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', text: value }], connectedApps: ['gmail', 'calendar'] }),
      })
      if (!res.ok) throw new Error('chat failed')
      const data = await res.json()
      setMessages((m) => [...m, { id: Date.now() + 1, role: 'assistant', text: data.reply || 'Done.' }])
    } catch {
      setMessages((m) => [...m, { id: Date.now() + 1, role: 'assistant', text: 'Network error. Check Worker URL and CORS.' }])
    }
  }

  return (
    <div className="px-4 pb-28 pt-6 text-white">
      <GlassCard className="mb-4 overflow-hidden p-4">
        <div className="mb-3 flex items-center justify-between text-white/80">
          <button className="rounded-xl border border-white/20 bg-white/10 p-3">
            <Grid3X3 className="h-5 w-5" />
          </button>
          <button className="rounded-xl border border-white/20 bg-white/10 p-3">
            <Mic className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-[400px] rounded-[22px] border border-white/20 bg-black/20 p-4">
          {messages.map((m) => (
            <div key={m.id} className={`mb-3 ${m.role === 'assistant' ? 'text-left' : 'text-right'}`}>
              <div className={`inline-block rounded-2xl px-4 py-2 text-lg ${m.role === 'assistant' ? 'border border-white/20 bg-white/10' : 'bg-blue-500/70'}`}>
                {m.text}
              </div>
              {m.chip && (
                <div className="mt-2 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-[#1e2037]/70 px-3 py-2 text-base">
                  <Atom className="h-4 w-4" /> ATOM
                </div>
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="mb-3 flex gap-2 overflow-x-auto">
        {quickPrompts.map((p) => (
          <button key={p} onClick={() => send(p)} className="shrink-0 rounded-full border border-white/20 bg-white/[0.06] px-4 py-2 text-lg text-white/90">
            {p}
          </button>
        ))}
      </div>

      <GlassCard className="p-3">
        <div className="mb-2 text-2xl text-white/50">Write your message</div>
        <div className="flex items-center gap-2">
          <button className="rounded-xl p-3 text-white/80">
            <Plus className="h-7 w-7" />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send(input)}
            className="flex-1 bg-transparent text-xl outline-none placeholder:text-white/30"
            placeholder="Message Atom"
          />
          <button className="rounded-full border border-white/20 bg-white/20 p-3 text-white" onClick={() => send(input)}>
            <ArrowUp className="h-6 w-6" />
          </button>
        </div>
      </GlassCard>
    </div>
  )
}

function BottomNav({ tab, setTab }) {
  const items = [
    { key: 'atom', label: 'Atom', icon: Atom },
    { key: 'panel', label: 'Panel', icon: Grid3X3 },
    { key: 'friends', label: 'Friends', icon: Users },
    { key: 'integrations', label: 'Integrations', icon: Puzzle },
  ]

  return (
    <div className="fixed bottom-4 left-1/2 z-40 w-[min(95vw,700px)] -translate-x-1/2 rounded-[34px] border border-white/25 bg-[#171b2d]/80 p-2 backdrop-blur-xl">
      <div className="grid grid-cols-4 gap-2">
        {items.map((item) => {
          const Icon = item.icon
          const active = item.key === tab
          return (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`rounded-2xl px-2 py-3 text-center ${active ? 'border border-white/40 bg-white/10 text-white' : 'text-white/60'}`}
            >
              <Icon className="mx-auto mb-1 h-6 w-6" />
              <span className="text-sm">{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState('integrations')

  return (
    <div className="min-h-screen bg-[#070b16] text-white">
      <div className="mx-auto min-h-screen w-full max-w-[720px] bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,.18),transparent_30%),radial-gradient(circle_at_80%_70%,rgba(99,102,241,.12),transparent_30%),#070b16]">
        <div className="flex items-center justify-between px-6 pt-6 text-white/90">
          <div className="text-3xl font-semibold">9:44 ◐</div>
          <div className="rounded-full border border-white/15 bg-black/40 px-4 py-2">
            <Search className="h-5 w-5" />
          </div>
          <div className="h-6 w-16 rounded-xl border border-white/20" />
        </div>

        {tab === 'integrations' ? <IntegrationsScreen setTab={setTab} /> : <AtomScreen />}

        <div className="pointer-events-none fixed bottom-1 right-4 text-white/60">
          <Star className="h-10 w-10" />
        </div>
      </div>
      <BottomNav tab={tab} setTab={setTab} />
    </div>
  )
}
