import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const links = [
  { to: '/why-join', label: 'Why Join' },
  { to: '/about', label: 'About Us' },
  { to: '/contact', label: 'Contact Us' },
]

export default function PublicHeader() {
  const { user } = useAuth()

  return (
    <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
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

      <nav className="hidden items-center gap-1 md:flex">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `rounded-xl px-3 py-2 text-sm font-semibold transition ${
                isActive ? 'bg-panel2/70 text-white' : 'text-slate-400 hover:text-white'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        {user ? (
          <Link to="/dashboard" className="btn-primary !px-3 !py-2 text-xs sm:text-sm">
            Dashboard
          </Link>
        ) : (
          <>
            <Link to="/login" className="btn-ghost !px-3 !py-2 text-xs sm:text-sm">
              Log in
            </Link>
            <Link to="/join" className="btn-primary !px-3 !py-2 text-xs sm:text-sm">
              Join now
            </Link>
          </>
        )}
      </div>
    </header>
  )
}
