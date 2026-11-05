export interface Rank {
  key: string
  name: string
  min: number
  color: string
  emoji: string
}

export const RANKS: Rank[] = [
  { key: 'rookie', name: 'Rookie', min: 0, color: '#22d3ee', emoji: '🌱' },
  { key: 'hustler', name: 'Hustler', min: 500, color: '#818cf8', emoji: '⚡' },
  { key: 'creator', name: 'Creator', min: 2000, color: '#f472b6', emoji: '🎨' },
  { key: 'leader', name: 'Leader', min: 5000, color: '#fbbf24', emoji: '👑' },
  { key: 'mogul', name: 'Mogul', min: 10000, color: '#34d399', emoji: '💎' },
  { key: 'legend', name: 'Legend', min: 25000, color: '#fb7185', emoji: '🔥' },
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
