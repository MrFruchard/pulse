'use client'

import { useEffect, useState } from 'react'

type Phase = 'fade-in' | 'beat-1' | 'rest' | 'beat-2' | 'fade-out' | 'done'

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>('fade-in')
  const [ripple, setRipple] = useState(false)
  const [ripple2, setRipple2] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => { setPhase('beat-1'); setRipple(true) },   500)
    const t2 = setTimeout(() => { setRipple(false); setPhase('rest') },    1350)
    const t3 = setTimeout(() => { setPhase('beat-2'); setRipple2(true) }, 1750)
    const t4 = setTimeout(() => { setRipple2(false); setPhase('fade-out') }, 2100)
    const t5 = setTimeout(() => { setPhase('done'); onDone() },            2500)

    return () => [t1, t2, t3, t4, t5].forEach(clearTimeout)
  }, [onDone])

  if (phase === 'done') return null

  const textClass =
    phase === 'fade-in' ? 'splash-fade-in' :
    phase === 'beat-1'  ? 'splash-heartbeat' :
    phase === 'beat-2'  ? 'splash-heartbeat-soft' :
    ''

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-gray-950 ${phase === 'fade-out' ? 'splash-fade-out' : ''}`}
    >
      <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>

        {/* Ondes battement 1 */}
        {ripple && (
          <>
            <span className="splash-ripple absolute rounded-full border border-white/25" style={{ width: 100, height: 100, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
            <span className="splash-ripple-delayed absolute rounded-full border border-white/15" style={{ width: 100, height: 100, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
          </>
        )}

        {/* Ondes battement 2 */}
        {ripple2 && (
          <span className="splash-ripple absolute rounded-full border border-white/20" style={{ width: 100, height: 100, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
        )}

        {/* Texte */}
        <h1
          key={phase}
          className={`text-6xl font-bold tracking-tight select-none text-white ${textClass}`}
          style={{ opacity: phase === 'fade-in' ? 0 : 1 }}
        >
          Pulse
        </h1>
      </div>
    </div>
  )
}
