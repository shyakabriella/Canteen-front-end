import type { LucideIcon } from 'lucide-react'

type CardTone = 'indigo' | 'emerald' | 'amber' | 'rose'

interface DashboardCardProps {
  title: string
  value: string
  description: string
  change: string
  icon: LucideIcon
  tone: CardTone
}

const toneClasses: Record<
  CardTone,
  {
    background: string
    icon: string
    change: string
  }
> = {
  indigo: {
    background: 'bg-indigo-50',
    icon: 'text-indigo-600',
    change: 'text-indigo-600',
  },
  emerald: {
    background: 'bg-emerald-50',
    icon: 'text-emerald-600',
    change: 'text-emerald-600',
  },
  amber: {
    background: 'bg-amber-50',
    icon: 'text-amber-600',
    change: 'text-amber-600',
  },
  rose: {
    background: 'bg-rose-50',
    icon: 'text-rose-600',
    change: 'text-rose-600',
  },
}

export default function DashboardCard({
  title,
  value,
  description,
  change,
  icon: Icon,
  tone,
}: DashboardCardProps) {
  const selectedTone = toneClasses[tone]

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            {title}
          </p>

          <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950">
            {value}
          </h3>
        </div>

        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${selectedTone.background}`}
        >
          <Icon className={`h-6 w-6 ${selectedTone.icon}`} />
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="truncate text-xs text-slate-400">
          {description}
        </p>

        <span
          className={`shrink-0 text-xs font-bold ${selectedTone.change}`}
        >
          {change}
        </span>
      </div>
    </article>
  )
}
