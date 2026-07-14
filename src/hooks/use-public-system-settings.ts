'use client'

import {
  useCallback,
  useEffect,
  useState,
} from 'react'
import { getPublicSystemSettings } from '@/services/public-system-settings.service'
import type { PublicSystemSettings } from '@/types/public-system-settings'

export function usePublicSystemSettings() {
  const [settings, setSettings] =
    useState<PublicSystemSettings | null>(null)

  const [isLoading, setIsLoading] =
    useState(true)

  const [errorMessage, setErrorMessage] =
    useState('')

  const loadSettings = useCallback(
    async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        setSettings(
          await getPublicSystemSettings(),
        )
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to load public system settings.',
        )
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  return {
    settings,
    isLoading,
    errorMessage,
    reload: loadSettings,
  }
}
