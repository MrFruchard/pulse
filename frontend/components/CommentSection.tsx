'use client'

import { useEffect, useState } from 'react'
import { posts as postsApi } from '@/lib/api'
import { ImagePicker } from '@/components/ImagePicker'
import type { Comment } from '@/types'

interface CommentSectionProps {
  postId: string
}

export function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    postsApi.comments(postId)
      .then(data => setComments((data as { comments: Comment[] }).comments ?? []))
      .catch(() => {})
      .finally(() => setFetching(false))
  }, [postId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if ((!content.trim() && !imageUrl) || loading) return

    setLoading(true)
    try {
      const data = await postsApi.comment(postId, content.trim(), imageUrl || undefined) as { comment: Comment }
      setComments(prev => [...prev, data.comment])
      setContent('')
      setImageUrl('')
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  return (
    <div className="mt-3 border-t border-gray-800 pt-3">
      {/* Liste */}
      {fetching ? (
        <p className="text-xs text-gray-600 mb-2">Chargement...</p>
      ) : (
        <div className="flex flex-col gap-2 mb-3">
          {comments.map(c => (
            <div key={c.id} className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold shrink-0">
                {c.authorPseudo[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-gray-300 mr-1">{c.authorPseudo}</span>
                {c.content && (
                  <span className="text-xs text-gray-400">{c.content}</span>
                )}
                {c.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.imageUrl}
                    alt="comment image"
                    className="mt-1 rounded-lg max-h-48 object-cover border border-gray-800"
                  />
                )}
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-xs text-gray-600">Aucun commentaire.</p>
          )}
        </div>
      )}

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <ImagePicker onUpload={setImageUrl} label="📎 Image" />
        <div className="flex gap-2">
          <input
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Écrire un commentaire..."
            maxLength={500}
            className="flex-1 bg-gray-800 text-xs text-gray-100 placeholder-gray-600 rounded-lg px-3 py-2 outline-none border border-gray-700 focus:border-gray-600"
          />
          <button
            type="submit"
            disabled={(!content.trim() && !imageUrl) || loading}
            className="text-xs px-3 py-2 bg-white text-gray-900 font-semibold rounded-lg disabled:opacity-40 hover:bg-gray-100 transition"
          >
            {loading ? '...' : 'Envoyer'}
          </button>
        </div>
      </form>
    </div>
  )
}
