import type { ReactNode } from 'react'
import PublicShell from '@/components/public/PublicShell'

interface PublicLayoutProps {
  children: ReactNode
}

export default function PublicLayout({
  children,
}: PublicLayoutProps) {
  return (
    <PublicShell>
      {children}
    </PublicShell>
  )
}
