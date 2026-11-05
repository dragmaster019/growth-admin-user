import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { ErrorBox } from '../components/ui'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/dashboard" replace />

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await login(email, pass)
      navigate('/dashboard')
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
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-edge/50" />

      <div className="relative grid w-full max-w-5xl items-center gap-10 md:grid-cols-[1.05fr_0.95fr]">
        <div className="fade-up hidden md:block">
          <div className="flex items-center gap-3">
            <span className="brand-mark">G</span>
            <span className="text-2xl font-black tracking-tight text-white">
              Growth<span className="text-lime">.</span>
            </span>
          </div>

          <h1 className="mt-8 text-4xl font-black leading-[1.06] tracking-tight text-white lg:text-[3.25rem]">
            Turn your circle
            <br />
            into <span className="text-gradient">income.</span>
          </h1>

          <p className="mt-5 max-w-md text-sm leading-relaxed text-slate-400">
            The student side hustle built on people you already know. Invite friends, grow your circle
            and earn on your own schedule — between classes, after practice, whenever.
          </p>

          <div className="mt-8 grid max-w-md grid-cols-3 gap-3">
            {[
              { k: '01', v: 'Join in minutes' },
              { k: '02', v: 'Invite your circle' },
              { k: '03', v: 'Earn as you grow' },
            ].map((s) => (
              <div key={s.k} className="rounded-2xl border border-edge bg-panel/60 p-3.5 backdrop-blur">
                <div className="text-lg font-black tracking-tight text-lime">{s.k}</div>
                <div className="mt-1 text-[10px] uppercase leading-relaxed tracking-wider text-slate-500">{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="fade-up w-full">
          <form onSubmit={submit} className="card p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 md:hidden">
                <span className="brand-mark !h-9 !w-9 !rounded-xl !text-base">G</span>
                <span className="text-lg font-black tracking-tight text-white">
                  Growth<span className="text-lime">.</span>
                </span>
              </div>
              <span className="pill ml-auto">
                <span className="h-1.5 w-1.5 rounded-full bg-neon shadow-[0_0_8px_var(--color-neon)]" />
                Secure login
              </span>
            </div>

            <h1 className="mt-6 text-2xl font-black tracking-tight text-white">Welcome back</h1>
            <p className="mt-1 text-sm text-slate-400">Sign in and keep growing.</p>

            <div className="mt-6 space-y-4">
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

              <div>
                <div className="flex items-center justify-between gap-3">
                  <label className="label" htmlFor="pass">Password</label>
                  <Link to="/forgot-password" className="mb-1.5 text-xs font-semibold text-slate-500 transition hover:text-lime">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="pass"
                    type={show ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    maxLength={128}
                    className="field pr-11"
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    aria-label={show ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 transition hover:text-lime"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-4.5 w-4.5">
                      {show ? (
                        <>
                          <path d="M3 3l18 18" />
                          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                          <path d="M9.9 5.1A10.8 10.8 0 0 1 12 5c5 0 9 4.5 9 7a11.8 11.8 0 0 1-2.2 3.2M6.2 6.2A12.6 12.6 0 0 0 3 12c0 2.5 4 7 9 7a10.7 10.7 0 0 0 4.2-.9" />
                        </>
                      ) : (
                        <>
                          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                          <circle cx="12" cy="12" r="3" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              <button className="btn-primary w-full" disabled={busy}>
                {busy ? 'Logging in…' : 'Log in'}
              </button>

              <p className="text-center text-sm text-slate-500">
                New to Growth?{' '}
                <Link className="font-semibold text-lime hover:underline" to="/join">
                  Join the network
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
