import {
  QrCode,
  ShoppingBag,
  WalletCards,
} from 'lucide-react'
import Link from 'next/link'

export default function PublicFooter() {
  return (
    <footer className="border-t border-white/10 bg-slate-950">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-3"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600">
              <ShoppingBag className="h-5 w-5 text-white" />
            </span>

            <div>
              <p className="font-black text-white">
                Smart Canteen
              </p>

              <p className="text-xs font-semibold text-slate-400">
                Fast, secure and traceable ordering
              </p>
            </div>
          </Link>

          <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">
            Browse food, pay using your Smart Wallet, track preparation
            progress and collect orders securely using QR codes.
          </p>
        </div>

        <div>
          <p className="text-sm font-extrabold text-white">
            Quick Links
          </p>

          <div className="mt-4 space-y-3">
            <FooterLink href="/">
              Home
            </FooterLink>

            <FooterLink href="/login">
              Login
            </FooterLink>

            <FooterLink href="/#features">
              Features
            </FooterLink>

            <FooterLink href="/#how-it-works">
              How It Works
            </FooterLink>
          </div>
        </div>

        <div>
          <p className="text-sm font-extrabold text-white">
            System Features
          </p>

          <div className="mt-4 space-y-3 text-sm text-slate-400">
            <p className="flex items-center gap-2">
              <WalletCards className="h-4 w-4 text-indigo-400" />
              Smart Wallet payment
            </p>

            <p className="flex items-center gap-2">
              <QrCode className="h-4 w-4 text-indigo-400" />
              QR pickup confirmation
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-5 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>
            © {new Date().getFullYear()} Smart Canteen. All rights reserved.
          </p>

          <Link
            href="/login"
            className="font-bold text-indigo-300 transition hover:text-indigo-200"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </footer>
  )
}

function FooterLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <p>
      <Link
        href={href}
        className="text-sm font-semibold text-slate-400 transition hover:text-white"
      >
        {children}
      </Link>
    </p>
  )
}
