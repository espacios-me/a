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
import React, { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Atom,
  CalendarDays,
  Command,
  FolderOpen,
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Cloud,
  FolderOpen,
  Github,
  Key,
  LayoutGrid,
  Loader2,
  Mail,
  MessageCircle,
  Mic,
  Plus,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, "") || "http://localhost:8787";

const quickPrompts = ["What's on my calendar?", "Summarize my emails", "Create a reminder"];

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`flex h-7 w-12 items-center rounded-full p-1 transition-all ${checked ? "bg-white" : "bg-neutral-600"}`}
      aria-pressed={checked}
    >
      <span className={`h-5 w-5 rounded-full bg-black shadow-sm transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}
} from "lucide-react";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, "") || "http://localhost:8787";

const INTEGRATIONS = [
  { id: "cloudflare", name: "Cloudflare", category: "Hosting", icon: Cloud, color: "text-orange-500" },
  { id: "whatsapp", name: "WhatsApp", category: "Communication", icon: MessageCircle, color: "text-green-500" },
  { id: "google_drive", name: "Google Drive", category: "Storage", icon: FolderOpen, color: "text-yellow-500" },
  { id: "github", name: "GitHub", category: "Development", icon: Github, color: "text-white" },
  { id: "gmail", name: "Gmail", category: "Communication", icon: Mail, color: "text-red-400" },
  { id: "notion", name: "Notion", category: "Productivity", icon: BookOpen, color: "text-neutral-300" },
];

const quickPrompts = [
  { label: "Check Cloudflare status", icon: Cloud },
  { label: "Draft a WhatsApp reply", icon: MessageCircle },
  { label: "Summarize my emails", icon: Mail },
  { label: "Fetch GitHub data", icon: Github },
];

function ChatBubble({ role, text }) {
  const isUser = role === "user";
  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[88%] rounded-[22px] px-5 py-3.5 text-[15px] leading-relaxed backdrop-blur-md transition-all
          ${isUser ? "rounded-br-[6px] bg-white text-black" : "rounded-bl-[6px] border border-white/10 bg-white/5 text-white/90"}`}
        className={`max-w-[85%] rounded-[24px] px-4 py-3 text-[15px] leading-relaxed shadow-lg backdrop-blur-md
        ${isUser ? "rounded-br-[4px] bg-blue-600 text-white" : "rounded-bl-[4px] border border-white/10 bg-white/5 text-white/90"}`}
      >
        {text}
      </div>
    </div>
  );
}

function DynamicAtom() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setPhase((p) => (p + 1) % 4), 3400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      <div className="absolute inset-0 rounded-full bg-white/5" />
      <div
        className={`absolute inset-0 rounded-full bg-white/10 transition-all duration-[1800ms] ${
          phase === 0 ? "scale-100 opacity-100 shadow-[0_0_50px_rgba(255,255,255,0.15)_inset,0_0_35px_rgba(255,255,255,0.1)]" : "scale-95 opacity-0"
        }`}
      />
      <div
        className={`absolute inset-0 rounded-full bg-white transition-all duration-[1800ms] ${
          phase === 1 ? "scale-90 opacity-100 shadow-[0_0_60px_rgba(255,255,255,0.7),0_0_100px_rgba(255,255,255,0.3)]" : "scale-75 opacity-0"
        }`}
      />
      <div className={`absolute inset-0 transition-all duration-[1800ms] ${phase === 2 ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
        <div className="absolute inset-0 [transform:rotateX(60deg)_rotateY(20deg)]">
          <div className="h-full w-full animate-[spin_4.5s_linear_infinite] rounded-full border-[2px] border-dotted border-white/80" />
        </div>
        <div className="absolute inset-0 [transform:rotateX(20deg)_rotateY(65deg)]">
          <div className="h-full w-full animate-[spin_5.5s_linear_infinite_reverse] rounded-full border-[2px] border-dotted border-white/60" />
        </div>
      </div>
      <div className={`absolute inset-0 transition-all duration-[1800ms] ${phase === 3 ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
        <div className="h-full w-full animate-[spin_2s_linear_infinite] rounded-full border-[2px] border-white/80 border-t-transparent" />
      </div>
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    setIsConnecting(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "google" }),
      });

      if (!response.ok) throw new Error("Login failed");

      const data = await response.json();
      onLogin(data?.user || { name: "User" });
    } catch {
      setError("Could not connect to your Worker. Start it and try again.");
        body: JSON.stringify({ provider }),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();
      onLogin(data.user);
    } catch {
      setError("Could not connect to backend. Make sure your Worker is running.");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-[#050505] p-6 text-white">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#1f2b5f]/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[#5f2b57]/20 blur-3xl" />

      <div className="relative z-10 mb-16 flex flex-col items-center">
        <DynamicAtom />
        <div className="mt-8 flex items-start">
          <h1 className="text-5xl font-bold tracking-tighter text-white">atom</h1>
          <div className="ml-1.5 mt-2 h-2.5 w-2.5 rounded-full bg-white" />
        </div>
        <div className="mt-5 flex items-center gap-2 text-xs uppercase tracking-[0.26em] text-white/50">
          <Sparkles className="h-3.5 w-3.5" /> Secure Workspace
        </div>
      </div>

      <div className="relative z-10 w-full max-w-sm space-y-3">
        <button
          onClick={handleLogin}
          disabled={isConnecting}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/20 bg-white px-4 py-4 text-[15px] font-medium text-black transition-all hover:scale-[1.02] hover:bg-neutral-200 disabled:opacity-50"
        >
          {isConnecting ? <Loader2 className="h-5 w-5 animate-spin text-black/50" /> : "Sign in securely"}
        </button>
        {error && <p className="text-center text-xs text-red-300">{error}</p>}
    <div className="flex h-full w-full flex-col items-center justify-center bg-[#0A0D14] p-6 text-white relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 mb-10 flex flex-col items-center">
        <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-blue-500 to-indigo-600 shadow-[0_0_60px_rgba(59,130,246,0.4)]">
          <Sparkles className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome to Atom</h1>
        <p className="mt-3 max-w-[300px] text-center text-[15px] text-white/50">
          Sign in to securely access your AI assistant and integrations.
        </p>
      </div>

      <div className="relative z-10 w-full max-w-sm space-y-3">
        {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-sm text-red-400">{error}</div>}
        {["google", "microsoft", "github"].map((provider) => (
          <button
            key={provider}
            onClick={() => handleSSO(provider)}
            disabled={isConnecting}
            className="group flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-[15px] font-medium capitalize transition-all hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isConnecting ? <Loader2 className="h-5 w-5 animate-spin text-white/50" /> : `Continue with ${provider}`}
          </button>
        ))}
      </div>
    </div>
  );
}

function IntegrationsScreen() {
  const [toggles, setToggles] = useState({ keiffer: true, thekeiffer: true, properties: true });
  const handleToggle = (key) => setToggles((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="flex h-full flex-col bg-[#0E0E10] text-white">
      <div className="px-6 pb-4 pt-14">
        <h2 className="text-center text-[15px] font-bold uppercase tracking-widest text-white">Atom Integrations</h2>
      </div>

      <div className="flex-1 space-y-8 overflow-y-auto px-5 pb-32 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-5 shadow-xl">
          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
              <svg className="h-6 w-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            </div>
            <div>
              <h3 className="text-[17px] font-medium">Connect Google Workspace</h3>
              <p className="mt-1 text-xs leading-relaxed text-white/55">Connect your full suite of Google Workspace apps.</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { id: "keiffer", label: "keifferjapeth@gmail.com", avatar: "K" },
              { id: "thekeiffer", label: "thekeifferjapeth@gmail.com", avatar: "T" },
              { id: "properties", label: "propertiestage@gmail.com", avatar: "P" },
            ].map((account) => (
              <div key={account.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-3 pl-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-600 text-xs font-medium">{account.avatar}</div>
                  <span className="max-w-[170px] truncate text-sm font-medium text-white/90">{account.label}</span>
function IntegrationsView({ onBack, connectedApps, toggleApp, onLogout }) {
  const [geminiKey, setGeminiKey] = useState("");
  const [geminiStatus, setGeminiStatus] = useState({ loading: false, result: null, error: false });
  const [cloudflareStatus, setCloudflareStatus] = useState({ loading: false, result: null });

  const handleTestGemini = async () => {
    if (!geminiKey) return;
    setGeminiStatus({ loading: true, result: null, error: false });

    try {
      const res = await fetch(`${BACKEND_URL}/api/test-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "gemini", apiKey: geminiKey }),
      });
      const data = await res.json();
      setGeminiStatus({ loading: false, result: data.message || "Unknown response.", error: !data.success });
    } catch {
      setGeminiStatus({ loading: false, result: "Network error. Is backend running?", error: true });
    }
  };

  const handleCloudflareCheck = async () => {
    setCloudflareStatus({ loading: true, result: null });
    try {
      const res = await fetch(`${BACKEND_URL}/api/integrations/cloudflare/status`);
      const data = await res.json();
      setCloudflareStatus({ loading: false, result: `${data.status} • Workers: ${data.active_workers} • Cache hit: ${data.cache_hit_ratio}` });
    } catch {
      setCloudflareStatus({ loading: false, result: "Could not fetch Cloudflare status." });
    }
  };

  return (
    <div className="flex h-full flex-col bg-[#0A0D14]">
      <div className="border-b border-white/5 bg-black/20 px-6 pb-6 pt-12 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="-ml-2 rounded-full p-2 text-white/60 transition-colors hover:bg-white/5 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-bold">Apps & Settings</h2>
        </div>
      </div>

      <div className="flex-1 space-y-8 overflow-y-auto p-6 pb-32 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <section>
          <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">Connected Tools</h3>
          <div className="grid gap-3">
            {INTEGRATIONS.map((app) => {
              const isConnected = connectedApps.includes(app.id);
              const Icon = app.icon;
              return (
                <div key={app.id} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:bg-white/[0.04]">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ${app.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">{app.name}</h4>
                      <p className="text-xs text-white/30">{app.category}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleApp(app.id)}
                    className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                      isConnected ? "border border-green-500/20 bg-green-500/10 text-green-400" : "bg-white text-black hover:bg-white/90"
                    }`}
                  >
                    {isConnected ? "Connected" : "Connect"}
                  </button>
                </div>
                <ToggleSwitch checked={toggles[account.id]} onChange={() => handleToggle(account.id)} />
              </div>
            ))}

            <button className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm font-medium text-white/75 transition hover:bg-white/[0.08]">
              <Plus className="h-5 w-5" /> Add Workspace account
            </button>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Badge icon={CalendarDays} label="Google Calendar" />
            <Badge icon={Mail} label="Gmail" />
            <Badge icon={FolderOpen} label="Google Docs" />
            <Badge icon={MessageCircle} label="Chat" />
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-medium">Request an integration</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-[24px] border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-5">
              <div className="mb-3 grid h-10 w-10 grid-cols-2 gap-0.5 rounded-xl bg-white/10 p-2">
                <div className="rounded-[2px] bg-[#F25022]" />
                <div className="rounded-[2px] bg-[#7FBA00]" />
                <div className="rounded-[2px] bg-[#00A4EF]" />
                <div className="rounded-[2px] bg-[#FFB900]" />
              </div>
              <h4 className="mb-1.5 text-sm font-medium">Microsoft 365</h4>
              <p className="text-[11px] leading-relaxed text-white/55">Email, calendars, docs, sheets, enterprise accounts.</p>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <Command className="h-5 w-5" />
              </div>
              <h4 className="mb-1.5 text-sm font-medium">Apple Ecosystem</h4>
              <p className="text-[11px] leading-relaxed text-white/55">High penetration among prosumers; deep personal workflows.</p>
            </div>
          </div>
        </div>
        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="mb-4 flex items-center gap-2 text-white/80">
            <Key className="h-4 w-4" />
            <h4 className="text-sm font-bold">API Key Tester (Dev Tools)</h4>
          </div>
          <p className="mb-6 text-xs leading-relaxed text-white/40">
            Validate your Gemini key, then add it to Cloudflare Worker secrets.
          </p>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase text-white/50">Gemini API Key</label>
            <div className="flex gap-2">
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-blue-500/50"
              />
              <button
                onClick={handleTestGemini}
                disabled={geminiStatus.loading || !geminiKey}
                className="rounded-xl bg-blue-600/20 px-4 py-2 text-sm font-bold text-blue-400 hover:bg-blue-600/30 disabled:opacity-50"
              >
                {geminiStatus.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}
              </button>
            </div>
            {geminiStatus.result && (
              <p className={`flex items-center gap-1 text-xs ${geminiStatus.error ? "text-red-400" : "text-green-400"}`}>
                {geminiStatus.error ? <AlertCircle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                {geminiStatus.result}
              </p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <h4 className="mb-3 text-sm font-bold text-white/90">Cloudflare status</h4>
          <button onClick={handleCloudflareCheck} className="rounded-xl bg-orange-500/15 px-4 py-2 text-xs font-bold text-orange-300 hover:bg-orange-500/25">
            {cloudflareStatus.loading ? "Checking..." : "Check now"}
          </button>
          {cloudflareStatus.result && <p className="mt-3 text-xs text-white/70">{cloudflareStatus.result}</p>}
        </section>

        <section className="border-t border-white/10 pt-4">
          <button onClick={onLogout} className="w-full rounded-xl border border-red-500/20 bg-red-500/10 py-3 text-sm font-bold text-red-400 transition-colors hover:bg-red-500/20">
            Sign Out
          </button>
        </section>
      </div>
    </div>
  );
}

function Badge({ icon: Icon, label }) {
  return (
    <div className="flex shrink-0 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium text-white/75">
      <Icon className="h-4 w-4" /> {label}
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("atom");
  const [messages, setMessages] = useState([{ id: "init-1", role: "assistant", text: "Welcome to Atom. Your secure, intelligent workspace." }]);
  const [input, setInput] = useState("");
  const [view, setView] = useState("chat");
  const [messages, setMessages] = useState([
    { id: "init-1", role: "assistant", text: "Welcome back. I am securely connected to your Cloudflare backend." },
    { id: "init-2", role: "assistant", text: "You can ask me to summarize messages, check Cloudflare status, or draft WhatsApp replies." },
  ]);
  const [input, setInput] = useState("");
  const [connectedApps, setConnectedApps] = useState(["cloudflare", "whatsapp"]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current && activeTab === "atom" && isAuthenticated) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, activeTab, isAuthenticated]);
    if (scrollRef.current && view === "chat" && isAuthenticated) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, view, isAuthenticated]);

  const toggleApp = (id) => {
    setConnectedApps((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  };

  const handleSend = async (rawText) => {
    const text = rawText?.trim();
    if (!text || isLoading) return;

    const userMessage = { id: `user-${Date.now()}`, role: "user", text };
    const nextMessages = [...messages, userMessage];
    const nextHistory = [...messages, userMessage];
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, connectedApps: ["google_drive", "gmail", "cloudflare"] }),
      });

      const data = await response.json();
      const reply = data.reply || data.error || "I couldn't fetch a response right now.";
      setMessages((prev) => [...prev, { id: `ai-${Date.now()}`, role: "assistant", text: reply }]);
    } catch {
      setMessages((prev) => [...prev, { id: `err-${Date.now()}`, role: "assistant", text: "Network error fetching response." }]);
        body: JSON.stringify({ messages: nextHistory, connectedApps }),
      });

      const data = await response.json();
      const reply = data.reply || data.error || "I couldn't generate a response right now.";
      setMessages((prev) => [...prev, { id: `ai-${Date.now()}`, role: "assistant", text: reply }]);
    } catch {
      setMessages((prev) => [...prev, { id: `err-${Date.now()}`, role: "assistant", text: "Network error. Is your Cloudflare Worker running?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setView("chat");
  };

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-[#000000] font-sans text-white sm:p-4">
      <div className="pointer-events-none absolute -left-20 top-10 h-[320px] w-[320px] rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-12 h-[320px] w-[320px] rounded-full bg-fuchsia-500/10 blur-3xl" />

      <div className="relative flex h-full w-full max-w-md flex-col overflow-hidden border border-white/10 bg-[#0E0E10] shadow-2xl sm:h-[850px] sm:rounded-[40px]">
        {!isAuthenticated ? (
          <LoginScreen onLogin={() => setIsAuthenticated(true)} />
        ) : (
          <>
            {activeTab === "atom" && (
              <div className="relative flex h-full flex-1 flex-col">
                <div className="pointer-events-none absolute inset-x-0 top-0 z-30 bg-gradient-to-b from-[#0E0E10] via-[#0E0E10]/90 to-transparent px-6 pb-4 pt-12" />

                <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 pb-48 pt-16 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <div className="flex flex-col gap-5">
                    {messages.map((m) => (
                      <ChatBubble key={m.id} role={m.role} text={m.text} />
                    ))}
                    {isLoading && (
                      <div className="flex w-full justify-start">
                        <div className="max-w-[85%] rounded-[20px] rounded-bl-[4px] border border-white/10 bg-white/5 px-5 py-3.5 shadow-lg backdrop-blur-md">
                          <Loader2 className="h-5 w-5 animate-spin text-white/50" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="absolute inset-x-0 bottom-24 z-40 px-5">
                  <div className="flex gap-2 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {quickPrompts.map((label) => (
                      <button key={label} onClick={() => handleSend(label)} className="shrink-0 rounded-full border border-white/10 bg-[#1A1C20] px-4 py-2 text-[13px] text-white/70 transition hover:bg-white/10 hover:text-white">
                        {label}
                      </button>
                    ))}
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-[#020408] font-sans text-white sm:p-4">
      <div className="relative flex h-full w-full max-w-md flex-col overflow-hidden border border-white/10 bg-[#0A0D14] shadow-2xl sm:h-[800px] sm:rounded-[40px]">
        {!isAuthenticated ? (
          <LoginScreen onLogin={() => setIsAuthenticated(true)} />
        ) : view === "chat" ? (
          <>
            <div className="absolute inset-x-0 top-0 z-30 border-b border-white/5 bg-[#0A0D14]/60 px-6 py-5 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">Atom Secure</p>
                    <h1 className="text-xl font-bold text-white/95">chatspacr</h1>
                  </div>
                </div>
                <button onClick={() => setView("integrations")} className="relative flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-white/5">
                  <LayoutGrid className="h-5 w-5 text-white/60" />
                  {connectedApps.length > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full border border-[#0A0D14] bg-blue-500" />}
                </button>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 pb-44 pt-32 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex flex-col gap-5">
                {messages.map((m) => (
                  <ChatBubble key={m.id} role={m.role} text={m.text} />
                ))}
                {isLoading && (
                  <div className="flex w-full justify-start">
                    <div className="max-w-[85%] rounded-[24px] rounded-bl-[4px] border border-white/10 bg-white/5 px-4 py-3 shadow-lg backdrop-blur-md">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-[24px] border border-white/10 bg-[#1A1C20] p-2 pl-4 pr-2 shadow-2xl backdrop-blur-xl">
                    <button className="text-white/40 transition-colors hover:text-white">
                      <Plus className="h-5 w-5" />
              <div className="mt-8">
                <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.15em] text-white/30">Quick Actions</p>
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.map((p) => (
                    <button key={p.label} onClick={() => handleSend(p.label)} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/70 transition-all hover:bg-white/10">
                      <p.icon className="h-3.5 w-3.5 text-blue-400" />
                      {p.label}
                    </button>
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
                      placeholder="Write your message"
                      className="flex-1 bg-transparent px-2 py-2.5 text-[15px] outline-none placeholder:text-white/40 disabled:opacity-50"
                      disabled={isLoading}
                    />
                    <div className="flex items-center gap-2">
                      <button className="px-1 text-white/40 transition-colors hover:text-white">
                        <Mic className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleSend(input)}
                        disabled={!input.trim() || isLoading}
                        className={`flex h-9 w-9 items-center justify-center rounded-full transition-all ${input.trim() && !isLoading ? "bg-white text-black" : "bg-white/5 text-white/20"}`}
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" strokeWidth={3} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "integrations" && <IntegrationsScreen />}

            {(activeTab === "panel" || activeTab === "friends") && (
              <div className="flex flex-1 flex-col items-center justify-center text-white/40">
                <Atom className="mb-4 h-12 w-12 opacity-30" />
                <p>This view is under construction.</p>
            <div className="absolute inset-x-0 bottom-0 z-40 p-4 pb-8 sm:pb-6">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-2 shadow-2xl ring-1 ring-white/5 backdrop-blur-2xl">
                <div className="flex items-center gap-2">
                  <button className="flex h-12 w-12 items-center justify-center rounded-[20px] bg-white/[0.05] text-white/60 transition-colors hover:text-white">
                    <Plus className="h-5 w-5" />
                  </button>
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
                    placeholder="Message Atom..."
                    className="flex-1 bg-transparent px-2 text-[15px] outline-none placeholder:text-white/30 disabled:opacity-50"
                    disabled={isLoading}
                  />
                  <button
                    onClick={() => handleSend(input)}
                    disabled={!input.trim() || isLoading}
                    className={`flex h-12 w-12 items-center justify-center rounded-[20px] transition-all ${input.trim() && !isLoading ? "bg-blue-600 text-white" : "bg-white/5 text-white/20"}`}
                  >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-white/5 px-3 pt-1">
                  <div className="flex gap-2">
                    {connectedApps.slice(0, 4).map((appId) => {
                      const app = INTEGRATIONS.find((a) => a.id === appId);
                      return app ? <app.icon key={appId} className={`h-3.5 w-3.5 ${app.color} opacity-60`} title={app.name} /> : null;
                    })}
                  </div>
                  <button className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/30 transition-colors hover:text-white">
                    <Mic className="h-3 w-3" /> Voice
                  </button>
                </div>
              </div>
            )}

            <div className="absolute inset-x-0 bottom-0 z-50 flex h-24 items-start justify-around border-t border-white/10 bg-[#0E0E10]/85 px-2 pt-3 backdrop-blur-xl">
              <TabButton icon={Atom} label="Atom" active={activeTab === "atom"} onClick={() => setActiveTab("atom")} />
              <TabButton icon={LayoutGrid} label="Panel" active={activeTab === "panel"} onClick={() => setActiveTab("panel")} />
              <TabButton icon={Users} label="Friends" active={activeTab === "friends"} onClick={() => setActiveTab("friends")} />
              <button onClick={() => setActiveTab("integrations")} className={`flex flex-col items-center gap-1.5 p-2 transition-colors ${activeTab === "integrations" ? "text-white" : "text-white/35 hover:text-white/60"}`}>
                <div className="relative">
                  <Star className="h-6 w-6" strokeWidth={1.5} />
                  {activeTab === "integrations" && <div className="absolute -right-2 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#0E0E10] bg-white" />}
                </div>
                <span className="text-[10px] font-medium tracking-wide">Integrations</span>
              </button>
            </div>
          </>
        ) : (
          <IntegrationsView onBack={() => setView("chat")} connectedApps={connectedApps} toggleApp={toggleApp} onLogout={handleLogout} />
        )}
      </div>
    </div>
  );
}

function TabButton({ icon: Icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1.5 p-2 transition-colors ${active ? "text-white" : "text-white/35 hover:text-white/60"}`}>
      <Icon className="h-6 w-6" strokeWidth={1.5} />
      <span className="text-[10px] font-medium tracking-wide">{label}</span>
    </button>
  );
}
