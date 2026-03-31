'use client'

import { useEffect, useState } from 'react'
import { session as sessionApi } from '@/lib/api'
import type { SessionState } from '@/types'

export function useSession() {
  const [sessionState, setSessionState] = useState<SessionState | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    sessionApi.current()
      .then((data) => setSessionState(data as SessionState))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return { sessionState, loading }
}
