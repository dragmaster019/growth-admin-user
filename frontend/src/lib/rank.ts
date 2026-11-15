export interface Rank {
  key: string
  name: string
  min: number
  color: string
  emoji: string
}

export const RANKS: Rank[] = [
  { key: 'rookie', name: 'Rookie', min: 0, color: '#a7d8b5', emoji: '🌱' },
  { key: 'hustler', name: 'Hustler', min: 500, color: '#8fd4a4', emoji: '⚡' },
  { key: 'creator', name: 'Creator', min: 2000, color: '#5fd184', emoji: '🎨' },
  { key: 'leader', name: 'Leader', min: 5000, color: '#2fbe64', emoji: '👑' },
  { key: 'mogul', name: 'Mogul', min: 10000, color: '#07ab5f', emoji: '💎' },
  { key: 'legend', name: 'Legend', min: 25000, color: '#d4ac9c', emoji: '🔥' },
]

export function rankForPoints(points: number | null | undefined): Rank {
  const value = Number(points) || 0
  let current = RANKS[0]
  for (const rank of RANKS) if (value >= rank.min) current = rank
  return current
}

export function nextRankForPoints(points: number | null | undefined): Rank | null {
  const value = Number(points) || 0
  return RANKS.find((rank) => rank.min > value) ?? null
}

export function rankProgress(points: number | null | undefined) {
  const current = rankForPoints(points)
  const next = nextRankForPoints(points)
  if (!next) return { current, next: null, progress: 100, remaining: 0 }
  const span = next.min - current.min
  const gained = Math.max(0, (Number(points) || 0) - current.min)
  return {
    current,
    next,
    progress: Math.min(100, Math.round((gained / span) * 100)),
    remaining: Math.max(0, next.min - (Number(points) || 0)),
  }
}
