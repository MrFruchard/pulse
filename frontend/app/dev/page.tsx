'use client'

import { HeartbeatScreen } from '@/components/HeartbeatScreen'

export default function DevPage() {
  const opensAt = new Date(Date.now() + 90 * 60_000).toISOString() // dans 90 min → 40 BPM
  return <HeartbeatScreen opensAt={opensAt} />
}
