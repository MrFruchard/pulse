'use client'

import { useEffect, useState } from 'react'
import { useSession } from '@/hooks/useSession'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function timeUntil(target: string) {
  const diff = Math.max(0, new Date(target).getTime() - Date.now())
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return { h, m, s, done: diff === 0 }
}

export function Countdown() {
  const { sessionState, loading } = useSession()
  const [time, setTime] = useState({ h: 0, m: 0, s: 0, done: false })

  useEffect(() => {
    if (!sessionState?.opensAt) return
    const interval = setInterval(() => {
      setTime(timeUntil(sessionState.opensAt))
    }, 1000)
    return () => clearInterval(interval)
  }, [sessionState?.opensAt])

  if (loading) return <div className="text-gray-500 text-sm">Chargement...</div>

  if (sessionState?.isActive) {
    return (
      <div className="flex items-center gap-2 text-green-400 font-semibold text-lg">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        Session en cours
      </div>
    )
  }

  return (
    <div className="text-center">
      <p className="text-gray-500 text-sm mb-3 uppercase tracking-widest">Prochaine session dans</p>
      <div className="flex gap-4 text-5xl font-mono font-bold tabular-nums">
        <div className="flex flex-col items-center">
          <span>{pad(time.h)}</span>
          <span className="text-xs text-gray-500 font-sans mt-1">heures</span>
        </div>
        <span className="mt-1">:</span>
        <div className="flex flex-col items-center">
          <span>{pad(time.m)}</span>
          <span className="text-xs text-gray-500 font-sans mt-1">minutes</span>
        </div>
        <span className="mt-1">:</span>
        <div className="flex flex-col items-center">
          <span>{pad(time.s)}</span>
          <span className="text-xs text-gray-500 font-sans mt-1">secondes</span>
        </div>
      </div>
    </div>
  )
}
