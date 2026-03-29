import React, { useEffect, useRef, useState } from 'react'
import {
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
  Send,
  Sparkles,
} from 'lucide-react'

const BACKEND_URL = 'http://localhost:8787'

const INTEGRATIONS = [
  { id: 'cloudflare', name: 'Cloudflare', category: 'Hosting', icon: Cloud, color: 'text-orange-500' },
  { id: 'whatsapp', name: 'WhatsApp', category: 'Communication', icon: MessageCircle, color: 'text-green-500' },
  { id: 'google_drive', name: 'Google Drive', category: 'Storage', icon: FolderOpen, color: 'text-yellow-500' },
  { id: 'github', name: 'GitHub', category: 'Development', icon: Github, color: 'text-white' },
  { id: 'gmail', name: 'Gmail', category: 'Communication', icon: Mail, color: 'text-red-400' },
  { id: 'notion', name: 'Notion', category: 'Productivity', icon: BookOpen, color: 'text-neutral-300' },
]

const quickPrompts = [
  { label: 'Check Cloudflare status', icon: Cloud },
  { label: 'Draft a WhatsApp reply', icon: MessageCircle },
  { label: 'Summarize my emails', icon: Mail },
  { label: 'Fetch GitHub data', icon: Github },
]

function ChatBubble({ role, text }) {
  const isUser = role === 'user'
  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div
        className={`max-w-[85%] rounded-[24px] px-4 py-3 text-[15px] leading-relaxed shadow-lg backdrop-blur-md ${
          isUser ? 'rounded-br-[4px] bg-blue-600 text-white' : 'rounded-bl-[4px] border border-white/10 bg-white/5 text-white/90'
        }`}
      >
        {text}
      </div>
    </div>
  )
}

function LoginScreen({ onLogin }) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState('')

  const handleSSO = async (provider) => {
    setIsConnecting(true)
    setError('')
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      })

      if (response.ok) {
        const data = await response.json()
        onLogin(data.user)
      } else {
        setError('Login failed. Check your backend server.')
      }
    } catch {
      setError('Network error. Is your Cloudflare Worker running?')
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-[#0A0D14] p-6 text-white animate-in fade-in duration-500 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 mb-10 flex flex-col items-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-blue-500 to-indigo-600 shadow-[0_0_60px_rgba(59,130,246,0.4)] mb-8">
          <Sparkles className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome to Atom</h1>
        <p className="mt-3 text-center text-[15px] text-white/50 max-w-[280px]">Sign in to securely access your AI assistant and integrations.</p>
      </div>

      <div className="relative z-10 w-full max-w-sm space-y-3">
        {error && <div className="mb-4 rounded-xl bg-red-500/10 p-3 text-center text-sm text-red-400 border border-red-500/20">{error}</div>}
        {['google', 'microsoft', 'github'].map((provider) => (
          <button
            key={provider}
            onClick={() => handleSSO(provider)}
            disabled={isConnecting}
            className="group flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-[15px] font-medium capitalize transition-all hover:bg-white/10 hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnecting ? <Loader2 className="h-5 w-5 animate-spin text-white/50" /> : `Continue with ${provider}`}
          </button>
        ))}
      </div>
    </div>
  )
}

function IntegrationsView({ onBack, connectedApps, toggleApp, onLogout }) {
  const [geminiKey, setGeminiKey] = useState('')
  const [geminiStatus, setGeminiStatus] = useState({ loading: false, result: null, error: false })

  const [waToken, setWaToken] = useState('')
  const [waPhoneId, setWaPhoneId] = useState('')
  const [waStatus, setWaStatus] = useState({ loading: false, result: null, error: false })

  const testApiKey = async (provider, apiKey, extraData = {}) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/test-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey, extraData }),
      })
      const data = await res.json()
      return { success: data.success, message: data.message }
    } catch {
      return { success: false, message: 'Network error. Is the backend running?' }
    }
  }

  const handleTestGemini = async () => {
    if (!geminiKey) return
    setGeminiStatus({ loading: true, result: null, error: false })
    const res = await testApiKey('gemini', geminiKey)
    setGeminiStatus({ loading: false, result: res.message, error: !res.success })
  }

  const handleTestWhatsApp = async () => {
    if (!waToken || !waPhoneId) return
    setWaStatus({ loading: true, result: null, error: false })
    const res = await testApiKey('whatsapp', waToken, { phoneId: waPhoneId })
    setWaStatus({ loading: false, result: res.message, error: !res.success })
  }

  return (
    <div className="flex flex-col h-full bg-[#0A0D14] animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="px-6 pt-12 pb-6 border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/5 text-white/60 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-bold">Apps & Settings</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <section>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400 mb-4">Connected Tools</h3>
          <div className="grid gap-3">
            {INTEGRATIONS.map((app) => {
              const isConnected = connectedApps.includes(app.id)
              const Icon = app.icon
              return (
                <div key={app.id} className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/[0.02] transition-all hover:bg-white/[0.04]">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 ${app.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{app.name}</h4>
                      <p className="text-xs text-white/30">{app.category}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleApp(app.id)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                      isConnected ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-white text-black hover:bg-white/90'
                    }`}
                  >
                    {isConnected ? 'Connected' : 'Connect'}
                  </button>
                </div>
              )
            })}
          </div>
        </section>

        <section className="p-5 rounded-2xl bg-white/[0.02] border border-white/10">
          <div className="flex items-center gap-2 mb-4 text-white/80">
            <Key className="h-4 w-4" />
            <h4 className="text-sm font-bold">API Key Tester (Dev Tools)</h4>
          </div>
          <p className="text-xs text-white/40 mb-6 leading-relaxed">Test your keys against your Cloudflare backend here.</p>

          <div className="mb-6 space-y-2">
            <label className="text-[11px] font-bold uppercase text-white/50">Gemini API Key</label>
            <div className="flex gap-2">
              <input type="password" value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} placeholder="AIzaSy..." className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500/50" />
              <button onClick={handleTestGemini} disabled={geminiStatus.loading || !geminiKey} className="bg-blue-600/20 text-blue-400 px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-600/30 disabled:opacity-50">
                {geminiStatus.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test'}
              </button>
            </div>
            {geminiStatus.result && (
              <p className={`text-xs flex items-center gap-1 ${geminiStatus.error ? 'text-red-400' : 'text-green-400'}`}>
                {geminiStatus.error ? <AlertCircle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                {geminiStatus.result}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-bold uppercase text-white/50">WhatsApp Cloud API</label>
            <input type="password" value={waToken} onChange={(e) => setWaToken(e.target.value)} placeholder="Access Token (EAALX...)" className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-500/50" />
            <div className="flex gap-2">
              <input type="text" value={waPhoneId} onChange={(e) => setWaPhoneId(e.target.value)} placeholder="Phone Number ID" className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-500/50" />
              <button onClick={handleTestWhatsApp} disabled={waStatus.loading || !waToken || !waPhoneId} className="bg-green-600/20 text-green-400 px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-600/30 disabled:opacity-50">
                {waStatus.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test'}
              </button>
            </div>
            {waStatus.result && (
              <p className={`text-xs flex items-center gap-1 mt-1 ${waStatus.error ? 'text-red-400' : 'text-green-400'}`}>
                {waStatus.error ? <AlertCircle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                {waStatus.result}
              </p>
            )}
          </div>
        </section>

        <section className="pt-4 border-t border-white/10">
          <button onClick={onLogout} className="w-full rounded-xl border border-red-500/20 bg-red-500/10 py-3 text-sm font-bold text-red-400 transition-colors hover:bg-red-500/20">
            Sign Out
          </button>
        </section>
      </div>
    </div>
  )
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [view, setView] = useState('chat')
  const [messages, setMessages] = useState([
    { id: 'init-1', role: 'assistant', text: 'Welcome back. I am securely connected to your Cloudflare backend.' },
    { id: 'init-2', role: 'assistant', text: 'You can ask me to draft WhatsApp messages, check your hosting status, or summarize documents.' },
  ])
  const [input, setInput] = useState('')
  const [connectedApps, setConnectedApps] = useState(['cloudflare', 'whatsapp'])
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current && view === 'chat' && isAuthenticated) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [messages, view, isAuthenticated])

  const toggleApp = (id) => {
    setConnectedApps((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]))
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setView('chat')
  }

  const fetchBackendChat = async (userText, history) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...history, { role: 'user', text: userText }], connectedApps }),
      })
      if (!response.ok) throw new Error('Backend connection failed.')
      const data = await response.json()
      return data.reply
    } catch {
      return 'Network error. Make sure your Cloudflare Worker is running on localhost:8787.'
    }
  }

  const handleSend = async (rawText) => {
    const text = rawText?.trim()
    if (!text || isLoading) return

    const userMessage = { id: `user-${Date.now()}`, role: 'user', text }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    const aiResponseText = await fetchBackendChat(text, messages)
    setMessages((prev) => [...prev, { id: `ai-${Date.now()}`, role: 'assistant', text: aiResponseText }])
    setIsLoading(false)
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#020408] sm:p-4 overflow-hidden font-sans text-white relative">
      <div className="relative flex h-full w-full max-w-md flex-col overflow-hidden sm:h-[800px] sm:rounded-[40px] border border-white/10 bg-[#0A0D14] shadow-2xl">
        {!isAuthenticated ? (
          <LoginScreen onLogin={() => setIsAuthenticated(true)} />
        ) : view === 'chat' ? (
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
                <button onClick={() => setView('integrations')} className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/5 transition-colors">
                  <LayoutGrid className="h-5 w-5 text-white/60" />
                  {connectedApps.length > 0 && <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-500 border border-[#0A0D14]" />}
                </button>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 pb-44 pt-32 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex flex-col gap-5">
                {messages.map((m) => (
                  <ChatBubble key={m.id} role={m.role} text={m.text} />
                ))}
                {isLoading && (
                  <div className="flex w-full justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="max-w-[85%] rounded-[24px] rounded-bl-[4px] border border-white/10 bg-white/5 px-4 py-3 shadow-lg backdrop-blur-md">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8">
                <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.15em] text-white/30">Quick Actions</p>
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.map((p) => (
                    <button key={p.label} onClick={() => handleSend(p.label)} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/70 hover:bg-white/10 transition-all">
                      <p.icon className="h-3.5 w-3.5 text-blue-400" />
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 z-40 p-4 pb-8 sm:pb-6">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-2 shadow-2xl backdrop-blur-2xl ring-1 ring-white/5">
                <div className="flex items-center gap-2">
                  <button className="flex h-12 w-12 items-center justify-center rounded-[20px] bg-white/[0.05] text-white/60 hover:text-white transition-colors">
                    <Plus className="h-5 w-5" />
                  </button>
                  <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend(input)} placeholder="Message Atom..." className="flex-1 bg-transparent px-2 text-[15px] outline-none placeholder:text-white/30 disabled:opacity-50" disabled={isLoading} />
                  <button onClick={() => handleSend(input)} disabled={!input.trim() || isLoading} className={`flex h-12 w-12 items-center justify-center rounded-[20px] transition-all ${input.trim() && !isLoading ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/20'}`}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between px-3 pt-1 border-t border-white/5">
                  <div className="flex gap-2">
                    {connectedApps.slice(0, 4).map((appId) => {
                      const app = INTEGRATIONS.find((a) => a.id === appId)
                      return app ? <app.icon key={appId} className={`h-3.5 w-3.5 ${app.color} opacity-60`} title={app.name} /> : null
                    })}
                  </div>
                  <button className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/30 hover:text-white transition-colors">
                    <Mic className="h-3 w-3" /> Voice
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <IntegrationsView onBack={() => setView('chat')} connectedApps={connectedApps} toggleApp={toggleApp} onLogout={handleLogout} />
        )}
      </div>
    </div>
  )
}
