import {
  ArrowRight,
  ShoppingBag,
} from 'lucide-react'
import Link from 'next/link'

export default function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-20 w-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-3"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-950/40">
            <ShoppingBag className="h-5 w-5 text-white" />
          </span>

          <div>
            <p className="text-base font-black tracking-tight text-white">
              Smart Canteen
            </p>

            <p className="text-xs font-semibold text-slate-400">
              Fast food ordering system
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          <Link
            href="/"
            className="text-sm font-bold text-slate-300 transition hover:text-white"
          >
            Home
          </Link>

          <a
            href="#features"
            className="text-sm font-bold text-slate-300 transition hover:text-white"
          >
            Features
          </a>

          <a
            href="#how-it-works"
            className="text-sm font-bold text-slate-300 transition hover:text-white"
          >
            How It Works
          </a>
        </nav>

        <Link
          href="/login"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-extrabold text-slate-950 transition hover:bg-slate-100"
        >
          Login
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </header>
  )
}
