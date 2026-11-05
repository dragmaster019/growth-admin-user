import { useEffect, useMemo, useState } from 'react'

type Operator = '+' | '-' | '*' | '/'

const operatorSymbol: Record<Operator, string> = {
  '+': '+',
  '-': '−',
  '*': '×',
  '/': '÷',
}

const keys = [
  ['C', '±', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', '.', '⌫', '='],
] as const

function compute(left: number, right: number, operator: Operator) {
  if (operator === '+') return left + right
  if (operator === '-') return left - right
  if (operator === '*') return left * right
  return left / right
}

function formatResult(value: number) {
  if (!Number.isFinite(value)) return ''
  const rounded = Math.round(value * 1e10) / 1e10
  return String(rounded)
}

function prettyDisplay(value: string) {
  if (value === 'Error') return value
  const negative = value.startsWith('-')
  const raw = negative ? value.slice(1) : value
  const [integer, decimal] = raw.split('.')
  const formatted = Number(integer || '0').toLocaleString()
  return `${negative ? '−' : ''}${formatted}${decimal !== undefined ? `.${decimal}` : ''}`
}

export default function Calculator() {
  const [display, setDisplay] = useState('0')
  const [previous, setPrevious] = useState<number | null>(null)
  const [operator, setOperator] = useState<Operator | null>(null)
  const [waiting, setWaiting] = useState(false)
  const [expression, setExpression] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [failed, setFailed] = useState(false)

  const reset = () => {
    setDisplay('0')
    setPrevious(null)
    setOperator(null)
    setWaiting(false)
    setExpression('')
    setFailed(false)
  }

  const inputDigit = (digit: string) => {
    if (failed) {
      reset()
      setDisplay(digit)
      return
    }
    if (waiting) {
      setDisplay(digit)
      setWaiting(false)
      return
    }
    setDisplay((current) => {
      if (current === '0') return digit
      if (current.replace('-', '').replace('.', '').length >= 14) return current
      return current + digit
    })
  }

  const inputDecimal = () => {
    if (failed) {
      reset()
      setDisplay('0.')
      return
    }
    if (waiting) {
      setDisplay('0.')
      setWaiting(false)
      return
    }
    setDisplay((current) => (current.includes('.') ? current : `${current}.`))
  }

  const negate = () => {
    if (failed || display === '0') return
    setDisplay((current) => (current.startsWith('-') ? current.slice(1) : `-${current}`))
  }

  const percent = () => {
    if (failed) return
    const value = Number(display) / 100
    setDisplay(formatResult(value))
    setWaiting(false)
  }

  const backspace = () => {
    if (failed) {
      reset()
      return
    }
    if (waiting) return
    setDisplay((current) => (current.length <= 1 ? '0' : current.slice(0, -1)))
  }

  const chooseOperator = (next: Operator) => {
    if (failed) return
    const value = Number(display)

    if (operator && previous !== null && !waiting) {
      const result = compute(previous, value, operator)
      if (!Number.isFinite(result)) {
        setDisplay('Error')
        setFailed(true)
        setPrevious(null)
        setOperator(null)
        setWaiting(true)
        setExpression('')
        return
      }
      setPrevious(result)
      setDisplay(formatResult(result))
      setExpression(`${formatResult(result)} ${operatorSymbol[next]}`)
    } else {
      setPrevious(value)
      setExpression(`${prettyDisplay(formatResult(value))} ${operatorSymbol[next]}`)
    }

    setOperator(next)
    setWaiting(true)
  }

  const equals = () => {
    if (failed || operator === null || previous === null) return
    const value = Number(display)
    const result = compute(previous, value, operator)
    const line = `${prettyDisplay(formatResult(previous))} ${operatorSymbol[operator]} ${prettyDisplay(formatResult(value))} = ${Number.isFinite(result) ? prettyDisplay(formatResult(result)) : 'Error'}`
    setHistory((current) => [line, ...current].slice(0, 4))

    if (!Number.isFinite(result)) {
      setDisplay('Error')
      setFailed(true)
    } else {
      setDisplay(formatResult(result))
    }
    setPrevious(null)
    setOperator(null)
    setWaiting(true)
    setExpression('')
  }

  const press = (key: string) => {
    if (/^\d$/.test(key)) return inputDigit(key)
    if (key === '.') return inputDecimal()
    if (key === 'C') return reset()
    if (key === '±') return negate()
    if (key === '%') return percent()
    if (key === '⌫') return backspace()
    if (key === '=') return equals()
    if (key === '+') return chooseOperator('+')
    if (key === '−') return chooseOperator('-')
    if (key === '×') return chooseOperator('*')
    if (key === '÷') return chooseOperator('/')
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const map: Record<string, string> = {
        Enter: '=',
        '=': '=',
        Escape: 'C',
        Backspace: '⌫',
        '+': '+',
        '-': '−',
        '*': '×',
        '/': '÷',
        '%': '%',
        '.': '.',
      }
      if (/^\d$/.test(event.key)) {
        event.preventDefault()
        inputDigit(event.key)
        return
      }
      const key = map[event.key]
      if (key) {
        event.preventDefault()
        press(key)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  const displayText = useMemo(() => prettyDisplay(display), [display])

  return (
    <div className="calc-shell">
      <div className="flex items-center justify-between gap-3 px-1">
        <div>
          <h2 className="text-lg font-bold text-white">Calculator</h2>
          <p className="mt-0.5 text-xs text-slate-500">Quick maths while you work.</p>
        </div>
        <span className="pill border-lime/30 bg-lime/10 text-lime">3D tool</span>
      </div>

      <div className="calc-display mt-4">
        <div className="h-5 truncate text-xs text-slate-500">{expression || '\u00a0'}</div>
        <div className={`truncate text-right text-4xl font-black tracking-tight ${failed ? 'calc-display-error' : 'calc-display-value'}`}>
          {displayText}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {keys.flat().map((key) => {
          const isOperator = ['÷', '×', '−', '+', '='].includes(key)
          const isAction = ['C', '±', '%', '⌫'].includes(key)
          return (
            <button
              key={key}
              type="button"
              onClick={() => press(key)}
              className={`calc-key ${isOperator ? 'calc-key-operator' : ''} ${isAction ? 'calc-key-action' : ''} ${key === '=' ? 'calc-key-equals' : ''}`}
            >
              {key}
            </button>
          )
        })}
      </div>

      {history.length > 0 && (
        <div className="mt-4 rounded-2xl border border-edge/70 bg-panel2/40 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Recent</span>
            <button type="button" onClick={() => setHistory([])} className="text-[10px] font-semibold text-slate-500 hover:text-white">
              Clear
            </button>
          </div>
          <ul className="mt-2 space-y-1.5">
            {history.map((line, index) => (
              <li key={`${line}-${index}`} className="truncate text-right text-[11px] text-slate-400">{line}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
