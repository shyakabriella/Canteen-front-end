'use client'

import { QrCode } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useMemo } from 'react'

function removeTrailingSlash(
  value: string,
): string {
  return value.replace(/\/+$/, '')
}

export default function MenuOrderQrPage() {
  const qrValue = useMemo(() => {
    const appUrl = removeTrailingSlash(
      process.env.NEXT_PUBLIC_APP_URL ??
        'https://www.canabera.asyncafrica.com',
    )

    /*
     * This QR code is NOT related to a canteen table.
     *
     * The mobile app scans this payload and opens:
     * /student/menu
     *
     * From the menu screen, the customer can:
     * - view food categories
     * - view food items
     * - add food to cart
     * - proceed to checkout
     * - pay using wallet
     * - create an order
     */
    return JSON.stringify({
      type: 'smart_canteen_menu_order',
      version: 1,
      action: 'open_menu',
      route: '/student/menu',
      web_url: `${appUrl}/student/menu`,
    })
  }, [])

  return (
    <main className="flex min-h-[calc(100vh-7rem)] w-full items-center justify-center bg-slate-950 p-4 sm:p-8">
      <section className="flex w-full max-w-2xl flex-col items-center rounded-[2rem] bg-white p-5 text-center shadow-2xl sm:p-10">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <QrCode className="h-7 w-7" />
        </div>

        <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-indigo-600">
          Smart Canteen
        </p>

        <h1 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
          Scan to View Menu and Order
        </h1>

        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
          Scan this QR code using the Smart Canteen mobile app.
        </p>

        <div className="mt-7 flex aspect-square w-full max-w-[460px] items-center justify-center rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl sm:p-7">
          <QRCodeSVG
            value={qrValue}
            size={1200}
            level="H"
            bgColor="#ffffff"
            fgColor="#000000"
            includeMargin
            className="h-full w-full"
            title="Smart Canteen menu and order QR code"
          />
        </div>

        <p className="mt-6 text-base font-extrabold text-slate-900">
          Menu • Cart • Checkout • Order
        </p>
      </section>
    </main>
  )
}