import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import PublicHeader from '../components/PublicHeader'
import SocialLinks from '../components/SocialLinks'
import { api } from '../lib/api'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api.post('/contact', form)
      setSent(true)
      setForm({ name: '', email: '', message: '' })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative min-h-[100dvh] overflow-x-clip">
      <div className="pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full bg-lime/15 blur-3xl animate-floaty" />
      <div className="pointer-events-none absolute -right-20 top-32 h-96 w-96 rounded-full bg-neon/10 blur-3xl animate-floaty-slow" />
      <div className="pointer-events-none absolute left-1/3 top-[36rem] h-72 w-72 rounded-full bg-magenta/10 blur-3xl" />

      <PublicHeader />

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <section className="fade-up py-8 sm:py-12 lg:py-16">
          <span className="pill border-lime/30 !bg-lime/10 !text-lime">Contact us</span>
          <h1 className="mt-5 max-w-3xl text-balance text-3xl font-black leading-[1.06] tracking-tight text-white min-[420px]:text-4xl sm:text-5xl">
            Let’s talk about your <span className="text-gradient">circle.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
            Questions about joining, points, payouts or building your team? Reach us on social or
            send a message below. We usually reply within two working days.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <div className="card">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                One-click connect
              </div>
              <h2 className="mt-2 text-xl font-black tracking-tight text-white">
                Find us where you already are.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Tap a channel and you will be redirected straight to the conversation.
              </p>
              <div className="mt-5">
                <SocialLinks variant="cards" />
              </div>
            </div>

            <div className="rounded-2xl border border-lime/25 bg-lime/5 p-5">
              <div className="text-sm font-semibold text-lime">Response time</div>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                We reply to most messages within two working days. For urgent account issues,
                include your registered email in the message.
              </p>
            </div>
          </div>

          <div className="card">
            {sent ? (
              <div className="flex min-h-[24rem] flex-col items-start justify-center">
                <span className="pill border-lime/30 bg-lime/10 text-lime">Message sent</span>
                <h2 className="mt-4 text-2xl font-black tracking-tight text-white">
                  Thanks for reaching out.
                </h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-400">
                  Your message is with the team. We will reply to the email you shared, usually
                  within two working days.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <button type="button" className="btn-ghost" onClick={() => setSent(false)}>
                    Send another message
                  </button>
                  <Link to="/why-join" className="btn-primary">
                    Explore Growth
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Send a message
                </div>
                <h2 className="mt-2 text-xl font-black tracking-tight text-white">
                  Tell us what you need.
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  Share your question and the best email to reach you. We only use your details to
                  respond to this message.
                </p>

                <form onSubmit={submit} className="mt-5 space-y-4">
                  {error && (
                    <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                      {error}
                    </div>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label" htmlFor="contact-name">
                        Full name
                      </label>
                      <input
                        id="contact-name"
                        className="field"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="label" htmlFor="contact-email">
                        Email
                      </label>
                      <input
                        id="contact-email"
                        className="field"
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label" htmlFor="contact-message">
                      Message
                    </label>
                    <textarea
                      id="contact-message"
                      className="field min-h-[9rem] resize-y"
                      required
                      maxLength={5000}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Tell us what you would like help with."
                    />
                  </div>
                  <button type="submit" className="btn-primary w-full" disabled={busy}>
                    {busy ? 'Sending…' : 'Send message'}
                  </button>
                  <p className="text-center text-[11px] text-slate-600">
                    We only use your details to respond to this request.
                  </p>
                </form>
              </>
            )}
          </div>
        </section>
      </main>

    </div>
  )
}
