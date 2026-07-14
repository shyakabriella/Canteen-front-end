'use client'

import {
  Bell,
  ChevronDown,
  Menu,
  Search,
} from 'lucide-react'

interface AdminNavbarProps {
  userName: string
  userRole: string
  onMenuClick: () => void
}

export default function AdminNavbar({
  userName,
  userRole,
  onMenuClick,
}: AdminNavbarProps) {
  const initial = userName.trim().charAt(0).toUpperCase() || 'A'

  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open dashboard menu"
          className="rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-50 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative hidden w-[320px] md:block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            type="search"
            placeholder="Search orders, users or food..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          aria-label="View notifications"
          className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-indigo-600"
        >
          <Bell className="h-5 w-5" />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        <button
          type="button"
          className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-slate-50"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
            {initial}
          </span>

          <span className="hidden text-left sm:block">
            <span className="block max-w-[150px] truncate text-sm font-bold text-slate-900">
              {userName}
            </span>

            <span className="block text-xs capitalize text-slate-500">
              {userRole.replaceAll('_', ' ')}
            </span>
          </span>

          <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
        </button>
      </div>
    </header>
  )
}
