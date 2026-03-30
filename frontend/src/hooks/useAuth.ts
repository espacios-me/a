import { useEffect, useState } from 'react'

export interface User {
  id: string
  name: string
  email: string
  provider?: string
}

const STORAGE_KEY = 'atom:user'

function readStoredUser(): User | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setUser(readStoredUser())
    setLoading(false)
  }, [])

  const login = (nextUser: User) => {
    setUser(nextUser)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser))
    }
  }

  const logout = () => {
    setUser(null)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }

  return {
    user,
    loading,
    login,
    logout,
  }
}
