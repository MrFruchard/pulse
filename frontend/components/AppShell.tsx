'use client'

import { useCallback, useEffect, useState } from 'react'
import { SplashScreen } from '@/components/SplashScreen'

export function AppShell({ children }: { children: React.ReactNode }) {
  // SSR : pas de splash, contenu visible par défaut
  const [showSplash, setShowSplash] = useState(false)
  const [contentVisible, setContentVisible] = useState(true)

  useEffect(() => {
    const seen = sessionStorage.getItem('pulse_splash_seen')
    if (!seen) {
      // Premier chargement : cacher le contenu et montrer la splash
      setContentVisible(false)
      setShowSplash(true)
    }
  }, [])

  const handleDone = useCallback(() => {
    sessionStorage.setItem('pulse_splash_seen', '1')
    setShowSplash(false)
    setContentVisible(true)
  }, [])

  return (
    <>
      {showSplash && <SplashScreen onDone={handleDone} />}
      <div
        style={{
          opacity: contentVisible ? 1 : 0,
          transition: contentVisible ? 'opacity 0.5s ease-in' : 'none',
        }}
      >
        {children}
      </div>
    </>
  )
}
