'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  clearAuthSession,
  getStoredAuthSession,
  saveAuthSession,
} from '@/lib/auth'
import { ApiError } from '@/lib/api'
import {
  getProfile,
  loginUser,
  logoutUser,
  registerUser,
} from '@/services/auth.service'
import type {
  AuthUser,
  LoginPayload,
  RegisterPayload,
  RegisterResult,
} from '@/types/auth'

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  isRefreshingProfile: boolean
  isAuthenticated: boolean
  login: (
    payload: LoginPayload,
    rememberMe?: boolean,
  ) => Promise<AuthUser>
  register: (
    payload: RegisterPayload,
    rememberMe?: boolean,
  ) => Promise<RegisterResult>
  refreshProfile: () => Promise<AuthUser | null>
  logout: () => Promise<void>
}

const AuthContext =
  createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

function sessionUsesLocalStorage(): boolean {
  if (typeof window === 'undefined') {
    return true
  }

  return Boolean(
    localStorage.getItem('smart_canteen_token'),
  )
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] =
    useState<AuthUser | null>(null)
  const [token, setToken] =
    useState<string | null>(null)
  const [isLoading, setIsLoading] =
    useState(true)
  const [
    isRefreshingProfile,
    setIsRefreshingProfile,
  ] = useState(false)

  useEffect(() => {
    let active = true

    async function initializeSession() {
      const storedSession = getStoredAuthSession()

      if (!storedSession) {
        if (active) {
          setIsLoading(false)
        }

        return
      }

      if (active) {
        setToken(storedSession.token)
        setUser(storedSession.user)
      }

      try {
        const latestProfile = await getProfile()

        if (!active) {
          return
        }

        setUser(latestProfile)

        saveAuthSession(
          {
            token: storedSession.token,
            user: latestProfile,
          },
          sessionUsesLocalStorage(),
        )
      } catch (error) {
        if (
          error instanceof ApiError &&
          error.status === 401
        ) {
          clearAuthSession()

          if (active) {
            setToken(null)
            setUser(null)
          }
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void initializeSession()

    return () => {
      active = false
    }
  }, [])

  const login = useCallback(
    async (
      payload: LoginPayload,
      rememberMe = true,
    ): Promise<AuthUser> => {
      const session = await loginUser(payload)

      saveAuthSession(session, rememberMe)
      setToken(session.token)
      setUser(session.user)

      try {
        const latestProfile = await getProfile()

        saveAuthSession(
          {
            token: session.token,
            user: latestProfile,
          },
          rememberMe,
        )

        setUser(latestProfile)

        return latestProfile
      } catch {
        return session.user
      }
    },
    [],
  )

  const register = useCallback(
    async (
      payload: RegisterPayload,
      rememberMe = true,
    ): Promise<RegisterResult> => {
      const result = await registerUser(payload)

      if (result.token && result.user) {
        saveAuthSession(
          {
            token: result.token,
            user: result.user,
            message: result.message,
          },
          rememberMe,
        )

        setToken(result.token)
        setUser(result.user)
      }

      return result
    },
    [],
  )

  const refreshProfile = useCallback(
    async (): Promise<AuthUser | null> => {
      const storedSession = getStoredAuthSession()

      if (!storedSession) {
        return null
      }

      setIsRefreshingProfile(true)

      try {
        const latestProfile = await getProfile()

        saveAuthSession(
          {
            token: storedSession.token,
            user: latestProfile,
          },
          sessionUsesLocalStorage(),
        )

        setToken(storedSession.token)
        setUser(latestProfile)

        return latestProfile
      } catch (error) {
        if (
          error instanceof ApiError &&
          error.status === 401
        ) {
          clearAuthSession()
          setToken(null)
          setUser(null)
        }

        throw error
      } finally {
        setIsRefreshingProfile(false)
      }
    },
    [],
  )

  const logout = useCallback(async (): Promise<void> => {
    try {
      const storedSession = getStoredAuthSession()

      if (storedSession?.token) {
        await logoutUser()
      }
    } finally {
      clearAuthSession()
      setToken(null)
      setUser(null)
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      isRefreshingProfile,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      refreshProfile,
      logout,
    }),
    [
      user,
      token,
      isLoading,
      isRefreshingProfile,
      login,
      register,
      refreshProfile,
      logout,
    ],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider.',
    )
  }

  return context
}
