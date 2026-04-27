'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from '@/hooks/useSession'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function timeUntil(target: string) {
  const diff = Math.max(0, new Date(target).getTime() - Date.now())
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  const totalSeconds = Math.floor(diff / 1000)
  return { h, m, s, totalSeconds, done: diff === 0 }
}

// Chiffre flipboard — anime quand la valeur change
function FlipDigit({ value, urgent }: { value: string; urgent: boolean }) {
  return (
    <div className="relative overflow-hidden" style={{ minWidth: '1ch' }}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: -30, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 30, opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.18, ease: [0.2, 0.8, 0.3, 1] }}
          className={`block tabular-nums ${urgent ? 'text-red-400' : 'text-white'}`}
          style={{
            filter: urgent ? 'drop-shadow(0 0 8px rgba(248,113,113,0.8))' : undefined,
          }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}

// Bloc heure/minute/seconde
function TimeBlock({ value, label, urgent }: { value: number; label: string; urgent: boolean }) {
  const digits = pad(value).split('')
  const shakeVariants = {
    shake: {
      x: [0, -3, 3, -3, 3, 0],
      transition: { duration: 0.4, repeat: Infinity, repeatDelay: 0.6 },
    },
    still: { x: 0 },
  }

  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      variants={shakeVariants}
      animate={urgent ? 'shake' : 'still'}
    >
      <div className="flex text-7xl font-mono font-bold">
        {digits.map((d, i) => (
          <FlipDigit key={i} value={d} urgent={urgent} />
        ))}
      </div>
      <span className={`text-xs uppercase tracking-widest font-sans ${urgent ? 'text-red-400/70' : 'text-gray-500'}`}>
        {label}
      </span>
    </motion.div>
  )
}

// Séparateur ":" qui pulse au BPM via prop
function Separator({ urgent, pulse }: { urgent: boolean; pulse: boolean }) {
  return (
    <motion.span
      animate={{ opacity: pulse ? 1 : 0.2 }}
      transition={{ duration: 0.1 }}
      className={`text-7xl font-mono font-bold mb-5 ${urgent ? 'text-red-400' : 'text-gray-600'}`}
    >
      :
    </motion.span>
  )
}

export function Countdown({ beatCount, separatorBeatRef }: {
  beatCount?: number
  separatorBeatRef?: React.MutableRefObject<(() => void) | null>
}) {
  const { sessionState, loading } = useSession()
  const [time, setTime] = useState({ h: 0, m: 0, s: 0, totalSeconds: 0, done: false })
  const [separatorOn, setSeparatorOn] = useState(false)

  // Tick chaque seconde
  useEffect(() => {
    if (!sessionState?.opensAt) return
    const interval = setInterval(() => {
      setTime(timeUntil(sessionState.opensAt))
    }, 1000)
    setTime(timeUntil(sessionState.opensAt))
    return () => clearInterval(interval)
  }, [sessionState?.opensAt])

  // Enregistrer le callback séparateur — appelé directement depuis RAF du parent
  useEffect(() => {
    if (!separatorBeatRef) return
    separatorBeatRef.current = () => {
      setSeparatorOn(true)
      setTimeout(() => setSeparatorOn(false), 150)
    }
    return () => { if (separatorBeatRef) separatorBeatRef.current = null }
  }, [separatorBeatRef])

  if (loading) return <div className="text-gray-500 text-sm">Chargement...</div>

  if (sessionState?.isActive) {
    return (
      <div className="flex items-center gap-2 text-green-400 font-semibold text-lg">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        Session en cours
      </div>
    )
  }

  const urgent = time.totalSeconds <= 60
  const superUrgent = time.totalSeconds <= 10

  return (
    <div className="flex flex-col items-center gap-4">
      <p className={`text-xs uppercase tracking-widest ${urgent ? 'text-red-400/80' : 'text-gray-500'}`}>
        {superUrgent ? 'Imminent' : 'Prochaine session dans'}
      </p>
      <div className="flex items-center gap-3">
        <TimeBlock value={time.h} label="heures" urgent={urgent} />
        <Separator urgent={urgent} pulse={separatorOn} />
        <TimeBlock value={time.m} label="minutes" urgent={urgent} />
        <Separator urgent={urgent} pulse={separatorOn} />
        <TimeBlock value={time.s} label="secondes" urgent={urgent} />
      </div>
    </div>
  )
}
