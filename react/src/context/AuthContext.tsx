// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react'
import { getProfile } from '../lib/api'

interface AuthContextType {
  token: string | null
  login: (t: string) => void
  logout: () => void
  role: string | null
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Parse JWT token to get payload
function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    if (token) {
      const payload = parseJwt(token);
      setRole(payload?.role || null);
      
      // Verify token is valid with backend
      getProfile(token).catch(logout);
    } else {
      setRole(null);
    }
  }, [token])

  const login = (t: string) => {
    localStorage.setItem('token', t)
    setToken(t)
  }
  
  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setRole(null)
  }

  return (
    <AuthContext.Provider value={{ 
      token, 
      login, 
      logout, 
      role,
      isAdmin: role === 'admin'
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
