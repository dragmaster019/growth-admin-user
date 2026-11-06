import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import type { Leg, Role, User } from '../lib/types'
import { Empty, ErrorBox, Modal, PageHeader, Spinner, money } from '../components/ui'

const legClasses: Record<Leg, string> = {
  ROOT: 'border-edge bg-panel2/70 text-slate-400',
  LEFT: 'border-lime/40 bg-lime/10 text-lime',
  MIDDLE: 'border-neon/40 bg-neon/10 text-neon',
  RIGHT: 'border-magenta/40 bg-magenta/10 text-magenta',
}

export default function Users() {
  const { user: me } = useAuth()
  const isAdmin = me?.role === 'admin'
  const [users, setUsers] = useState<User[]>(() => api.peek<{ users: User[] }>('/users')?.users ?? [])
  const [role, setRole] = useState<Role>(() => api.peek<{ role: Role }>('/users')?.role ?? 'user')
  const [loading, setLoading] = useState(() => api.peek('/users') === undefined)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [target, setTarget] = useState<User | null>(null)
  const [query, setQuery] = useState('')
  const [pts, setPts] = useState({ points: '', type: 'credit' as 'credit' | 'debit' })
  const [editTarget, setEditTarget] = useState<User | null>(null)
  const [form, setForm] = useState({ name: '', email: '', mobile: '', role: 'user' as Role })
  const [busy, setBusy] = useState(false)
  const [resetResult, setResetResult] = useState<{ name: string; tempPassword: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const load = useCallback(() => {
    setLoading(api.peek('/users') === undefined)
    api.get<{ users: User[]; role: Role }>('/users')
      .then((d) => { setUsers(d.users); setRole(d.role) })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase()
    if (!search) return users
    return users.filter((u) =>
      [u.name, u.email, u.referralCode, u.position, u.role, u.mobile, u.Id]
        .some((value) => String(value ?? '').toLowerCase().includes(search)),
    )
  }, [users, query])

  async function remove(u: User) {
    if (!window.confirm(`Delete ${u.name} (${u.email})? This cannot be undone.`)) return
    setError('')
    setMsg('')
    try {
      await api.del(`/users/${u._id}`)
      setMsg(`${u.name} deleted.`)
      load()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function adjust(e: FormEvent) {
    e.preventDefault()
    if (!target) return
    setError('')
    setMsg('')
    try {
      const d = await api.patch<{ user: User }>(`/users/${target._id}/points`, {
        points: Number(pts.points),
        type: pts.type,
      })
      setMsg(`${pts.type === 'credit' ? 'Credited' : 'Debited'} ${pts.points} pts — ${d.user.name} now has ${money(d.user.points)}.`)
      setTarget(null)
      setPts({ points: '', type: 'credit' })
      load()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  function openEdit(u: User) {
    setEditTarget(u)
    setForm({
      name: u.name,
      email: u.email,
      mobile: u.mobile == null ? '' : String(u.mobile),
      role: u.role,
    })
    setError('')
    setMsg('')
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault()
    if (!editTarget) return
    setBusy(true)
    setError('')
    setMsg('')
    try {
      const d = await api.patch<{ user: User }>(`/users/${editTarget._id}`, {
        name: form.name,
        email: form.email,
        mobile: form.mobile === '' ? null : Number(form.mobile),
        role: form.role,
      })
      setMsg(`${d.user.name} updated.`)
      setEditTarget(null)
      load()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function resetPassword(u: User) {
    if (!window.confirm(`Reset the password for ${u.name}? They will receive a temporary password.`)) return
    setError('')
    setMsg('')
    try {
      const d = await api.post<{ tempPassword: string }>(`/users/${u._id}/reset-password`)
      setCopied(false)
      setResetResult({ name: u.name, tempPassword: d.tempPassword })
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function copyTempPassword() {
    if (!resetResult) return
    try {
      await navigator.clipboard.writeText(resetResult.tempPassword)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <>
      <PageHeader
        title={isAdmin ? 'Users' : 'My circle'}
        subtitle={isAdmin ? 'Every account in the network.' : 'People placed directly under you.'}
      />
      {error && <div className="mb-4"><ErrorBox message={error} /></div>}
      {msg && <div className="mb-4 rounded-xl border border-lime/40 bg-lime/10 px-4 py-3 text-sm text-lime">{msg}</div>}

      {loading ? (
        <Spinner />
      ) : users.length === 0 ? (
        <Empty>No users to show.</Empty>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-72">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                className="field !pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, email, code…"
                aria-label="Search users"
              />
            </div>
            <span className="pill ml-auto">
              {visible.length} of {users.length} members
            </span>
          </div>

          {visible.length === 0 ? (
            <Empty>No users match your search.</Empty>
          ) : (
            <>
              <div className="card hidden overflow-x-auto md:block">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th><th>Email</th><th>Code</th><th>Leg</th>
                      <th className="text-right">Points</th><th>Role</th>
                      {role === 'admin' && <th />}
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((u) => (
                      <tr key={u._id}>
                        <td className="font-medium text-white">
                          {u.name}
                          {u.isFounder && <span className="ml-2 pill border-amber-400/40 bg-amber-400/10 text-amber-300">founder</span>}
                        </td>
                        <td className="mono text-slate-400">{u.email}</td>
                        <td className="mono text-neon">{u.referralCode}</td>
                        <td>
                          <span className={`pill !border ${legClasses[u.position] ?? legClasses.ROOT}`}>{u.position}</span>
                        </td>
                        <td className="text-right font-semibold text-emerald-300">{money(u.points)}</td>
                        <td>
                          <span className={`pill ${u.role === 'admin' ? 'border-amber-400/40 bg-amber-400/10 text-amber-300' : 'border-lime/30 bg-lime/10 text-lime'}`}>
                            {u.role}
                          </span>
                        </td>
                        {role === 'admin' && (
                          <td>
                            <div className="flex flex-wrap justify-end gap-2">
                              <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => { setTarget(u); setMsg('') }}>Give points</button>
                              <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => openEdit(u)}>Edit</button>
                              <button className="btn-ghost !px-3 !py-1.5 text-xs !text-amber-300" onClick={() => resetPassword(u)}>
                                Reset password
                              </button>
                              <button
                                className="btn-danger !px-3 !py-1.5 text-xs"
                                disabled={u._id === me?._id}
                                onClick={() => remove(u)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-2.5 md:hidden">
                {visible.map((u) => (
                  <div key={u._id} className="rounded-2xl border border-edge/70 bg-panel2/35 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="truncate font-semibold text-white">{u.name}</span>
                          {u.isFounder && <span className="pill border-amber-400/40 bg-amber-400/10 text-amber-300">founder</span>}
                        </div>
                        <div className="mono mt-1 truncate text-xs text-slate-400">{u.email}</div>
                      </div>
                      <span className={`pill shrink-0 ${u.role === 'admin' ? 'border-amber-400/40 bg-amber-400/10 text-amber-300' : 'border-lime/30 bg-lime/10 text-lime'}`}>
                        {u.role}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-3 items-end gap-2 text-xs">
                      <div className="min-w-0">
                        <div className="text-slate-500">Code</div>
                        <div className="mono mt-0.5 truncate text-neon">{u.referralCode}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">Leg</div>
                        <div className="mt-0.5">
                          <span className={`pill !border ${legClasses[u.position] ?? legClasses.ROOT}`}>{u.position}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-slate-500">Points</div>
                        <div className="mt-0.5 font-semibold text-emerald-300">{money(u.points)}</div>
                      </div>
                    </div>

                    {role === 'admin' && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button className="btn-ghost !px-2 !py-2 text-xs" onClick={() => { setTarget(u); setMsg('') }}>Give points</button>
                        <button className="btn-ghost !px-2 !py-2 text-xs" onClick={() => openEdit(u)}>Edit</button>
                        <button className="btn-ghost !px-2 !py-2 text-xs !text-amber-300" onClick={() => resetPassword(u)}>Reset password</button>
                        <button
                          className="btn-danger !px-2 !py-2 text-xs"
                          disabled={u._id === me?._id}
                          onClick={() => remove(u)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {target && (
        <Modal
          maxWidth="max-w-md"
          onClose={() => setTarget(null)}
          title={<h2 className="text-lg font-semibold text-white">Give points</h2>}
          footer={
            <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
              <button type="button" className="btn-ghost" onClick={() => setTarget(null)}>Cancel</button>
              <button type="submit" form="points-form" className="btn-primary">Apply</button>
            </div>
          }
        >
          <form id="points-form" onSubmit={adjust}>
            <p className="text-sm text-slate-400">
              {target.name} · current balance <span className="text-emerald-300">{money(target.points)}</span>
            </p>
            <div className="mt-4 grid gap-3">
              <div>
                <label className="label">Amount</label>
                <input className="field" type="number" min="0" step="any" required value={pts.points}
                  onChange={(e) => setPts({ ...pts, points: e.target.value })} />
              </div>
              <div>
                <label className="label">Direction</label>
                <select className="field" value={pts.type}
                  onChange={(e) => setPts({ ...pts, type: e.target.value as 'credit' | 'debit' })}>
                  <option value="credit">Credit (add)</option>
                  <option value="debit">Debit (subtract)</option>
                </select>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {editTarget && (
        <Modal
          maxWidth="max-w-md"
          onClose={() => setEditTarget(null)}
          title={<h2 className="text-lg font-semibold text-white">Edit member</h2>}
          footer={
            <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
              <button type="button" className="btn-ghost" onClick={() => setEditTarget(null)}>Cancel</button>
              <button type="submit" form="edit-user-form" className="btn-primary" disabled={busy}>
                {busy ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          }
        >
          <form id="edit-user-form" onSubmit={saveEdit}>
            <p className="text-sm text-slate-400">
              Update {editTarget.name}&apos;s account details.
            </p>
            <div className="mt-4 grid gap-3">
              <div>
                <label className="label" htmlFor="edit-name">Name</label>
                <input
                  id="edit-name"
                  className="field"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="label" htmlFor="edit-email">Email</label>
                <input
                  id="edit-email"
                  className="field"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="label" htmlFor="edit-mobile">Mobile</label>
                <input
                  id="edit-mobile"
                  className="field"
                  type="tel"
                  inputMode="numeric"
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="label" htmlFor="edit-role">Role</label>
                <select
                  id="edit-role"
                  className="field"
                  value={form.role}
                  disabled={editTarget._id === me?._id}
                  onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                {editTarget._id === me?._id && (
                  <p className="mt-1.5 text-xs text-slate-500">You cannot change your own role.</p>
                )}
              </div>
            </div>
          </form>
        </Modal>
      )}

      {resetResult && (
        <Modal
          maxWidth="max-w-md"
          onClose={() => setResetResult(null)}
          title={<h2 className="text-lg font-semibold text-white">Temporary password</h2>}
          footer={
            <div className="grid gap-2 sm:flex sm:justify-end">
              <button type="button" className="btn-primary" onClick={() => setResetResult(null)}>Done</button>
            </div>
          }
        >
          <p className="text-sm text-slate-400">
            Share this with {resetResult.name}. It will not be shown again.
          </p>
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-edge bg-panel2/60 p-3">
            <code className="mono flex-1 break-all text-sm text-emerald-300">{resetResult.tempPassword}</code>
            <button type="button" className="btn-ghost !px-3 !py-1.5 text-xs" onClick={copyTempPassword}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            The member can sign in with this password and change it from their profile.
          </p>
        </Modal>
      )}
    </>
  )
}
