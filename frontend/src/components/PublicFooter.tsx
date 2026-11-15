import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import SocialLinks from './SocialLinks'

const copyrightYear = new Date().getFullYear()

const columns = [
  {
    title: 'Network',
    links: [
      { to: '/why-join', label: 'Why join' },
      { to: '/why-join#how', label: 'How it works' },
      { to: '/why-join#stories', label: 'Campus stories' },
      { to: '/why-join#faq', label: 'FAQ' },
    ],
  },
  {
    title: 'Company',
    links: [
      { to: '/about', label: 'About us' },
      { to: '/contact', label: 'Contact' },
      { to: '/why-join#interest', label: 'Request a callback' },
    ],
  },
  {
    title: 'Get started',
    links: [
      { to: '/join', label: 'Join with a code' },
      { to: '/login', label: 'Log in' },
      { to: '/why-join#interest', label: 'Talk to a campus lead' },
    ],
  },
]

export default function PublicFooter() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api.post('/contact', {
        name: 'Newsletter',
        email,
        message: 'Newsletter signup from the public footer.',
      })
      setSent(true)
      setEmail('')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <footer className="relative z-10 mt-16 border-t border-edge/80 bg-panel/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <section className="border-b border-edge/80 py-12 text-center sm:py-16">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-lime" />
              The campus dispatch
            </div>
            <h2 className="mt-4 font-serif text-4xl leading-[0.98] tracking-tight text-white sm:text-5xl lg:text-6xl">
              New drops in your inbox.
              <span className="block italic text-lime">No spam.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-400">
              Occasional notes on campus earning, new reward drops and plays that actually work.
              One useful email, never a flood.
            </p>
            {sent ? (
              <div className="mx-auto mt-5 max-w-xl rounded-2xl border border-lime/40 bg-lime/10 p-4 text-sm text-slate-300">
                <span className="font-semibold text-lime">You are on the list.</span> Watch your
                inbox for the next dispatch.
              </div>
            ) : (
              <form onSubmit={subscribe} className="mx-auto mt-5 max-w-xl">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <label className="sr-only" htmlFor="footer-newsletter">
                    Email address
                  </label>
                  <input
                    id="footer-newsletter"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="field !rounded-full sm:flex-1"
                    placeholder="you@college.edu"
                  />
                  <button
                    type="submit"
                    className="btn-primary group shrink-0 !px-5"
                    disabled={busy}
                  >
                    {busy ? 'Subscribing…' : 'Subscribe'}
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 transition group-hover:translate-x-0.5"
                    >
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </button>
                </div>
                {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
              </form>
            )}
          </div>
        </section>

        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <Link to="/why-join" className="inline-flex items-center gap-3">
              <span className="brand-mark">G</span>
              <span>
                <span className="block text-lg font-black leading-none tracking-tight text-white">
                  Growth<span className="text-lime">.</span>
                </span>
                <span className="mt-0.5 block text-[10px] uppercase tracking-[0.22em] text-slate-500">
                  Campus network
                </span>
              </span>
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-slate-400">
              A student-first referral network for people who would rather build with their circle
              than cold-call strangers. Three legs, one wallet, no joining fee.
            </p>
            <div className="mt-5">
              <SocialLinks />
            </div>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-slate-400 transition hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-t border-edge/80 py-5 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© {copyrightYear} Growth. All rights reserved.</span>
          <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-lime" />
              3 legs
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-neon" />
              One wallet
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-magenta" />
              Student-first
            </span>
          </span>
        </div>
      </div>
    </footer>
  )
}
