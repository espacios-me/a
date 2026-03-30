import { useState, useEffect } from 'react'

interface User {
  id: string
  name: string
  email: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate checking authentication status
    // In production, this would check with your backend
    const checkAuth = async () => {
      try {
        // Simulate API call
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        }).catch(() => null)

        if (response?.ok) {
          const userData = await response.json()
          setUser(userData)
        } else {
          // Check for mock user in localStorage for demo
          const mockUser = localStorage.getItem('mockUser')
          if (mockUser) {
            setUser(JSON.parse(mockUser))
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const logout = () => {
    setUser(null)
    localStorage.removeItem('mockUser')
    // In production, call logout API endpoint
  }

  const login = (userData: User) => {
    setUser(userData)
    localStorage.setItem('mockUser', JSON.stringify(userData))
  }

  return {
    user,
    loading,
    logout,
    login,
  }
}
