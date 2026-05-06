'use client'

import { useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Pill, INTENTION_PILL, INTENTION_LABEL } from '@/components/ui/Pill'
import { CommentSection } from '@/components/CommentSection'
import type { Post, ReactionType } from '@/types'

const REACTION_LABELS: Record<ReactionType, string> = {
  LIKE: 'Aimer', FIRE: 'En feu', INSIGHTFUL: 'Pertinent', SUPPORT: 'Soutenir',
}

const REACTIONS: { type: ReactionType; emoji: string }[] = [
  { type: 'LIKE', emoji: '👍' },
  { type: 'FIRE', emoji: '🔥' },
  { type: 'INSIGHTFUL', emoji: '💡' },
  { type: 'SUPPORT', emoji: '🤝' },
]

interface PostCardProps {
  post: Post
  onReact?: (postId: string, type: ReactionType) => void
}

export function PostCard({ post, onReact }: PostCardProps) {
  const [showComments, setShowComments] = useState(false)
  const [userReaction, setUserReaction] = useState<ReactionType | undefined>(post.userReaction)
  const [reactions, setReactions] = useState(post.reactions)

  function handleReactionClick(type: ReactionType) {
    const isSame = userReaction === type
    if (isSame) {
      setUserReaction(undefined)
      setReactions(prev => ({ ...prev, [type]: Math.max(0, (prev[type] ?? 0) - 1) }))
    } else {
      if (userReaction) {
        setReactions(prev => ({ ...prev, [userReaction]: Math.max(0, (prev[userReaction] ?? 0) - 1) }))
      }
      setUserReaction(type)
      setReactions(prev => ({ ...prev, [type]: (prev[type] ?? 0) + 1 }))
    }
    onReact?.(post.id, type)
  }

  const time = new Date(post.createdAt).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <article className="post-enter bg-surface border border-border rounded-lg p-4
      hover:border-border-strong transition-colors">
      <div className="flex items-start gap-3">
        <Avatar pseudo={post.author.pseudo} avatarUrl={post.author.avatarUrl} size={36} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-sm font-semibold">{post.author.pseudo}</span>
            {post.author.streak > 1 && (
              <span className="text-xs text-yellow-500">🔥 {post.author.streak}</span>
            )}
            <Pill variant={INTENTION_PILL[post.intention]} size="sm">
              {INTENTION_LABEL[post.intention]}
            </Pill>
            <span className="text-xs text-text-faint ml-auto">{time}</span>
          </div>

          <p className="text-sm text-text leading-relaxed whitespace-pre-wrap mb-3">
            {post.content}
          </p>

          {post.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.imageUrl}
              alt={`Image de ${post.author.pseudo}`}
              className="w-full rounded-md max-h-72 object-cover border border-border mb-3"
            />
          )}

          <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Réactions">
            {REACTIONS.map(({ type, emoji }) => (
              <button
                key={type}
                onClick={() => handleReactionClick(type)}
                aria-label={`${REACTION_LABELS[type]}${(reactions[type] ?? 0) > 0 ? ` (${reactions[type]})` : ''}`}
                aria-pressed={userReaction === type}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors
                  ${userReaction === type
                    ? 'bg-accent-soft text-accent'
                    : 'text-text-faint hover:text-text-muted hover:bg-surface-2'
                  }`}
              >
                <span aria-hidden="true">{emoji}</span>
                {(reactions[type] ?? 0) > 0 && <span>{reactions[type]}</span>}
              </button>
            ))}
            <button
              onClick={() => setShowComments(v => !v)}
              aria-label={`${showComments ? 'Masquer' : 'Afficher'} les commentaires`}
              aria-expanded={showComments}
              className="ml-auto text-xs text-text-faint hover:text-text-muted transition-colors"
            >
              💬 {post.commentCount}
            </button>
          </div>

          {showComments && <CommentSection postId={post.id} />}
        </div>
      </div>
    </article>
  )
}
