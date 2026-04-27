'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useBpm } from '@/hooks/useBpm'
import { Countdown } from '@/components/Countdown'

const RINGS = [0, 150, 300]

interface HeartbeatScreenProps {
  opensAt: string
}

export function HeartbeatScreen({ opensAt }: HeartbeatScreenProps) {
  const bpm = useBpm(opensAt)
  const [beatCount, setBeatCount] = useState(0)
  const intervalMs = Math.round(60_000 / bpm)

  useEffect(() => {
    const interval = setInterval(() => {
      setBeatCount(n => n + 1)
    }, intervalMs)
    return () => clearInterval(interval)
  }, [intervalMs])

  return (
    <div className="fixed inset-0 bg-[#080808] flex flex-col items-center justify-center overflow-hidden">
      {/* Cercles sonar */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {RINGS.map((delay, i) => (
          <SonarRing key={i} beatCount={beatCount} delayMs={delay} />
        ))}
      </div>

      {/* Titre Pulse pulsant */}
      <PulseTitle beatCount={beatCount} />

      {/* Countdown centré */}
      <div className="mt-8 z-10">
        <Countdown />
      </div>

      {/* Ligne ECG */}
      <EcgLine beatCount={beatCount} />
    </div>
  )
}

function SonarRing({ beatCount, delayMs }: { beatCount: number; delayMs: number }) {
  return (
    <motion.div
      key={`${beatCount}-${delayMs}`}
      className="absolute rounded-full border border-white/20"
      style={{ width: 120, height: 120 }}
      initial={{ scale: 0.8, opacity: 0.6 }}
      animate={{ scale: 3.5, opacity: 0 }}
      transition={{
        duration: 1.2,
        ease: 'easeOut',
        delay: delayMs / 1000,
      }}
    />
  )
}

function PulseTitle({ beatCount }: { beatCount: number }) {
  return (
    <motion.h1
      key={beatCount}
      className="text-7xl font-bold tracking-tight text-white z-10 select-none"
      initial={{ scale: 1.06 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      Pulse
    </motion.h1>
  )
}

function EcgLine({ beatCount }: { beatCount: number }) {
  const d = "M0,40 L120,40 L140,40 L150,10 L160,70 L170,40 L185,25 L195,40 L400,40"

  return (
    <div className="absolute bottom-24 left-0 right-0 px-8 pointer-events-none">
      <svg
        viewBox="0 0 400 80"
        className="w-full"
        style={{ overflow: 'visible' }}
      >
        <motion.path
          key={beatCount}
          d={d}
          fill="none"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0.8 }}
          animate={{ pathLength: 1, opacity: 0.25 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />
      </svg>
    </div>
  )
}
