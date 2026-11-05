import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import type { User } from '../lib/types'
import { ErrorBox } from '../components/ui'

interface Sponsor {
  name: string
  referralCode: string
}

export default function Join() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    pass: '',
    referralCode: params.get('ref') ?? '',
    position: '',
  })
  const [sponsor, setSponsor] = useState<Sponsor | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const code = form.referralCode.trim()
    setSponsor(null)
    if (!code) return

    let ignore = false
    const timer = setTimeout(() => {
      api
        .get<{ sponsor: Sponsor }>(`/auth/referrer/${encodeURIComponent(code)}`)
        .then((d) => {
          if (!ignore) setSponsor(d.sponsor)
        })
        .catch(() => {
          if (!ignore) setSponsor(null)
        })
    }, 250)

    return () => {
      ignore = true
      clearTimeout(timer)
    }
  }, [form.referralCode])

  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const data = await api.post<{ user: User; code: string }>('/auth/register', {
        name: form.name,
        email: form.email,
        mobile: form.mobile,
        pass: form.pass,
        referralCode: form.referralCode,
        position: form.position || undefined,
      })
      navigate(`/join-success?code=${encodeURIComponent(data.code)}&name=${encodeURIComponent(form.name)}`)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-6 sm:py-8">
      <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-lime/20 blur-3xl animate-floaty" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-neon/15 blur-3xl animate-floaty-slow" />

      <div className="fade-up relative w-full max-w-5xl">
        <div className="card overflow-hidden !p-0">
          <div className="grid md:grid-cols-[0.85fr_1.15fr]">
            <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-edge p-8 md:flex">
              <div className="pointer-events-none absolute -left-16 top-24 h-56 w-56 rounded-full bg-lime/15 blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-3">
                  <span className="brand-mark">G</span>
                  <span className="text-xl font-black tracking-tight text-white">
                    Growth<span className="text-lime">.</span>
                  </span>
                </div>
                <h1 className="mt-10 text-3xl font-black leading-tight tracking-tight text-white">
                  Your circle.
                  <br />
                  Your <span className="text-gradient">income.</span>
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">
                  Turn friends into a team that earns with you. Join in minutes — no experience, no
                  awkward pitches, just your circle.
                </p>
              </div>

              <ul className="relative mt-10 space-y-4">
                {[
                  'Join with your sponsor’s code',
                  'Build your campus circle',
                  'Earn on your own schedule',
                ].map((step, i) => (
                  <li key={step} className="flex items-start gap-3 text-sm text-slate-300">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-lime/40 bg-lime/10 text-[11px] font-bold text-lime">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ul>

              <div className="relative mt-10 flex flex-wrap gap-2">
                <span className="pill">student friendly</span>
                <span className="pill">start in minutes</span>
              </div>
            </aside>

            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 md:hidden">
                  <span className="brand-mark !h-9 !w-9 !rounded-xl !text-base">G</span>
                  <span className="text-lg font-black tracking-tight text-white">
                    Growth<span className="text-lime">.</span>
                  </span>
                </div>
                <Link to="/login" className="ml-auto text-sm font-semibold text-lime hover:underline">
                  Log in
                </Link>
              </div>

              <h1 className="mt-6 text-2xl font-black tracking-tight text-white">Create your account</h1>
              <p className="mt-1 text-sm text-slate-400">
                Claim your spot and start earning between classes.
              </p>

              <form onSubmit={submit} className="mt-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  {error && (
                    <div className="sm:col-span-2">
                      <ErrorBox message={error} />
                    </div>
                  )}

                  <div>
                    <label className="label" htmlFor="ref">Referral code</label>
                    <input
                      id="ref"
                      required
                      className="field mono"
                      value={form.referralCode}
                      onChange={set('referralCode')}
                      placeholder="ALICE-D01"
                    />
                    {sponsor ? (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-neon">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-neon/15">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="h-2.5 w-2.5">
                            <path d="m5 13 4 4L19 7" />
                          </svg>
                        </span>
                        Sponsor: {sponsor.name}
                      </p>
                    ) : (
                      <p className="mt-1.5 text-xs text-slate-600">Ask your sponsor for their code.</p>
                    )}
                  </div>

                  <div>
                    <label className="label" htmlFor="pos">Leg (optional)</label>
                    <select id="pos" className="field" value={form.position} onChange={set('position')}>
                      <option value="">Auto (spillover)</option>
                      <option value="LEFT">A — LEFT</option>
                      <option value="MIDDLE">B — MIDDLE</option>
                      <option value="RIGHT">C — RIGHT</option>
                    </select>
                  </div>

                  <div>
                    <label className="label" htmlFor="name">Full name</label>
                    <input id="name" required className="field" value={form.name} onChange={set('name')} placeholder="Ada Lovelace" />
                  </div>

                  <div>
                    <label className="label" htmlFor="email2">Email</label>
                    <input id="email2" type="email" required className="field" value={form.email} onChange={set('email')} placeholder="you@example.com" />
                  </div>

                  <div>
                    <label className="label" htmlFor="mobile">Mobile</label>
                    <input id="mobile" className="field" value={form.mobile} onChange={set('mobile')} placeholder="9999999999" />
                  </div>

                  <div>
                    <label className="label" htmlFor="pass2">Password</label>
                    <input id="pass2" type="password" required minLength={8} maxLength={128} autoComplete="new-password" className="field" value={form.pass} onChange={set('pass')} placeholder="••••••••" />
                  </div>
                </div>

                <button className="btn-primary mt-6 w-full" disabled={busy}>
                  {busy ? 'Creating account…' : 'Create account'}
                </button>
              </form>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link className="font-semibold text-lime hover:underline" to="/login">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
