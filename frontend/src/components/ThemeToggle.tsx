import { useLocation } from 'react-router-dom'
import { useTheme } from '../lib/theme'

const APP_PATHS = [
  '/dashboard',
  '/tree',
  '/leaderboard',
  '/payouts',
  '/calculator',
  '/transactions',
  '/users',
  '/profile',
  '/change-password',
  '/contact-management',
]

export default function ThemeToggle({ inline = false }: { inline?: boolean }) {
  const { theme, toggle } = useTheme()
  const { pathname } = useLocation()
  const dark = theme === 'dark'
  const inApp = APP_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  const base =
    'flex items-center justify-center rounded-2xl border border-edge bg-panel/85 text-white shadow-card ring-1 ring-black/5 backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-lime/50 hover:text-lime'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
      className={
        inline
          ? `${base} h-9 w-9`
          : `${base} fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-50 h-11 w-11 sm:bottom-5 sm:right-5 sm:h-12 sm:w-12 ${
              inApp ? 'hidden lg:flex' : 'flex'
            }`
      }
    >
      {dark ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-5 w-5">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        </svg>
      )}
    </button>
  )
}
