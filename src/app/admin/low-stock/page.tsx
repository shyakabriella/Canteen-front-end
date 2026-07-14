import { redirect } from 'next/navigation'

export default function LowStockRedirectPage() {
  redirect('/admin/low-stock-alerts')
}
