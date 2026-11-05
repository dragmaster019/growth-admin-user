import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { ErrorBox } from '../components/ui'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [pass, setPass] = useState('')
  const [conpass, setConpass] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (pass !== conpass) {
      setError('New passwords do not match')
      return
    }
    setBusy(true)
    setError('')
    try {
      await api.post('/auth/reset-password', { token, pass, conpass })
      setDone(true)
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
          {done ? (
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
                  <path d="m5 12 4.5 4.5L19 7" />
                </svg>
              </div>
              <h1 className="mt-5 text-2xl font-black tracking-tight text-white">Password updated</h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Your password has been changed. You can now sign in with your new password.
              </p>
              <Link to="/login" className="btn-primary mt-6 w-full">
                Go to login
              </Link>
            </div>
          ) : !token ? (
            <div className="text-center">
              <h1 className="text-2xl font-black tracking-tight text-white">Invalid reset link</h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                This link is missing a reset token. Request a new link to continue.
              </p>
              <Link to="/forgot-password" className="btn-primary mt-6 w-full">
                Request new link
              </Link>
            </div>
          ) : (
            <>
              <span className="pill">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                Secure reset
              </span>
              <h1 className="mt-5 text-2xl font-black tracking-tight text-white">Choose a new password</h1>
              <p className="mt-1 text-sm text-slate-400">Use at least 8 characters. This link expires soon.</p>

              <form onSubmit={submit} className="mt-6 space-y-4">
                {error && <ErrorBox message={error} />}
                <div>
                  <label className="label" htmlFor="pass">New password</label>
                  <div className="relative">
                    <input
                      id="pass"
                      type={show ? 'text' : 'password'}
                      required
                      minLength={8}
                      maxLength={128}
                      autoComplete="new-password"
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
                <div>
                  <label className="label" htmlFor="conpass">Confirm new password</label>
                  <input
                    id="conpass"
                    type={show ? 'text' : 'password'}
                    required
                    minLength={8}
                    maxLength={128}
                    autoComplete="new-password"
                    className="field"
                    value={conpass}
                    onChange={(e) => setConpass(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <button className="btn-primary w-full" disabled={busy}>
                  {busy ? 'Updating…' : 'Update password'}
                </button>
              </form>

              <p className="mt-5 text-center text-sm text-slate-500">
                <Link className="font-semibold text-lime hover:underline" to="/login">
                  Back to login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
