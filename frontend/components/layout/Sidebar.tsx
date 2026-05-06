'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { auth } from '@/lib/api'

interface SidebarProps {
  pseudo?: string
  unreadCount?: number
}

const PulseLogoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="3" fill="var(--accent)" />
    <circle cx="12" cy="12" r="6.5" stroke="var(--accent)" strokeWidth="1.2" opacity="0.55" />
    <circle cx="12" cy="12" r="10.5" stroke="var(--accent)" strokeWidth="1.2" opacity="0.22" />
  </svg>
)

export function Sidebar({ pseudo, unreadCount = 0 }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await auth.logout().catch(() => {})
    router.push('/')
    router.refresh()
  }

  const items = [
    { href: '/feed',          label: 'Pulse',         icon: '○' },
    { href: '/explore',       label: 'Explore',       icon: '⊹' },
    { href: '/notifications', label: 'Notifications', icon: '🔔', badge: unreadCount },
    { href: pseudo ? `/profile/${pseudo}` : '/profile', label: 'Profil', icon: '◯' },
  ]

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-60
      border-r border-border bg-bg z-40">
      <div className="p-6 flex items-center gap-2.5">
        <PulseLogoIcon />
        <span className="text-lg font-semibold tracking-tight">Pulse</span>
      </div>

      <nav className="flex-1 px-3 space-y-1" aria-label="Navigation">
        {items.map(({ href, label, icon, badge }) => {
          const active = pathname.startsWith(href.split('/').slice(0, 3).join('/'))
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${active
                  ? 'bg-accent-soft text-accent'
                  : 'text-text-muted hover:text-text hover:bg-surface'
                }`}
            >
              <span className="text-base w-5 text-center">{icon}</span>
              <span>{label}</span>
              {badge && badge > 0 && (
                <span className="ml-auto min-w-[20px] h-5 bg-accent text-bg text-[10px]
                  font-bold rounded-full flex items-center justify-center px-1">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
            text-text-muted hover:text-text hover:bg-surface transition-colors"
        >
          <span>↩</span>
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  )
}
