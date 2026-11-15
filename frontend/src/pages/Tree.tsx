import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import type { Leg, TreeNode } from '../lib/types'
import { Empty, ErrorBox, PageHeader, Spinner, money } from '../components/ui'

const NODE_W = 196
const NODE_H = 86
const GAP_X = 26
const GAP_Y = 104
const PAD = 28

const legColor: Record<Leg, string> = {
  LEFT: 'var(--color-lime)',
  MIDDLE: 'var(--color-neon)',
  RIGHT: 'var(--color-magenta)',
  ROOT: '#6f947f',
}

const legClass: Record<Leg, string> = {
  LEFT: 'border-lime/50 text-lime',
  MIDDLE: 'border-neon/50 text-neon',
  RIGHT: 'border-magenta/50 text-magenta',
  ROOT: 'border-edge text-slate-400',
}

// Legs are shown as A / B / C in the tree
const legLabel: Record<Leg, string> = {
  LEFT: 'A',
  MIDDLE: 'B',
  RIGHT: 'C',
  ROOT: 'ROOT',
}

interface Box {
  node: TreeNode
  x: number
  y: number
}

interface Edge {
  x1: number
  y1: number
  x2: number
  y2: number
  leg: Leg
}

interface Layout {
  boxes: Box[]
  edges: Edge[]
  width: number
  height: number
  count: number
  depth: number
}

function layoutTree(root: TreeNode): Layout {
  const boxes: Box[] = []
  const edges: Edge[] = []
  let leaf = 0
  let maxDepth = 0

  function walk(node: TreeNode, depth: number): Box {
    if (depth > maxDepth) maxDepth = depth
    const kids = node.children.map((c) => walk(c, depth + 1))
    let x: number
    if (kids.length === 0) {
      x = PAD + leaf * (NODE_W + GAP_X)
      leaf += 1
    } else {
      x = (kids[0].x + kids[kids.length - 1].x) / 2
    }
    const box: Box = { node, x, y: PAD + depth * (NODE_H + GAP_Y) }
    boxes.push(box)
    for (const kid of kids) {
      edges.push({
        x1: box.x + NODE_W / 2,
        y1: box.y + NODE_H,
        x2: kid.x + NODE_W / 2,
        y2: kid.y,
        leg: kid.node.position,
      })
    }
    return box
  }

  walk(root, 0)
  return {
    boxes,
    edges,
    width: PAD * 2 + Math.max(leaf, 1) * (NODE_W + GAP_X) - GAP_X,
    height: PAD * 2 + (maxDepth + 1) * (NODE_H + GAP_Y) - GAP_Y,
    count: boxes.length,
    depth: maxDepth + 1,
  }
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

function NodeCard({
  box,
  isMe,
  canFocus,
  onFocus,
}: {
  box: Box
  isMe: boolean
  canFocus: boolean
  onFocus: (code: string) => void
}) {
  const { node } = box
  const accent = legColor[node.position] ?? legColor.ROOT
  return (
    <button
      type="button"
      onClick={() => { if (canFocus) onFocus(node.referralCode) }}
      title={`${node.name} · ${node.email}`}
      style={{ left: box.x, top: box.y, width: NODE_W, height: NODE_H }}
      className={`group absolute rounded-2xl border bg-panel/95 p-3 text-left shadow-card backdrop-blur transition
        ${canFocus ? 'cursor-pointer hover:-translate-y-0.5 hover:bg-panel2' : 'cursor-default'} ${isMe ? 'ring-2 ring-lime/70' : ''}`}
    >
      <span
        className="absolute inset-x-0 top-0 h-1 rounded-t-2xl"
        style={{ background: accent }}
      />
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-ink"
          style={{ background: accent }}
        >
          {initials(node.name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="truncate text-sm font-semibold text-white">{node.name}</span>
            {node.isFounder && <span title="Founder">👑</span>}
          </div>
          <div className="mono truncate text-[10px] text-slate-500">{node.referralCode}</div>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span
          title={`${node.position} leg`}
          className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${legClass[node.position]}`}
        >
          {legLabel[node.position]}
        </span>
        <span className="text-xs font-semibold text-emerald-300">{money(node.points)} pts</span>
      </div>
      {node.children.length > 0 && (
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-edge bg-ink px-2 py-0.5 text-[10px] text-slate-400">
          {node.children.length} {node.children.length === 1 ? 'child' : 'children'}
        </span>
      )}
    </button>
  )
}

export default function Tree() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [code, setCode] = useState(user?.referralCode ?? '')
  const [active, setActive] = useState(user?.referralCode ?? '')
  const [tree, setTree] = useState<TreeNode | null>(
    () => api.peek<{ tree: TreeNode }>(`/tree?code=${encodeURIComponent((user?.referralCode ?? '').toUpperCase())}`)?.tree ?? null,
  )
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(
    () => api.peek(`/tree?code=${encodeURIComponent((user?.referralCode ?? '').toUpperCase())}`) === undefined,
  )
  const [zoom, setZoom] = useState(1)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const c = active.trim().toUpperCase()
    if (!c) {
      setTree(null)
      setLoading(false)
      return
    }
    setLoading(api.peek(`/tree?code=${encodeURIComponent(c)}`) === undefined)
    setError('')
    api
      .get<{ code: string; tree: TreeNode }>(`/tree?code=${encodeURIComponent(c)}`)
      .then((d) => { setTree(d.tree); setZoom(1) })
      .catch((e) => { setError((e as Error).message); setTree(null) })
      .finally(() => setLoading(false))
  }, [active])

  const layout = useMemo(() => (tree ? layoutTree(tree) : null), [tree])

  function submit(e: FormEvent) {
    e.preventDefault()
    setActive(code.trim().toUpperCase())
  }

  function focus(code: string) {
    setCode(code)
    setActive(code)
  }

  function fit() {
    if (!layout || !scrollRef.current) return
    const avail = scrollRef.current.clientWidth - 12
    setZoom(Math.min(1, Math.max(0.35, avail / layout.width)))
  }

  return (
    <>
      <PageHeader
        title="Your network"
        subtitle="Your circle at a glance — every member can build three legs."
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {isAdmin ? (
          <form onSubmit={submit} className="flex gap-2">
            <input
              className="field mono sm:max-w-xs"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Referral code"
            />
            <button className="btn-primary">View</button>
          </form>
        ) : (
          <span className="pill mono" title="Your referral code">
            {user?.referralCode || 'No referral code'}
          </span>
        )}
        {layout && (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <span className="pill">{layout.count} nodes</span>
            <span className="pill">{layout.depth} levels</span>
            <span className="pill border-lime/40 text-lime">{layout.count - 1} in circle</span>
            <div className="flex items-center overflow-hidden rounded-xl border border-edge bg-panel2">
              <button type="button" className="px-2.5 py-1.5 text-slate-300 hover:bg-panel" onClick={() => setZoom((z) => Math.max(0.35, Math.round((z - 0.1) * 100) / 100))}>−</button>
              <span className="w-12 text-center text-xs text-slate-400">{Math.round(zoom * 100)}%</span>
              <button type="button" className="px-2.5 py-1.5 text-slate-300 hover:bg-panel" onClick={() => setZoom((z) => Math.min(1.6, Math.round((z + 0.1) * 100) / 100))}>+</button>
            </div>
            <button type="button" className="btn-ghost !px-3 !py-1.5 text-xs" onClick={fit}>Fit</button>
          </div>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-3 text-xs">
        {(['LEFT', 'MIDDLE', 'RIGHT'] as Leg[]).map((leg) => (
          <span key={leg} className="flex items-center gap-1.5 text-slate-400">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: legColor[leg] }} />
            <span className="font-semibold" style={{ color: legColor[leg] }}>{legLabel[leg]}</span>
            {leg}
          </span>
        ))}
        <span className="ml-auto text-slate-500">
          {isAdmin ? 'Click any card to explore that branch.' : 'You are viewing your own network.'}
        </span>
      </div>

      {error && <div className="mb-4"><ErrorBox message={error} /></div>}

      {loading ? (
        <Spinner />
      ) : !tree || !layout ? (
        <Empty>Nothing here yet.</Empty>
      ) : (
        <div ref={scrollRef} className="card !p-0 overflow-auto" style={{ maxHeight: '72vh' }}>
          <div style={{ width: layout.width * zoom, height: layout.height * zoom }} className="relative">
            <div
              className="relative"
              style={{ width: layout.width, height: layout.height, transform: `scale(${zoom})`, transformOrigin: 'top left' }}
            >
              <svg width={layout.width} height={layout.height} className="absolute inset-0">
                {layout.edges.map((e, i) => {
                  const midY = (e.y1 + e.y2) / 2
                  return (
                    <g key={i}>
                      <path
                        d={`M ${e.x1} ${e.y1} V ${midY} H ${e.x2} V ${e.y2}`}
                        fill="none"
                        stroke={legColor[e.leg] ?? legColor.ROOT}
                        strokeOpacity="0.55"
                        strokeWidth="1.6"
                      />
                      <circle cx={e.x2} cy={e.y2} r="2.6" fill={legColor[e.leg] ?? legColor.ROOT} />
                      <text
                        x={e.x2}
                        y={midY - 6}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="700"
                        fill={legColor[e.leg] ?? legColor.ROOT}
                      >
                        {legLabel[e.leg]}
                      </text>
                    </g>
                  )
                })}
              </svg>
              {layout.boxes.map((b) => (
                <NodeCard
                  key={b.node._id}
                  box={b}
                  isMe={b.node.referralCode === user?.referralCode}
                  canFocus={isAdmin}
                  onFocus={focus}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
