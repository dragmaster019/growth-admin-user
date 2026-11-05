export const DEFAULT_POINT_VALUE_INR = 12

export function pointsToInr(points: number, rate = DEFAULT_POINT_VALUE_INR) {
  return Math.round((Number(points) || 0) * rate)
}

export function inrToPoints(rupees: number, rate = DEFAULT_POINT_VALUE_INR) {
  if (!Number.isFinite(rate) || rate <= 0) return 0
  return Math.max(0, Math.floor((Number(rupees) || 0) / rate))
}

export function formatInr(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.round(Number(value) || 0))
}

export function formatRate(rate = DEFAULT_POINT_VALUE_INR) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rate)
}

export function pointsInr(points: number, rate = DEFAULT_POINT_VALUE_INR) {
  return formatInr(pointsToInr(points, rate))
}
