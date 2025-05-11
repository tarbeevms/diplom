// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react'
import { getProfile } from '../lib/api'

interface AuthContextType {
  token: string | null
  login: (t: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))

  const login = (t: string) => {
    localStorage.setItem('token', t)
    setToken(t)
  }
  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
  }

  useEffect(() => {
    if (token) getProfile(token).catch(logout)
  }, [token])

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
