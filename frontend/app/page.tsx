import { Countdown } from '@/components/Countdown'
import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <h1 className="text-5xl font-bold tracking-tight mb-4">Pulse</h1>
      <p className="text-gray-400 text-lg max-w-md mb-12">
        Un réseau social qui n&apos;existe qu&apos;une heure par jour.
        La rareté crée l&apos;anticipation. La contrainte crée la qualité.
      </p>

      <Countdown />

      <div className="flex gap-4 mt-12">
        <Link
          href="/login"
          className="px-6 py-3 rounded-lg bg-white text-gray-900 font-semibold hover:bg-gray-100 transition"
        >
          Se connecter
        </Link>
        <Link
          href="/register"
          className="px-6 py-3 rounded-lg border border-gray-700 text-gray-100 font-semibold hover:border-gray-500 transition"
        >
          Créer un compte
        </Link>
      </div>
    </main>
  )
}
