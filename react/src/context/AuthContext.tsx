// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProfile } from '../lib/api'
import { toast } from 'sonner'
import { setCookie, getCookie, removeCookie } from '../utils/cookies'

// Cookie name constant to ensure consistency
const AUTH_TOKEN_COOKIE = 'auth_token';

interface AuthContextType {
  token: string | null
  login: (t: string, rememberMe: boolean) => void
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
  // Initialize token from cookie instead of localStorage
  const [token, setToken] = useState<string | null>(() => {
    return getCookie(AUTH_TOKEN_COOKIE);
  })
  const [role, setRole] = useState<string | null>(null)
  const navigate = useNavigate()

  // Listen for auth logout events
  useEffect(() => {
    const handleAuthLogout = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('Auth logout event triggered:', customEvent.detail);
      
      // Clear all auth data
      handleLogout();
      
      // If this was a forced logout (from an API error), redirect to login
      if (customEvent.detail?.forced) {
        toast.error('Сессия истекла. Необходимо войти заново.');
        navigate('/login', { replace: true });
      }
    };
    
    window.addEventListener('auth:logout', handleAuthLogout);
    
    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, [navigate]);

  useEffect(() => {
    if (token) {
      const payload = parseJwt(token);
      setRole(payload?.role || null);
      
      // Verify token is valid with backend
      getProfile(token).catch(error => {
        // If profile fetch fails, check if it's due to auth issues
        const errorMessage = error?.message || '';
        if (
          errorMessage.includes('Not authorized') || 
          errorMessage.includes('Authentication required') ||
          errorMessage.toLowerCase().includes('unauthorized')
        ) {
          // Trigger forced logout
          window.dispatchEvent(new CustomEvent('auth:logout', { 
            detail: { message: errorMessage, forced: true }
          }));
        }
      });
    } else {
      setRole(null);
    }
  }, [token])

  const login = (t: string, rememberMe = false) => {
    // Set cookie with token - use days parameter for "remember me"
    const expiryDays = rememberMe ? 30 : undefined; // 30 days for "remember me", session cookie otherwise
    setCookie(AUTH_TOKEN_COOKIE, t, expiryDays);
    setToken(t);
  }
  
  const handleLogout = () => {
    // Remove the auth cookie
    removeCookie(AUTH_TOKEN_COOKIE);
    
    // Also remove the session cookie from the backend if it exists
    removeCookie('session');
    
    setToken(null);
    setRole(null);
  }

  return (
    <AuthContext.Provider value={{ 
      token, 
      login, 
      logout: handleLogout, 
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
