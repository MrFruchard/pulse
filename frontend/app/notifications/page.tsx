'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/api'
import { followRequests } from '@/lib/api'
import { NavBar } from '@/components/NavBar'
import { useNotifications } from '@/hooks/useNotifications'
import type { User } from '@/types'

const NOTIF_LABELS: Record<string, { icon: string; text: (p: Record<string, string>) => string }> = {
  REACTION:       { icon: '👍', text: (p) => `a réagi à ton post` },
  COMMENT:        { icon: '💬', text: (p) => `a commenté : "${p.commentExcerpt ?? ''}"` },
  FOLLOW_REQUEST: { icon: '👤', text: () => `veut te suivre` },
  FOLLOW_ACCEPTED:{ icon: '✅', text: () => `a accepté ta demande de suivi` },
  FOLLOW:         { icon: '➕', text: () => `te suit maintenant` },
  SESSION_OPEN:   { icon: '🟢', text: () => `La session est ouverte !` },
}

export default function NotificationsPage() {
  const router = useRouter()
  const [me, setMe] = useState<User | null>(null)
  const { items, unreadCount, markRead, markAllRead } = useNotifications()

  useEffect(() => {
    auth.me()
      .then(data => setMe((data as { user: User }).user))
      .catch(() => router.push('/login'))
  }, [router])

  async function handleFollowAction(notifId: string, requestId: string, action: 'ACCEPT' | 'DECLINE') {
    await followRequests.respond(requestId, action).catch(() => {})
    await markRead(notifId)
  }

  if (!me) return null

  return (
    <>
      <NavBar pseudo={me.pseudo} unreadCount={unreadCount} />

      <main className="max-w-2xl mx-auto px-4 py-6 pt-20">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-gray-500 hover:text-gray-300 transition"
            >
              Tout marquer comme lu
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16 text-gray-600 text-sm">
            Aucune notification.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map(notif => {
              const payload = notif.payload as Record<string, string>
              const def = NOTIF_LABELS[notif.type]
              const isFollowRequest = notif.type === 'FOLLOW_REQUEST'

              return (
                <div
                  key={notif.id}
                  onClick={() => !isFollowRequest && markRead(notif.id)}
                  className={`flex items-start gap-3 p-4 rounded-xl border transition cursor-pointer
                    ${notif.isRead
                      ? 'border-gray-800 bg-gray-900/50'
                      : 'border-gray-700 bg-gray-900'
                    }`}
                >
                  <span className="text-lg shrink-0">{def?.icon ?? '🔔'}</span>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200">
                      {def ? def.text(payload) : notif.type}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(notif.createdAt).toLocaleString('fr-FR', {
                        day: '2-digit', month: '2-digit',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>

                    {/* Actions follow request inline */}
                    {isFollowRequest && payload.requesterId && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleFollowAction(notif.id, payload.requestId ?? '', 'ACCEPT') }}
                          className="text-xs px-3 py-1 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition"
                        >
                          Accepter
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleFollowAction(notif.id, payload.requestId ?? '', 'DECLINE') }}
                          className="text-xs px-3 py-1 border border-gray-700 text-gray-400 rounded-lg hover:border-gray-600 transition"
                        >
                          Refuser
                        </button>
                      </div>
                    )}

                    {/* Lien vers le post si pertinent */}
                    {payload.postId && !isFollowRequest && (
                      <Link
                        href={`/feed`}
                        onClick={e => e.stopPropagation()}
                        className="text-xs text-gray-500 hover:text-gray-300 mt-1 inline-block transition"
                      >
                        Voir le post →
                      </Link>
                    )}
                  </div>

                  {!notif.isRead && (
                    <div className="w-2 h-2 rounded-full bg-white shrink-0 mt-1.5" />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}
