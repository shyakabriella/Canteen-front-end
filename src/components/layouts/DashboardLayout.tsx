'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import AdminFooter from '@/components/admin/AdminFooter'
import AdminNavbar from '@/components/admin/AdminNavbar'
import AdminSidebar from '@/components/admin/AdminSidebar'
import { useAuth } from '@/contexts/AuthContext'
import { formatRoleName } from '@/lib/auth'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const router = useRouter()

  const {
    user,
    isLoading,
    isAuthenticated,
    logout,
  } = useAuth()

  const [sidebarOpen, setSidebarOpen] =
    useState(false)
  const [isLoggingOut, setIsLoggingOut] =
    useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isLoading, isAuthenticated, router])

  async function handleLogout() {
    setIsLoggingOut(true)

    try {
      await logout()
    } catch (error) {
      console.error('Backend logout failed:', error)
    } finally {
      router.replace('/login')
      router.refresh()
      setIsLoggingOut(false)
    }
  }

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-100">
        <div className="text-center">
          <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-blue-600" />

          <p className="mt-3 text-sm font-semibold text-slate-500">
            Loading your profile...
          </p>
        </div>
      </div>
    )
  }

  const userName = user.name || 'System User'
  const userRole = formatRoleName(user.role)

  return (
    <div className="min-h-dvh bg-[#f6f7fb] text-slate-900">
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userName={userName}
        userEmail={user.email}
        userRole={userRole}
        isLoggingOut={isLoggingOut}
        onLogout={handleLogout}
      />

      <div className="flex min-h-dvh flex-col lg:pl-[280px]">
        <AdminNavbar
          userName={userName}
          userRole={userRole}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-7">
          <div className="mx-auto w-full max-w-[1600px]">
            {children}
          </div>
        </main>

        <AdminFooter />
      </div>
    </div>
  )
}
