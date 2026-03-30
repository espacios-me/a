import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Bot, ChevronLeft, Loader2, MessageSquarePlus, Plus, RefreshCw, SendHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useLocation } from 'wouter'

type MessageRole = 'assistant' | 'user'
type MessageStatus = 'failed' | 'sending' | 'sent'

type ConversationSummary = {
  id: string
  title: string
  preview: string
  updatedAt: string
  messageCount: number
  lastMessageRole: MessageRole
  connectedApps: string[]
}

type MessageRecord = {
  id: string
  conversationId: string
  role: MessageRole
  content: string
  status: MessageStatus
  createdAt: string
  error?: string
  model?: string
  latencyMs?: number
}

type SendMessageResponse = {
  conversation: ConversationSummary
  messages: MessageRecord[]
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const DRAFT_ID = '__draft__'
const DEFAULT_CONNECTED_APPS = ['gmail', 'google-drive', 'github']
const QUICK_PROMPTS = [
  'Summarize this thread and suggest next steps',
  'Draft a calm reply I can send today',
  'Turn this into a clear action list',
]

function apiUrl(path: string) {
  return `${API_BASE}${path}`
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })

  if (!response.ok) {
    let message = 'Something went wrong'
    try {
      const data = await response.json()
      message = data?.error || data?.message || message
    } catch {
      message = response.statusText || message
    }
    throw new Error(message)
  }

  return response.json() as Promise<T>
}

function getConnectedApps(): string[] {
  if (typeof window === 'undefined') return DEFAULT_CONNECTED_APPS

  try {
    const raw = window.localStorage.getItem('atom:connected-apps')
    if (!raw) return DEFAULT_CONNECTED_APPS
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CONNECTED_APPS
  } catch {
    return DEFAULT_CONNECTED_APPS
  }
}

function sortConversations(items: ConversationSummary[]) {
  return [...items].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

function formatMessageTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function formatUpdatedAt(iso: string) {
  const date = new Date(iso)
  const now = new Date()
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function optimisticMessage(content: string): MessageRecord {
  return {
    id: `local-${Date.now()}`,
    conversationId: DRAFT_ID,
    role: 'user',
    content,
    status: 'sending',
    createdAt: new Date().toISOString(),
  }
}

function draftConversation(content: string, connectedApps: string[]): ConversationSummary {
  return {
    id: DRAFT_ID,
    title: content.length > 36 ? `${content.slice(0, 36).trimEnd()}…` : content,
    preview: content,
    updatedAt: new Date().toISOString(),
    messageCount: 1,
    lastMessageRole: 'user',
    connectedApps,
  }
}

export default function Chat() {
  const { user, loading: authLoading } = useAuth()
  const [, setLocation] = useLocation()
  const connectedApps = useMemo(() => getConnectedApps(), [])
  const [showList, setShowList] = useState(true)
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, MessageRecord[]>>({})
  const [booting, setBooting] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [composerValue, setComposerValue] = useState('')

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) || null,
    [conversations, activeConversationId]
  )

  const activeMessages = useMemo(() => {
    if (!activeConversationId) return []
    return messagesByConversation[activeConversationId] || []
  }, [messagesByConversation, activeConversationId])

  const loadConversations = useCallback(async () => {
    try {
      setBooting(true)
      const data = await request<{ conversations: ConversationSummary[] }>('/api/conversations')
      const next = sortConversations(data.conversations)
      setConversations(next)
      setActiveConversationId((current) => current || next[0]?.id || null)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load conversations')
    } finally {
      setBooting(false)
    }
  }, [])

  const loadMessages = useCallback(async (conversationId: string) => {
    if (!conversationId || conversationId === DRAFT_ID) return
    try {
      setLoadingMessages(true)
      const data = await request<{ conversation: ConversationSummary | null; messages: MessageRecord[] }>(`/api/conversations/${conversationId}/messages`)
      setMessagesByConversation((current) => ({ ...current, [conversationId]: data.messages }))
      if (data.conversation) {
        setConversations((current) => {
          const exists = current.some((conversation) => conversation.id === data.conversation?.id)
          return sortConversations(
            exists
              ? current.map((conversation) => (conversation.id === data.conversation?.id ? data.conversation : conversation))
              : [data.conversation, ...current]
          )
        })
      }
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load messages')
    } finally {
      setLoadingMessages(false)
    }
  }, [])

  useEffect(() => {
    void loadConversations()
  }, [loadConversations])

  useEffect(() => {
    if (activeConversationId) setShowList(false)
  }, [activeConversationId])

  useEffect(() => {
    if (!activeConversationId || activeConversationId === DRAFT_ID) return
    if (messagesByConversation[activeConversationId]) return
    void loadMessages(activeConversationId)
  }, [activeConversationId, loadMessages, messagesByConversation])

  const startNewConversation = () => {
    setActiveConversationId(DRAFT_ID)
    setMessagesByConversation((current) => ({ ...current, [DRAFT_ID]: [] }))
    setShowList(false)
  }

  const sendMessage = useCallback(async (rawValue: string) => {
    const content = rawValue.trim()
    if (!content || sending) return

    setSending(true)
    setError(null)

    const targetConversationId = activeConversationId || DRAFT_ID
    const pendingMessage = optimisticMessage(content)

    setActiveConversationId(targetConversationId)
    setMessagesByConversation((current) => ({
      ...current,
      [targetConversationId]: [...(current[targetConversationId] || []), pendingMessage],
    }))

    setConversations((current) => {
      const withoutDraft = current.filter((conversation) => conversation.id !== DRAFT_ID)
      return sortConversations(
        targetConversationId === DRAFT_ID
          ? [draftConversation(content, connectedApps), ...withoutDraft]
          : current.map((conversation) =>
              conversation.id === targetConversationId
                ? {
                    ...conversation,
                    preview: content,
                    updatedAt: pendingMessage.createdAt,
                    messageCount: conversation.messageCount + 1,
                    lastMessageRole: 'user',
                    connectedApps,
                  }
                : conversation
            )
      )
    })

    try {
      const response = await request<SendMessageResponse>('/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: targetConversationId === DRAFT_ID ? undefined : targetConversationId,
          content,
          connectedApps,
        }),
      })

      setMessagesByConversation((current) => {
        const next = { ...current }
        delete next[DRAFT_ID]
        next[response.conversation.id] = response.messages
        return next
      })

      setConversations((current) => {
        const next = current.filter((conversation) => conversation.id !== DRAFT_ID && conversation.id !== response.conversation.id)
        return sortConversations([response.conversation, ...next])
      })

      setActiveConversationId(response.conversation.id)
      setComposerValue('')
    } catch (err) {
      setMessagesByConversation((current) => ({
        ...current,
        [targetConversationId]: (current[targetConversationId] || []).map((message) =>
          message.id === pendingMessage.id
            ? { ...message, status: 'failed', error: err instanceof Error ? err.message : 'Message failed to send' }
            : message
        ),
      }))
      setError(err instanceof Error ? err.message : 'Message failed to send')
    } finally {
      setSending(false)
    }
  }, [activeConversationId, connectedApps, sending])

  const retryMessage = async (message: MessageRecord) => {
    setMessagesByConversation((current) => ({
      ...current,
      [message.conversationId]: (current[message.conversationId] || []).filter((entry) => entry.id !== message.id),
    }))
    await sendMessage(message.content)
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-gray-300 border-t-black dark:border-gray-700 dark:border-t-white" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4 dark:bg-black">
        <div className="w-full max-w-md rounded-[2rem] border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-white">Open Atom from the home screen</h1>
          <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-gray-400">Start a session from the landing page first, then come back here for the full messaging workspace.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={() => setLocation('/')} variant="primary">Go to home</Button>
            <Button onClick={() => setLocation('/integrations')} variant="secondary">Integrations</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row">
        <aside className={`${showList ? 'flex' : 'hidden'} h-screen w-full flex-col border-r border-gray-200 bg-gray-50/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80 lg:flex lg:w-[340px] lg:min-w-[340px]`}>
          <div className="border-b border-gray-200 px-4 py-4 dark:border-gray-800 sm:px-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Atom</p>
                <h1 className="mt-1 text-xl font-semibold tracking-tight text-black dark:text-white">Messages</h1>
              </div>
              <button type="button" onClick={startNewConversation} className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-black transition hover:border-gray-300 hover:shadow-sm dark:border-gray-800 dark:bg-black dark:text-white dark:hover:border-gray-700">
                <MessageSquarePlus className="h-4 w-4" />
                New
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {conversations.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-gray-300 bg-white/70 px-5 py-6 text-sm text-gray-500 dark:border-gray-800 dark:bg-black/40 dark:text-gray-400">Start a conversation and Atom will keep the thread organized, persistent, and easy to revisit.</div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conversation) => {
                  const active = conversation.id === activeConversationId
                  return (
                    <button key={conversation.id} type="button" onClick={() => { setActiveConversationId(conversation.id); setShowList(false) }} className={[
                      'w-full rounded-3xl border px-4 py-3 text-left transition-all',
                      active ? 'border-black bg-black text-white shadow-sm dark:border-white dark:bg-white dark:text-black' : 'border-transparent bg-white text-black hover:border-gray-200 hover:shadow-sm dark:bg-black/40 dark:text-white dark:hover:border-gray-800',
                    ].join(' ')}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{conversation.title}</p>
                          <p className={['mt-1 truncate text-sm', active ? 'text-white/80 dark:text-black/70' : 'text-gray-500 dark:text-gray-400'].join(' ')}>{conversation.preview}</p>
                        </div>
                        <span className={['shrink-0 text-xs font-medium', active ? 'text-white/70 dark:text-black/60' : 'text-gray-400 dark:text-gray-500'].join(' ')}>{formatUpdatedAt(conversation.updatedAt)}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </aside>

        <section className={`${showList ? 'hidden lg:flex' : 'flex'} min-h-screen min-w-0 flex-1 flex-col`}>
          <div className="hidden items-center justify-between border-b border-gray-200 bg-white/80 px-6 py-3 text-sm backdrop-blur-md dark:border-gray-800 dark:bg-black/80 lg:flex">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <span>Connected apps:</span>
              <div className="flex flex-wrap gap-2">
                {connectedApps.map((app) => (
                  <span key={app} className="rounded-full border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 dark:border-gray-800 dark:text-gray-300">{app}</span>
                ))}
              </div>
            </div>
            <button type="button" onClick={() => setLocation('/integrations')} className="text-gray-500 transition hover:text-black dark:text-gray-400 dark:hover:text-white">Manage integrations</button>
          </div>

          {error ? <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200 sm:px-6">{error}</div> : null}

          <div className="border-b border-gray-200 bg-white/80 px-4 py-4 backdrop-blur-md dark:border-gray-800 dark:bg-black/80 sm:px-6">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setShowList(true)} className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-black dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-white lg:hidden" aria-label="Back to conversations">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black">
                <Bot className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold text-black dark:text-white">{activeConversation?.title || 'New conversation'}</h2>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">{activeConversation?.connectedApps.length ? `Context: ${activeConversation.connectedApps.join(' · ')}` : `Context: ${connectedApps.join(' · ')}`}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-6">
            {booting || loadingMessages ? (
              <div className="space-y-4">
                <div className="h-16 w-3/4 animate-pulse rounded-3xl bg-gray-100 dark:bg-gray-900" />
                <div className="ml-auto h-16 w-1/2 animate-pulse rounded-3xl bg-gray-100 dark:bg-gray-900" />
                <div className="h-24 w-2/3 animate-pulse rounded-3xl bg-gray-100 dark:bg-gray-900" />
              </div>
            ) : activeMessages.length === 0 ? (
              <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-[2rem] border border-dashed border-gray-300 px-6 text-center dark:border-gray-800">
                <h3 className="text-lg font-semibold text-black dark:text-white">Start with one clear prompt</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-gray-500 dark:text-gray-400">Atom works best when the conversation is focused. Ask for a summary, a draft, or a concrete next step.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {activeMessages.map((message) => {
                  const isUser = message.role === 'user'
                  return (
                    <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[88%] sm:max-w-[76%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
                        <div className={[
                          'rounded-3xl px-4 py-3 shadow-sm transition-all',
                          isUser ? 'rounded-br-lg bg-black text-white dark:bg-white dark:text-black' : 'rounded-bl-lg border border-gray-200 bg-white text-black dark:border-gray-800 dark:bg-gray-900 dark:text-white',
                        ].join(' ')}>
                          <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                        </div>
                        <div className={`flex items-center gap-2 px-1 text-xs ${isUser ? 'justify-end' : 'justify-start'} text-gray-500 dark:text-gray-400`}>
                          <span>{formatMessageTime(message.createdAt)}</span>
                          <span aria-hidden="true">•</span>
                          <span className="capitalize">{message.status}</span>
                          {message.latencyMs ? <><span aria-hidden="true">•</span><span>{(message.latencyMs / 1000).toFixed(1)}s</span></> : null}
                          {message.status === 'failed' ? (
                            <button type="button" onClick={() => void retryMessage(message)} className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-red-600 transition hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10">
                              <RefreshCw className="h-3 w-3" />
                              Retry
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )
                })}
                {sending ? <div className="flex justify-start"><div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"><Loader2 className="h-4 w-4 animate-spin" />Atom is thinking…</div></div> : null}
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 bg-white/90 px-4 py-4 backdrop-blur-md dark:border-gray-800 dark:bg-black/80 sm:px-6">
            {activeMessages.length === 0 ? (
              <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {QUICK_PROMPTS.map((prompt) => (
                  <button key={prompt} type="button" onClick={() => void sendMessage(prompt)} className="shrink-0 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:text-black dark:border-gray-800 dark:text-gray-300 dark:hover:border-gray-700 dark:hover:text-white">{prompt}</button>
                ))}
              </div>
            ) : null}
            <div className="flex items-end gap-3 rounded-3xl border border-gray-200 bg-gray-50 px-3 py-2 shadow-sm dark:border-gray-800 dark:bg-gray-950">
              <button type="button" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-white hover:text-black dark:hover:bg-gray-900 dark:hover:text-white" aria-label="More actions">
                <Plus className="h-5 w-5" />
              </button>
              <textarea
                value={composerValue}
                onChange={(event) => setComposerValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    void sendMessage(composerValue)
                  }
                }}
                rows={1}
                placeholder="Write a message"
                className="max-h-40 min-h-[2.75rem] flex-1 resize-none border-0 bg-transparent px-0 py-2 text-sm leading-6 outline-none focus:ring-0"
                disabled={sending}
              />
              <button type="button" onClick={() => void sendMessage(composerValue)} disabled={!composerValue.trim() || sending} className={[
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition',
                composerValue.trim() && !sending ? 'bg-black text-white hover:bg-gray-900 dark:bg-white dark:text-black dark:hover:bg-gray-100' : 'bg-gray-200 text-gray-400 dark:bg-gray-900 dark:text-gray-600',
              ].join(' ')} aria-label="Send message">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
