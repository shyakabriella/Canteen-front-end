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
import { getPublicSystemSettings } from '@/services/system-settings.service'
import type { PublicSystemSettings } from '@/types/system-settings'

interface SystemSettingsContextValue {
  settings: PublicSystemSettings
  isLoading: boolean
  error: string
  refreshSettings: () => Promise<void>
}

const defaultSettings: PublicSystemSettings = {
  app_name: 'Smart Canteen',
  currency: 'RWF',
  registration_enabled: true,
}

const SystemSettingsContext =
  createContext<SystemSettingsContextValue | undefined>(
    undefined,
  )

interface SystemSettingsProviderProps {
  children: ReactNode
}

export function SystemSettingsProvider({
  children,
}: SystemSettingsProviderProps) {
  const [settings, setSettings] =
    useState<PublicSystemSettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const refreshSettings = useCallback(async () => {
    setError('')

    try {
      const response = await getPublicSystemSettings()

      setSettings({
        ...defaultSettings,
        ...response,
      })
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to load public system settings.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshSettings()
  }, [refreshSettings])

  const value = useMemo(
    () => ({
      settings,
      isLoading,
      error,
      refreshSettings,
    }),
    [settings, isLoading, error, refreshSettings],
  )

  return (
    <SystemSettingsContext.Provider value={value}>
      {children}
    </SystemSettingsContext.Provider>
  )
}

export function useSystemSettings(): SystemSettingsContextValue {
  const context = useContext(SystemSettingsContext)

  if (!context) {
    throw new Error(
      'useSystemSettings must be used inside SystemSettingsProvider.',
    )
  }

  return context
}
