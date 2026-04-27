'use client'

import React, { useEffect, useRef, useState } from 'react'
import { animate } from 'animejs'
import { useBpm } from '@/hooks/useBpm'
import { Countdown } from '@/components/Countdown'

interface HeartbeatScreenProps {
  opensAt: string
}

export function HeartbeatScreen({ opensAt }: HeartbeatScreenProps) {
  const bpm = useBpm(opensAt)
  const turbulenceRef = useRef<SVGFETurbulenceElement>(null)
  const displacementRef = useRef<SVGFEDisplacementMapElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const bpmRef = useRef(bpm)
  const [beatCount, setBeatCount] = useState(0)
  const separatorBeatRef = useRef<(() => void) | null>(null)

  useEffect(() => { bpmRef.current = bpm }, [bpm])

  useEffect(() => {
    let rafId: number
    let lastBeat = 0

    function beat(now: number) {
      const intervalMs = Math.round(60_000 / bpmRef.current)
      if (now - lastBeat >= intervalMs) {
        lastBeat = now
        // Tout déclenché ici, au même frame, sans passer par React
        fireLubDub()
        separatorBeatRef.current?.()
        setBeatCount(n => n + 1)
      }
      rafId = requestAnimationFrame(beat)
    }

    rafId = requestAnimationFrame(beat)
    return () => cancelAnimationFrame(rafId)
  }, [])

  function animateFreq(from: number, to: number, duration: number, ease: string) {
    const turb = turbulenceRef.current
    if (!turb) return
    const proxy = { v: from }
    animate(proxy, {
      v: to,
      duration,
      ease,
      onUpdate: () => {
        turb.setAttribute('baseFrequency', `${proxy.v.toFixed(4)} ${proxy.v.toFixed(4)}`)
      },
    })
  }

  function animateScale(from: number, to: number, duration: number, ease: string) {
    const disp = displacementRef.current
    if (!disp) return
    const proxy = { v: from }
    animate(proxy, {
      v: to,
      duration,
      ease,
      onUpdate: () => {
        disp.setAttribute('scale', proxy.v.toFixed(2))
      },
    })
  }

  function fireLubDub() {
    const title = titleRef.current
    if (!title) return

    // LUB — montée rapide scale + freq, retour élastique
    animateScale(0, 30, 300, 'out(2)')
    animateFreq(0.01, 0.05, 300, 'out(2)')
    setTimeout(() => {
      animateScale(30, 0, 700, 'outElastic')
      animateFreq(0.05, 0.01, 700, 'outElastic')
    }, 300)

    animate(title, {
      scale: [1, 1.1, 1],
      duration: 400,
      ease: 'out(4)',
    })

    // DUB — 140ms après, plus doux
    setTimeout(() => {
      animateScale(0, 18, 250, 'out(2)')
      animateFreq(0.01, 0.032, 250, 'out(2)')
      setTimeout(() => {
        animateScale(18, 0, 600, 'outElastic')
        animateFreq(0.032, 0.01, 600, 'outElastic')
      }, 250)

      animate(title, {
        scale: [1, 1.05, 1],
        duration: 350,
        ease: 'out(3)',
      })
    }, 140)
  }

  return (
    <div className="fixed inset-0 bg-[#060606] flex flex-col items-center justify-center overflow-hidden">

      {/* SVG filter */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          <filter id="heartbeat-filter" x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
            <feTurbulence
              ref={turbulenceRef}
              type="fractalNoise"
              baseFrequency="0.01 0.01"
              numOctaves="2"
              seed="5"
              result="noise"
            />
            <feDisplacementMap
              ref={displacementRef}
              in="SourceGraphic"
              in2="noise"
              scale="0"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Titre avec filtre */}
      <div
        className="relative flex flex-col items-center justify-center"
        style={{ filter: 'url(#heartbeat-filter)' }}
      >
        <div className="absolute w-72 h-72 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <h1
          ref={titleRef}
          className="text-9xl font-bold tracking-tight text-white select-none relative z-10"
          style={{ willChange: 'transform' }}
        >
          Pulse
        </h1>
      </div>

      {/* Countdown hors filtre pour rester lisible */}
      <div className="mt-12 z-10">
        <Countdown beatCount={beatCount} separatorBeatRef={separatorBeatRef} />
      </div>

    </div>
  )
}

