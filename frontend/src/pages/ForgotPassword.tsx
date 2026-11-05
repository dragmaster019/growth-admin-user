import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { ErrorBox } from '../components/ui'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-8 sm:py-10">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-lime/20 blur-3xl animate-floaty" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-neon/15 blur-3xl animate-floaty-slow" />

      <div className="fade-up w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3">
          <span className="brand-mark">G</span>
          <span className="text-2xl font-black tracking-tight text-white">
            Growth<span className="text-lime">.</span>
          </span>
        </div>

        <div className="card p-6 sm:p-8">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
                  <path d="m4 6 8 6 8-6" />
                  <rect x="3" y="5" width="18" height="14" rx="2.5" />
                </svg>
              </div>
              <h1 className="mt-5 text-2xl font-black tracking-tight text-white">Check your inbox</h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                If an account exists for <span className="font-semibold text-slate-200">{email}</span>, we&apos;ve sent a
                password reset link. It expires in 15 minutes.
              </p>
              <Link to="/login" className="btn-primary mt-6 w-full">
                Back to login
              </Link>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="mt-3 w-full text-center text-sm font-semibold text-slate-500 transition hover:text-lime"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <span className="pill">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                Account recovery
              </span>
              <h1 className="mt-5 text-2xl font-black tracking-tight text-white">Forgot password?</h1>
              <p className="mt-1 text-sm text-slate-400">
                Enter your account email and we&apos;ll send you a secure reset link.
              </p>

              <form onSubmit={submit} className="mt-6 space-y-4">
                {error && <ErrorBox message={error} />}
                <div>
                  <label className="label" htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="field"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <button className="btn-primary w-full" disabled={busy}>
                  {busy ? 'Sending…' : 'Send reset link'}
                </button>
              </form>

              <p className="mt-5 text-center text-sm text-slate-500">
                Remembered it?{' '}
                <Link className="font-semibold text-lime hover:underline" to="/login">
                  Log in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
