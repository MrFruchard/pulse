'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { BottomNav } from '@/components/layout/BottomNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { useNotifications } from '@/hooks/useNotifications'
import { auth } from '@/lib/api'
import type { User } from '@/types'

const AUTH_PATHS = ['/', '/login', '/register']

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [me, setMe] = useState<User | null>(null)
  const { unreadCount } = useNotifications()

  const isAuthPage = AUTH_PATHS.some(p => pathname === p)
    || pathname.startsWith('/login')
    || pathname.startsWith('/register')

  useEffect(() => {
    if (isAuthPage) return
    auth.me()
      .then(data => setMe((data as { user: User }).user))
      .catch(() => {})
  }, [isAuthPage])

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Sidebar desktop */}
      <Sidebar pseudo={me?.pseudo} unreadCount={unreadCount} />

      {/* Contenu principal */}
      <main className="lg:pl-60 pb-16 lg:pb-0 min-h-screen">
        <div className="max-w-xl mx-auto px-0 lg:px-4">
          {children}
        </div>
      </main>

      {/* Bottom nav mobile */}
      <BottomNav unreadCount={unreadCount} />
    </div>
  )
}
