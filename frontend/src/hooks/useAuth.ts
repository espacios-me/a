import { useCallback, useEffect, useMemo, useState } from 'react'
import { SessionUser, logoutRequest, apiRequest } from '@/lib/api'

interface UseAuthValue {
  user: SessionUser | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

export function useAuth(): UseAuthValue {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiRequest<{ user: SessionUser | null }>('/api/auth/me')
      setUser(data.user)
      setError(null)
    } catch (err) {
      setUser(null)
      setError(err instanceof Error ? err.message : 'Unable to load session')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const logout = useCallback(async () => {
    await logoutRequest()
    setUser(null)
  }, [])

  return useMemo(
    () => ({ user, loading, error, refresh, logout }),
    [user, loading, error, refresh, logout],
  )
}
