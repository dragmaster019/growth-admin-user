import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

export default function JoinSuccess() {
  const [params] = useSearchParams()
  const code = params.get('code') ?? ''
  const name = params.get('name') ?? 'there'
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-8 sm:py-10">
      <div className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-lime/20 blur-3xl animate-floaty" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-neon/15 blur-3xl animate-floaty-slow" />

      <div className="fade-up card relative w-full max-w-md p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-lime/30 bg-lime/10 shadow-[0_0_40px_-10px_var(--color-lime)]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-lime">
            <path d="m5 13 4 4L19 7" />
          </svg>
        </div>

        <div className="mt-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          Account created
        </div>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-white">You’re in, {name}.</h1>
        <p className="mt-1.5 text-sm text-slate-400">Share your code with friends and start earning together.</p>

        <div className="mt-6 rounded-2xl border border-edge bg-panel2/50 p-4">
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Your referral code</div>
          <button
            onClick={copy}
            title="Copy referral code"
            className="mono mt-2 w-full break-all text-2xl font-black tracking-tight text-lime transition hover:brightness-110"
          >
            {code || '—'}
          </button>
        </div>

        <button onClick={copy} className="btn-ghost mt-3 w-full text-sm">
          {copied ? 'Copied!' : 'Copy code'}
        </button>
        <Link to="/login" className="btn-primary mt-3 w-full">Go to login</Link>
      </div>
    </div>
  )
}
