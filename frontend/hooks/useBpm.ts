'use client'

import { useEffect, useState } from 'react'

export function getBpm(opensAt: string): number {
  const diffMs = new Date(opensAt).getTime() - Date.now()
  const diffMin = diffMs / 60000
  if (diffMin > 60) return 40
  if (diffMin > 30) return 60
  if (diffMin > 10) return 80
  if (diffMin > 5)  return 100
  return 120
}

export function useBpm(opensAt: string): number {
  const [bpm, setBpm] = useState(() => getBpm(opensAt))

  useEffect(() => {
    const interval = setInterval(() => {
      setBpm(getBpm(opensAt))
    }, 30_000)
    return () => clearInterval(interval)
  }, [opensAt])

  return bpm
}
