import { useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { DEFAULT_POINT_VALUE_INR, formatInr, pointsToInr } from '../lib/points'
import type { Txn } from '../lib/types'
import {
  categoryClasses,
  directionAmountClass,
  exportTransactionsCsv,
  txnCategory,
  txnDirection,
  txnLabel,
  type TxnDirection,
} from '../lib/transactions'
import { Empty, ErrorBox, PageHeader, Spinner, money } from '../components/ui'
import Calculator from '../components/Calculator'
import TxnCards from '../components/TxnCards'

type Filter = 'all' | TxnDirection

const filterOptions: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'credit', label: 'Credits' },
  { value: 'debit', label: 'Debits' },
]

const icons = {
  credit: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  ),
  debit: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M12 5v14M19 12l-7 7-7-7" />
    </svg>
  ),
  net: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M12 3v18M3 12h18" />
    </svg>
  ),
  count: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M4 6h16M4 12h16M4 18h10" />
    </svg>
  ),
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Transactions() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [txns, setTxns] = useState<Txn[] | null>(() => api.peek<{ txns: Txn[] }>('/transactions')?.txns ?? null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.get<{ txns: Txn[] }>('/transactions')
      .then((d) => setTxns(d.txns))
      .catch((e) => setError((e as Error).message))
  }, [])

  useEffect(() => {
    if (!exportOpen) return
    const onPointerDown = (event: MouseEvent) => {
      if (!exportRef.current?.contains(event.target as Node)) setExportOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [exportOpen])

  const summary = useMemo(() => {
    let credit = 0
    let debit = 0
    for (const txn of txns ?? []) {
      if (txnDirection(txn) === 'debit') debit += txn.amount
      else credit += txn.amount
    }
    return { credit, debit, net: credit - debit, count: txns?.length ?? 0 }
  }, [txns])

  const counts = useMemo(
    () => ({
      all: txns?.length ?? 0,
      credit: (txns ?? []).filter((txn) => txnDirection(txn) === 'credit').length,
      debit: (txns ?? []).filter((txn) => txnDirection(txn) === 'debit').length,
    }),
    [txns],
  )

  const visible = useMemo(() => {
    const list = txns ?? []
    const search = query.trim().toLowerCase()
    return list.filter((txn) => {
      if (filter !== 'all' && txnDirection(txn) !== filter) return false
      if (!search) return true
      return [txn.type, txnLabel(txn.type), txn.from, txn.to]
        .some((value) => value.toLowerCase().includes(search))
    })
  }, [txns, filter, query])

  const topParties = useMemo(() => {
    const totals = new Map<string, number>()
    for (const txn of txns ?? []) {
      if (txnDirection(txn) === 'debit') continue
      const key = isAdmin ? txn.to : txn.from
      totals.set(key, (totals.get(key) ?? 0) + txn.amount)
    }
    return [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [txns, isAdmin])

  const topMax = topParties[0]?.[1] ?? 0

  return (
    <>
      <PageHeader
        title="Transactions"
        subtitle={
          isAdmin
            ? 'Every point movement in the network, logged.'
            : 'Points credited to your wallet, logged.'
        }
        actions={
          <div className="relative" ref={exportRef}>
            <button
              type="button"
              className="btn-export"
              aria-haspopup="menu"
              aria-expanded={exportOpen}
              onClick={() => setExportOpen((open) => !open)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
              </svg>
              Export CSV
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-3.5 w-3.5 transition ${exportOpen ? 'rotate-180' : ''}`}>
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {exportOpen && (
              <div
                role="menu"
                className="absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-2xl border border-edge bg-panel/95 p-1.5 shadow-2xl backdrop-blur"
              >
                <button
                  type="button"
                  role="menuitem"
                  disabled={!visible.length}
                  onClick={() => {
                    exportTransactionsCsv(visible, `transactions-filtered-${new Date().toISOString().slice(0, 10)}.csv`)
                    setExportOpen(false)
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-300 transition hover:bg-panel2 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span>
                    <span className="block font-semibold">Export filtered</span>
                    <span className="block text-[11px] text-slate-500">Respects search and type filter</span>
                  </span>
                  <span className="pill border-lime/30 bg-lime/10 text-lime">{visible.length}</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  disabled={!txns?.length}
                  onClick={() => {
                    exportTransactionsCsv(txns ?? [], `transactions-all-${new Date().toISOString().slice(0, 10)}.csv`)
                    setExportOpen(false)
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-300 transition hover:bg-panel2 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span>
                    <span className="block font-semibold">Export everything</span>
                    <span className="block text-[11px] text-slate-500">Full transaction history</span>
                  </span>
                  <span className="pill">{txns?.length ?? 0}</span>
                </button>
              </div>
            )}
          </div>
        }
      />

      {error ? (
        <ErrorBox message={error} />
      ) : !txns ? (
        <Spinner />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="card border-emerald-400/25 !bg-emerald-500/[0.06]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300/80">Total credited</div>
                  <div className="mt-2 text-xl font-black tracking-tight sm:text-2xl text-emerald-300">+{money(summary.credit)}</div>
                  <div className="mt-0.5 text-[11px] font-semibold text-emerald-300/70">
                    ≈ {formatInr(pointsToInr(summary.credit, DEFAULT_POINT_VALUE_INR))}
                  </div>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
                  {icons.credit}
                </span>
              </div>
            </div>
            <div className="card border-red-400/25 !bg-red-500/[0.06]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-red-300/80">Total debited</div>
                  <div className="mt-2 text-xl font-black tracking-tight sm:text-2xl text-red-300">-{money(summary.debit)}</div>
                  <div className="mt-0.5 text-[11px] font-semibold text-red-300/70">
                    ≈ {formatInr(pointsToInr(summary.debit, DEFAULT_POINT_VALUE_INR))}
                  </div>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-red-400/30 bg-red-400/10 text-red-300">
                  {icons.debit}
                </span>
              </div>
            </div>
            <div className={`card ${summary.net >= 0 ? 'border-lime/25 !bg-lime/[0.06]' : 'border-red-400/25 !bg-red-500/[0.06]'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Net flow</div>
                  <div className={`mt-2 text-2xl font-black tracking-tight ${summary.net >= 0 ? 'text-lime' : 'text-red-300'}`}>
                    {summary.net >= 0 ? '+' : '-'}{money(Math.abs(summary.net))}
                  </div>
                  <div className={`mt-0.5 text-[11px] font-semibold ${summary.net >= 0 ? 'text-lime/70' : 'text-red-300/70'}`}>
                    ≈ {formatInr(pointsToInr(Math.abs(summary.net), DEFAULT_POINT_VALUE_INR))}
                  </div>
                </div>
                <span className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${summary.net >= 0 ? 'border-lime/30 bg-lime/10 text-lime' : 'border-red-400/30 bg-red-400/10 text-red-300'}`}>
                  {icons.net}
                </span>
              </div>
            </div>
            <div className="card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Transactions</div>
                  <div className="mt-2 text-xl font-black tracking-tight sm:text-2xl text-white">{money(summary.count)}</div>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-edge bg-panel2/60 text-slate-300">
                  {icons.count}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {filterOptions.map((option) => {
                  const active = filter === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFilter(option.value)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                        active
                          ? option.value === 'debit'
                            ? 'border border-red-500/40 bg-red-500/15 text-red-300'
                            : option.value === 'credit'
                              ? 'border border-emerald-400/40 bg-emerald-400/15 text-emerald-300'
                              : 'border border-lime/40 bg-lime/15 text-lime'
                          : 'border border-edge bg-panel2/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      {option.label} <span className={active ? 'opacity-70' : 'text-slate-500'}>{counts[option.value]}</span>
                    </button>
                  )
                })}
                <div className="relative ml-auto w-full sm:w-64">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>
                  <input
                    className="field !pl-9"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search type, from or to…"
                    aria-label="Search transactions"
                  />
                </div>
              </div>

              {visible.length === 0 ? (
                <Empty>
                  {txns.length === 0
                    ? 'No transactions yet.'
                    : 'No transactions match your filters.'}
                </Empty>
              ) : (
                <>
                  <div className="card hidden overflow-x-auto md:block">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>From</th>
                        <th>To</th>
                        <th className="text-right">Amount</th>
                        <th>When</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((txn) => {
                        const direction = txnDirection(txn)
                        return (
                          <tr key={txn._id}>
                            <td>
                              <span className={`pill !border ${categoryClasses[txnCategory(txn.type)]}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${direction === 'debit' ? 'bg-red-400' : 'bg-current'}`} />
                                {txnLabel(txn.type)}
                              </span>
                            </td>
                            <td className="mono max-w-[10rem] truncate text-slate-400" title={txn.from}>{txn.from}</td>
                            <td className="mono max-w-[10rem] truncate text-slate-400" title={txn.to}>{txn.to}</td>
                            <td className={`text-right font-semibold ${directionAmountClass[direction]}`}>
                              {direction === 'debit' ? '-' : '+'}{money(txn.amount)}
                            </td>
                            <td className="whitespace-nowrap text-slate-500">{formatDate(txn.createdAt)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                    </table>
                  </div>
                  <TxnCards txns={visible} formatWhen={(txn) => formatDate(txn.createdAt)} />
                </>
              )}
            </div>

            <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
              <Calculator />

              <div className="card">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-white">{isAdmin ? 'Top recipients' : 'Top sources'}</h2>
                    <p className="mt-0.5 text-xs text-slate-500">{isAdmin ? 'Who is earning the most' : 'Who is sending you points'}</p>
                  </div>
                  <span className="pill">{topParties.length}</span>
                </div>
                {topParties.length === 0 ? (
                  <div className="mt-4 rounded-xl border border-dashed border-edge px-3 py-5 text-center text-xs text-slate-500">
                    Not enough transaction data yet.
                  </div>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {topParties.map(([party, amount], index) => (
                      <li key={party}>
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-panel2 text-[10px] font-bold text-slate-400">{index + 1}</span>
                            <span className="mono truncate text-slate-300">{party || '—'}</span>
                          </span>
                          <span className="shrink-0 font-semibold text-emerald-300">{money(amount)}</span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-panel2">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-lime to-neon"
                            style={{ width: `${topMax ? Math.max(6, (amount / topMax) * 100) : 0}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </aside>
          </div>
        </>
      )}
    </>
  )
}
