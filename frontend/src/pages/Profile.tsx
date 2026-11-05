import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import type { User } from '../lib/types'
import { ErrorBox, PageHeader, money } from '../components/ui'

export default function Profile() {
  const { user, setUser } = useAuth()
  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    mobile: user?.mobile ? String(user.mobile) : '',
    Id: user?.Id ? String(user.Id) : '',
  })
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  if (!user) return null

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setMsg('')
    try {
      const data = await api.patch<{ user: User }>('/me/profile', {
        name: form.name,
        email: form.email,
        mobile: form.mobile,
        Id: form.Id,
      })
      setUser(data.user)
      setMsg('Profile updated.')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Profile"
        subtitle="Your identity on the network."
        actions={<Link to="/change-password" className="btn-ghost text-sm">Change password</Link>}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          {error && <div className="mb-4"><ErrorBox message={error} /></div>}
          {msg && <div className="mb-4 rounded-xl border border-lime/40 bg-lime/10 px-4 py-3 text-sm text-lime">{msg}</div>}
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Name</label>
              <input className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="field" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label">Mobile</label>
              <input className="field" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
            </div>
            <div>
              <label className="label">User ID</label>
              <input className="field" value={form.Id} onChange={(e) => setForm({ ...form, Id: e.target.value })} />
            </div>
            <button className="btn-primary sm:col-span-2" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
          </form>
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold text-white">Account</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-2"><dt className="text-slate-400">Referral code</dt><dd className="mono text-neon">{user.referralCode}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-slate-400">Referred by</dt><dd className="mono text-slate-300">{user.referredBy || '—'}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-slate-400">Leg</dt><dd>{user.position}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-slate-400">Role</dt><dd>{user.role}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-slate-400">Balance</dt><dd className="text-emerald-300">{money(user.points)} pts</dd></div>
          </dl>
        </div>
      </div>
    </>
  )
}
