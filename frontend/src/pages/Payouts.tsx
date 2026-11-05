import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { DEFAULT_POINT_VALUE_INR, formatInr, formatRate, pointsToInr } from '../lib/points'
import type { PayoutData, PayoutMethod, PayoutRequest, PayoutStatus } from '../lib/types'
import { Empty, ErrorBox, PageHeader, Spinner, money } from '../components/ui'

const statusStyles: Record<PayoutStatus, string> = {
  pending: 'border-amber-400/40 bg-amber-400/10 text-amber-300',
  approved: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
  rejected: 'border-red-400/40 bg-red-400/10 text-red-300',
}

const methodLabels: Record<PayoutMethod, string> = {
  upi: 'UPI',
  bank: 'Bank transfer',
  paypal: 'PayPal',
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(undefined, {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function StatusPill({ status }: { status: PayoutStatus }) {
  return (
    <span className={`pill !border capitalize ${statusStyles[status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  )
}

export default function Payouts() {
  const [data, setData] = useState<PayoutData | null>(() => api.peek<PayoutData>('/payouts') ?? null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [busyId, setBusyId] = useState('')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PayoutMethod>('upi')
  const [destination, setDestination] = useState('')
  const [note, setNote] = useState('')
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({})

  useEffect(() => {
    api.get<PayoutData>('/payouts').then(setData).catch((e) => setError((e as Error).message))
  }, [])

  const isAdmin = data?.role === 'admin'

  const summary = useMemo(() => {
    const requests = data?.requests ?? []
    return {
      pending: requests.filter((r) => r.status === 'pending').length,
      approved: requests.filter((r) => r.status === 'approved').length,
      paid: requests.filter((r) => r.status === 'approved').reduce((sum, r) => sum + r.amount, 0),
      pendingValue: requests.filter((r) => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0),
    }
  }, [data])

  const quickAmounts = useMemo(() => {
    if (!data) return []
    const values = [data.minPayout, Math.round(data.balance / 2), data.balance]
    return [...new Set(values.filter((value) => value >= data.minPayout && value <= data.balance))]
  }, [data])

  async function submitPayout(e: React.FormEvent) {
    e.preventDefault()
    if (!data) return
    setBusy(true)
    setNotice('')
    setError('')
    try {
      const res = await api.post<{ request: PayoutRequest }>('/payouts', { amount, method, destination, note })
      setData((current) =>
        current
          ? {
              ...current,
              requests: [res.request, ...current.requests],
              pendingCount: current.pendingCount + 1,
            }
          : current,
      )
      setAmount('')
      setDestination('')
      setNote('')
      setNotice('Request sent. An admin will review it shortly.')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function review(request: PayoutRequest, status: 'approved' | 'rejected') {
    setBusyId(request._id)
    setNotice('')
    setError('')
    try {
      await api.patch(`/payouts/${request._id}`, {
        status,
        adminNote: adminNotes[request._id] || '',
      })
      const fresh = await api.get<PayoutData>('/payouts')
      setData(fresh)
      setNotice(status === 'approved' ? `Payout to ${request.name} approved.` : `Payout to ${request.name} rejected.`)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusyId('')
    }
  }

  if (error && !data) return <ErrorBox message={error} />
  if (!data) return <Spinner label="Loading payouts…" />

  const rate = data.pointValue ?? DEFAULT_POINT_VALUE_INR
  const pendingRequests = data.requests.filter((request) => request.status === 'pending')
  const otherRequests = data.requests.filter((request) => request.status !== 'pending')

  return (
    <>
      <PageHeader
        title="Payouts"
        subtitle={
          isAdmin
            ? `Review withdrawal requests at ${formatRate(rate)} per point.`
            : `Turn your points into real money at ${formatRate(rate)} per point.`
        }
        actions={
          <span className="pill border-lime/30 bg-lime/10 text-lime">
            {isAdmin ? `${summary.pending} pending` : `${formatInr(pointsToInr(data.balance, rate))} available`}
          </span>
        }
      />

      {notice && (
        <div className="mb-4 rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
          {notice}
        </div>
      )}
      {error && <div className="mb-4"><ErrorBox message={error} /></div>}

      {isAdmin ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="card border-amber-400/25 !bg-amber-400/[0.07]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-300/80">Pending</div>
              <div className="mt-2 text-2xl font-black text-amber-300">{summary.pending}</div>
              <div className="text-[11px] text-slate-500">
                {money(summary.pendingValue)} pts · {formatInr(pointsToInr(summary.pendingValue, rate))}
              </div>
            </div>
            <div className="card border-emerald-400/25 !bg-emerald-400/[0.06]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300/80">Approved</div>
              <div className="mt-2 text-2xl font-black text-emerald-300">{summary.approved}</div>
              <div className="text-[11px] text-slate-500">
                {money(summary.paid)} pts · {formatInr(pointsToInr(summary.paid, rate))}
              </div>
            </div>
            <div className="card">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Requests</div>
              <div className="mt-2 text-2xl font-black text-white">{data.requests.length}</div>
              <div className="text-[11px] text-slate-500">last 100</div>
            </div>
            <div className="card">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Min payout</div>
              <div className="mt-2 text-2xl font-black text-white">{formatInr(pointsToInr(data.minPayout, rate))}</div>
              <div className="text-[11px] text-slate-500">{money(data.minPayout)} points</div>
            </div>
          </div>

          <div className="mt-6 card">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Pending review</h2>
                <p className="text-xs text-slate-500">Approve to deduct points and log a payout transaction.</p>
              </div>
              <span className="pill border-amber-400/30 bg-amber-400/10 text-amber-300">{pendingRequests.length}</span>
            </div>

            {pendingRequests.length === 0 ? (
              <Empty>No pending payouts. Queue is clear. ✨</Empty>
            ) : (
              <ul className="space-y-3">
                {pendingRequests.map((request) => (
                  <li key={request._id} className="rounded-2xl border border-edge/70 bg-panel2/40 p-3.5">
                    <div className="flex flex-wrap items-start gap-3">
                      <span className="avatar !h-10 !w-10 !text-[11px]">{initials(request.name)}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-white">{request.name}</span>
                          <StatusPill status={request.status} />
                        </div>
                        <div className="mono truncate text-[11px] text-slate-500">{request.email}</div>
                        <div className="mt-1.5 text-xs text-slate-400">
                          {methodLabels[request.method]} · <span className="mono">{request.destination}</span>
                        </div>
                        {request.note && <div className="mt-1 text-xs text-slate-500">“{request.note}”</div>}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-white">{money(request.amount)}</div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500">points</div>
                        <div className="text-[11px] font-semibold text-emerald-300">
                          {formatInr(pointsToInr(request.amount, rate))}
                        </div>
                        <div className="mt-1 text-[10px] text-slate-500">{formatDate(request.createdAt)}</div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <input
                        className="field !py-2 text-xs"
                        placeholder="Admin note (optional)"
                        value={adminNotes[request._id] || ''}
                        onChange={(e) =>
                          setAdminNotes((current) => ({ ...current, [request._id]: e.target.value }))
                        }
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="btn-primary flex-1 !py-2 text-xs sm:flex-none"
                          disabled={busyId === request._id}
                          onClick={() => review(request, 'approved')}
                        >
                          {busyId === request._id ? 'Saving…' : 'Approve'}
                        </button>
                        <button
                          type="button"
                          className="btn-danger flex-1 !py-2 text-xs sm:flex-none"
                          disabled={busyId === request._id}
                          onClick={() => review(request, 'rejected')}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-6 card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">History</h2>
              <span className="pill">{otherRequests.length}</span>
            </div>
            {otherRequests.length === 0 ? (
              <Empty>Reviewed payouts will appear here.</Empty>
            ) : (
              <ul className="space-y-2">
                {otherRequests.map((request) => (
                  <li key={request._id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-edge/60 bg-panel2/30 px-3 py-2.5">
                    <span className="avatar !h-8 !w-8 !text-[10px]">{initials(request.name)}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-white">{request.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {methodLabels[request.method]} · {formatDate(request.createdAt)}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-white">
                      {money(request.amount)} pts
                      <span className="ml-1.5 text-[11px] font-semibold text-emerald-300">
                        {formatInr(pointsToInr(request.amount, rate))}
                      </span>
                    </span>
                    <StatusPill status={request.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <section className="card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">Request a payout</h2>
                <p className="text-xs text-slate-500">
                  Minimum {money(data.minPayout)} points ({formatInr(pointsToInr(data.minPayout, rate))}). One request
                  can be pending at a time.
                </p>
              </div>
              <div className="mini-card px-4 py-2 text-right">
                <div className="text-[10px] uppercase tracking-wider text-slate-500">Available</div>
                <div className="text-xl font-black text-emerald-300">{formatInr(pointsToInr(data.balance, rate))}</div>
                <div className="text-[10px] text-slate-500">{money(data.balance)} points</div>
              </div>
            </div>

            {data.pendingCount > 0 && (
              <div className="mt-4 rounded-xl border border-amber-400/40 bg-amber-400/10 px-3.5 py-2.5 text-xs text-amber-300">
                You already have a pending request. It will show below.
              </div>
            )}

            <form onSubmit={submitPayout} className="mt-5 space-y-4">
              <div>
                <div className="flex items-end justify-between gap-3">
                  <label className="label" htmlFor="payout-amount">Amount (points)</label>
                  <Link to="/calculator" className="text-[11px] font-semibold text-lime hover:underline">
                    Points calculator →
                  </Link>
                </div>
                <input
                  id="payout-amount"
                  type="number"
                  className="field"
                  min={data.minPayout}
                  max={data.balance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`${data.minPayout} – ${data.balance}`}
                  required
                />
                <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                  <span>1 point = {formatRate(rate)}</span>
                  <span className="font-semibold text-emerald-300">
                    {amount ? `≈ ${formatInr(pointsToInr(Number(amount), rate))}` : '—'}
                  </span>
                </div>
                {quickAmounts.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {quickAmounts.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setAmount(String(value))}
                        title={formatInr(pointsToInr(value, rate))}
                        className="rounded-full border border-edge bg-panel2/60 px-2.5 py-1 text-[11px] font-semibold text-slate-400 transition hover:border-lime/40 hover:text-lime"
                      >
                        {money(value)} pts
                        <span className="ml-1 text-[10px] text-emerald-300/80">
                          {formatInr(pointsToInr(value, rate))}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="payout-method">Method</label>
                  <select
                    id="payout-method"
                    className="field"
                    value={method}
                    onChange={(e) => setMethod(e.target.value as PayoutMethod)}
                  >
                    <option value="upi">UPI</option>
                    <option value="bank">Bank transfer</option>
                    <option value="paypal">PayPal</option>
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="payout-destination">
                    {method === 'upi' ? 'UPI ID' : method === 'bank' ? 'Account number' : 'PayPal email'}
                  </label>
                  <input
                    id="payout-destination"
                    className="field"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder={
                      method === 'upi'
                        ? 'name@bank'
                        : method === 'bank'
                          ? 'Account / IFSC'
                          : 'you@paypal.com'
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="payout-note">Note (optional)</label>
                <textarea
                  id="payout-note"
                  className="field"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Anything the admin should know?"
                />
              </div>

              <button className="btn-primary w-full" disabled={busy || data.pendingCount > 0}>
                {busy ? 'Sending request…' : data.pendingCount > 0 ? 'Request pending' : 'Request payout'}
              </button>
            </form>
          </section>

          <aside className="card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Your requests</h2>
              <span className="pill">{data.requests.length}</span>
            </div>
            {data.requests.length === 0 ? (
              <Empty>No payout requests yet.</Empty>
            ) : (
              <ul className="space-y-3">
                {data.requests.map((request) => (
                  <li key={request._id} className="rounded-2xl border border-edge/60 bg-panel2/30 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-black text-white">
                          {money(request.amount)} pts
                          <span className="ml-1.5 text-[11px] font-semibold text-emerald-300">
                            {formatInr(pointsToInr(request.amount, rate))}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {methodLabels[request.method]} · {formatDate(request.createdAt)}
                        </div>
                      </div>
                      <StatusPill status={request.status} />
                    </div>
                    {request.adminNote && (
                      <div className="mt-2 rounded-lg border border-edge/60 bg-panel2/50 px-2.5 py-1.5 text-[11px] text-slate-400">
                        Admin: {request.adminNote}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      )}
    </>
  )
}
