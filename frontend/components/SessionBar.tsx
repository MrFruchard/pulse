'use client'

import { useEffect, useState } from 'react'
import type { SessionState } from '@/types'

interface SessionBarProps {
  session: SessionState
}

function timeLeft(closesAt: string) {
  const diff = Math.max(0, new Date(closesAt).getTime() - Date.now())
  const m = Math.floor(diff / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return `${m}:${String(s).padStart(2, '0')}`
}

export function SessionBar({ session }: SessionBarProps) {
  const [remaining, setRemaining] = useState('')

  useEffect(() => {
    if (!session.isActive || !session.closesAt) return
    setRemaining(timeLeft(session.closesAt))
    const interval = setInterval(() => setRemaining(timeLeft(session.closesAt!)), 1000)
    return () => clearInterval(interval)
  }, [session])

  if (!session.isActive) return null

  return (
    <div className="bg-green-500/10 border-b border-green-500/20 px-4 py-2">
      <div className="max-w-2xl mx-auto flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-green-400">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="font-medium">Session en cours</span>
        </div>
        <span className="text-green-400/70 font-mono text-xs">
          {remaining} restantes
        </span>
      </div>
    </div>
  )
}
