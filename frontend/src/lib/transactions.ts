import type { Txn } from './types'

export type TxnDirection = 'credit' | 'debit'
export type TxnCategory = 'join' | 'product' | 'admin' | 'spin' | 'payout' | 'other'

export function txnDirection(txn: Pick<Txn, 'type'>): TxnDirection {
  const type = txn.type.toLowerCase()
  return type.includes('debit') ||
    type.includes('withdraw') ||
    type.includes('spend') ||
    type.includes('payout')
    ? 'debit'
    : 'credit'
}

export function txnCategory(type: string): TxnCategory {
  const value = type.toLowerCase()
  if (value.includes('registration') || value.includes('join')) return 'join'
  if (value.includes('spin') || value.includes('lucky')) return 'spin'
  if (value.includes('payout') || value.includes('withdraw')) return 'payout'
  if (value.includes('product')) return 'product'
  if (value.includes('admin')) return 'admin'
  return 'other'
}

const labels: Record<string, string> = {
  'new registration': 'Join bonus',
  'admin credit': 'Admin credit',
  'admin debit': 'Admin debit',
  'product purchased': 'Product commission',
  'product purchased (root remainder)': 'Root remainder',
  'product purchased (founder pool)': 'Founder pool',
  'lucky draw': 'Lucky draw',
  payout: 'Payout',
}

export function txnLabel(type: string) {
  if (labels[type]) return labels[type]
  return type.replace(/\b\w/g, (c) => c.toUpperCase())
}

export const categoryClasses: Record<TxnCategory, string> = {
  join: 'border-lime/40 bg-lime/10 text-lime',
  product: 'border-magenta/40 bg-magenta/10 text-magenta',
  admin: 'border-amber-400/40 bg-amber-400/10 text-amber-300',
  spin: 'border-neon/40 bg-neon/10 text-neon',
  payout: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
  other: 'border-edge bg-panel2/70 text-slate-300',
}

export const directionAmountClass: Record<TxnDirection, string> = {
  credit: 'text-emerald-300',
  debit: 'text-red-300',
}

export function exportTransactionsCsv(txns: Txn[], filename = 'transactions.csv') {
  const header = ['Type', 'Direction', 'From', 'To', 'Amount', 'Date']
  const rows = txns.map((txn) => [
    txnLabel(txn.type),
    txnDirection(txn),
    txn.from,
    txn.to,
    String(txn.amount),
    new Date(txn.createdAt).toISOString(),
  ])
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`
  const csv = [header, ...rows].map((row) => row.map(escape).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
