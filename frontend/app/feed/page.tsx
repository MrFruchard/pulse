'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth, posts as postsApi } from '@/lib/api'
import { useSession } from '@/hooks/useSession'
import { useWebSocket } from '@/hooks/useWebSocket'
import { NavBar } from '@/components/NavBar'
import { SessionBar } from '@/components/SessionBar'
import { Countdown } from '@/components/Countdown'
import { PostCard } from '@/components/PostCard'
import { PostComposer } from '@/components/PostComposer'
import { FollowRequestsPanel } from '@/components/FollowRequestsPanel'
import type { Post, PostIntention, ReactionType, User } from '@/types'

type FeedFilter = 'global' | 'following'

const INTENTION_FILTERS: { value: PostIntention | ''; label: string }[] = [
  { value: '', label: 'Tous' },
  { value: 'QUESTION', label: 'Questions' },
  { value: 'SHARE', label: 'Partages' },
  { value: 'PROJECT', label: 'Projets' },
  { value: 'CHALLENGE', label: 'Challenges' },
]

export default function FeedPage() {
  const router = useRouter()
  const { sessionState, loading: sessionLoading } = useSession()
  const [me, setMe] = useState<User | null>(null)
  const [feedPosts, setFeedPosts] = useState<Post[]>([])
  const [feedFilter, setFeedFilter] = useState<FeedFilter>('global')
  const [intentionFilter, setIntentionFilter] = useState<PostIntention | ''>('')
  const [loadingPosts, setLoadingPosts] = useState(false)

  // Auth check
  useEffect(() => {
    auth.me()
      .then((data) => setMe((data as { user: User }).user))
      .catch(() => router.push('/login'))
  }, [router])

  const fetchPosts = useCallback(async () => {
    setLoadingPosts(true)
    try {
      const data = await postsApi.feed({
        feed: feedFilter,
        ...(intentionFilter ? { intention: intentionFilter } : {}),
      })
      setFeedPosts((data as { posts: Post[] }).posts ?? [])
    } catch {
      // session inactive — pas d'erreur à afficher
    } finally {
      setLoadingPosts(false)
    }
  }, [feedFilter, intentionFilter])

  useEffect(() => {
    if (sessionState?.isActive || me?.role === 'admin') fetchPosts()
    else setFeedPosts([])
  }, [sessionState, fetchPosts, me?.role])

  // Temps réel
  useWebSocket((msg) => {
    if (msg.type === 'new_post') {
      setFeedPosts(prev => [msg.post as Post, ...prev])
    }
    if (msg.type === 'new_reaction') {
      setFeedPosts(prev => prev.map(p => {
        if (p.id !== msg.postId) return p
        return {
          ...p,
          reactions: {
            ...p.reactions,
            [msg.reaction as string]: (p.reactions[msg.reaction as ReactionType] ?? 0) + 1,
          },
        }
      }))
    }
    if (msg.type === 'session_opened' || msg.type === 'session_closed') {
      window.location.reload()
    }
  })

  async function handleReact(postId: string, type: ReactionType) {
    try {
      await postsApi.react(postId, type)
      setFeedPosts(prev => prev.map(p => {
        if (p.id !== postId) return p
        return {
          ...p,
          userReaction: type,
          reactions: { ...p.reactions, [type]: (p.reactions[type] ?? 0) + 1 },
        }
      }))
    } catch { /* déjà réagi */ }
  }

  if (sessionLoading || !me) return null

  return (
    <>
      <NavBar pseudo={me.pseudo} />

      <div className="pt-14">
        {sessionState && <SessionBar session={sessionState} />}

        <main className="max-w-2xl mx-auto px-4 py-6">
          {!sessionState?.isActive && me?.role !== 'admin' ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-gray-500 text-sm mb-8">La prochaine session commence dans</p>
              <Countdown />
            </div>
          ) : (
            <>
              <FollowRequestsPanel />
              <PostComposer onPost={fetchPosts} currentUserId={me.id} />

              {/* Filtres */}
              <div className="flex items-center gap-2 mt-6 mb-4 flex-wrap">
                <div className="flex gap-1 bg-gray-900 rounded-lg p-1 border border-gray-800">
                  {(['global', 'following'] as FeedFilter[]).map(f => (
                    <button
                      key={f}
                      onClick={() => setFeedFilter(f)}
                      className={`text-xs px-3 py-1.5 rounded-md transition capitalize
                        ${feedFilter === f ? 'bg-white text-gray-900 font-semibold' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                      {f === 'global' ? 'Global' : 'Abonnements'}
                    </button>
                  ))}
                </div>

                <div className="flex gap-1 flex-wrap">
                  {INTENTION_FILTERS.map(f => (
                    <button
                      key={f.value}
                      onClick={() => setIntentionFilter(f.value)}
                      className={`text-xs px-3 py-1.5 rounded-lg transition border
                        ${intentionFilter === f.value
                          ? 'border-gray-400 text-gray-100'
                          : 'border-gray-800 text-gray-500 hover:border-gray-700'}`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Posts */}
              {loadingPosts ? (
                <div className="text-center py-12 text-gray-600 text-sm">Chargement...</div>
              ) : feedPosts.length === 0 ? (
                <div className="text-center py-12 text-gray-600 text-sm">
                  Aucun post pour l&apos;instant. Sois le premier !
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {feedPosts.map(post => (
                    <PostCard key={post.id} post={post} onReact={handleReact} />
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  )
}
