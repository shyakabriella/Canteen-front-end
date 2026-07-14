'use client'

import type { ReactNode } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import { SystemSettingsProvider } from '@/contexts/SystemSettingsContext'

interface ProvidersProps {
  children: ReactNode
}

export default function Providers({
  children,
}: ProvidersProps) {
  return (
    <SystemSettingsProvider>
      <AuthProvider>{children}</AuthProvider>
    </SystemSettingsProvider>
  )
}
