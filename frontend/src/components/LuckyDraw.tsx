import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'
import type { Txn, User } from '../lib/types'
import { money } from './ui'

const SEGMENT = 360 / 8
const SEGMENT_PCT = 100 / 8

// Values must match backend/src/utils/luckyDraw.js
const PRIZES = [
  { value: 10, color: '#2fbe64' },
  { value: 50, color: '#07ab5f' },
  { value: 5, color: '#1a6837' },
  { value: 100, color: '#669f76' },
  { value: 25, color: '#8fd4a4' },
  { value: 250, color: '#d4ac9c' },
  { value: 20, color: '#a7d8b5' },
  { value: 75, color: '#2e866a' },
]

const GRADIENT = PRIZES.map(
  (prize, i) => `${prize.color} ${i * SEGMENT_PCT}% ${(i + 1) * SEGMENT_PCT}%`,
).join(', ')

export interface LuckyDrawRecord {
  _id: string
  dayKey: string
  drawnAt: string
  drawnBy: string
  winnerId: string
  winnerName: string
  winnerEmail: string
  prize: number
}

interface DrawStatus {
  today: string
  canDraw: boolean
  eligible: number
  lastDraw: LuckyDrawRecord | null
}

export interface LuckyDrawResult {
  draw: LuckyDrawRecord
  winner: User
  prize: number
  txn: Txn
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

export default function LuckyDraw({ onWin }: { onWin?: (result: LuckyDrawResult) => void }) {
  const [status, setStatus] = useState<DrawStatus | null>(() => api.peek<DrawStatus>('/lucky-draw') ?? null)
  const [loading, setLoading] = useState(!status)
  const [error, setError] = useState('')
  const [spinning, setSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [result, setResult] = useState<LuckyDrawResult | null>(null)
  const rotationRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    api
      .get<DrawStatus>('/lucky-draw')
      .then((data) => setStatus(data))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const canDraw = !!status?.canDraw && (status?.eligible ?? 0) > 0 && !loading
  const lastDraw = result?.draw ?? status?.lastDraw ?? null

  async function draw() {
    if (spinning || !canDraw) return
    setSpinning(true)
    setError('')
    setResult(null)
    try {
      const data = await api.post<LuckyDrawResult>('/lucky-draw')
      setStatus((current) =>
        current ? { ...current, canDraw: false, lastDraw: data.draw } : current,
      )

      const index = Math.max(0, PRIZES.findIndex((prize) => prize.value === data.prize))
      const target = 360 - (index * SEGMENT + SEGMENT / 2)
      const current = rotationRef.current
      const next = current + 360 * 5 + ((((target - current) % 360) + 360) % 360)
      rotationRef.current = next
      setRotation(next)

      timerRef.current = setTimeout(() => {
        setSpinning(false)
        setResult(data)
        onWin?.(data)
      }, 3400)
    } catch (e) {
      setSpinning(false)
      setError((e as Error).message)
      setStatus((current) => (current ? { ...current, canDraw: false } : current))
    }
  }

  return (
    <section className="card overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Lucky draw</h2>
          <p className="mt-1 text-xs text-slate-500">One random user wins points, once per day.</p>
        </div>
        <span className="pill border-amber-400/30 bg-amber-400/10 text-amber-300">Admin</span>
      </div>

      <div className="mt-5 flex flex-col items-center">
        <div className="relative h-52 w-52 sm:h-56 sm:w-56">
          <div className="absolute inset-0 rounded-full border-[6px] border-panel bg-panel2 shadow-card">
            <div
              className="absolute inset-0 overflow-hidden rounded-full"
              style={{
                background: `conic-gradient(from 0deg, ${GRADIENT})`,
                transform: `rotate(${rotation}deg)`,
                transition: 'transform 3.4s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              aria-hidden="true"
            >
              {PRIZES.map((prize, i) => {
                const angle = i * SEGMENT + SEGMENT / 2
                return (
                  <span
                    key={prize.value}
                    className="absolute left-1/2 top-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-black/15 text-[11px] font-black text-[#f4fbf6] drop-shadow-sm"
                    style={{
                      transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-70px) rotate(${-angle}deg)`,
                    }}
                  >
                    {prize.value}
                  </span>
                )
              })}
            </div>
          </div>

          <div className="pointer-events-none absolute left-1/2 top-[-8px] z-10 -translate-x-1/2" aria-hidden="true">
            <div className="h-0 w-0 border-l-[10px] border-r-[10px] border-t-[16px] border-l-transparent border-r-transparent border-t-white drop-shadow-md" />
          </div>

          <button
            type="button"
            onClick={draw}
            disabled={spinning || !canDraw}
            aria-label={canDraw ? 'Draw a lucky user' : 'Lucky draw is not available'}
            className="absolute left-1/2 top-1/2 z-10 flex h-[74px] w-[74px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-4 border-panel bg-lime text-[11px] font-black uppercase tracking-wider text-ink shadow-[var(--glow-brand)] transition duration-200 enabled:hover:scale-105 disabled:cursor-not-allowed disabled:opacity-90"
          >
            {spinning || loading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-ink/30 border-t-ink" />
            ) : (
              <>
                <span className="text-lg leading-none">G</span>
                <span className="mt-0.5">{canDraw ? 'Draw' : 'Done'}</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-4 min-h-12 text-center" aria-live="polite">
          {error ? (
            <p className="mx-auto max-w-[16rem] text-xs font-medium text-red-300">{error}</p>
          ) : result ? (
            <div className="space-y-1">
              <p className="text-sm font-bold text-emerald-300">
                {result.winner.name} won +{money(result.prize)} points
              </p>
              <p className="text-[11px] text-slate-500">Draw complete for today.</p>
            </div>
          ) : !canDraw && lastDraw ? (
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-wider text-slate-500">Today's lucky user</p>
              <p className="text-sm font-bold text-white">
                {lastDraw.winnerName} <span className="text-emerald-300">+{money(lastDraw.prize)}</span>
              </p>
            </div>
          ) : status && status.eligible === 0 ? (
            <p className="mx-auto max-w-[16rem] text-xs leading-relaxed text-slate-500">
              No regular users are eligible for the draw yet.
            </p>
          ) : (
            <div className="space-y-1">
              <p className="mx-auto max-w-[16rem] text-xs leading-relaxed text-slate-500">
                Spin to pick one lucky user. They receive 5–250 points.
              </p>
              {status && (
                <p className="text-[11px] text-slate-500">{status.eligible} eligible users</p>
              )}
            </div>
          )}
        </div>
      </div>

      {lastDraw && canDraw && !result && !error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-edge/70 bg-panel2/35 px-3 py-2">
          <span className="avatar !h-7 !w-7 !text-[9px]">{initials(lastDraw.winnerName)}</span>
          <p className="min-w-0 flex-1 truncate text-[11px] text-slate-500">
            Last draw: <span className="font-semibold text-slate-300">{lastDraw.winnerName}</span> won{' '}
            {money(lastDraw.prize)} pts
          </p>
        </div>
      )}
    </section>
  )
}
