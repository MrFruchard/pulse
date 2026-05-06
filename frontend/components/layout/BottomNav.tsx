'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface BottomNavProps {
  unreadCount?: number
}

const PulseIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="3" fill="currentColor" />
    <circle cx="12" cy="12" r="6.5" stroke="currentColor" strokeWidth="1.4" opacity={active ? 0.7 : 0.4} />
    <circle cx="12" cy="12" r="10.5" stroke="currentColor" strokeWidth="1.2" opacity={active ? 0.35 : 0.2} />
  </svg>
)
const ExploreIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="11" cy="11" r="6.5" /><path d="M16 16l4 4" strokeLinecap="round" />
  </svg>
)
const NotifIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M5 16h14l-1.5-2.5V10a5.5 5.5 0 10-11 0v3.5L5 16z" strokeLinejoin="round" />
    <path d="M10 19a2 2 0 004 0" strokeLinecap="round" />
  </svg>
)
const ProfileIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="12" cy="9" r="3.5" />
    <path d="M5 19c1.5-3 4-4.5 7-4.5s5.5 1.5 7 4.5" strokeLinecap="round" />
  </svg>
)

export function BottomNav({ unreadCount = 0 }: BottomNavProps) {
  const pathname = usePathname()

  const items = [
    { href: '/feed',          label: 'Pulse',   icon: (a: boolean) => <PulseIcon active={a} /> },
    { href: '/explore',       label: 'Explore', icon: () => <ExploreIcon /> },
    { href: '/notifications', label: 'Notifs',  icon: () => <NotifIcon />, badge: unreadCount },
    { href: '/profile',       label: 'Profil',  icon: () => <ProfileIcon /> },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden
        border-t border-border bg-bg/85 backdrop-blur-md
        flex justify-around items-center
        h-16 pb-safe"
      aria-label="Navigation principale"
    >
      {items.map(({ href, label, icon, badge }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors
              ${active ? 'text-accent' : 'text-text-muted hover:text-text'}`}
          >
            <div className="relative">
              {icon(active)}
              {badge && badge > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-accent text-bg
                  text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
              {active && (
                <span
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1
                    rounded-full bg-accent animate-dot-pulse"
                />
              )}
            </div>
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
