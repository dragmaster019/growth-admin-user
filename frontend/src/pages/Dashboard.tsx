import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import type { Txn, User } from '../lib/types'
import {
  categoryClasses,
  directionAmountClass,
  txnCategory,
  txnDirection,
  txnLabel,
} from '../lib/transactions'
import LuckyDraw from '../components/LuckyDraw'
import TxnCards from '../components/TxnCards'
import { rankProgress } from '../lib/rank'
import { DEFAULT_POINT_VALUE_INR, formatInr, pointsToInr } from '../lib/points'
import { Empty, ErrorBox, RankBadge, Spinner, Stat, money } from '../components/ui'

interface AdminDash {
  me: User
  stats: {
    totalUsers: number
    totalProducts: number
    totalPoints: number
    founderCount: number
    pendingPayouts: number
  }
  txns: Txn[]
  founders: User[]
  pointValue: number
}

interface UserDash {
  me: User
  direct: User[]
  downline: number
  myTxns: Txn[]
  // products: Product[] // Products feature temporarily disabled
  referralLink: string
  pointValue: number
}

const icons = {
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
    </svg>
  ),
  box: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M21 8 12 3 3 8l9 5 9-5Z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </svg>
  ),
  wallet: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M20 12V8a2 2 0 0 0-2-2H5a2 2 0 0 1 0-4h13" />
      <path d="M3 6v12a2 2 0 0 0 2 2h15a2 2 0 0 0 2-2v-4" />
      <path d="M16 12h6v4h-6a2 2 0 0 1 0-4Z" />
    </svg>
  ),
  crown: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="m3 7 4 4 5-7 5 7 4-4-2 12H5L3 7Z" />
    </svg>
  ),
  team: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M16 5.5a3 3 0 0 1 0 5M18 20a6 6 0 0 0-3-5.2" />
    </svg>
  ),
  network: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="12" cy="4" r="2" />
      <circle cx="5" cy="20" r="2" />
      <circle cx="19" cy="20" r="2" />
      <path d="M12 6v5M5 18v-3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3" />
    </svg>
  ),
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

function TxnTable({ txns }: { txns: Txn[] }) {
  if (!txns.length) return <Empty>No transactions yet.</Empty>
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="table">
          <thead>
            <tr><th>Type</th><th>From</th><th>To</th><th className="text-right">Amount</th><th>When</th></tr>
          </thead>
          <tbody>
            {txns.map((t) => {
              const direction = txnDirection(t)
              return (
                <tr key={t._id}>
                  <td>
                    <span className={`pill !border ${categoryClasses[txnCategory(t.type)]}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${direction === 'debit' ? 'bg-red-400' : 'bg-current'}`} />
                      {txnLabel(t.type)}
                    </span>
                  </td>
                  <td className="mono max-w-[9rem] truncate text-slate-400" title={t.from}>{t.from}</td>
                  <td className="mono max-w-[9rem] truncate text-slate-400" title={t.to}>{t.to}</td>
                  <td className={`text-right font-semibold ${directionAmountClass[direction]}`}>
                    {direction === 'debit' ? '-' : '+'}{money(t.amount)}
                  </td>
                  <td className="whitespace-nowrap text-slate-500">{new Date(t.createdAt).toLocaleString()}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <TxnCards txns={txns} />
    </>
  )
}

function AdminView() {
  const [data, setData] = useState<AdminDash | null>(() => api.peek<AdminDash>('/dashboard/admin') ?? null)
  const [error, setError] = useState('')
  useEffect(() => {
    api.get<AdminDash>('/dashboard/admin').then(setData).catch((e) => setError((e as Error).message))
  }, [])
  if (error) return <ErrorBox message={error} />
  if (!data) return <Spinner />

  const rate = data.pointValue ?? DEFAULT_POINT_VALUE_INR

  return (
    <>
      <section className="hero mb-6">
        <div className="relative flex flex-wrap items-center justify-between gap-8">
          <div className="max-w-xl">
            <span className="pill border-lime/30 !bg-lime/10 !text-lime">Admin access</span>
            <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
              Admin <span className="text-gradient">control room</span>
            </h1>
            <p className="mt-2.5 text-sm leading-relaxed text-slate-400">
              Network health at a glance. Manage members, growth and payouts from one place.
            </p>
            <div className="mt-5 grid gap-2 min-[420px]:grid-cols-2 sm:flex sm:flex-wrap">
              <Link to="/users" className="btn-primary w-full sm:w-auto">Manage users</Link>
              <Link to="/payouts" className="btn-ghost w-full sm:w-auto">Review payouts</Link>
              <Link to="/tree" className="btn-ghost w-full sm:w-auto">View network</Link>
            </div>
          </div>

          <div className="stagger grid w-full grid-cols-2 gap-2.5 sm:w-auto sm:grid-cols-4">
            {[
              { k: 'Members', v: money(data.stats.totalUsers), sub: '' },
              { k: 'Points', v: money(data.stats.totalPoints), sub: formatInr(pointsToInr(data.stats.totalPoints, rate)) },
              { k: 'Founders', v: money(data.stats.founderCount), sub: '' },
              { k: 'Pending', v: money(data.stats.pendingPayouts), sub: '' },
            ].map((s) => (
              <div key={s.k} className="mini-card p-3.5">
                <div className="text-[10px] uppercase tracking-wider text-slate-500">{s.k}</div>
                <div className="mt-1 text-xl font-black tracking-tight text-white">{s.v}</div>
                {s.sub && <div className="mt-0.5 text-[10px] font-semibold text-emerald-300/80">{s.sub}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="stagger grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Recent transactions</h2>
            <Link to="/transactions" className="text-xs font-semibold text-lime hover:underline">View all →</Link>
          </div>
          <TxnTable txns={data.txns} />
        </div>

        <div className="order-first space-y-6 lg:order-none">
          <LuckyDraw
            onWin={(res) =>
              setData((current) =>
                current
                  ? {
                      ...current,
                      txns: [res.txn, ...current.txns].slice(0, 20),
                      founders: current.founders.map((f) =>
                        f._id === res.winner._id ? { ...f, points: res.winner.points } : f,
                      ),
                      stats: { ...current.stats, totalPoints: current.stats.totalPoints + res.prize },
                    }
                  : current,
              )
            }
          />

          <div className="card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Founders</h2>
              <span className="pill">{data.founders.length}</span>
            </div>
            {data.founders.length === 0 ? (
              <Empty>No founders yet.</Empty>
            ) : (
              <ul className="space-y-3">
                {data.founders.map((f) => (
                  <li key={f._id} className="flex items-center gap-3">
                    <span className="avatar !h-9 !w-9 !text-[10px]">{initials(f.name)}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-white">{f.name}</div>
                      <div className="mono truncate text-xs text-slate-500">{f.referralCode}</div>
                    </div>
                    <span className="pill border-emerald-400/30 bg-emerald-400/10 text-emerald-300">{money(f.points)}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/users" className="btn-ghost mt-5 w-full text-sm">Manage users</Link>
          </div>
        </div>
      </div>
    </>
  )
}

function UserView() {
  const [data, setData] = useState<UserDash | null>(() => api.peek<UserDash>('/dashboard/user') ?? null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    api.get<UserDash>('/dashboard/user').then(setData).catch((e) => setError((e as Error).message))
  }, [])
  if (error) return <ErrorBox message={error} />
  if (!data) return <Spinner />

  const link = `${window.location.origin}${data.referralLink}`
  const rate = data.pointValue ?? DEFAULT_POINT_VALUE_INR
  const progress = rankProgress(data.me.points)
  async function copy() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  async function share() {
    const text = `Join my Growth circle and start earning points: ${link}`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Join my Growth circle', text, url: link })
        return
      } catch {
        // user cancelled or share is unavailable
      }
    }
    await copy()
  }

  return (
    <>
      <section className="hero mb-6">
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="pill border-lime/30 !bg-lime/10 !text-lime">Welcome back</span>
            <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
              Hey, {data.me.name.split(' ')[0]} <span className="inline-block animate-floaty">👋</span>
            </h1>
            <p className="mt-2.5 text-sm text-slate-400">Your side hustle at a glance — wallet, circle and activity.</p>
            <div className="mt-5 grid gap-2 min-[420px]:grid-cols-2 sm:flex sm:flex-wrap">
              <button onClick={share} className="btn-primary w-full sm:w-auto">Share invite</button>
              <button onClick={copy} className="btn-ghost w-full sm:w-auto">{copied ? 'Link copied!' : 'Copy invite link'}</button>
              {/* Products feature temporarily disabled */}
              {/* <Link to="/products" className="btn-ghost">Browse drops</Link> */}
            </div>
          </div>

          <div className="mini-card w-full p-5 sm:max-w-xs">
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Wallet balance</div>
              <RankBadge rank={data.me.rank} emoji={data.me.rankEmoji} />
            </div>
            <div className="mt-1.5 text-4xl font-black tracking-tight text-emerald-300">{money(data.me.points)}</div>
            <div className="text-xs text-slate-500">points available</div>
            <div className="mt-1 text-sm font-bold text-emerald-300/80">
              ≈ {formatInr(pointsToInr(data.me.points, rate))}
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-panel2">
              <div
                className="h-full rounded-full bg-gradient-to-r from-lime via-magenta to-neon"
                style={{ width: `${Math.max(5, progress.progress)}%` }}
              />
            </div>
            <div className="mt-1.5 text-[10px] text-slate-500">
              {progress.next ? `${money(progress.remaining)} pts to ${progress.next.name} ${progress.next.emoji}` : 'Max rank unlocked 🔥'}
            </div>
            <div className="mono mt-3 truncate rounded-lg border border-edge bg-panel2/50 px-2.5 py-1.5 text-[10px] text-neon" title={link}>
              {data.me.referralCode}
            </div>
          </div>
        </div>
      </section>

      <div className="stagger grid grid-cols-2 gap-3">
        <Stat label="Direct members" value={money(data.direct.length)} hint="first line" icon={icons.team} tone="brand" />
        <Stat label="Team size" value={money(data.downline)} hint="your whole circle" icon={icons.network} tone="warning" />
      </div>

      <div className="stagger mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Recent transactions</h2>
            <Link to="/transactions" className="text-xs font-semibold text-lime hover:underline">View all →</Link>
          </div>
          <TxnTable txns={data.myTxns} />
        </div>

        <div className="order-first space-y-6 lg:order-none">
          <div className="card">
            <h2 className="text-lg font-bold text-white">Invite link</h2>
            <p className="mt-1 text-xs text-slate-500">Share with friends and grow your circle.</p>
            <div className="mono mt-3 break-all rounded-xl border border-edge bg-panel2/50 p-3 text-xs text-neon">{link}</div>
            <button onClick={copy} className="btn-ghost mt-3 w-full text-sm">{copied ? 'Copied!' : 'Copy link'}</button>
          </div>

          <div className="card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Direct members</h2>
              <span className="pill">{data.direct.length}</span>
            </div>
            {data.direct.length === 0 ? (
              <Empty>Your circle is empty — invite a friend.</Empty>
            ) : (
              <ul className="space-y-2">
                {data.direct.map((d) => (
                  <li key={d._id} className="flex items-center gap-2.5 rounded-xl border border-edge/60 bg-panel2/30 px-2.5 py-2 text-sm">
                    <span className="avatar !h-7 !w-7 !text-[9px]">{initials(d.name)}</span>
                    <span className="min-w-0 flex-1 truncate text-slate-300">{d.name}</span>
                    <span className="pill mono !py-0.5 !text-[10px]">{d.position}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Products feature temporarily disabled */}
      {/*
      <div className="card mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Drops you can buy</h2>
          <Link to="/products" className="text-xs font-semibold text-lime hover:underline">Shop all →</Link>
        </div>
        {data.products.length === 0 ? (
          <Empty>No products yet.</Empty>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {data.products.map((p) => (
              <div key={p._id} className="group overflow-hidden rounded-2xl border border-edge bg-panel2/40 transition duration-300 hover:-translate-y-0.5 hover:border-lime/40">
                <div className="relative h-28 w-full overflow-hidden bg-lime/10">
                  {p.Image ? (
                    <img src={p.Image} alt={p.Product_name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-2xl font-black text-lime/50">
                      {initials(p.Product_name)}
                    </div>
                  )}
                </div>
                <div className="p-3.5">
                  <div className="truncate text-sm font-semibold text-white">{p.Product_name}</div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-sm font-bold text-lime">{money(p.Price)} pts</span>
                    <span className="text-[11px] text-slate-500">{p.Quantity} left</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      */}
    </>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  return user?.role === 'admin' ? <AdminView /> : <UserView />
}
