import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import api from '../api'
import type { CurrentUser } from '../types'
import { useToast } from './ToastContext'

interface AuthContextType {
  currentUser: CurrentUser | null
  token: string | null
  loading: boolean
  authModalOpen: boolean
  authModalMode: 'login' | 'register' | 'verifyEmail'
  verificationEmail: string
  openAuthModal: (mode?: 'login' | 'register' | 'verifyEmail', email?: string) => void
  closeAuthModal: () => void
  switchAuthMode: (mode: 'login' | 'register' | 'verifyEmail') => void
  login: (email: string, password: string) => Promise<boolean>
  register: (payload: {
    fullName: string
    email: string
    password: string
    phone?: string
    role: 'TENANT' | 'OWNER'
  }) => Promise<{ success: boolean; verificationRequired?: boolean; demoVerificationCode?: string; message?: string }>
  verifyEmail: (email: string, code: string) => Promise<boolean>
  resendVerification: (email: string) => Promise<{ success: boolean; demoCode?: string }>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('propzy_token') || localStorage.getItem('rentflow_token') || null
  })
  const [loading, setLoading] = useState<boolean>(() => {
    return !!(localStorage.getItem('propzy_token') || localStorage.getItem('rentflow_token'))
  })
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'verifyEmail'>('login')
  const [verificationEmail, setVerificationEmail] = useState<string>('')
  const { showToast } = useToast()

  const refreshUser = async () => {
    const activeToken = localStorage.getItem('propzy_token') || localStorage.getItem('rentflow_token')
    if (activeToken) {
      api.defaults.headers.common.Authorization = `Bearer ${activeToken}`
      try {
        const res = await api.get('/api/v1/auth/me')
        setCurrentUser(res.data)
        setToken(activeToken)
      } catch {
        localStorage.removeItem('propzy_token')
        localStorage.removeItem('rentflow_token')
        delete api.defaults.headers.common.Authorization
        setCurrentUser(null)
        setToken(null)
      } finally {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    const activeToken = localStorage.getItem('propzy_token') || localStorage.getItem('rentflow_token')
    if (activeToken) {
      api.defaults.headers.common.Authorization = `Bearer ${activeToken}`
      api.get('/api/v1/auth/me')
        .then((res) => {
          setCurrentUser(res.data)
          setToken(activeToken)
        })
        .catch(() => {
          localStorage.removeItem('propzy_token')
          localStorage.removeItem('rentflow_token')
          delete api.defaults.headers.common.Authorization
          setCurrentUser(null)
          setToken(null)
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [])

  const openAuthModal = (mode: 'login' | 'register' | 'verifyEmail' = 'login', email = '') => {
    setAuthModalMode(mode)
    if (email) setVerificationEmail(email)
    setAuthModalOpen(true)
  }

  const closeAuthModal = () => {
    setAuthModalOpen(false)
  }

  const switchAuthMode = (mode: 'login' | 'register' | 'verifyEmail') => {
    setAuthModalMode(mode)
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await api.post('/api/v1/auth/login', { email, password })
      const newToken = res.data.token
      localStorage.setItem('propzy_token', newToken)
      api.defaults.headers.common.Authorization = `Bearer ${newToken}`
      setToken(newToken)
      setCurrentUser(res.data)
      showToast(`Welcome back, ${res.data.fullName || 'User'}!`, 'success')
      closeAuthModal()
      return true
    } catch (err: unknown) {
      const errorObj = err as { response?: { status?: number; data?: { message?: string } } }
      const msg = errorObj.response?.data?.message || 'Login failed. Please check your credentials.'
      if (errorObj.response?.status === 403 && msg.toLowerCase().includes('verify')) {
        setVerificationEmail(email)
        setAuthModalMode('verifyEmail')
        showToast('Please verify your email address to continue.', 'info')
      } else {
        showToast(msg, 'error')
      }
      return false
    }
  }

  const register = async (payload: {
    fullName: string
    email: string
    password: string
    phone?: string
    role: 'TENANT' | 'OWNER'
  }) => {
    try {
      const res = await api.post('/api/v1/auth/register', payload)
      if (res.data.verificationRequired) {
        setVerificationEmail(payload.email)
        setAuthModalMode('verifyEmail')
        showToast('Verification code generated. Please verify to activate your account.', 'info')
        return {
          success: true,
          verificationRequired: true,
          demoVerificationCode: res.data.demoVerificationCode,
        }
      } else {
        const newToken = res.data.token
        if (newToken) {
          localStorage.setItem('propzy_token', newToken)
          api.defaults.headers.common.Authorization = `Bearer ${newToken}`
          setToken(newToken)
          setCurrentUser(res.data)
        }
        showToast('Account created successfully!', 'success')
        closeAuthModal()
        return { success: true }
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { status?: number; data?: { message?: string } } }
      const msg = errorObj.response?.data?.message || 'Registration failed.'
      showToast(msg, 'error')
      return { success: false, message: msg }
    }
  }

  const verifyEmail = async (email: string, code: string): Promise<boolean> => {
    try {
      const res = await api.post('/api/v1/auth/verify-email', { email, code })
      const newToken = res.data.token
      if (newToken) {
        localStorage.setItem('propzy_token', newToken)
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`
        setToken(newToken)
        setCurrentUser(res.data)
      }
      showToast('Email verified successfully! You are now logged in.', 'success')
      closeAuthModal()
      return true
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } }
      const msg = errorObj.response?.data?.message || 'Invalid or expired verification code.'
      showToast(msg, 'error')
      return false
    }
  }

  const resendVerification = async (email: string) => {
    try {
      const res = await api.post('/api/v1/auth/resend-verification', { email })
      showToast('A new verification code has been sent!', 'success')
      return { success: true, demoCode: res.data.demoVerificationCode }
    } catch {
      showToast('Could not resend verification code. Please try again.', 'error')
      return { success: false }
    }
  }

  const logout = () => {
    localStorage.removeItem('propzy_token')
    localStorage.removeItem('rentflow_token')
    delete api.defaults.headers.common.Authorization
    setCurrentUser(null)
    setToken(null)
    showToast('You have been logged out.', 'info')
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        loading,
        authModalOpen,
        authModalMode,
        verificationEmail,
        openAuthModal,
        closeAuthModal,
        switchAuthMode,
        login,
        register,
        verifyEmail,
        resendVerification,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// oxlint-disable-next-line react/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
