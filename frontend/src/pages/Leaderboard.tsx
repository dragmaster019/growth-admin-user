import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { rankProgress } from '../lib/rank'
import { DEFAULT_POINT_VALUE_INR, formatInr, formatRate, pointsToInr } from '../lib/points'
import type { LeaderboardData, LeaderboardEntry } from '../lib/types'
import { Empty, ErrorBox, PageHeader, RankBadge, Spinner, money } from '../components/ui'

const podiumTones = [
  'border-amber-300/60 bg-amber-300/10 shadow-[0_18px_50px_-28px_rgba(251,191,36,0.8)]',
  'border-slate-300/50 bg-slate-300/10',
  'border-orange-300/50 bg-orange-300/10',
]

const medals = ['🥇', '🥈', '🥉']

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

function PodiumCard({ entry, place, rate }: { entry: LeaderboardEntry; place: number; rate: number }) {
  const first = place === 0
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-2.5 text-center backdrop-blur sm:rounded-3xl sm:p-5 ${
        podiumTones[place]
      } ${first ? 'sm:-translate-y-2' : ''}`}
    >
      <div className="text-xl sm:text-3xl" aria-hidden>
        {medals[place]}
      </div>
      <div
        className={`mx-auto mt-2 flex items-center justify-center rounded-full text-sm font-black text-white ${
          first ? 'h-14 w-14 text-base sm:h-20 sm:w-20 sm:text-lg' : 'h-10 w-10 sm:h-14 sm:w-14'
        }`}
        style={{
          background:
            place === 0
              ? 'linear-gradient(135deg,#f59e0b,#f97316)'
              : place === 1
                ? 'linear-gradient(135deg,#64748b,#94a3b8)'
                : 'linear-gradient(135deg,#c2410c,#fb923c)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.35)',
        }}
      >
        {initials(entry.name)}
      </div>
      <div className="mt-2 truncate text-xs font-black text-white sm:text-base">{entry.name}</div>
      <div className="mono mt-0.5 hidden truncate text-[10px] text-slate-500 sm:block">{entry.referralCode}</div>
      <div className="mt-2">
        <RankBadge rank={entry.rank} emoji={entry.rankEmoji} />
      </div>
      <div className="mt-1.5 text-base font-black tracking-tight text-white sm:mt-2 sm:text-2xl">{money(entry.points)}</div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500">points</div>
      <div className="mt-1 text-xs font-bold text-emerald-300/90">≈ {formatInr(pointsToInr(entry.points, rate))}</div>
    </div>
  )
}

export default function Leaderboard() {
  const [data, setData] = useState<LeaderboardData | null>(() => api.peek<LeaderboardData>('/leaderboard') ?? null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<LeaderboardData>('/leaderboard').then(setData).catch((e) => setError((e as Error).message))
  }, [])

  if (error) return <ErrorBox message={error} />
  if (!data) return <Spinner label="Loading leaderboard…" />

  const rate = data.pointValue ?? DEFAULT_POINT_VALUE_INR
  const progress = rankProgress(data.me.points)
  const top = data.leaderboard.slice(0, 3)
  const rest = data.leaderboard.slice(3)
  const isAdmin = data.me.role === 'admin'

  return (
    <>
      <PageHeader
        title="Leaderboard"
        subtitle={`The people moving the network right now. Rank is based on wallet points at ${formatRate(rate)} each.`}
        actions={
          <Link to="/payouts" className="btn-primary">
            Redeem points
          </Link>
        }
      />

      <section className="hero mb-6">
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="pill border-lime/30 !bg-lime/10 !text-lime">{isAdmin ? 'Admin view' : 'Your position'}</span>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <div className="text-5xl font-black leading-none tracking-tight text-gradient">
                {isAdmin ? '👑' : `#${data.me.rankPosition}`}
              </div>
              <div>
                <div className="text-sm font-bold text-white">
                  {isAdmin ? `${data.total} members ranked` : `out of ${data.total} members`}
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                  <RankBadge rank={data.me.rank} emoji={data.me.rankEmoji} />
                  <span>
                    {money(data.me.points)} points · ≈ {formatInr(pointsToInr(data.me.points, rate))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mini-card w-full p-4 sm:max-w-sm">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              <span>{progress.next ? `Next: ${progress.next.name}` : 'Max rank unlocked'}</span>
              <span>{progress.progress}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-panel2">
              <div
                className="h-full rounded-full bg-gradient-to-r from-lime via-magenta to-neon"
                style={{ width: `${Math.max(4, progress.progress)}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-slate-500">
              {progress.next
                ? `${money(progress.remaining)} more points to ${progress.next.name} ${progress.next.emoji}`
                : 'You are at the top rank. Keep building.'}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-edge/70 bg-panel2/50 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wider text-slate-500">Direct</div>
                <div className="text-lg font-black text-white">{money(data.me.directCount)}</div>
              </div>
              <div className="rounded-xl border border-edge/70 bg-panel2/50 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wider text-slate-500">Team</div>
                <div className="text-lg font-black text-white">{money(data.me.teamSize)}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {data.leaderboard.length === 0 ? (
        <Empty>No ranked members yet. Invite your first friend to get on the board.</Empty>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-4">
            {top.map((entry, index) => (
              <PodiumCard key={entry._id} entry={entry} place={index} rate={rate} />
            ))}
          </div>

          <div className="card">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Top 20 earners</h2>
                <p className="text-xs text-slate-500">Updated live from wallet balances.</p>
              </div>
              <span className="pill">{data.leaderboard.length}</span>
            </div>

            {rest.length === 0 ? (
              <Empty>Only the podium is populated so far.</Empty>
            ) : (
              <ul className="space-y-2">
                {rest.map((entry) => {
                  const isMe = entry.isMe
                  return (
                    <li
                      key={entry._id}
                      className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition ${
                        isMe
                          ? 'border-lime/40 bg-lime/10'
                          : 'border-edge/60 bg-panel2/30 hover:border-lime/30 hover:bg-panel2/60'
                      }`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-panel2 text-xs font-black text-slate-400">
                        {entry.rankPosition}
                      </span>
                      <span className="avatar !h-9 !w-9 !text-[10px]">{initials(entry.name)}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold text-white">{entry.name}</span>
                          {isMe && <span className="pill !py-0.5 !text-[9px]">You</span>}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <RankBadge rank={entry.rank} emoji={entry.rankEmoji} />
                          <span>{entry.directCount} direct</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-white">{money(entry.points)}</div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500">points</div>
                        <div className="text-[10px] font-semibold text-emerald-300/80">
                          {formatInr(pointsToInr(entry.points, rate))}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </>
  )
}
