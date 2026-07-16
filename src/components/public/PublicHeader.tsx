import {
  ArrowRight,
  Coffee,
  Menu,
  ShoppingBag,
  UtensilsCrossed,
} from 'lucide-react'
import Link from 'next/link'

export default function PublicHeader() {
  return (
    <header
      className="
        sticky top-0 z-50 -mb-20
        bg-gradient-to-b
        from-[#07150d]/90
        via-[#07150d]/55
        to-transparent
        backdrop-blur-[2px]
      "
    >
      <div className="mx-auto flex min-h-20 w-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        {/* Brand */}
        <Link
          href="/"
          className="group flex items-center gap-3"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#e1bb75]/30 bg-[#d9b779] text-[#102018] shadow-lg shadow-black/20 transition group-hover:scale-105">
            <ShoppingBag className="h-5 w-5" />
          </span>

          <div>
            <p className="text-base font-black tracking-tight text-white sm:text-lg">
              Smart Canteen
            </p>

            <p className="text-xs font-semibold text-white/55">
              Fresh food ordering system
            </p>
          </div>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/"
            className="relative text-sm font-extrabold text-white/75 transition hover:text-white"
          >
            Home
          </Link>

          <Link
            href="/#menu"
            className="relative text-sm font-extrabold text-white/75 transition hover:text-white"
          >
            Menu
          </Link>

          <Link
            href="/#how-it-works"
            className="relative text-sm font-extrabold text-white/75 transition hover:text-white"
          >
            How It Works
          </Link>
        </nav>

        {/* Login button */}
        <Link
          href="/login"
          className="
            inline-flex h-12 items-center justify-center gap-2
            rounded-full border border-white/20
            bg-white/95 px-5
            text-sm font-extrabold text-[#102018]
            shadow-lg shadow-black/10
            transition
            hover:bg-[#d9b779]
            sm:px-6
          "
        >
          Login

          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </header>
  )
}
