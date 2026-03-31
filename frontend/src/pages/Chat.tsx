import React, { useEffect, useRef, useState } from 'react'
import { useLocation } from 'wouter'
import { ArrowUp, BrainCircuit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { IntegrationStateResponse, apiRequest } from '@/lib/api'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function Chat() {
  const { user, loading: authLoading } = useAuth()
  const [, setLocation] = useLocation()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'intro',
      role: 'assistant',
      content: 'I can now reason over your connected tools. Ask for a status check, draft a message, or plan your next workflow.',
      timestamp: new Date(),
    },
  ])
  const [connectedApps, setConnectedApps] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!user) return
    apiRequest<IntegrationStateResponse>('/api/integrations/state')
      .then((response) => {
        const apps = response.providers
          .filter((provider) => provider.connection && provider.enabled)
          .map((provider) => provider.name)
        setConnectedApps(apps)
      })
      .catch(() => setConnectedApps([]))
  }, [user])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: `${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const response = await apiRequest<{ reply: string }>('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: nextMessages.map((message) => ({ role: message.role, text: message.content })),
          connectedApps,
        }),
      })

      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          content: response.reply,
          timestamp: new Date(),
        },
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reach the assistant')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/15 border-t-white" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-xl mb-4">Sign in before opening the connected assistant.</p>
          <Button onClick={() => setLocation('/')} variant="primary">
            Back to home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="border-b border-white/10 sticky top-0 z-40 bg-black/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/45 mb-2">Atom Chat</p>
            <h1 className="text-2xl font-semibold tracking-[-0.03em]">Connected assistant</h1>
            <div className="flex flex-wrap gap-2 mt-3">
              {connectedApps.length > 0 ? connectedApps.map((app) => (
                <span key={app} className="px-3 py-1 rounded-full text-xs border border-white/10 bg-white/[0.04] text-white/65">
                  {app}
                </span>
              )) : (
                <span className="text-sm text-white/45">No enabled integrations yet</span>
              )}
            </div>
          </div>
          <Button variant="secondary" onClick={() => setLocation('/integrations')}>
            Dashboard
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] sm:max-w-xl px-4 py-3 rounded-3xl ${
                  message.role === 'user'
                    ? 'bg-white text-black rounded-br-lg'
                    : 'bg-white/[0.05] border border-white/10 text-white rounded-bl-lg'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 text-white/45 text-xs uppercase tracking-[0.25em] mb-2">
                    <BrainCircuit className="h-3.5 w-3.5" />
                    Atom
                  </div>
                )}
                <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>
                <span className={`text-xs mt-2 block ${message.role === 'user' ? 'text-black/55' : 'text-white/40'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/[0.05] border border-white/10 rounded-3xl rounded-bl-lg px-4 py-3 text-white/70">
                Thinking through your connected tools...
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-white/10 bg-black/90">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-2 flex items-end gap-2">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  void sendMessage()
                }
              }}
              rows={1}
              placeholder="Ask Atom to work across your integrations..."
              className="flex-1 min-h-[52px] max-h-40 resize-none bg-transparent border-0 focus:border-0 focus:shadow-none px-4 py-3"
            />
            <Button variant="primary" onClick={() => void sendMessage()} disabled={loading || !input.trim()} className="rounded-2xl px-4 h-[52px]">
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
