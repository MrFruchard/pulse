'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { auth, users as usersApi } from '@/lib/api'
import { NavBar } from '@/components/NavBar'
import { PostCard } from '@/components/PostCard'
import { Button } from '@/components/ui/Button'
import type { Post, User } from '@/types'

interface ProfileData {
  user: User
  followerCount: number
  followingCount: number
  posts: Post[]
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active:    { label: 'Actif',    color: 'text-green-400' },
  dormant:   { label: 'Dormant',  color: 'text-yellow-400' },
  suspended: { label: 'Suspendu', color: 'text-red-400' },
}

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const pseudo = params.pseudo as string

  const [me, setMe] = useState<User | null>(null)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    auth.me()
      .then((data) => setMe((data as { user: User }).user))
      .catch(() => router.push('/login'))
  }, [router])

  useEffect(() => {
    usersApi.profile(pseudo)
      .then((data) => {
        const d = data as ProfileData
        setProfile(d)
        setPosts(d.posts ?? [])
      })
      .catch(() => setNotFound(true))
  }, [pseudo])

  async function handleFollow() {
    if (!profile) return
    setFollowLoading(true)
    try {
      if (isFollowing) {
        await usersApi.unfollow(profile.user.id)
        setIsFollowing(false)
        setProfile(p => p ? { ...p, followerCount: p.followerCount - 1 } : p)
      } else {
        await usersApi.follow(profile.user.id)
        setIsFollowing(true)
        setProfile(p => p ? { ...p, followerCount: p.followerCount + 1 } : p)
      }
    } catch { /* ignore */ }
    finally { setFollowLoading(false) }
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-gray-400">Utilisateur introuvable.</p>
        <Link href="/feed" className="text-sm text-gray-600 hover:text-gray-400">← Retour au feed</Link>
      </div>
    )
  }

  if (!profile) return null

  const { user } = profile
  const isMe = me?.id === user.id
  const status = STATUS_LABELS[user.status] ?? STATUS_LABELS.active

  return (
    <>
      <NavBar pseudo={me?.pseudo} />

      <main className="max-w-2xl mx-auto px-4 py-6 pt-20">
        {/* Header profil */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center text-xl font-bold shrink-0">
                {user.pseudo[0].toUpperCase()}
              </div>
              <div>
                <h1 className="text-lg font-bold">{user.pseudo}</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs ${status.color}`}>{status.label}</span>
                  {user.streak > 0 && (
                    <span className="text-xs text-yellow-500">🔥 {user.streak} jours</span>
                  )}
                </div>
                {user.bio && (
                  <p className="text-sm text-gray-400 mt-2 max-w-xs">{user.bio}</p>
                )}
              </div>
            </div>

            {!isMe && me && (
              <Button
                variant={isFollowing ? 'secondary' : 'primary'}
                onClick={handleFollow}
                loading={followLoading}
                className="shrink-0"
              >
                {isFollowing ? 'Abonné' : 'Suivre'}
              </Button>
            )}
          </div>

          <div className="flex gap-6 mt-5 pt-5 border-t border-gray-800">
            <div className="text-center">
              <div className="font-bold text-lg">{profile.followerCount}</div>
              <div className="text-xs text-gray-500">Abonnés</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg">{profile.followingCount}</div>
              <div className="text-xs text-gray-500">Abonnements</div>
            </div>
          </div>
        </div>

        {/* Posts */}
        <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-widest">
          Posts
        </h2>

        {posts.length === 0 ? (
          <div className="text-center py-12 text-gray-600 text-sm">
            Aucun post pour l&apos;instant.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </main>
    </>
  )
}
