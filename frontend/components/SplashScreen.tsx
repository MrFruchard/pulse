'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Phase = 'waiting' | 'expanding' | 'done'

interface RippleOrigin {
  x: number
  y: number
}

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>('waiting')
  const [origin, setOrigin] = useState<RippleOrigin>({ x: 0, y: 0 })

  function handleTap(e: React.MouseEvent | React.TouchEvent) {
    if (phase !== 'waiting') return

    let x: number, y: number
    if ('touches' in e) {
      x = e.touches[0].clientX
      y = e.touches[0].clientY
    } else {
      x = (e as React.MouseEvent).clientX
      y = (e as React.MouseEvent).clientY
    }

    setOrigin({ x, y })
    setPhase('expanding')
  }

  // Rayon max pour couvrir tout l'écran depuis n'importe quel point
  const maxRadius = typeof window !== 'undefined'
    ? Math.hypot(
        Math.max(origin.x, window.innerWidth - origin.x),
        Math.max(origin.y, window.innerHeight - origin.y)
      ) * 1.1
    : 1200

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-950 cursor-pointer select-none overflow-hidden"
          onClick={handleTap}
          onTouchStart={handleTap}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeIn' }}
        >

          {/* Onde principale qui explose depuis le point de tap */}
          <AnimatePresence>
            {phase === 'expanding' && (
              <motion.div
                key="ripple"
                className="absolute rounded-full"
                style={{
                  left: origin.x,
                  top: origin.y,
                  x: '-50%',
                  y: '-50%',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 40%, transparent 70%)',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
                initial={{ width: 0, height: 0, opacity: 1 }}
                animate={{ width: maxRadius * 2, height: maxRadius * 2, opacity: 0 }}
                transition={{ duration: 0.9, ease: [0.2, 0.8, 0.4, 1] }}
              />
            )}
          </AnimatePresence>

          {/* Deuxième onde légèrement décalée */}
          <AnimatePresence>
            {phase === 'expanding' && (
              <motion.div
                key="ripple-2"
                className="absolute rounded-full"
                style={{
                  left: origin.x,
                  top: origin.y,
                  x: '-50%',
                  y: '-50%',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
                initial={{ width: 0, height: 0, opacity: 1 }}
                animate={{ width: maxRadius * 2, height: maxRadius * 2, opacity: 0 }}
                transition={{ duration: 0.9, ease: [0.2, 0.8, 0.4, 1], delay: 0.12 }}
              />
            )}
          </AnimatePresence>

          {/* Point central qui pulse en attente */}
          <AnimatePresence>
            {phase === 'waiting' && (
              <motion.div
                key="dot"
                className="absolute rounded-full bg-white"
                style={{ left: '50%', top: '50%', x: '-50%', y: '-50%' }}
                initial={{ width: 6, height: 6, opacity: 0 }}
                animate={{
                  width: [6, 8, 6],
                  height: [6, 8, 6],
                  opacity: [0.4, 0.8, 0.4],
                  boxShadow: [
                    '0 0 0px 0px rgba(255,255,255,0)',
                    '0 0 12px 4px rgba(255,255,255,0.15)',
                    '0 0 0px 0px rgba(255,255,255,0)',
                  ],
                }}
                exit={{ opacity: 0, scale: 2 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
          </AnimatePresence>

          {/* Texte "Pulse" — apparaît dans le sillage de l'onde */}
          <AnimatePresence>
            {phase === 'expanding' && (
              <motion.h1
                key="title"
                className="relative text-7xl font-bold tracking-tight text-white"
                initial={{ opacity: 0, scale: 0.85, filter: 'blur(12px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.6, delay: 0.25, ease: [0.2, 0.8, 0.4, 1] }}
                onAnimationComplete={() => {
                  // Attendre un moment puis laisser place au site
                  setTimeout(onDone, 800)
                }}
              >
                Pulse
              </motion.h1>
            )}
          </AnimatePresence>

          {/* Hint tap */}
          <AnimatePresence>
            {phase === 'waiting' && (
              <motion.p
                key="hint"
                className="absolute bottom-12 text-xs text-gray-600 tracking-widest uppercase"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                Appuie pour continuer
              </motion.p>
            )}
          </AnimatePresence>

        </motion.div>
      )}
    </AnimatePresence>
  )
}
