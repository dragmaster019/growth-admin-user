import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import {
  DEFAULT_POINT_VALUE_INR,
  formatInr,
  formatRate,
  inrToPoints,
  pointsToInr,
} from '../lib/points'
import type { PayoutData } from '../lib/types'
import { PageHeader } from '../components/ui'

const quickPoints = [500, 1000, 5000, 10000]

export default function PointsCalculator() {
  const { user } = useAuth()
  const [data, setData] = useState<PayoutData | null>(() => api.peek<PayoutData>('/payouts') ?? null)
  const [pointsInput, setPointsInput] = useState('500')
  const [rupeesInput, setRupeesInput] = useState(String(pointsToInr(500)))

  useEffect(() => {
    api.get<PayoutData>('/payouts').then(setData).catch(() => undefined)
  }, [])

  const rate = data?.pointValue ?? DEFAULT_POINT_VALUE_INR
  const balance = data?.balance ?? user?.points ?? 0
  const minPayout = data?.minPayout ?? 500
  const points = Number(pointsInput) || 0
  const rupees = Number(rupeesInput) || 0

  function changePoints(value: string) {
    setPointsInput(value)
    const next = Number(value)
    setRupeesInput(value === '' || !Number.isFinite(next) ? '' : String(pointsToInr(next, rate)))
  }

  function changeRupees(value: string) {
    setRupeesInput(value)
    const next = Number(value)
    setPointsInput(value === '' || !Number.isFinite(next) ? '' : String(inrToPoints(next, rate)))
  }

  function applyPoints(value: number) {
    setPointsInput(String(value))
    setRupeesInput(String(pointsToInr(value, rate)))
  }

  const belowMinimum = points > 0 && points < minPayout

  return (
    <>
      <PageHeader
        title="Points calculator"
        subtitle="See exactly what your points are worth in rupees."
        actions={
          <span className="pill border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
            {formatRate(rate)} per point
          </span>
        }
      />

      <section className="hero mb-6">
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="pill border-lime/30 !bg-lime/10 !text-lime">Live conversion</span>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
              1 point = <span className="text-gradient">{formatRate(rate)}</span>
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate-400">
              Points are converted at a fixed rate. Minimum withdrawal is {minPayout.toLocaleString('en-IN')} points
              ({formatInr(pointsToInr(minPayout, rate))}).
            </p>
          </div>
          <div className="mini-card w-full p-4 sm:max-w-xs">
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Your balance</div>
            <div className="mt-1 text-2xl font-black text-white">{balance.toLocaleString('en-IN')} pts</div>
            <div className="mt-1 text-lg font-black text-emerald-300">{formatInr(pointsToInr(balance, rate))}</div>
            <Link to="/payouts" className="btn-primary mt-4 w-full !py-2 text-xs">
              Request payout
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <section className="card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">Convert points ↔ rupees</h2>
              <p className="mt-0.5 text-xs text-slate-500">Type in either box and the other updates instantly.</p>
            </div>
            <span className="pill border-lime/30 bg-lime/10 text-lime">INR</span>
          </div>

          <div className="mt-5 grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <div>
              <label className="label" htmlFor="calculator-points">Points</label>
              <input
                id="calculator-points"
                type="number"
                min={0}
                inputMode="numeric"
                className="field text-lg font-bold"
                value={pointsInput}
                onChange={(e) => changePoints(e.target.value)}
                placeholder="500"
              />
            </div>
            <div className="hidden pb-3 text-center text-xl font-black text-slate-500 sm:block">→</div>
            <div>
              <label className="label" htmlFor="calculator-rupees">Rupees</label>
              <input
                id="calculator-rupees"
                type="number"
                min={0}
                inputMode="numeric"
                className="field text-lg font-bold"
                value={rupeesInput}
                onChange={(e) => changeRupees(e.target.value)}
                placeholder="6000"
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {quickPoints.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => applyPoints(value)}
                className="rounded-full border border-edge bg-panel2/60 px-3 py-1.5 text-[11px] font-semibold text-slate-400 transition hover:border-lime/40 hover:text-lime"
              >
                {value.toLocaleString('en-IN')} pts
              </button>
            ))}
            <button
              type="button"
              onClick={() => applyPoints(balance)}
              className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-300 transition hover:border-emerald-400/60"
            >
              My balance
            </button>
          </div>

          <div className="mt-5 rounded-2xl border border-edge/70 bg-panel2/40 p-4">
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Estimated value</div>
            <div className="mt-1 break-words text-3xl font-black tracking-tight text-emerald-300">
              {formatInr(rupees)}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {points.toLocaleString('en-IN')} points × {formatRate(rate)} = {formatInr(rupees)}
            </div>
            {belowMinimum && (
              <div className="mt-3 rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-[11px] text-amber-300">
                Minimum payout is {minPayout.toLocaleString('en-IN')} points ({formatInr(pointsToInr(minPayout, rate))}).
              </div>
            )}
          </div>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold text-white">How payouts work</h2>
          <p className="mt-1 text-xs text-slate-500">Simple, reviewed, and tracked.</p>
          <ol className="mt-4 space-y-3">
            {[
              {
                title: 'Request',
                body: `Choose how many points to redeem (minimum ${minPayout.toLocaleString('en-IN')}).`,
              },
              {
                title: 'Admin review',
                body: 'An admin checks the request and approves or rejects it.',
              },
              {
                title: 'Points deducted',
                body: 'Points leave your wallet only after approval, and a payout transaction is logged.',
              },
            ].map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xs font-black text-lime">
                  {index + 1}
                </span>
                <div>
                  <div className="text-sm font-bold text-white">{step.title}</div>
                  <div className="mt-0.5 text-xs leading-relaxed text-slate-500">{step.body}</div>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-5 rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-3.5">
            <div className="text-[10px] uppercase tracking-[0.18em] text-emerald-300/80">Your cash value</div>
            <div className="mt-1 text-2xl font-black text-emerald-300">{formatInr(pointsToInr(balance, rate))}</div>
            <div className="text-[11px] text-slate-500">{balance.toLocaleString('en-IN')} points available</div>
          </div>
          <Link to="/payouts" className="btn-ghost mt-4 w-full text-sm">Go to payouts</Link>
        </section>
      </div>
    </>
  )
}
