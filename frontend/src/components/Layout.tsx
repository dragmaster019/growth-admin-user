import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { rankProgress } from '../lib/rank'
import { DEFAULT_POINT_VALUE_INR, formatInr, pointsToInr } from '../lib/points'
import type { User } from '../lib/types'
import ThemeToggle from './ThemeToggle'
import { RankBadge, money } from './ui'

const icon = (paths: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
    {paths}
  </svg>
)

const links: { to: string; label: string; icon: ReactNode; accent: string; adminOnly?: boolean }[] = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    accent: '#8b5cf6',
    icon: icon(<><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>),
  },
  {
    to: '/tree',
    label: 'Network',
    accent: '#ec4899',
    icon: icon(<><circle cx="12" cy="4" r="2" /><circle cx="5" cy="20" r="2" /><circle cx="19" cy="20" r="2" /><path d="M12 6v5M5 18v-3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3" /></>),
  },
  {
    to: '/leaderboard',
    label: 'Leaderboard',
    accent: '#f59e0b',
    icon: icon(<><path d="m3 7 4 4 5-7 5 7 4-4-2 12H5L3 7Z" /></>),
  },
  {
    to: '/payouts',
    label: 'Payouts',
    accent: '#10b981',
    icon: icon(<><path d="M12 3v18M17 7H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>),
  },
  {
    to: '/calculator',
    label: 'Calculator',
    accent: '#0ea5e9',
    icon: icon(<><rect x="4" y="3" width="16" height="18" rx="3" /><path d="M8 7h8M8 12h2M12 12h2M16 12h.01M8 16h2M12 16h2M16 16h.01" /></>),
  },
  {
    to: '/transactions',
    label: 'Transactions',
    accent: '#06b6d4',
    icon: icon(<><path d="M4 7h16M4 12h16M4 17h10" /></>),
  },
  {
    to: '/users',
    label: 'Users',
    accent: '#3b82f6',
    adminOnly: true,
    icon: icon(<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9" /><path d="M16 3.1a4 4 0 0 1 0 7.8" /></>),
  },
  {
    to: '/contact-management',
    label: 'Contacts',
    accent: '#14b8a6',
    adminOnly: true,
    icon: icon(<><path d="M4 4h16v16H4z" /><path d="m4 7 8 6 8-6" /></>),
  },
  {
    to: '/profile',
    label: 'Profile',
    accent: '#f97316',
    icon: icon(<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>),
  },
]

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

function Logo({ compact = false, iconOnly = false }: { compact?: boolean; iconOnly?: boolean }) {
  return (
    <Link to="/dashboard" className="group flex items-center gap-3">
      <span className="brand-mark transition duration-300 group-hover:rotate-6 group-hover:scale-105">G</span>
      {!iconOnly && (
        <span>
          <span className="block text-lg font-black leading-none tracking-tight text-white">
            Growth<span className="text-lime">.</span>
          </span>
          {!compact && (
            <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.22em] text-slate-500">
              Build · Earn · Repeat
            </span>
          )}
        </span>
      )}
    </Link>
  )
}

function Sparkle() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
    </svg>
  )
}

function MenuIcon({ open = false }: { open?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5">
      {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h10M4 17h16" />}
    </svg>
  )
}

function NavList({
  items,
  compact = false,
  onNavigate,
}: {
  items: (typeof links)[number][]
  compact?: boolean
  onNavigate?: () => void
}) {
  return (
    <nav className={`min-h-0 flex-1 space-y-1.5 overflow-y-auto ${compact ? 'px-0' : 'pr-0.5'}`}>
      {items.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          title={compact ? l.label : undefined}
          onClick={onNavigate}
          style={{ '--nav-accent': l.accent } as CSSProperties}
          className={({ isActive }) =>
            `nav-item group ${isActive ? 'nav-item-active' : ''} ${compact ? 'justify-center !px-0' : ''}`
          }
        >
          <span className="nav-icon">{l.icon}</span>
          {!compact && <span className="truncate">{l.label}</span>}
        </NavLink>
      ))}
    </nav>
  )
}

function BoostCard({
  user,
  progress,
  compact = false,
}: {
  user: User | null
  progress: ReturnType<typeof rankProgress>
  compact?: boolean
}) {
  if (!user || compact) return null
  return (
    <div className="boost-card relative mt-4 shrink-0 overflow-hidden rounded-2xl border border-white/10 p-3.5">
      <div className="relative z-10">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/70">Level up</span>
          <RankBadge rank={user.rank} emoji={user.rankEmoji} className="!border-white/25 !bg-white/10 !text-white" />
        </div>
        <div className="mt-2 text-sm font-black text-white">
          {progress.next ? `Next up: ${progress.next.name} ${progress.next.emoji}` : 'Max rank unlocked 🔥'}
        </div>
        <div className="mt-1 text-[11px] text-white/65">
          {progress.next ? `${money(progress.remaining)} points to go` : 'You are officially a legend.'}
        </div>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-black/20">
          <div
            className="h-full rounded-full bg-white/90"
            style={{ width: `${Math.max(5, progress.progress)}%` }}
          />
        </div>
        <Link to="/leaderboard" className="mt-2.5 inline-flex text-[11px] font-bold text-white/80 hover:text-white">
          See leaderboard →
        </Link>
      </div>
    </div>
  )
}

function UserCard({
  user,
  compact = false,
  onLogout,
}: {
  user: User | null
  compact?: boolean
  onLogout: () => void
}) {
  if (!user) return null
  if (compact) {
    return (
      <div className="mt-4 space-y-2 border-t border-white/10 pt-3">
        <Link to="/profile" className="flex justify-center" title={user.name}>
          <span className="avatar !h-9 !w-9 !text-[10px]">{initials(user.name)}</span>
        </Link>
        <button
          onClick={onLogout}
          title="Sign out"
          className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-red-400/40 hover:text-red-300"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div className="mt-4 shrink-0 rounded-2xl border border-white/10 bg-black/15 p-3 backdrop-blur">
      <div className="flex items-center gap-3">
        <span className="avatar">{initials(user.name)}</span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white">{user.name}</div>
          <div className="truncate text-[11px] text-slate-400">{user.email}</div>
        </div>
        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <RankBadge rank={user.rank} emoji={user.rankEmoji} className="!border-white/20 !bg-white/10 !text-white" />
        <span className="text-right">
          <span className="block text-sm font-black text-emerald-300">{money(user.points)} pts</span>
          <span className="block text-[10px] font-semibold text-emerald-300/70">
            {formatInr(pointsToInr(user.points, DEFAULT_POINT_VALUE_INR))}
          </span>
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="pill !border-transparent !bg-transparent !px-1 capitalize !text-slate-400">{user.role}</span>
        <button onClick={onLogout} className="btn-ghost !border-white/15 !bg-white/5 !px-2.5 !py-1.5 text-xs !text-slate-200">
          Sign out
        </button>
      </div>
    </div>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('mlm-sidebar-collapsed') === '1'
    } catch {
      return false
    }
  })
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  useEffect(() => {
    try {
      localStorage.setItem('mlm-sidebar-collapsed', collapsed ? '1' : '0')
    } catch {
      // ignore storage failures
    }
  }, [collapsed])

  useEffect(() => {
    if (!drawerOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [drawerOpen])

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const visible = links.filter((l) => !l.adminOnly || user?.role === 'admin')
  const progress = rankProgress(user?.points)

  return (
    <div
      className={`min-h-[100dvh] transition-[padding] duration-300 ${
        collapsed ? 'lg:pl-[6.5rem]' : 'lg:pl-[19rem]'
      }`}
    >
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden p-3 transition-[width] duration-300 lg:block ${
          collapsed ? 'w-[6.5rem]' : 'w-[19rem]'
        }`}
      >
        <div className="sidebar-shell relative flex h-full flex-col overflow-hidden rounded-[1.9rem] border border-white/10 p-3 shadow-card backdrop-blur-xl">
          <div
            className={`relative z-10 flex px-1.5 pt-1 ${
              collapsed ? 'flex-col items-center gap-2' : 'items-center justify-between gap-1'
            }`}
          >
            <Logo compact iconOnly={collapsed} />
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-lime/40 hover:text-white"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-4 w-4 transition ${collapsed ? 'rotate-180' : ''}`}>
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
          </div>

          <div className="relative z-10 mt-7 flex min-h-0 flex-1 flex-col overflow-hidden">
            <NavList items={visible} compact={collapsed} />
            <BoostCard user={user} progress={progress} compact={collapsed} />
            <UserCard user={user} compact={collapsed} onLogout={handleLogout} />
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-20 border-b border-edge bg-ink/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-2.5 px-4 py-3">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-edge bg-panel/80 text-white shadow-card backdrop-blur transition hover:border-lime/40 hover:text-lime"
          >
            <MenuIcon />
          </button>
          <Logo compact />
          <div className="ml-auto flex items-center gap-2">
            {user && (
              <span className="pill hidden border-emerald-400/30 bg-emerald-400/10 text-emerald-300 sm:inline-flex">
                {money(user.points)} pts
              </span>
            )}
            <ThemeToggle inline />
          </div>
        </div>
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-ink/70 backdrop-blur-sm"
          />
          <aside className="drawer-panel sidebar-shell absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col overflow-hidden rounded-r-[2rem] border-r border-white/10 p-4 shadow-2xl">
            <div className="relative z-10 flex items-center justify-between gap-3">
              <Logo />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:text-white"
              >
                <MenuIcon open />
              </button>
            </div>

            <div className="relative z-10 mt-7 flex min-h-0 flex-1 flex-col overflow-hidden">
              <NavList items={visible} onNavigate={() => setDrawerOpen(false)} />
              <UserCard user={user} onLogout={handleLogout} />
            </div>
          </aside>
        </div>
      )}

      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        aria-label="Open menu"
        title="Open menu"
        className="fab-menu fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-12 w-12 items-center justify-center gap-2 rounded-full text-xs font-black uppercase tracking-wide text-white sm:h-auto sm:w-auto sm:px-4 sm:py-3 lg:hidden"
      >
        <Sparkle />
        <span className="hidden sm:inline">Menu</span>
      </button>

      <main className="relative mx-auto w-full max-w-7xl px-4 pb-28 pt-5 sm:px-6 sm:pt-6 lg:px-10 lg:py-10">
        <div className="fade-up">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
