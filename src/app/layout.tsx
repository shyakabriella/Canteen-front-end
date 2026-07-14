import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import Providers from './providers'

export const metadata: Metadata = {
  title: {
    default: 'Smart Canteen',
    template: '%s | Smart Canteen',
  },
  description:
    'Smart canteen ordering, wallet, QR verification and inventory management system.',
}

interface RootLayoutProps {
  children: ReactNode
}

export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
