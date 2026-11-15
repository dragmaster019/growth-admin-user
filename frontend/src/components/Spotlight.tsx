import { useEffect } from 'react'

const SURFACES = '.card, .hero, .mini-card, .btn-primary'

export default function Spotlight() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const coarse = window.matchMedia('(pointer: coarse)').matches
    if (reduce || coarse) return

    let frame = 0
    let pending: PointerEvent | null = null

    const paint = () => {
      frame = 0
      const event = pending
      if (!event) return
      const node = event.target as HTMLElement | null
      const surface = node?.closest<HTMLElement>(SURFACES)
      if (!surface) return

      const rect = surface.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      surface.style.setProperty('--mx', `${x}px`)
      surface.style.setProperty('--my', `${y}px`)

      if (surface.classList.contains('card-hover') || surface.classList.contains('hero')) {
        const px = x / rect.width - 0.5
        const py = y / rect.height - 0.5
        const strength = surface.classList.contains('hero') ? 1.6 : 4
        surface.style.setProperty('--rx', `${(-py * strength).toFixed(2)}deg`)
        surface.style.setProperty('--ry', `${(px * strength).toFixed(2)}deg`)
      }
    }

    const onMove = (event: PointerEvent) => {
      pending = event
      if (!frame) frame = requestAnimationFrame(paint)
    }

    const onOut = (event: PointerEvent) => {
      const node = event.target as HTMLElement | null
      const surface = node?.closest<HTMLElement>(SURFACES)
      if (!surface) return
      const next = event.relatedTarget as Node | null
      if (next && surface.contains(next)) return
      surface.style.removeProperty('--rx')
      surface.style.removeProperty('--ry')
      surface.style.removeProperty('--mx')
      surface.style.removeProperty('--my')
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerout', onOut, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerout', onOut)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return null
}
