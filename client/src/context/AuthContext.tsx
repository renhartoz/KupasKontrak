import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User } from '@/types'
import { api } from '@/api'

interface AuthContextType {
  user: User | null
  login: (access: string, refresh: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setIsLoading(false)
      return
    }

    try {
      const response = await api.get('/accounts/me/')
      setUser(response.data)
    } catch (error) {
      console.error('Session expired or invalid')
      localStorage.removeItem('token')
      localStorage.removeItem('refresh_token')
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (access: string, refresh: string) => {
    localStorage.setItem('token', access)
    localStorage.setItem('refresh_token', refresh)
    await checkAuth()
  }

  const logout = async () => {
    const refresh = localStorage.getItem('refresh_token')
    if (refresh) {
      try {
        await api.post('/accounts/logout/', { refresh })
      } catch (e) {
        console.error('Logout failed', e)
      }
    }
    localStorage.removeItem('token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
