import { Link } from 'react-router-dom'
import SocialLinks from './SocialLinks'

const exploreLinks = [
  { to: '/why-join', label: 'Why Join' },
  { to: '/about', label: 'About Us' },
  { to: '/contact', label: 'Contact Us' },
  { to: '/join', label: 'Create account' },
]

const currentYear = new Date().getFullYear()

const accountLinks = [
  { to: '/login', label: 'Log in' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/payouts', label: 'Payouts' },
]

export default function SiteFooter() {
  return (
    <footer className="relative z-10 mt-12 border-t border-edge bg-ink/70">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr] lg:px-10">
        <div>
          <Link to="/why-join" className="group inline-flex items-center gap-3">
            <span className="brand-mark transition duration-300 group-hover:rotate-6 group-hover:scale-105">G</span>
            <span>
              <span className="block text-lg font-black leading-none tracking-tight text-white">
                Growth<span className="text-lime">.</span>
              </span>
              <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.22em] text-slate-500">
                Build · Earn · Repeat
              </span>
            </span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
            A student-first referral network for building your circle, tracking your points and
            growing with people you already trust.
          </p>
          <div className="mt-5">
            <SocialLinks />
          </div>
        </div>

        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Explore</div>
          <ul className="mt-4 space-y-2.5 text-sm">
            {exploreLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="text-slate-400 transition hover:text-lime">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Your account</div>
          <ul className="mt-4 space-y-2.5 text-sm">
            {accountLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="text-slate-400 transition hover:text-lime">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link to="/contact" className="btn-ghost mt-5 !px-3 !py-2 text-xs">
            Need help? Contact us
          </Link>
        </div>
      </div>

      <div className="border-t border-edge/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-[11px] text-slate-500 sm:flex-row sm:px-6 lg:px-10">
          <span>© {currentYear} Growth. All rights reserved.</span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-lime" />
            Built for campus circles.
          </span>
        </div>
      </div>
    </footer>
  )
}
