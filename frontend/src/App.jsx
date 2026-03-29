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

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://a.espacios.workers.dev'

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

        <button onClick={onLogout} className="w-full py-4 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm font-bold hover:bg-red-500/10 transition-all">
          Sign Out
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [view, setView] = useState('chat')
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hello! I'm Atom. How can I help you today?" },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [connectedApps, setConnectedApps] = useState(['cloudflare'])
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMsg = { role: 'user', text: input }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          connectedApps,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessages((prev) => [...prev, { role: 'assistant', text: data.reply }])
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', text: 'Sorry, I encountered an error. Please check your Gemini API key.' }])
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Network error. Is the backend running?' }])
    } finally {
      setIsLoading(false)
    }
  }

  const toggleApp = (appId) => {
    setConnectedApps((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    )
  }

  if (!user) return <LoginScreen onLogin={setUser} />

  if (view === 'integrations') {
    return (
      <IntegrationsView
        onBack={() => setView('chat')}
        connectedApps={connectedApps}
        toggleApp={toggleApp}
        onLogout={() => setUser(null)}
      />
    )
  }

  return (
    <div className="flex h-full w-full flex-col bg-[#0A0D14] text-white relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[100px] rounded-full pointer-events-none" />
      
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/20 backdrop-blur-xl z-20">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold tracking-tight">Atom</span>
        </div>
        <button onClick={() => setView('integrations')} className="p-2 rounded-xl hover:bg-white/5 text-white/60 hover:text-white transition-all">
          <LayoutGrid className="h-5 w-5" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {messages.map((msg, i) => (
          <ChatBubble key={i} {...msg} />
        ))}
        {isLoading && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-white/5 rounded-2xl rounded-bl-[4px] px-4 py-3 border border-white/10">
              <Loader2 className="h-4 w-4 animate-spin text-white/40" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-4 pb-8 bg-gradient-to-t from-[#0A0D14] via-[#0A0D14] to-transparent z-20">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 1 && (
            <div className="grid grid-cols-2 gap-2 px-2">
              {quickPrompts.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setInput(p.label)}
                  className="flex items-center gap-2 p-3 rounded-xl border border-white/5 bg-white/[0.02] text-[13px] text-white/50 hover:bg-white/5 hover:text-white/80 transition-all text-left"
                >
                  <p.icon className="h-3.5 w-3.5" />
                  {p.label}
                </button>
              ))}
            </div>
          )}
          
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-[26px] blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
            <div className="relative flex items-center gap-2 bg-[#161922] border border-white/10 rounded-[24px] p-2 pl-4 shadow-2xl">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask Atom anything..."
                className="flex-1 bg-transparent border-none outline-none text-[15px] py-2 placeholder:text-white/20"
              />
              <button className="p-2 text-white/20 hover:text-white/60 transition-colors">
                <Mic className="h-5 w-5" />
              </button>
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 disabled:opacity-50 disabled:grayscale transition-all"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
          <p className="text-[10px] text-center text-white/20 font-medium">
            Atom can make mistakes. Verify important information.
          </p>
        </div>
      </footer>
    </div>
  )
}
