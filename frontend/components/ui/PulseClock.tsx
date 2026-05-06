'use client'

import { useEffect, useState } from 'react'

type ClockState = 'open' | 'urgent' | 'closed'
type ClockSize = 'hero' | 'lg' | 'md' | 'sm'

interface PulseClockProps {
  state: ClockState
  seconds: number
  size?: ClockSize
  label?: string
}

function pad(n: number) {
  return String(Math.max(0, n)).padStart(2, '0')
}

function toHMS(total: number) {
  const s = Math.max(0, Math.floor(total))
  return {
    h: Math.floor(s / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  }
}

const fontSizes: Record<ClockSize, string> = {
  hero: 'text-[80px]',
  lg:   'text-5xl',
  md:   'text-3xl',
  sm:   'text-base',
}

const gaps: Record<ClockSize, string> = {
  hero: 'gap-4',
  lg:   'gap-3',
  md:   'gap-2',
  sm:   'gap-1.5',
}

export function PulseClock({ state, seconds, size = 'lg', label }: PulseClockProps) {
  const [current, setCurrent] = useState(seconds)

  useEffect(() => {
    setCurrent(seconds)
    if (state === 'closed') return
    const id = setInterval(() => setCurrent(prev => Math.max(0, prev - 1)), 1000)
    return () => clearInterval(id)
  }, [seconds, state])

  const { h, m, s } = toHMS(current)

  const colorClass = state === 'closed'
    ? 'text-text-faint'
    : state === 'urgent'
    ? 'text-danger'
    : 'text-accent'

  const animClass = state === 'closed'
    ? 'animate-pulse-closed'
    : state === 'urgent'
    ? 'animate-pulse-urgent'
    : 'animate-pulse-open'

  const glowClass = state === 'urgent'
    ? 'animate-pulse-urgent-glow'
    : state === 'open'
    ? 'animate-pulse-glow'
    : ''

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`flex items-baseline ${gaps[size]} ${colorClass} ${animClass} ${glowClass}
          font-semibold tabular-nums tracking-tight`}
        style={{ fontVariantNumeric: 'tabular-nums' }}
        aria-label={`${h}h${pad(m)}m${pad(s)}s`}
        aria-live="polite"
        aria-atomic="true"
      >
        <span className={fontSizes[size]}>{pad(h)}</span>
        <span className={`${fontSizes[size]} text-text-faint`}>:</span>
        <span className={fontSizes[size]}>{pad(m)}</span>
        <span className={`${fontSizes[size]} text-text-faint`}>:</span>
        <span className={fontSizes[size]}>{pad(s)}</span>
      </div>
      {label && (
        <span className="text-xs text-text-faint tracking-wide uppercase">{label}</span>
      )}
    </div>
  )
}
