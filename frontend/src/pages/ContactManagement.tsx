import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { Empty, ErrorBox, PageHeader, Spinner } from '../components/ui'

type Status = 'new' | 'contacted' | 'completed'

interface ContactSubmission {
  id: string
  name: string
  email: string
  message: string
  status: Status
  createdAt: string
}

const statuses: {
  value: Status
  label: string
  className: string
  textClass: string
  focusClass: string
}[] = [
  {
    value: 'new',
    label: 'New',
    className: 'border-red-500/40 bg-red-500/10 text-red-300',
    textClass: 'text-red-300',
    focusClass: 'focus:border-red-400 focus:ring-red-500/20',
  },
  {
    value: 'contacted',
    label: 'Contacted',
    className: 'border-amber-400/40 bg-amber-400/10 text-amber-300',
    textClass: 'text-amber-300',
    focusClass: 'focus:border-amber-300 focus:ring-amber-400/20',
  },
  {
    value: 'completed',
    label: 'Completed',
    className: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
    textClass: 'text-emerald-300',
    focusClass: 'focus:border-emerald-300 focus:ring-emerald-400/20',
  },
]

const statusOf = (status: Status) => statuses.find((s) => s.value === status)
const statusClass = (status: Status) => statusOf(status)?.className ?? ''
const statusLabel = (status: Status) => statusOf(status)?.label ?? status

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function StatusPicker({
  value,
  label,
  disabled,
  onChange,
}: {
  value: Status
  label: string
  disabled?: boolean
  onChange: (status: Status) => void
}) {
  return (
    <div className="relative inline-flex items-center">
      <select
        aria-label={`Status for ${label}`}
        className={`cursor-pointer appearance-none rounded-xl border py-2 pl-3 pr-9 text-xs font-semibold outline-none transition focus:ring-2 disabled:cursor-wait disabled:opacity-60 ${statusClass(value)} ${statusOf(value)?.focusClass ?? ''}`}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as Status)}
      >
        {statuses.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`pointer-events-none absolute right-2.5 h-3.5 w-3.5 opacity-80 ${statusOf(value)?.textClass ?? 'text-slate-400'}`}
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  )
}

function MessageModal({ submission, onClose }: { submission: ContactSubmission; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div className="card max-h-[90vh] w-full max-w-lg overflow-y-auto !rounded-b-none pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:!rounded-3xl sm:pb-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white">{submission.name}</h2>
            <a
              href={`mailto:${submission.email}`}
              className="mono text-xs text-lime hover:underline"
            >
              {submission.email}
            </a>
          </div>
          <span className={`pill ${statusClass(submission.status)}`}>{statusLabel(submission.status)}</span>
        </div>
        <div className="mt-4 rounded-2xl border border-edge bg-panel2/40 p-4">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Message</div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
            {submission.message || 'No message provided.'}
          </p>
        </div>
        <div className="mt-3 text-[11px] text-slate-500">
          Received {formatDate(submission.createdAt)}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Close
          </button>
          <a href={`mailto:${submission.email}`} className="btn-primary">
            Email lead
          </a>
        </div>
      </div>
    </div>
  )
}

export default function ContactManagement() {
  const { user, loading: authLoading } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [submissions, setSubmissions] = useState<ContactSubmission[]>(
    () => api.peek<{ submissions: ContactSubmission[] }>('/contact/admin')?.submissions ?? [],
  )
  const [loading, setLoading] = useState(
    () => api.peek<{ submissions: ContactSubmission[] }>('/contact/admin') === undefined,
  )
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<Status | 'all'>('all')
  const [query, setQuery] = useState('')
  const [updatingId, setUpdatingId] = useState('')
  const [selected, setSelected] = useState<ContactSubmission | null>(null)

  const load = useCallback(() => {
    setLoading(api.peek<{ submissions: ContactSubmission[] }>('/contact/admin') === undefined)
    api
      .get<{ submissions: ContactSubmission[] }>('/contact/admin')
      .then((d) => setSubmissions(d.submissions ?? []))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (authLoading || !isAdmin) return
    load()
  }, [authLoading, isAdmin, load])

  async function updateStatus(id: string, status: Status) {
    setUpdatingId(id)
    setError('')
    try {
      const data = await api.patch<{ submission: ContactSubmission }>(`/contact/${id}`, { status })
      setSubmissions((list) => list.map((s) => (s.id === id ? data.submission : s)))
      setSelected((s) => (s && s.id === id ? data.submission : s))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setUpdatingId('')
    }
  }

  if (authLoading) return <Spinner label="Checking session…" />
  if (!isAdmin) {
    return (
      <div className="card">
        <h1 className="text-lg font-bold text-white">Admins only</h1>
        <p className="mt-1 text-sm text-slate-400">
          This page lists callback requests from the Why Join page. Sign in with an admin account to
          manage them.
        </p>
      </div>
    )
  }

  const counts = {
    all: submissions.length,
    new: submissions.filter((s) => s.status === 'new').length,
    contacted: submissions.filter((s) => s.status === 'contacted').length,
    completed: submissions.filter((s) => s.status === 'completed').length,
  }

  const byStatus = filter === 'all' ? submissions : submissions.filter((s) => s.status === filter)
  const search = query.trim().toLowerCase()
  const visible = search
    ? byStatus.filter((s) =>
        [s.name, s.email, s.message].some((value) => value.toLowerCase().includes(search)),
      )
    : byStatus

  return (
    <>
      <PageHeader
        title="Contact leads"
        subtitle="Callback requests submitted from the Why Join page. Mark each one as new, contacted or completed."
        actions={
          <button type="button" className="btn-ghost text-sm" onClick={load}>
            Refresh
          </button>
        }
      />

      {error && (
        <div className="mb-4">
          <ErrorBox message={error} />
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {(['all', 'new', 'contacted', 'completed'] as const).map((value) => {
          const label = value === 'all' ? 'All' : statuses.find((s) => s.value === value)?.label
          const active = filter === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                active
                  ? value === 'new'
                    ? 'border border-red-500/40 bg-red-500/15 text-red-300'
                    : value === 'contacted'
                      ? 'border border-amber-400/40 bg-amber-400/15 text-amber-300'
                      : value === 'completed'
                        ? 'border border-emerald-400/40 bg-emerald-400/15 text-emerald-300'
                        : 'border border-lime/40 bg-lime/15 text-lime'
                  : 'border border-edge bg-panel2/60 text-slate-400 hover:text-white'
              }`}
            >
              {label} <span className={active ? 'opacity-70' : 'text-slate-500'}>{counts[value]}</span>
            </button>
          )
        })}
        <div className="relative ml-auto w-full sm:w-60">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            className="field !pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search leads…"
            aria-label="Search contact leads"
          />
        </div>
        <span className="text-xs text-slate-500">
          {counts.new} waiting for first contact
        </span>
      </div>

      {loading ? (
        <Spinner />
      ) : visible.length === 0 ? (
        <Empty>
          {submissions.length === 0
            ? 'No callback requests yet. Share the Why Join page to start collecting leads.'
            : search
              ? `No leads match “${query.trim()}”.`
              : `No ${filter} leads right now.`}
        </Empty>
      ) : (
        <>
          <div className="card hidden overflow-x-auto md:block">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Message</th>
                  <th>Received</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visible.map((s) => (
                  <tr key={s.id}>
                    <td className="font-medium text-white">{s.name}</td>
                    <td className="mono text-slate-400">{s.email}</td>
                    <td className="max-w-xs truncate text-slate-400">
                      {s.message || <span className="text-slate-600">—</span>}
                    </td>
                    <td className="whitespace-nowrap text-slate-500">{formatDate(s.createdAt)}</td>
                    <td>
                      <StatusPicker
                        value={s.status}
                        label={s.name}
                        disabled={updatingId === s.id}
                        onChange={(status) => updateStatus(s.id, status)}
                      />
                    </td>
                    <td>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          className="btn-ghost !px-3 !py-1.5 text-xs"
                          onClick={() => setSelected(s)}
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-2.5 md:hidden">
            {visible.map((s) => (
              <div key={s.id} className="rounded-2xl border border-edge/70 bg-panel2/35 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-white">{s.name}</div>
                    <a href={`mailto:${s.email}`} className="mono mt-0.5 block truncate text-xs text-slate-400">
                      {s.email}
                    </a>
                  </div>
                  <span className="shrink-0 text-[11px] text-slate-500">{formatDate(s.createdAt)}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-400">
                  {s.message || <span className="text-slate-600">No message</span>}
                </p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <StatusPicker
                    value={s.status}
                    label={s.name}
                    disabled={updatingId === s.id}
                    onChange={(status) => updateStatus(s.id, status)}
                  />
                  <button
                    type="button"
                    className="btn-ghost !px-3 !py-2 text-xs"
                    onClick={() => setSelected(s)}
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {selected && <MessageModal submission={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
