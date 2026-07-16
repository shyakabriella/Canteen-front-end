import type { ReactNode } from 'react'
import PublicFooter from '@/components/public/PublicFooter'
import PublicHeader from '@/components/public/PublicHeader'

export default function PublicLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white">
      <PublicHeader />

      <main className="flex-1">
        {children}
      </main>

      <PublicFooter />
    </div>
  )
}