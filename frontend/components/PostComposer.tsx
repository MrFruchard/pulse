'use client'

import { useState } from 'react'
import { posts as postsApi } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import type { PostIntention } from '@/types'

const INTENTIONS: { value: PostIntention; label: string; color: string }[] = [
  { value: 'QUESTION',  label: 'Question',  color: 'border-blue-500 text-blue-400 bg-blue-500/10' },
  { value: 'SHARE',     label: 'Partage',   color: 'border-green-500 text-green-400 bg-green-500/10' },
  { value: 'PROJECT',   label: 'Projet',    color: 'border-purple-500 text-purple-400 bg-purple-500/10' },
  { value: 'CHALLENGE', label: 'Challenge', color: 'border-orange-500 text-orange-400 bg-orange-500/10' },
]

interface PostComposerProps {
  onPost?: () => void
}

export function PostComposer({ onPost }: PostComposerProps) {
  const [content, setContent] = useState('')
  const [intention, setIntention] = useState<PostIntention | ''>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = content.trim().length > 0 && intention !== '' && !loading

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    setLoading(true)
    setError('')
    try {
      await postsApi.create({ content: content.trim(), intention })
      setContent('')
      setIntention('')
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

        <div className="ml-auto flex items-center gap-3">
          <span className={`text-xs ${content.length > 450 ? 'text-orange-400' : 'text-gray-600'}`}>
            {content.length}/500
          </span>
          <Button type="submit" disabled={!canSubmit} loading={loading}>
            Publier
          </Button>
        </div>
      </div>

      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </form>
  )
}
