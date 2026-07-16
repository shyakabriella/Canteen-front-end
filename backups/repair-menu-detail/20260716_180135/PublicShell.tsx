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

  const isFoodDetailPage =
    /^\/menu\/[^/]+\/?$/.test(pathname)

  return (
    <>
      <PublicHeader
        overlay={!isFoodDetailPage}
      />

      {children}

      {!isFoodDetailPage && (
        <PublicFooter />
      )}
    </>
  )
}
