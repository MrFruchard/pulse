'use client'

import { useEffect, useState } from 'react'
import { posts as postsApi, users as usersApi } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import type { PostIntention, PostPrivacy, User } from '@/types'

const INTENTIONS: { value: PostIntention; label: string; color: string }[] = [
  { value: 'QUESTION',  label: 'Question',  color: 'border-blue-500 text-blue-400 bg-blue-500/10' },
  { value: 'SHARE',     label: 'Partage',   color: 'border-green-500 text-green-400 bg-green-500/10' },
  { value: 'PROJECT',   label: 'Projet',    color: 'border-purple-500 text-purple-400 bg-purple-500/10' },
  { value: 'CHALLENGE', label: 'Challenge', color: 'border-orange-500 text-orange-400 bg-orange-500/10' },
]

const PRIVACIES: { value: PostPrivacy; label: string; icon: string }[] = [
  { value: 'PUBLIC',    label: 'Public',      icon: '🌍' },
  { value: 'FOLLOWERS', label: 'Abonnés',     icon: '👥' },
  { value: 'PRIVATE',   label: 'Sélection',   icon: '🔒' },
]

interface PostComposerProps {
  onPost?: () => void
  currentUserId?: string
}

interface FollowerItem {
  id: string
  pseudo: string
  avatarUrl: string | null
}

export function PostComposer({ onPost, currentUserId }: PostComposerProps) {
  const [content, setContent] = useState('')
  const [intention, setIntention] = useState<PostIntention | ''>('')
  const [privacy, setPrivacy] = useState<PostPrivacy>('PUBLIC')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [followers, setFollowers] = useState<FollowerItem[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loadingFollowers, setLoadingFollowers] = useState(false)

  useEffect(() => {
    if (privacy !== 'PRIVATE' || !currentUserId) return
    if (followers.length > 0) return
    setLoadingFollowers(true)
    usersApi.followers(currentUserId)
      .then(data => setFollowers((data as { followers: FollowerItem[] }).followers ?? []))
      .catch(() => {})
      .finally(() => setLoadingFollowers(false))
  }, [privacy, currentUserId, followers.length])

  function toggleFollower(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const canSubmit = content.trim().length > 0 && intention !== '' && !loading
    && (privacy !== 'PRIVATE' || selectedIds.size > 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    setLoading(true)
    setError('')
    try {
      await postsApi.create({
        content: content.trim(),
        intention,
        privacy,
        ...(privacy === 'PRIVATE' ? { allowedUserIds: Array.from(selectedIds) } : {}),
      })
      setContent('')
      setIntention('')
      setPrivacy('PUBLIC')
      setSelectedIds(new Set())
      onPost?.()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la publication'
      if (msg.includes('already posted')) {
        setError('Tu as déjà publié un post dans cette session.')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Qu'est-ce que tu veux partager aujourd'hui ?"
        maxLength={500}
        rows={3}
        className="w-full bg-transparent text-sm text-gray-100 placeholder-gray-600 resize-none outline-none"
      />

      {/* Sélecteur intention */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {INTENTIONS.map((i) => (
          <button
            key={i.value}
            type="button"
            onClick={() => setIntention(i.value)}
            className={`text-xs px-3 py-1 rounded-full border transition font-medium
              ${intention === i.value ? i.color : 'border-gray-700 text-gray-500 hover:border-gray-600'}`}
          >
            {i.label}
          </button>
        ))}
      </div>

      {/* Sélecteur privacy */}
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs text-gray-600">Visibilité :</span>
        <div className="flex gap-1">
          {PRIVACIES.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPrivacy(p.value)}
              className={`text-xs px-2.5 py-1 rounded-lg border transition
                ${privacy === p.value
                  ? 'border-gray-400 text-gray-100'
                  : 'border-gray-800 text-gray-500 hover:border-gray-700'}`}
            >
              {p.icon} {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sélection followers pour PRIVATE */}
      {privacy === 'PRIVATE' && (
        <div className="mt-3 border border-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-2">Choisir les abonnés autorisés :</p>
          {loadingFollowers ? (
            <p className="text-xs text-gray-600">Chargement...</p>
          ) : followers.length === 0 ? (
            <p className="text-xs text-gray-600">Aucun abonné pour l&apos;instant.</p>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
              {followers.map(f => (
                <label key={f.id} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(f.id)}
                    onChange={() => toggleFollower(f.id)}
                    className="rounded border-gray-700 bg-gray-800 text-white"
                  />
                  <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold shrink-0">
                    {f.pseudo[0].toUpperCase()}
                  </div>
                  <span className="text-xs text-gray-300 group-hover:text-white transition">{f.pseudo}</span>
                </label>
              ))}
            </div>
          )}
          {selectedIds.size > 0 && (
            <p className="text-xs text-gray-500 mt-2">{selectedIds.size} abonné(s) sélectionné(s)</p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-3">
        <span className={`text-xs ${content.length > 450 ? 'text-orange-400' : 'text-gray-600'}`}>
          {content.length}/500
        </span>
        <Button type="submit" disabled={!canSubmit} loading={loading}>
          Publier
        </Button>
      </div>

      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </form>
  )
}
