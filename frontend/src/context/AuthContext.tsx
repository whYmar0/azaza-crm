import React, { createContext, useContext, useEffect, useState } from 'react'
import { authApi } from '../api/client'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, orgName?: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue>(null!)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('hm_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    authApi.me()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('hm_token')
        setToken(null)
      })
      .finally(() => setLoading(false))
  }, [token])

  const login = async (email: string, password: string) => {
    const data = await authApi.login(email, password)
    localStorage.setItem('hm_token', data.token)
    setToken(data.token)
    setUser(data.user)
  }

  const register = async (name: string, email: string, password: string, orgName?: string) => {
    const data = await authApi.register({ name, email, password, org_name: orgName })
    localStorage.setItem('hm_token', data.token)
    setToken(data.token)
    setUser(data.user)
  }

  const logout = () => {
    localStorage.removeItem('hm_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
