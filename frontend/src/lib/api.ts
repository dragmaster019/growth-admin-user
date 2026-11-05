const BASE = '/api'

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE'

const CACHE_TTL = 15_000
const cache = new Map<string, { data: unknown; at: number }>()
const inflight = new Map<string, Promise<unknown>>()

export function clearApiCache() {
  cache.clear()
}

async function request<T>(path: string, method: Method, body?: unknown): Promise<T> {
  const res = await fetch(BASE + path, {
    method,
    credentials: 'include',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let data: unknown = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { error: text }
  }
  if (!res.ok) {
    const msg = (data as { error?: string } | null)?.error ?? `Request failed (${res.status})`
    throw new Error(msg)
  }
  return data as T
}

function getCached<T>(path: string): Promise<T> {
  const hit = cache.get(path)
  if (hit && Date.now() - hit.at < CACHE_TTL) return Promise.resolve(hit.data as T)

  const pending = inflight.get(path)
  if (pending) return pending as Promise<T>

  const p = request<T>(path, 'GET')
    .then((data) => {
      cache.set(path, { data, at: Date.now() })
      return data
    })
    .finally(() => inflight.delete(path))

  inflight.set(path, p)
  return p
}

function mutate<T>(path: string, method: Method, body?: unknown): Promise<T> {
  return request<T>(path, method, body).then((data) => {
    clearApiCache()
    return data
  })
}

export const api = {
  get: <T>(path: string) => getCached<T>(path),
  peek: <T>(path: string): T | undefined => {
    const hit = cache.get(path)
    return hit && Date.now() - hit.at < CACHE_TTL ? (hit.data as T) : undefined
  },
  post: <T>(path: string, body?: unknown) => mutate<T>(path, 'POST', body),
  patch: <T>(path: string, body?: unknown) => mutate<T>(path, 'PATCH', body),
  del: <T>(path: string) => mutate<T>(path, 'DELETE'),
}
