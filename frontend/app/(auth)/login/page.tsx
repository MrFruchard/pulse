'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/api'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

function PulseLogoMark() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" fill="var(--accent)" />
      <circle cx="12" cy="12" r="6.5" stroke="var(--accent)" strokeWidth="1.2" opacity="0.55" />
      <circle cx="12" cy="12" r="10.5" stroke="var(--accent)" strokeWidth="1.2" opacity="0.22" />
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await auth.login({ email: form.email, password: form.password })
      router.push('/feed')
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      setError(msg.includes('suspended') ? 'Ton compte a été suspendu.' : 'Identifiants invalides.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col px-6 py-8">
      <div className="flex items-center gap-2.5 mb-10">
        <PulseLogoMark />
        <span className="text-base font-semibold tracking-tight">Pulse</span>
      </div>

      <div className="relative flex bg-surface border border-border rounded-md p-1 mb-7">
        <div className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)]
          bg-surface-2 border border-border-strong rounded transition-all duration-200" />
        <Link href="/login" className="relative z-10 flex-1 py-2 text-center text-sm font-medium text-text">
          Se connecter
        </Link>
        <Link href="/register" className="relative z-10 flex-1 py-2 text-center text-sm font-medium text-text-muted">
          Créer un compte
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight mb-1.5">Bon retour.</h1>
        <p className="text-sm text-text-faint">On t&apos;attendait pour la prochaine fenêtre.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={set('email')}
          placeholder="toi@exemple.com"
          autoComplete="email"
          required
        />
        <Input
          label="Mot de passe"
          type="password"
          value={form.password}
          onChange={set('password')}
          placeholder="••••••••"
          autoComplete="current-password"
          required
          error={error || undefined}
        />
        <Button type="submit" variant="primary" full size="lg" loading={loading} className="mt-2">
          Se connecter
        </Button>
      </form>

      <div className="mt-auto pt-8 text-center">
        <span className="text-xs text-text-faint">Mot de passe oublié ?</span>
      </div>
    </div>
  )
}
