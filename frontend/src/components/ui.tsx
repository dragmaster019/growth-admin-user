import type { ReactNode } from 'react'
import { RANKS } from '../lib/rank'

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-10 text-sm text-slate-400">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-edge border-t-lime" />
      {label ?? 'Loading…'}
    </div>
  )
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
      {message}
    </div>
  )
}

export type StatTone = 'brand' | 'success' | 'warning' | 'danger'

const statToneClasses: Record<StatTone, string> = {
  brand: '',
  success: '!bg-emerald-500/15 !text-emerald-300 !shadow-none ring-1 ring-emerald-400/30',
  warning: '!bg-amber-400/15 !text-amber-300 !shadow-none ring-1 ring-amber-400/30',
  danger: '!bg-red-500/15 !text-red-300 !shadow-none ring-1 ring-red-400/30',
}

export function Stat({
  label,
  value,
  hint,
  icon,
  tone = 'brand',
  className = '',
}: {
  label: string
  value: ReactNode
  hint?: string
  icon?: ReactNode
  tone?: StatTone
  className?: string
}) {
  return (
    <div className={`card card-hover ${className}`}>
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</div>
          <div className="mt-1.5 truncate text-2xl font-black tracking-tight text-white sm:mt-2 sm:text-3xl">{value}</div>
          {hint && <div className="mt-1 text-[11px] text-slate-500 sm:mt-1.5 sm:text-xs">{hint}</div>}
        </div>
        {icon && <span className={`stat-icon !h-10 !w-10 sm:!h-11 sm:!w-11 ${statToneClasses[tone]}`}>{icon}</span>}
      </div>
    </div>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          <span className="h-1 w-6 rounded-full bg-lime" />
          Growth network
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white sm:text-[2rem]">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm text-slate-400">{subtitle}</p>}
      </div>
      {actions}
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-edge bg-panel2/30 px-4 py-8 text-center text-sm text-slate-500">
      {children}
    </div>
  )
}

export function RankBadge({
  rank,
  emoji,
  className = '',
}: {
  rank?: string
  emoji?: string
  className?: string
}) {
  const meta =
    RANKS.find((item) => item.name.toLowerCase() === String(rank || '').toLowerCase()) ?? RANKS[0]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${className}`}
      style={{
        color: meta.color,
        borderColor: `${meta.color}55`,
        background: `${meta.color}18`,
      }}
    >
      <span aria-hidden>{emoji || meta.emoji}</span>
      {rank || meta.name}
    </span>
  )
}

export function money(n: number | null | undefined) {
  return Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })
}
