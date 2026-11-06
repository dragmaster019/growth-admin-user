let lockCount = 0
let previousOverflow = ''

export function lockBodyScroll() {
  if (typeof document === 'undefined') return () => {}

  if (lockCount === 0) {
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  lockCount += 1

  let released = false
  return () => {
    if (released) return
    released = true
    lockCount = Math.max(0, lockCount - 1)
    if (lockCount === 0) document.body.style.overflow = previousOverflow
  }
}

export function resetBodyScroll() {
  lockCount = 0
  previousOverflow = ''
  if (typeof document !== 'undefined') document.body.style.overflow = ''
}
