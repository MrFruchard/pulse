'use client'

import { useCallback, useEffect, useState } from 'react'
import { SplashScreen } from '@/components/SplashScreen'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Splash uniquement au premier chargement de la session (pas sur chaque navigation)
    const seen = sessionStorage.getItem('pulse_splash_seen')
    if (!seen) {
      setShowSplash(true)
    } else {
      setReady(true)
    }
  }, [])

  const handleDone = useCallback(() => {
    sessionStorage.setItem('pulse_splash_seen', '1')
    setShowSplash(false)
    setReady(true)
  }, [])

  return (
    <>
      {showSplash && <SplashScreen onDone={handleDone} />}
      <div
        className="transition-opacity duration-500"
        style={{ opacity: ready ? 1 : 0 }}
      >
        {children}
      </div>
    </>
  )
}
