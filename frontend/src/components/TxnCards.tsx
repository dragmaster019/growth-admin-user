import type { Txn } from '../lib/types'
import {
  categoryClasses,
  directionAmountClass,
  txnCategory,
  txnDirection,
  txnLabel,
} from '../lib/transactions'
import { money } from './ui'

export default function TxnCards({
  txns,
  formatWhen,
}: {
  txns: Txn[]
  formatWhen?: (txn: Txn) => string
}) {
  if (!txns.length) return null

  return (
    <div className="space-y-2.5 md:hidden">
      {txns.map((txn) => {
        const direction = txnDirection(txn)
        return (
          <div key={txn._id} className="rounded-2xl border border-edge/70 bg-panel2/35 p-3.5">
            <div className="flex items-start justify-between gap-3">
              <span className={`pill !border ${categoryClasses[txnCategory(txn.type)]}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${direction === 'debit' ? 'bg-red-400' : 'bg-current'}`} />
                {txnLabel(txn.type)}
              </span>
              <span className={`shrink-0 text-sm font-bold ${directionAmountClass[direction]}`}>
                {direction === 'debit' ? '-' : '+'}
                {money(txn.amount)}
              </span>
            </div>

            <dl className="mt-3 space-y-1.5 text-xs">
              <div className="flex gap-2">
                <dt className="w-9 shrink-0 text-slate-500">From</dt>
                <dd className="mono min-w-0 truncate text-slate-300">{txn.from}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-9 shrink-0 text-slate-500">To</dt>
                <dd className="mono min-w-0 truncate text-slate-300">{txn.to}</dd>
              </div>
            </dl>

            <div className="mt-2.5 text-[11px] text-slate-500">
              {formatWhen ? formatWhen(txn) : new Date(txn.createdAt).toLocaleString()}
            </div>
          </div>
        )
      })}
    </div>
  )
}
