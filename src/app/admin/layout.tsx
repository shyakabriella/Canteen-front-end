import type { ReactNode } from 'react'
import DashboardLayout from '@/components/layouts/DashboardLayout'

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({
  children,
}: AdminLayoutProps) {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  )
}
