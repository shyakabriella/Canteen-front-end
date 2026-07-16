'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import PublicFooter from './PublicFooter'
import PublicHeader from './PublicHeader'

interface PublicShellProps {
  children: ReactNode
}

export default function PublicShell({
  children,
}: PublicShellProps) {
  const pathname = usePathname()

  const isMenuDetailPage =
    /^\/menu\/[^/]+\/?$/.test(pathname)

  return (
    <div className="min-h-screen bg-[#f7f3eb]">
      <PublicHeader
        overlay={!isMenuDetailPage}
      />

      {children}

      {!isMenuDetailPage && (
        <PublicFooter />
      )}
    </div>
  )
}
