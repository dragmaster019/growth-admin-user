import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { ErrorBox, PageHeader } from '../components/ui'

export default function ChangePassword() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [form, setForm] = useState({ oldpass: '', pass: '', conpass: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api.post('/me/password', form)
      await logout()
      navigate('/login', { replace: true })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title="Change password" subtitle="Keep your account safe." />
      <form onSubmit={submit} className="card max-w-lg space-y-4">
        {error && <ErrorBox message={error} />}
        <div>
          <label className="label" htmlFor="old">Current password</label>
          <input id="old" type="password" required autoComplete="current-password" className="field" value={form.oldpass}
            onChange={(e) => setForm({ ...form, oldpass: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="np">New password</label>
          <input id="np" type="password" required minLength={8} maxLength={128} autoComplete="new-password" className="field" value={form.pass}
            onChange={(e) => setForm({ ...form, pass: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="cp">Confirm new password</label>
          <input id="cp" type="password" required minLength={8} maxLength={128} autoComplete="new-password" className="field" value={form.conpass}
            onChange={(e) => setForm({ ...form, conpass: e.target.value })} />
        </div>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Saving…' : 'Update password'}</button>
      </form>
    </>
  )
}
