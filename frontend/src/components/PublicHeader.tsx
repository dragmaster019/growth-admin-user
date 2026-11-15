import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const links = [
  { to: '/why-join', label: 'Why join' },
  { to: '/why-join#how', label: 'How it works' },
  { to: '/why-join#stories', label: 'Stories' },
  { to: '/why-join#faq', label: 'FAQ' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

const itemClass =
  'relative shrink-0 px-3 py-2 text-[13px] font-medium text-slate-400 transition hover:text-white after:absolute after:inset-x-3 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-lime after:transition-transform after:duration-300 hover:after:scale-x-100'

function NavItem({ to, label }: { to: string; label: string }) {
  if (to.includes('#')) {
    return (
      <Link to={to} className={itemClass}>
        {label}
      </Link>
    )
  }
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `${itemClass} ${isActive ? 'text-white after:scale-x-100' : ''}`}
    >
      {label}
    </NavLink>
  )
}

export default function PublicHeader() {
  const { user } = useAuth()

  return (
    <>
      <div className="relative z-20 border-b border-edge/70 bg-panel/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:px-6">
          <p className="flex min-w-0 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-lime shadow-[0_0_10px_var(--color-lime)]" />
            <span className="truncate">Built for student earners</span>
            <span className="hidden text-slate-600 sm:inline">·</span>
            <span className="hidden sm:inline">No joining fee · Points in one wallet</span>
          </p>
          <Link
            to="/why-join#how"
            className="group inline-flex shrink-0 items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-lime"
          >
            <span className="hidden sm:inline">See how it works</span>
            <span className="sm:hidden">How it works</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3 w-3 transition group-hover:translate-x-0.5"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-edge/80 bg-ink/85 backdrop-blur-xl">
        <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center gap-4 px-4 py-3.5 sm:px-6 lg:grid-cols-[auto_1fr_auto]">
          <Link to="/why-join" className="flex items-center gap-3">
            <span className="brand-mark">G</span>
            <span>
              <span className="block text-lg font-black leading-none tracking-tight text-white">
                Growth<span className="text-lime">.</span>
              </span>
              <span className="mt-0.5 hidden text-[10px] uppercase tracking-[0.22em] text-slate-500 min-[380px]:block">
                Campus network
              </span>
            </span>
          </Link>

          <nav className="hidden items-center justify-center gap-0.5 lg:flex">
            {links.map((link) => (
              <NavItem key={link.to} to={link.to} label={link.label} />
            ))}
          </nav>

          <div className="flex items-center justify-self-end gap-2">
            {user ? (
              <Link to="/dashboard" className="btn-primary !min-h-10 !px-4 !py-2 text-xs">
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden rounded-full border border-transparent px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-edge hover:bg-panel2/50 hover:text-white min-[360px]:inline-flex"
                >
                  Log in
                </Link>
                <Link
                  to="/join"
                  className="btn-primary group !min-h-10 !gap-2 !py-1.5 !pl-4 !pr-1.5 !text-xs"
                >
                  <span>Join now</span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/15 transition group-hover:translate-x-0.5">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3.5 w-3.5"
                    >
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </span>
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="border-t border-edge/60 lg:hidden">
          <nav className="scrollbar-hide mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-3 py-1.5">
            {links.map((link) => (
              <NavItem key={link.to} to={link.to} label={link.label} />
            ))}
          </nav>
        </div>
      </header>
    </>
  )
}
