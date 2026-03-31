import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { apiFetch } from '@/lib'

type User = {
  id: string
  name: string
  email: string
  authMode: 'preview'
}

type AuthContextValue = {
  user: User | null
  loading: boolean
  error: string | null
  signIn: (provider: string) => Promise<void>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const payload = await apiFetch<{ user: User | null }>('/api/auth/session')
      setUser(payload.user)
    } catch (err) {
      setUser(null)
      setError(err instanceof Error ? err.message : 'Failed to check session')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const signIn = useCallback(async (provider: string) => {
    setLoading(true)
    setError(null)
    try {
      const payload = await apiFetch<{ user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ provider }),
      })
      setUser(payload.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed')
    } finally {
      setLoading(false)
    }
  }, [])

  const signOut = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed')
    } finally {
      setLoading(false)
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({ user, loading, error, signIn, signOut, refresh }), [user, loading, error, signIn, signOut, refresh])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
