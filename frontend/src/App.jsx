import React, { useEffect, useMemo, useState } from 'react'
import {
  Atom,
  Grid3X3,
  Users,
  Star,
  Plus,
  Mic,
  ArrowUp,
  CalendarDays,
  Mail,
  FileText,
  Command,
} from 'lucide-react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8787'

const quickPrompts = ['What\'s on my calendar?', 'Summarize my email', 'Create a reminder']

const workspaceAccounts = [
  'keifferjapeth@gmail.com',
  'thekeifferjapeth@gmail.com',
  'propertiestage@gmail.com',
]

const integrationRequests = [
  {
    id: 'microsoft',
    title: 'Microsoft 365',
    description: 'Email, calendars, docs, sheets, enterprise accounts.',
    icon: Grid3X3,
  },
  {
    id: 'apple',
    title: 'Apple Ecosystem',
    description: 'High penetration among prosumers; deep personal workflows.',
    icon: Command,
  },
]

const memoryCards = [
  {
    id: 1,
    title: 'You prioritize fast, minimal interfaces',
    body: 'Observed across product direction, UI comments, and app feedback.',
    tag: 'PATTERN',
  },
  {
    id: 2,
    title: 'Atom is evolving into a second-brain workspace',
    body: 'Consistent alignment around memory, focus, and secure workflows.',
    tag: 'PRODUCT',
  },
]

function GlassCard({ children, className = '' }) {
  return <div className={`rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl backdrop-blur-lg ${className}`}>{children}</div>
}

function Shell({ children }) {
  return (
    <div className="mx-auto mt-6 w-[430px] max-w-[95vw] overflow-hidden rounded-[54px] border border-white/10 bg-[#06070d] text-white shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
      <div className="min-h-[880px] bg-[radial-gradient(circle_at_top,_rgba(30,36,60,0.35),_transparent_46%),linear-gradient(180deg,#05060b_0%,#070914_100%)]">
        {children}
      </div>
    </div>
  )
}

function BottomNav({ tab, setTab }) {
  const items = [
    { id: 'atom', label: 'Atom', icon: Atom },
    { id: 'panel', label: 'Panel', icon: Grid3X3 },
    { id: 'friends', label: 'Friends', icon: Users },
    { id: 'integrations', label: 'Integrations', icon: Star },
  ]

  return (
    <div className="fixed bottom-0 left-1/2 z-10 w-[430px] max-w-[95vw] -translate-x-1/2 border-t border-white/10 bg-[#070911]/90 px-5 py-4 backdrop-blur-xl">
      <div className="grid grid-cols-4 gap-2">
        {items.map((item) => {
          const Icon = item.icon
          const active = tab === item.id
          return (
            <button key={item.id} onClick={() => setTab(item.id)} className="flex flex-col items-center gap-2 text-center">
              <Icon className={`h-8 w-8 ${active ? 'text-white' : 'text-white/35'}`} />
              <span className={`text-[14px] ${active ? 'text-white' : 'text-white/35'}`}>{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function AccountToggle({ email }) {
  const initial = useMemo(() => email.charAt(0).toUpperCase(), [email])
  const [enabled, setEnabled] = useState(email === workspaceAccounts[0])

  return (
    <div className="flex items-center justify-between rounded-[26px] border border-white/10 bg-white/[0.03] px-4 py-4">
      <div className="mr-3 flex min-w-0 items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/25 text-xl text-white">{initial}</div>
        <p className="truncate text-[22px] text-white/95">{email}</p>
      </div>
      <button onClick={() => setEnabled((s) => !s)} className={`relative h-12 w-24 rounded-full transition ${enabled ? 'bg-white/90' : 'bg-white/20'}`}>
        <span className={`absolute top-1 h-10 w-10 rounded-full transition ${enabled ? 'left-[51px] bg-black' : 'left-1 bg-white'}`} />
      </button>
    </div>
  )
}

function SignIn({ onSignIn }) {
  return (
    <Shell>
      <div className="flex min-h-[880px] flex-col items-center px-8 pt-20 text-center">
        <div className="mb-10 h-44 w-44 rounded-full border-4 border-white/80" />
        <h1 className="text-8xl font-black tracking-tight">atom</h1>
        <p className="mt-20 text-4xl tracking-[0.5em] text-white/55">ATOM</p>
        <button
          onClick={onSignIn}
          className="mt-auto mb-24 w-full rounded-[34px] bg-white px-8 py-7 text-[52px] font-medium text-black"
        >
          Sign in securely
        </button>
      </div>
    </Shell>
  )
}

function AtomScreen() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', text: 'Welcome to Atom. Your secure, intelligent workspace.' },
    { id: 2, role: 'user', text: "What's on my calendar?" },
    { id: 3, role: 'assistant', text: 'You have 3 meetings today. First at 10:00 AM.' },
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
    <div className="px-6 pb-36 pt-8">
      <div className="space-y-5">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[88%] rounded-[30px] border px-7 py-6 text-[18px] leading-relaxed ${m.role === 'user' ? 'border-white bg-white text-black' : 'border-white/10 bg-white/[0.05] text-white/90'}`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex gap-3 overflow-x-auto pb-1">
        {quickPrompts.map((p) => (
          <button key={p} onClick={() => send(p)} className="shrink-0 rounded-full border border-white/10 bg-white/[0.05] px-5 py-3 text-lg text-white/70">
            {p}
          </button>
        ))}
      </div>

      <GlassCard className="mt-5 px-4 py-4">
        <div className="flex items-center gap-3">
          <button className="rounded-full p-2 text-white/65">
            <Plus className="h-8 w-8" />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send(input)}
            className="flex-1 bg-transparent text-[36px] text-white outline-none placeholder:text-white/35"
            placeholder="Write your message"
          />
          <button className="rounded-full p-2 text-white/65">
            <Mic className="h-8 w-8" />
          </button>
          <button className="rounded-full border border-white/10 bg-white/10 p-3 text-white" onClick={() => send(input)}>
            <ArrowUp className="h-6 w-6" />
          </button>
        </div>
      </GlassCard>
    </div>
  )
}

function IntegrationsScreen() {
  return (
    <div className="px-6 pb-36 pt-8 text-white">
      <h1 className="mb-6 text-center text-[52px] font-semibold tracking-wide">ATOM INTEGRATIONS</h1>

      <GlassCard className="p-4">
        <div className="mb-4 flex items-center gap-4 rounded-[26px] border border-white/10 bg-white/[0.03] p-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10">
            <Mail className="h-12 w-12 text-white/90" />
          </div>
          <div>
            <h2 className="text-[22px] font-medium">Connect Google Workspace</h2>
            <p className="text-[20px] leading-relaxed text-white/55">Connect your full suite of Google Workspace apps.</p>
          </div>
        </div>

        <div className="space-y-4">
          {workspaceAccounts.map((account) => (
            <AccountToggle key={account} email={account} />
          ))}

          <button className="flex w-full items-center gap-4 rounded-[26px] border border-white/10 bg-white/[0.03] px-5 py-5 text-[24px] text-white/75">
            <Plus className="h-8 w-8" />
            Add Workspace account
          </button>
        </div>

        <div className="mt-5 flex gap-3 overflow-x-auto pb-1">
          <button className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[20px] text-white/75"><CalendarDays className="h-5 w-5" /> Google Calendar</button>
          <button className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[20px] text-white/75"><Mail className="h-5 w-5" /> Gmail</button>
          <button className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[20px] text-white/75"><FileText className="h-5 w-5" /> Google Docs</button>
        </div>
      </GlassCard>

      <h3 className="mb-4 mt-8 text-[52px] font-semibold">Request an integration</h3>
      <div className="grid grid-cols-2 gap-4">
        {integrationRequests.map((item) => {
          const Icon = item.icon
          return (
            <GlassCard key={item.id} className="min-h-[270px] p-5">
              <div className="mb-12 inline-flex rounded-2xl bg-white/10 p-3">
                <Icon className="h-9 w-9 text-white" />
              </div>
              <h4 className="text-[24px] font-medium leading-tight">{item.title}</h4>
              <p className="mt-3 text-[18px] leading-relaxed text-white/55">{item.description}</p>
            </GlassCard>
          )
        })}
      </div>
    </div>
  )
}

function PanelScreen() {
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/panel/summary`)
        if (!res.ok) throw new Error('summary failed')
        const data = await res.json()
        setSummary(data)
      } catch {
        setSummary(null)
      }
    }
    run()
  }, [])

  const memoryCount = summary?.memories ?? 128
  const contextCount = summary?.contexts ?? 24
  const recentMemories = summary?.recentMemories?.length ? summary.recentMemories : memoryCards

  return (
    <div className="px-6 pb-36 pt-8 text-white">
      <h1 className="mb-4 text-center text-[52px] font-semibold tracking-[0.1em]">MEMORY PANEL</h1>
      <p className="mx-auto max-w-[360px] text-center text-[20px] leading-relaxed text-white/50">
        Your second brain: memories, summaries, patterns, and context.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <GlassCard className="p-5">
          <div className="text-[20px] tracking-[0.2em] text-white/50">MEMORIES</div>
          <div className="mt-2 text-[56px] font-semibold">{memoryCount}</div>
          <p className="text-[20px] leading-relaxed text-white/55">Saved from email, docs, chat</p>
        </GlassCard>
        <GlassCard className="p-5">
          <div className="text-[20px] tracking-[0.2em] text-white/50">CONTEXTS</div>
          <div className="mt-2 text-[56px] font-semibold">{contextCount}</div>
          <p className="text-[20px] leading-relaxed text-white/55">Active areas of focus</p>
        </GlassCard>
      </div>

      <GlassCard className="mt-5 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-[44px] font-medium">Recent Memory</h2>
            <p className="text-[20px] text-white/55">What Atom currently remembers about you</p>
          </div>
          <span className="rounded-full border border-white/20 px-4 py-1 text-[18px] text-white/65">LIVE</span>
        </div>

        <div className="space-y-4">
          {recentMemories.map((card, index) => (
            <GlassCard key={card.id || index} className="p-5">
              <div className="mb-2 flex justify-end">
                <span className="rounded-full border border-white/20 px-4 py-1 text-[16px] text-white/60">{card.tag || card.kind || 'MEMORY'}</span>
              </div>
              <h3 className="text-[44px] leading-tight">{card.title || card.summary}</h3>
              <p className="mt-2 text-[20px] leading-relaxed text-white/55">{card.body || `Confidence: ${Math.round((card.confidence || 0.85) * 100)}%`}</p>
            </GlassCard>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}

function FriendsScreen() {
  const [friends, setFriends] = useState([])

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/friends`)
        if (!res.ok) throw new Error('friends failed')
        const data = await res.json()
        setFriends(data.friends || [])
      } catch {
        setFriends([])
      }
    }
    run()
  }, [])

  const fallbackFriends = [
    { id: 'f_1', name: 'Design Lead', contextCount: 7 },
    { id: 'f_2', name: 'Product Team', contextCount: 11 },
  ]
  const displayed = friends.length ? friends : fallbackFriends

  return (
    <div className="px-6 pb-36 pt-8 text-white">
      <h1 className="mb-5 text-center text-[52px] font-semibold">FRIENDS</h1>
      <div className="space-y-4">
        {displayed.map((friend) => (
          <GlassCard key={friend.id} className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[30px] font-medium">{friend.name}</h2>
              <span className="rounded-full border border-white/20 px-4 py-1 text-[16px] text-white/65">{friend.contextCount} contexts</span>
            </div>
            <p className="mt-2 text-[18px] text-white/60">Relationship context and follow-up cues are tracked here.</p>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const [signedIn, setSignedIn] = useState(false)
  const [tab, setTab] = useState('atom')

  if (!signedIn) {
    return <SignIn onSignIn={() => setSignedIn(true)} />
  }

  return (
    <Shell>
      {tab === 'atom' && <AtomScreen />}
      {tab === 'panel' && <PanelScreen />}
      {tab === 'friends' && <FriendsScreen />}
      {tab === 'integrations' && <IntegrationsScreen />}
      <BottomNav tab={tab} setTab={setTab} />
    </Shell>
  )
}
