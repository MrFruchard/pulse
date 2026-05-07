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

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', pseudo: '', password: '' })
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
      await auth.register({ email: form.email, pseudo: form.pseudo, password: form.password })
      router.push('/feed')
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('email')) setError('Cet email est déjà utilisé.')
      else if (msg.includes('pseudo')) setError('Ce pseudo est déjà pris.')
      else setError('Une erreur est survenue.')
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
        <div className="absolute top-1 bottom-1 right-1 w-[calc(50%-4px)]
          bg-surface-2 border border-border-strong rounded transition-all duration-200" />
        <Link href="/login" className="relative z-10 flex-1 py-2 text-center text-sm font-medium text-text-muted">
          Se connecter
        </Link>
        <Link href="/register" className="relative z-10 flex-1 py-2 text-center text-sm font-medium text-text">
          Créer un compte
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight mb-1.5">Bienvenue dans Pulse.</h1>
        <p className="text-sm text-text-faint">60 minutes par jour. Le reste, c&apos;est à toi.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="toi@exemple.com" autoComplete="email" required />
        <Input label="Pseudo" value={form.pseudo} onChange={set('pseudo')} placeholder="@ton_pseudo" autoComplete="username" required />
        <Input label="Mot de passe" type="password" value={form.password} onChange={set('password')} placeholder="••••••••" autoComplete="new-password" required error={error || undefined} />
        <Button type="submit" variant="primary" full size="lg" loading={loading} className="mt-2">
          Créer mon compte
        </Button>
      </form>
    </div>
  )
}
