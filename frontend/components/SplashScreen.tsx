'use client'

import { useEffect, useState } from 'react'

type Phase =
  | 'fade-in'      // 0 → 500ms  : "Pulse" apparaît
  | 'beat-1'       // 500 → 1300ms : premier battement + onde
  | 'rest'         // 1300 → 1700ms : silence
  | 'beat-2'       // 1700 → 2100ms : deuxième battement (plus doux)
  | 'fade-out'     // 2100 → 2500ms : disparition
  | 'done'         // 2500ms+  : retiré du DOM

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>('fade-in')
  const [ripple, setRipple] = useState(false)
  const [ripple2, setRipple2] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => { setPhase('beat-1'); setRipple(true) },  500)
    const t2 = setTimeout(() => { setRipple(false) },                      1300)
    const t3 = setTimeout(() => { setPhase('rest') },                      1300)
    const t4 = setTimeout(() => { setPhase('beat-2'); setRipple2(true) },  1700)
    const t5 = setTimeout(() => { setRipple2(false) },                     2100)
    const t6 = setTimeout(() => { setPhase('fade-out') },                  2100)
    const t7 = setTimeout(() => { setPhase('done'); onDone() },            2500)

    return () => [t1, t2, t3, t4, t5, t6, t7].forEach(clearTimeout)
  }, [onDone])

  if (phase === 'done') return null

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-gray-950
        ${phase === 'fade-out' ? 'animate-fade-out' : ''}`}
    >
      <div className="relative flex items-center justify-center">

        {/* Onde 1 */}
        {ripple && (
          <span
            key="ripple-1"
            className="absolute inset-0 rounded-full border border-white/30 animate-ripple"
            style={{ width: '120px', height: '120px', margin: 'auto' }}
          />
        )}
        {/* Onde 1 décalée */}
        {ripple && (
          <span
            key="ripple-1b"
            className="absolute inset-0 rounded-full border border-white/15 animate-ripple"
            style={{ width: '120px', height: '120px', margin: 'auto', animationDelay: '120ms' }}
          />
        )}

        {/* Onde 2 */}
        {ripple2 && (
          <span
            key="ripple-2"
            className="absolute inset-0 rounded-full border border-white/20 animate-ripple"
            style={{ width: '120px', height: '120px', margin: 'auto' }}
          />
        )}

        {/* Texte principal */}
        <h1
          className={`text-6xl font-bold tracking-tight select-none
            ${phase === 'fade-in'  ? 'animate-fade-in opacity-0' : ''}
            ${phase === 'beat-1'   ? 'animate-heartbeat' : ''}
            ${phase === 'beat-2'   ? 'animate-heartbeat' : ''}
          `}
          style={phase === 'beat-2' ? { animationDuration: '0.7s', animationTimingFunction: 'ease-in-out' } : {}}
        >
          Pulse
        </h1>
      </div>
    </div>
  )
}
