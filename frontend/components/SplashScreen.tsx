'use client'

import Link from 'next/link'
import { PulseClock } from '@/components/ui/PulseClock'
import { Button } from '@/components/ui/Button'
import { useSession } from '@/hooks/useSession'

interface SplashScreenProps {
  onDone?: () => void
  authenticated?: boolean
}

function PulseLogoMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" fill="var(--accent)" />
      <circle cx="12" cy="12" r="6.5" stroke="var(--accent)" strokeWidth="1.2" opacity="0.55" />
      <circle cx="12" cy="12" r="10.5" stroke="var(--accent)" strokeWidth="1.2" opacity="0.22" />
    </svg>
  )
}

export function SplashScreen({ authenticated = false }: SplashScreenProps) {
  const { sessionState } = useSession()

  const secondsToOpen = sessionState?.opensAt
    ? Math.max(0, Math.floor((new Date(sessionState.opensAt).getTime() - Date.now()) / 1000))
    : 0

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-between p-8">
      <div className="flex items-center gap-2.5 mt-4">
        <PulseLogoMark />
        <span className="text-lg font-semibold tracking-tight">Pulse</span>
      </div>

      <div className="flex flex-col items-center gap-8 text-center max-w-xs">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight leading-snug mb-3">
            Une heure.<br />
            <span className="text-text-muted">Une fois par jour.</span>
          </h1>
          <p className="text-sm text-text-faint leading-relaxed">
            Pulse n&apos;existe que 60 minutes par jour.<br />
            Pendant ce temps, on parle.
          </p>
        </div>

        <PulseClock
          state="closed"
          seconds={secondsToOpen}
          size="lg"
          label="prochaine ouverture"
        />
      </div>

      <div className="w-full max-w-xs flex flex-col gap-3 mb-4">
        {!authenticated ? (
          <>
            <Link href="/register">
              <Button variant="primary" full size="lg">Rejoindre</Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" full size="md">J&apos;ai déjà un compte</Button>
            </Link>
          </>
        ) : (
          <p className="text-center text-sm text-text-faint">
            La prochaine session ouvrira bientôt.
          </p>
        )}
      </div>
    </div>
  )
}
