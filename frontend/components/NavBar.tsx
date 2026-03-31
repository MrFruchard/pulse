'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/api'
import { Button } from '@/components/ui/Button'

interface NavBarProps {
  pseudo?: string
  unreadCount?: number
}

export function NavBar({ pseudo, unreadCount = 0 }: NavBarProps) {
  const router = useRouter()

  async function handleLogout() {
    await auth.logout().catch(() => {})
    router.push('/')
    router.refresh()
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-800 bg-gray-950/90 backdrop-blur">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/feed" className="text-lg font-bold tracking-tight hover:opacity-80 transition">
          Pulse
        </Link>

        <nav className="flex items-center gap-2">
          {pseudo && (
            <>
              <Link
                href={`/profile/${pseudo}`}
                className="text-sm text-gray-400 hover:text-gray-100 transition px-2 py-1"
              >
                {pseudo}
              </Link>
              {unreadCount > 0 && (
                <span className="text-xs bg-white text-gray-900 rounded-full px-1.5 py-0.5 font-bold">
                  {unreadCount}
                </span>
              )}
              <Button variant="ghost" onClick={handleLogout} className="text-xs">
                Déconnexion
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
