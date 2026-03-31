'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/api'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', pseudo: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }))
      setErrors(prev => ({ ...prev, [field]: '', global: '' }))
    }
  }

  function validate() {
    const errs: Record<string, string> = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Email invalide'
    if (form.pseudo.trim().length < 3) errs.pseudo = 'Minimum 3 caractères'
    if (form.pseudo.trim().length > 50) errs.pseudo = 'Maximum 50 caractères'
    if (form.password.length < 8) errs.password = 'Minimum 8 caractères'
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setLoading(true)
    setErrors({})
    try {
      await auth.register({ email: form.email, pseudo: form.pseudo.trim(), password: form.password })
      router.push('/feed')
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('email')) setErrors({ email: 'Cet email est déjà utilisé' })
      else if (msg.includes('pseudo')) setErrors({ pseudo: 'Ce pseudo est déjà pris' })
      else setErrors({ global: 'Une erreur est survenue, réessaie.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold tracking-tight">Pulse</Link>
          <p className="text-gray-500 text-sm mt-2">Crée ton compte</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="toi@exemple.com"
            value={form.email}
            onChange={set('email')}
            error={errors.email}
            required
            autoComplete="email"
          />
          <Input
            label="Pseudo"
            type="text"
            placeholder="johndoe"
            value={form.pseudo}
            onChange={set('pseudo')}
            error={errors.pseudo}
            required
            autoComplete="username"
          />
          <Input
            label="Mot de passe"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={set('password')}
            error={errors.password}
            required
            autoComplete="new-password"
          />

          {errors.global && (
            <p className="text-sm text-red-400 text-center">{errors.global}</p>
          )}

          <Button type="submit" loading={loading} className="w-full py-2.5">
            Créer mon compte
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-gray-300 hover:text-white transition">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  )
}
